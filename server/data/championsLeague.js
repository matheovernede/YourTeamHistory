/**
 * Champions League data: European teams pool, prize structure, and draw logic.
 * Unlocked when the player reaches Ligue 1 (division 7).
 */

const EUROPEAN_TEAMS = [
  { name: 'Real Madrid', country: 'ESP', overall: 90 },
  { name: 'FC Barcelona', country: 'ESP', overall: 88 },
  { name: 'Bayern Munich', country: 'GER', overall: 89 },
  { name: 'Manchester City', country: 'ENG', overall: 90 },
  { name: 'Liverpool FC', country: 'ENG', overall: 87 },
  { name: 'Inter Milan', country: 'ITA', overall: 86 },
  { name: 'Juventus', country: 'ITA', overall: 85 },
  { name: 'Arsenal', country: 'ENG', overall: 87 },
  { name: 'Atletico Madrid', country: 'ESP', overall: 85 },
  { name: 'Borussia Dortmund', country: 'GER', overall: 84 },
  { name: 'FC Porto', country: 'POR', overall: 82 },
  { name: 'SL Benfica', country: 'POR', overall: 83 },
  { name: 'Ajax Amsterdam', country: 'NED', overall: 82 },
  { name: 'PSV Eindhoven', country: 'NED', overall: 82 },
  { name: 'Celtic FC', country: 'SCO', overall: 82 },
  { name: 'SSC Napoli', country: 'ITA', overall: 86 },
  { name: 'AC Milan', country: 'ITA', overall: 85 },
  { name: 'Chelsea FC', country: 'ENG', overall: 84 },
  { name: 'Manchester United', country: 'ENG', overall: 84 },
  { name: 'Tottenham Hotspur', country: 'ENG', overall: 83 },
];

const CL_PRIZES = {
  group_stage: 5000000,
  quarter_final: 10000000,
  semi_final: 20000000,
  final: 50000000,
  winner_bonus: 100000000,
};

/**
 * Generate a Champions League draw.
 * The player's team is always placed in Group A.
 * 15 other European teams are drawn into 4 groups of 4.
 */
function generateCLDraw(playerTeamName, playerTeamOverall) {
  // Pick 15 random teams from the pool
  const shuffled = [...EUROPEAN_TEAMS].sort(() => Math.random() - 0.5);
  const opponents = shuffled.slice(0, 15);

  const playerTeam = { name: playerTeamName, overall: playerTeamOverall, isPlayer: true };

  // Create 4 groups of 4
  const groups = [
    { name: 'A', teams: [playerTeam] },
    { name: 'B', teams: [] },
    { name: 'C', teams: [] },
    { name: 'D', teams: [] },
  ];

  // Distribute 15 opponents across 4 groups (player is already in group A)
  let groupIdx = 0;
  for (const team of opponents) {
    // Group A already has 1 team (the player), needs 3 more
    if (groupIdx === 0 && groups[0].teams.length >= 4) {
      groupIdx++;
    }
    if (groupIdx === 1 && groups[1].teams.length >= 4) {
      groupIdx++;
    }
    if (groupIdx === 2 && groups[2].teams.length >= 4) {
      groupIdx++;
    }
    if (groupIdx === 3 && groups[3].teams.length >= 4) {
      break;
    }
    groups[groupIdx].teams.push({ name: team.name, overall: team.overall, isPlayer: false });
    if (groups[groupIdx].teams.length >= 4) {
      groupIdx++;
    }
  }

  // Initialize standings for each group
  for (const group of groups) {
    group.standings = group.teams.map(t => ({
      name: t.name,
      overall: t.overall,
      isPlayer: t.isPlayer || false,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    }));
  }

  return groups;
}

/**
 * Generate group stage fixtures (home & away for each pair = 6 matchdays per group).
 * Returns an array of matchdays, each containing all matches for that day.
 */
function generateGroupFixtures(groups) {
  const matchdays = [];

  for (let md = 0; md < 6; md++) {
    matchdays.push([]);
  }

  for (const group of groups) {
    const teams = group.standings.map(t => t.name);
    // Round-robin: each pair plays twice (home and away)
    const fixtures = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push({ home: teams[i], away: teams[j], group: group.name });
        fixtures.push({ home: teams[j], away: teams[i], group: group.name });
      }
    }
    // Distribute 6 fixtures across 6 matchdays (1 match per group per matchday)
    for (let i = 0; i < fixtures.length; i++) {
      matchdays[i % 6].push(fixtures[i]);
    }
  }

  return matchdays;
}

module.exports = { EUROPEAN_TEAMS, CL_PRIZES, generateCLDraw, generateGroupFixtures };
