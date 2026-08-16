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

function getStaminaFactor(stamina) {
  let factor = 1.0;
  if (stamina < 50) factor -= (50 - stamina) * 0.008;
  if (stamina < 25) factor -= (25 - stamina) * 0.012;
  return Math.max(0.5, factor);
}

/**
 * Break down team into attack/midfield/defense ratings.
 * Each line's contribution is based on the actual stats of the players in that role.
 */
function analyzeTeam(players) {
  const starters = players.filter(p => p.is_starter);
  if (starters.length === 0) return { attack: 40, midfield: 40, defense: 40, physical: 40, morale: 50 };

  let attackSum = 0, attackCount = 0;
  let midfieldSum = 0, midfieldCount = 0;
  let defenseSum = 0, defenseCount = 0;
  let physicalSum = 0, moraleSum = 0;

  for (const p of starters) {
    const sf = getStaminaFactor(p.stamina);
    physicalSum += p.physical * sf;
    moraleSum += p.morale;

    const pos = p.position;
    if (pos === 'GAR') {
      defenseSum += (p.defending * 0.7 + p.physical * 0.3) * sf;
      defenseCount++;
    } else if (['DC', 'ARG', 'ARD', 'PG', 'PD'].includes(pos)) {
      defenseSum += (p.defending * 0.5 + p.physical * 0.25 + p.pace * 0.25) * sf;
      defenseCount++;
    } else if (['MC', 'MOC', 'MDF', 'MG', 'MD'].includes(pos)) {
      midfieldSum += (p.passing * 0.35 + p.dribbling * 0.25 + p.shooting * 0.15 + p.pace * 0.1 + p.physical * 0.15) * sf;
      midfieldCount++;
    } else {
      attackSum += (p.shooting * 0.35 + p.pace * 0.25 + p.dribbling * 0.25 + p.physical * 0.15) * sf;
      attackCount++;
    }
  }

  return {
    attack: attackCount > 0 ? attackSum / attackCount : 40,
    midfield: midfieldCount > 0 ? midfieldSum / midfieldCount : 40,
    defense: defenseCount > 0 ? defenseSum / defenseCount : 40,
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

function simulateMatch(homePlayers, awayPlayers, { homeIsPlayer = true, difficulty = 'normal' } = {}) {
  const home = analyzeTeam(homePlayers);
  const away = analyzeTeam(awayPlayers);

  // Difficulty: boost AI team's ratings
  const aiBoost = difficulty === 'easy' ? 0 : difficulty === 'hard' ? 6 : 3;
  if (homeIsPlayer) {
    away.attack += aiBoost;
    away.midfield += aiBoost;
    away.defense += aiBoost;
  } else {
    home.attack += aiBoost;
    home.midfield += aiBoost;
    home.defense += aiBoost;
  }

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
    const scorers = squad.filter(p => p.is_starter && p.position !== 'GAR');
    const weights = scorers.map(p => {
      let w = p.shooting || p.overall;
      if (['BU'].includes(p.position)) w += 25;
      else if (['AIG', 'AID'].includes(p.position)) w += 12;
      else if (['MOC'].includes(p.position)) w += 5;
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
    });
  }

  // Yellow cards
  const numCards = Math.floor(Math.random() * 4) + 1;
  for (let i = 0; i < numCards; i++) {
    const minute = Math.floor(Math.random() * 90) + 1;
    const team = Math.random() < 0.5 ? 'home' : 'away';
    const squad = team === 'home' ? homePlayers : awayPlayers;
    const starters = squad.filter(p => p.is_starter);
    const carded = starters[Math.floor(Math.random() * starters.length)];
    if (carded) {
      events.push({ minute, type: 'yellow_card', team, player: `${carded.first_name} ${carded.last_name}` });
    }
  }

  events.sort((a, b) => a.minute - b.minute);
  return { homeGoals, awayGoals, events };
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
