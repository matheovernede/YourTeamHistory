/**
 * Realistic match simulation engine.
 *
 * The result is driven by real team stats:
 * - Attack (TIR, DRI, VIT des attaquants) vs Defense adverse (DEF, PHY des défenseurs)
 * - Midfield (PAS, DRI des milieux) determines possession/chance creation
 * - Stamina affects all stats progressively
 * - Morale affects consistency
 * - Poisson distribution for realistic scorelines
 */

const {
  getFormationSlots,
  getFormationWeights,
  getPositionGroup,
  getPositionFit,
} = require('../data/formations');

function getStaminaFactor(stamina) {
  let factor = 1.0;
  if (stamina < 50) factor -= (50 - stamina) * 0.008;
  if (stamina < 25) factor -= (25 - stamina) * 0.012;
  return Math.max(0.5, factor);
}

/**
 * Poste réellement occupé par un joueur.
 * Si la composition a été placée sur le terrain (slot_index), c'est le poste de
 * l'emplacement qui prime : aligner un défenseur en pointe le fait bien compter
 * comme attaquant — mais avec un malus d'adéquation.
 * Sinon (équipes IA, compo héritée), on retombe sur le poste déclaré.
 */
function resolveRole(player, formationSlots) {
  const hasSlot = formationSlots
    && player.slot_index !== null
    && player.slot_index !== undefined
    && formationSlots[player.slot_index];

  const slotPos = hasSlot ? formationSlots[player.slot_index] : player.position;
  return { slotPos, fit: hasSlot ? getPositionFit(player.position, slotPos) : 1 };
}

/**
 * Break down team into attack/midfield/defense ratings.
 * Each line's contribution is based on the actual stats of the players in that role.
 */
function analyzeTeam(players, formation = null) {
  const starters = players.filter(p => p.is_starter);
  if (starters.length === 0) return { attack: 40, midfield: 40, defense: 40, physical: 40, morale: 50 };

  const formationSlots = formation ? getFormationSlots(formation) : null;
  const weights = formation
    ? getFormationWeights(formation)
    : { defense: 1, midfield: 1, attack: 1 };

  let attackSum = 0, attackCount = 0;
  let midfieldSum = 0, midfieldCount = 0;
  let defenseSum = 0, defenseCount = 0;
  let physicalSum = 0, moraleSum = 0;

  for (const p of starters) {
    const { slotPos, fit } = resolveRole(p, formationSlots);
    // L'adéquation au poste module l'apport du joueur au même titre que la forme.
    const sf = getStaminaFactor(p.stamina) * fit;
    physicalSum += p.physical * sf;
    moraleSum += p.morale;

    if (slotPos === 'GAR') {
      defenseSum += (p.defending * 0.7 + p.physical * 0.3) * sf;
      defenseCount++;
      continue;
    }

    const group = getPositionGroup(slotPos);
    if (group === 'def') {
      defenseSum += (p.defending * 0.5 + p.physical * 0.25 + p.pace * 0.25) * sf;
      defenseCount++;
    } else if (group === 'mid') {
      midfieldSum += (p.passing * 0.35 + p.dribbling * 0.25 + p.shooting * 0.15 + p.pace * 0.1 + p.physical * 0.15) * sf;
      midfieldCount++;
    } else {
      attackSum += (p.shooting * 0.35 + p.pace * 0.25 + p.dribbling * 0.25 + p.physical * 0.15) * sf;
      attackCount++;
    }
  }

  return {
    attack: attackCount > 0 ? (attackSum / attackCount) * weights.attack : 40,
    midfield: midfieldCount > 0 ? (midfieldSum / midfieldCount) * weights.midfield : 40,
    defense: defenseCount > 0 ? (defenseSum / defenseCount) * weights.defense : 40,
    physical: physicalSum / starters.length,
    morale: moraleSum / starters.length,
  };
}

function poissonRandom(lambda) {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

/**
 * Calculate xG for each team using attack vs opposing defense.
 *
 * Home xG = f(home_attack, home_midfield) vs g(away_defense)
 * Away xG = f(away_attack, away_midfield) vs g(home_defense)
 *
 * Midfield superiority creates more chances (higher xG total for that team).
 * Attack vs Defense determines conversion quality.
 */
function calculateExpectedGoals(home, away, homeAdvantage = 0.25) {
  // Midfield battle: whoever wins midfield gets more chance creation
  const midfieldDiff = (home.midfield - away.midfield) / 100;

  // Base xG per team scales with overall quality
  const avgQuality = (home.attack + home.midfield + home.defense + away.attack + away.midfield + away.defense) / 6;
  const baseXG = 0.8 + (avgQuality - 40) * 0.015; // ~0.8 for regional, ~1.4 for top leagues
  const totalBase = Math.max(1.2, Math.min(3.0, baseXG * 2));

  // Attack efficiency: your attack vs their defense
  const homeAttackVsDefense = (home.attack - away.defense) / 80;
  const awayAttackVsDefense = (away.attack - home.defense) / 80;

  // Morale factor (high morale = more consistent, small boost)
  const homeMoraleFactor = 1 + (home.morale - 50) * 0.003;
  const awayMoraleFactor = 1 + (away.morale - 50) * 0.003;

  // Physical endurance affects second half (simplified as small multiplier)
  const homePhysFactor = 1 + (home.physical - 50) * 0.002;
  const awayPhysFactor = 1 + (away.physical - 50) * 0.002;

  // Calculate xG
  let homeXG = (totalBase * 0.5)
    + homeAttackVsDefense * 0.6
    + midfieldDiff * 0.4
    + homeAdvantage;
  homeXG *= homeMoraleFactor * homePhysFactor;

  let awayXG = (totalBase * 0.5)
    + awayAttackVsDefense * 0.6
    - midfieldDiff * 0.4;
  awayXG *= awayMoraleFactor * awayPhysFactor;

  return {
    home: Math.max(0.2, homeXG),
    away: Math.max(0.15, awayXG),
  };
}

/**
 * Bonus appliqué à l'adversaire du joueur selon la difficulté.
 * En facile l'IA est légèrement bridée, en difficile elle est renforcée : cela
 * s'ajoute à l'écart de niveau déjà créé au moment du seed.
 */
const DIFFICULTY_EDGE = { easy: -0.06, normal: 0, hard: 0.08 };

function applyDifficulty(ratings, edge) {
  if (!edge) return ratings;
  const scale = 1 + edge;
  return {
    ...ratings,
    attack: ratings.attack * scale,
    midfield: ratings.midfield * scale,
    defense: ratings.defense * scale,
  };
}

/**
 * @param {object} opts
 * @param {string} opts.difficulty      'easy' | 'normal' | 'hard'
 * @param {boolean} opts.homeIsPlayer   true si l'équipe à domicile est celle du joueur.
 *                                      Sert à savoir quel camp est l'IA à ajuster.
 */
function simulateMatch(homePlayers, awayPlayers, {
  homeFormation = null,
  awayFormation = null,
  difficulty = 'normal',
  homeIsPlayer = true,
} = {}) {
  let home = analyzeTeam(homePlayers, homeFormation);
  let away = analyzeTeam(awayPlayers, awayFormation);

  // La difficulté renforce ou bride l'adversaire, jamais l'équipe du joueur.
  const edge = DIFFICULTY_EDGE[difficulty] ?? 0;
  if (edge) {
    if (homeIsPlayer) away = applyDifficulty(away, edge);
    else home = applyDifficulty(home, edge);
  }

  const homeSlots = homeFormation ? getFormationSlots(homeFormation) : null;
  const awaySlots = awayFormation ? getFormationSlots(awayFormation) : null;

  const xG = calculateExpectedGoals(home, away);

  let homeGoals = poissonRandom(xG.home);
  let awayGoals = poissonRandom(xG.away);
  homeGoals = Math.min(homeGoals, 7);
  awayGoals = Math.min(awayGoals, 7);

  // Generate match events
  const events = [];
  const goalMinutes = [];
  for (let i = 0; i < homeGoals; i++) {
    goalMinutes.push({ minute: Math.floor(Math.random() * 90) + 1, team: 'home' });
  }
  for (let i = 0; i < awayGoals; i++) {
    goalMinutes.push({ minute: Math.floor(Math.random() * 90) + 1, team: 'away' });
  }
  goalMinutes.sort((a, b) => a.minute - b.minute);

  for (const goal of goalMinutes) {
    const squad = goal.team === 'home' ? homePlayers : awayPlayers;
    const slots = goal.team === 'home' ? homeSlots : awaySlots;
    // Le buteur est pondéré par le poste RÉELLEMENT occupé : un milieu aligné
    // en pointe marque comme un attaquant.
    const scorers = squad.filter(p => p.is_starter && resolveRole(p, slots).slotPos !== 'GAR');
    const weights = scorers.map(p => {
      const { slotPos } = resolveRole(p, slots);
      let w = p.shooting || p.overall;
      if (slotPos === 'BU') w += 25;
      else if (slotPos === 'AIG' || slotPos === 'AID') w += 12;
      else if (slotPos === 'MOC') w += 5;
      return w;
    });
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    let roll = Math.random() * totalWeight;
    let scorer = scorers[0];
    for (let i = 0; i < scorers.length; i++) {
      roll -= weights[i];
      if (roll <= 0) { scorer = scorers[i]; break; }
    }
    events.push({
      minute: goal.minute,
      type: 'goal',
      team: goal.team,
      player: scorer ? `${scorer.first_name} ${scorer.last_name}` : 'Inconnu',
      playerId: scorer ? scorer.id : null,
    });
  }

  // ---- Discipline ----
  // Les identifiants sont joints aux événements : sans eux, impossible de créditer
  // le bon joueur en base (les homonymes existent).
  const cards = { home: [], away: [] };
  const numCards = Math.floor(Math.random() * 4) + 1;
  for (let i = 0; i < numCards; i++) {
    const minute = Math.floor(Math.random() * 90) + 1;
    const team = Math.random() < 0.5 ? 'home' : 'away';
    const squad = team === 'home' ? homePlayers : awayPlayers;
    const starters = squad.filter(p => p.is_starter);
    if (!starters.length) continue;
    const carded = starters[Math.floor(Math.random() * starters.length)];
    if (!carded) continue;

    // Un carton sur dix est un rouge direct.
    const isRed = Math.random() < 0.10;
    events.push({
      minute,
      type: isRed ? 'red_card' : 'yellow_card',
      team,
      player: `${carded.first_name} ${carded.last_name}`,
      playerId: carded.id,
    });
    cards[team].push({ playerId: carded.id, red: isRed });
  }

  // ---- Blessures ----
  // Un joueur émoussé se blesse plus facilement : la forme physique devient un
  // vrai enjeu de rotation, au-delà du simple rendement.
  const injuries = { home: [], away: [] };
  for (const team of ['home', 'away']) {
    const squad = team === 'home' ? homePlayers : awayPlayers;
    const starters = squad.filter(p => p.is_starter);
    if (!starters.length) continue;

    for (const p of starters) {
      const fatigue = Math.max(0, (60 - (p.stamina ?? 100)) / 60); // 0 à 1
      const chance = 0.006 + fatigue * 0.028;                      // 0,6% à 3,4%
      if (Math.random() >= chance) continue;

      const severity = Math.random();
      const weeks = severity < 0.6 ? 1 + Math.floor(Math.random() * 2)   // légère : 1-2
                  : severity < 0.9 ? 3 + Math.floor(Math.random() * 3)   // moyenne : 3-5
                  : 6 + Math.floor(Math.random() * 5);                   // grave : 6-10
      injuries[team].push({ playerId: p.id, matches: weeks });
      events.push({
        minute: Math.floor(Math.random() * 90) + 1,
        type: 'injury',
        team,
        player: `${p.first_name} ${p.last_name}`,
        playerId: p.id,
        matches: weeks,
      });
      break; // au plus une blessure par équipe et par match
    }
  }

  events.sort((a, b) => a.minute - b.minute);

  // `scorers` permet de créditer les buts sans réanalyser les chaînes de texte.
  const scorers = events
    .filter(e => e.type === 'goal' && e.playerId)
    .map(e => ({ playerId: e.playerId, team: e.team }));

  return { homeGoals, awayGoals, events, cards, injuries, scorers };
}

/**
 * Lightweight AI vs AI simulation using overall ratings.
 */
function simulateAiMatchByStrength(homeOverall, awayOverall) {
  const home = { attack: homeOverall, midfield: homeOverall, defense: homeOverall, physical: homeOverall * 0.8, morale: 70 };
  const away = { attack: awayOverall, midfield: awayOverall, defense: awayOverall, physical: awayOverall * 0.8, morale: 70 };
  const xG = calculateExpectedGoals(home, away);
  let homeGoals = poissonRandom(xG.home);
  let awayGoals = poissonRandom(xG.away);
  return { homeGoals: Math.min(homeGoals, 6), awayGoals: Math.min(awayGoals, 6) };
}

function applyMatchEffects(db, teamId, won, drew) {
  const moraleChange = won ? 4 : drew ? -1 : -4;

  // Titulaires: perdent 10 points de stamina par match
  db.run('UPDATE players SET stamina = MAX(0, stamina - 10), morale = MAX(20, MIN(100, morale + ?)) WHERE team_id = ? AND is_starter = 1', [moraleChange, teamId]);

  // Remplaçants: récupèrent 15% (de stamina max, donc +15 points)
  db.run('UPDATE players SET stamina = MIN(100, stamina + 15) WHERE team_id = ? AND is_starter = 0', [teamId]);
}

module.exports = { simulateMatch, simulateAiMatchByStrength, analyzeTeam, calculateExpectedGoals, applyMatchEffects };
