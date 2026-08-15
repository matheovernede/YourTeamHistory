/**
 * Realistic match simulation engine.
 *
 * Key principles:
 * - Total goals in a match follow a Poisson-like distribution (avg ~2.5 for top leagues, less for lower).
 * - Team strength difference shifts the probability of who scores, not how many total goals.
 * - Home advantage adds ~0.3-0.4 expected goals.
 * - Lower-overall teams produce fewer total goals (tighter, more defensive games).
 * - Score distributions feel like real football: lots of 1-0, 1-1, 2-1, 0-0.
 */

function calculateTeamStrength(players, { isAI = false } = {}) {
  const starters = players.filter(p => p.is_starter);
  if (starters.length === 0) return 50;

  let totalAttack = 0;
  let totalDefense = 0;
  let totalMidfield = 0;
  let totalPhysical = 0;
  let totalMorale = 0;

  for (const p of starters) {
    let staminaFactor = 1.0;
    if (p.stamina < 50) staminaFactor -= (50 - p.stamina) * 0.008;
    if (p.stamina < 25) staminaFactor -= (25 - p.stamina) * 0.012;
    staminaFactor = Math.max(0.5, staminaFactor);

    const pos = p.position;
    if (pos === 'GAR') {
      totalDefense += (p.defending * 0.8 + p.physical * 0.2) * staminaFactor;
    } else if (['DC', 'ARG', 'ARD', 'PG', 'PD'].includes(pos)) {
      totalDefense += (p.defending * 0.5 + p.pace * 0.2 + p.physical * 0.3) * staminaFactor;
    } else if (['MC', 'MOC', 'MDF', 'MG', 'MD'].includes(pos)) {
      totalMidfield += (p.passing * 0.4 + p.dribbling * 0.3 + p.pace * 0.15 + p.shooting * 0.15) * staminaFactor;
    } else {
      totalAttack += (p.shooting * 0.4 + p.pace * 0.25 + p.dribbling * 0.25 + p.physical * 0.1) * staminaFactor;
    }

    totalPhysical += p.physical * staminaFactor;
    totalMorale += p.morale;
  }

  const numStarters = starters.length;
  const avgAttack = totalAttack / Math.max(1, starters.filter(p => ['BU', 'AIG', 'AID'].includes(p.position)).length);
  const avgDefense = totalDefense / Math.max(1, starters.filter(p => ['GAR', 'DC', 'ARG', 'ARD', 'PG', 'PD'].includes(p.position)).length);
  const avgMidfield = totalMidfield / Math.max(1, starters.filter(p => ['MC', 'MOC', 'MDF', 'MG', 'MD'].includes(p.position)).length);
  const avgPhysical = totalPhysical / numStarters;
  const avgMorale = totalMorale / numStarters;

  let strength = avgAttack * 0.3 + avgDefense * 0.25 + avgMidfield * 0.25 + avgPhysical * 0.1 + avgMorale * 0.1;

  if (isAI) {
    strength += 3;
  }

  return strength;
}

/**
 * Sample from a Poisson distribution using the inverse transform method.
 */
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
 * Calculate expected goals for each team based on strengths.
 *
 * Base expected goals for an average match (overall ~65) is about 1.1 per team.
 * Higher-level teams create more chances overall.
 * Strength difference shifts expected goals between teams.
 */
function calculateExpectedGoals(homeStrength, awayStrength) {
  const avgStrength = (homeStrength + awayStrength) / 2;

  // Base total xG scales with average quality (lower divisions = fewer goals)
  // At overall 55 -> ~1.8 total, at 65 -> ~2.3, at 80 -> ~2.8, at 90 -> ~3.0
  const baseTotalXG = 1.4 + (avgStrength - 50) * 0.025;
  const totalXG = Math.max(1.5, Math.min(3.2, baseTotalXG));

  // Home advantage: +0.3 xG for home, -0.1 for away
  const homeAdvantage = 0.3;

  // Strength difference determines split of goals
  const diff = homeStrength - awayStrength;
  // Each point of difference shifts ~2.5% of total xG
  const homeShare = 0.5 + diff * 0.02;
  const clampedShare = Math.max(0.25, Math.min(0.75, homeShare));

  const homeXG = totalXG * clampedShare + homeAdvantage;
  const awayXG = totalXG * (1 - clampedShare);

  return {
    home: Math.max(0.3, homeXG),
    away: Math.max(0.2, awayXG),
  };
}

function simulateMatch(homePlayers, awayPlayers, { homeIsPlayer = true } = {}) {
  // Player's team does NOT get the AI boost; the opponent does
  const homeStrength = calculateTeamStrength(homePlayers, { isAI: !homeIsPlayer });
  const awayStrength = calculateTeamStrength(awayPlayers, { isAI: homeIsPlayer });

  const xG = calculateExpectedGoals(homeStrength, awayStrength);

  // Generate goals from Poisson distribution
  let homeGoals = poissonRandom(xG.home);
  let awayGoals = poissonRandom(xG.away);

  // Cap at realistic maximums (very rare to score 6+)
  homeGoals = Math.min(homeGoals, 7);
  awayGoals = Math.min(awayGoals, 7);

  // Generate match events
  const events = [];

  // Distribute goal minutes randomly across 90 minutes
  const goalMinutes = [];
  for (let i = 0; i < homeGoals; i++) {
    goalMinutes.push({ minute: Math.floor(Math.random() * 90) + 1, team: 'home' });
  }
  for (let i = 0; i < awayGoals; i++) {
    goalMinutes.push({ minute: Math.floor(Math.random() * 90) + 1, team: 'away' });
  }
  goalMinutes.sort((a, b) => a.minute - b.minute);

  for (const goal of goalMinutes) {
    const players = goal.team === 'home' ? homePlayers : awayPlayers;
    const scorers = players.filter(p => p.is_starter && p.position !== 'GAR');
    // Weight scorer selection by shooting/overall
    const weights = scorers.map(p => (p.shooting || p.overall) + (p.position === 'BU' ? 20 : p.position === 'AIG' || p.position === 'AID' ? 10 : 0));
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

  // Yellow cards (roughly 3-4 per match total)
  const numCards = Math.floor(Math.random() * 4) + 1;
  for (let i = 0; i < numCards; i++) {
    const minute = Math.floor(Math.random() * 90) + 1;
    const team = Math.random() < 0.5 ? 'home' : 'away';
    const players = team === 'home' ? homePlayers : awayPlayers;
    const starters = players.filter(p => p.is_starter);
    const carded = starters[Math.floor(Math.random() * starters.length)];
    if (carded) {
      events.push({
        minute,
        type: 'yellow_card',
        team,
        player: `${carded.first_name} ${carded.last_name}`,
      });
    }
  }

  // Sort all events by minute
  events.sort((a, b) => a.minute - b.minute);

  return { homeGoals, awayGoals, events };
}

/**
 * Simulate a match between two AI teams using just their overalls.
 * Returns { homeGoals, awayGoals } without detailed events.
 */
function simulateAiMatchByStrength(homeOverall, awayOverall) {
  const xG = calculateExpectedGoals(homeOverall, awayOverall);
  let homeGoals = poissonRandom(xG.home);
  let awayGoals = poissonRandom(xG.away);
  homeGoals = Math.min(homeGoals, 6);
  awayGoals = Math.min(awayGoals, 6);
  return { homeGoals, awayGoals };
}

function applyMatchEffects(db, teamId, won, drew) {
  const moraleChange = won ? 4 : drew ? -1 : -4;

  const starters = [];
  const stmt = db.prepare('SELECT id, stamina, age FROM players WHERE team_id = ? AND is_starter = 1');
  stmt.bind([teamId]);
  while (stmt.step()) starters.push(stmt.getAsObject());
  stmt.free();

  for (const p of starters) {
    const ageFactor = p.age > 30 ? 1.3 : p.age > 28 ? 1.1 : 1.0;
    const staminaLoss = Math.round(-10 * ageFactor);
    db.run('UPDATE players SET stamina = MAX(0, MIN(100, stamina + ?)), morale = MAX(20, MIN(100, morale + ?)) WHERE id = ?', [staminaLoss, moraleChange, p.id]);
  }

  // Subs recover slightly between matches
  db.run('UPDATE players SET stamina = MIN(100, stamina + 5) WHERE team_id = ? AND is_starter = 0', [teamId]);
}

module.exports = { simulateMatch, simulateAiMatchByStrength, calculateTeamStrength, calculateExpectedGoals, applyMatchEffects };
