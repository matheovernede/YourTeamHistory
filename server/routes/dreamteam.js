const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb, queryOne, queryAll, run, saveDb } = require('../db/schema');
const { simulateMatch } = require('../engine/match');
const DREAM_TEAM_PLAYERS = require('../data/dreamTeamPlayers');
const { langueDe, t } = require('../i18n');

const router = express.Router();

// ===================== Player generation (from seed.js pattern) =====================

const FIRST_NAMES = [
  'Lucas', 'Hugo', 'Mathis', 'Nathan', 'Enzo', 'Thomas', 'Noah', 'Maxime', 'Antoine',
  'Baptiste', 'Alexis', 'Romain', 'Julien', 'Quentin', 'Nicolas', 'Kevin', 'Dylan',
  'Pierre', 'Florian', 'Valentin', 'Axel', 'Adrien', 'Benjamin', 'Guillaume', 'Vincent',
  'Mehdi', 'Youssef', 'Karim', 'Sofiane', 'Ibrahim', 'Moussa', 'Mamadou', 'Omar', 'Bilal',
  'Corentin', 'Gauthier', 'Erwan', 'Sylvain', 'Franck', 'Christophe',
];

const LAST_NAMES = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
  'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
  'Morel', 'Girard', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'Martinez', 'Legrand',
  'Diallo', 'Traore', 'Camara', 'Diop', 'Kone', 'Bamba', 'Toure', 'Coulibaly', 'Sylla', 'Ba',
  'Fernandez', 'Lopez', 'Pereira', 'Da Silva', 'Santos', 'Rodrigues', 'Ferreira', 'Costa',
];

const CL_TEAM_NAMES = [
  'Real Madrid', 'FC Barcelona', 'Bayern Munich', 'Manchester City',
  'Liverpool FC', 'Juventus', 'PSG', 'Inter Milan',
  'AC Milan', 'Borussia Dortmund', 'Atletico Madrid', 'Chelsea FC',
  'Arsenal', 'Napoli', 'Benfica', 'Porto',
];

function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePlayer(position, overallMin, overallMax) {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const age = randomInRange(18, 35);
  const overall = randomInRange(overallMin, overallMax);

  let pace, shooting, passing, dribbling, defending, physical;

  switch (position) {
    case 'GAR':
      pace = randomInRange(25, 45);
      shooting = randomInRange(8, 18);
      passing = randomInRange(overall - 20, overall - 5);
      dribbling = randomInRange(15, 35);
      defending = randomInRange(overall - 5, overall + 3);
      physical = randomInRange(overall - 12, overall - 2);
      break;
    case 'DC':
      pace = randomInRange(overall - 20, overall - 5);
      shooting = randomInRange(overall - 30, overall - 15);
      passing = randomInRange(overall - 15, overall - 5);
      dribbling = randomInRange(overall - 20, overall - 8);
      defending = randomInRange(overall - 3, overall + 5);
      physical = randomInRange(overall - 5, overall + 3);
      break;
    case 'ARD': case 'ARG':
      pace = randomInRange(overall - 2, overall + 8);
      shooting = randomInRange(overall - 20, overall - 8);
      passing = randomInRange(overall - 8, overall + 2);
      dribbling = randomInRange(overall - 8, overall + 2);
      defending = randomInRange(overall - 5, overall + 3);
      physical = randomInRange(overall - 8, overall + 2);
      break;
    case 'MC':
      pace = randomInRange(overall - 12, overall + 2);
      shooting = randomInRange(overall - 10, overall + 2);
      passing = randomInRange(overall - 2, overall + 6);
      dribbling = randomInRange(overall - 5, overall + 5);
      defending = randomInRange(overall - 10, overall + 2);
      physical = randomInRange(overall - 5, overall + 5);
      break;
    case 'MOC':
      pace = randomInRange(overall - 8, overall + 3);
      shooting = randomInRange(overall - 3, overall + 5);
      passing = randomInRange(overall, overall + 8);
      dribbling = randomInRange(overall, overall + 8);
      defending = randomInRange(overall - 25, overall - 12);
      physical = randomInRange(overall - 12, overall - 2);
      break;
    case 'MDF':
      pace = randomInRange(overall - 10, overall);
      shooting = randomInRange(overall - 15, overall - 5);
      passing = randomInRange(overall - 2, overall + 5);
      dribbling = randomInRange(overall - 8, overall + 2);
      defending = randomInRange(overall - 2, overall + 5);
      physical = randomInRange(overall - 3, overall + 5);
      break;
    case 'AIG': case 'AID':
      pace = randomInRange(overall + 2, overall + 12);
      shooting = randomInRange(overall - 5, overall + 5);
      passing = randomInRange(overall - 8, overall + 2);
      dribbling = randomInRange(overall, overall + 10);
      defending = randomInRange(overall - 35, overall - 20);
      physical = randomInRange(overall - 15, overall - 5);
      break;
    case 'BU':
      pace = randomInRange(overall - 5, overall + 8);
      shooting = randomInRange(overall + 2, overall + 10);
      passing = randomInRange(overall - 15, overall - 5);
      dribbling = randomInRange(overall - 5, overall + 5);
      defending = randomInRange(overall - 35, overall - 20);
      physical = randomInRange(overall - 5, overall + 5);
      break;
    default:
      pace = randomInRange(overall - 10, overall + 5);
      shooting = randomInRange(overall - 10, overall + 5);
      passing = randomInRange(overall - 5, overall + 5);
      dribbling = randomInRange(overall - 5, overall + 5);
      defending = randomInRange(overall - 10, overall + 5);
      physical = randomInRange(overall - 5, overall + 5);
  }

  const clamp = v => Math.max(1, Math.min(99, v));

  return {
    id: uuid(),
    first_name: firstName,
    last_name: lastName,
    age,
    position,
    overall,
    pace: clamp(pace),
    shooting: clamp(shooting),
    passing: clamp(passing),
    dribbling: clamp(dribbling),
    defending: clamp(defending),
    physical: clamp(physical),
    stamina: randomInRange(80, 100),
    morale: randomInRange(70, 90),
    is_starter: 1,
  };
}

function generateAITeam(targetOverall) {
  const positions = ['GAR', 'DC', 'DC', 'ARG', 'ARD', 'MC', 'MC', 'MOC', 'AIG', 'AID', 'BU'];
  const variance = 3;
  return positions.map(pos => generatePlayer(pos, targetOverall - variance, targetOverall + variance));
}

// ===================== Existing routes =====================

// GET /api/dreamteam/players — returns all players, optionally filtered
router.get('/players', (req, res) => {
  let players = DREAM_TEAM_PLAYERS;

  if (req.query.league) {
    players = players.filter(p => p.league === req.query.league);
  }

  if (req.query.position) {
    players = players.filter(p => p.position === req.query.position);
  }

  res.json(players);
});

// POST /api/dreamteam/save — acknowledges save (client handles localStorage)
router.post('/save', (req, res) => {
  res.json({ success: true });
});

// ===================== New gameplay routes =====================

/**
 * POST /api/dreamteam/friendly
 * Simulates a friendly match between the dream team and a generated AI team.
 * Body: { homePlayers, difficulty }
 * Difficulty determines AI overall: weak=55, medium=68, strong=78, legend=88
 */
router.post('/friendly', (req, res) => {
  const langue = langueDe(req);
  const { homePlayers, difficulty } = req.body;

  if (!homePlayers || homePlayers.length < 11) {
    return res.status(400).json({ error: t('erreur.joueursMinimumRequis', langue) });
  }

  const difficultyOveralls = { weak: 55, medium: 68, strong: 78, legend: 88 };
  const aiOverall = difficultyOveralls[difficulty] || difficultyOveralls.medium;

  // Prepare home players for the match engine (need is_starter flag)
  const homeSquad = homePlayers.slice(0, 11).map(p => ({
    ...p,
    is_starter: 1,
    stamina: p.stamina || 90,
    morale: p.morale || 80,
  }));

  const awaySquad = generateAITeam(aiOverall);

  const result = simulateMatch(homeSquad, awaySquad);

  // Generate a team name for the AI
  const aiTeamNames = {
    weak: 'FC Amateurs',
    medium: 'AS Departementale',
    strong: 'FC National',
    legend: 'Elite All-Stars',
  };

  res.json({
    homeGoals: result.homeGoals,
    awayGoals: result.awayGoals,
    events: result.events,
    opponentName: aiTeamNames[difficulty] || aiTeamNames.medium,
    opponentOverall: aiOverall,
  });
});

/**
 * POST /api/dreamteam/cl-draw
 * Generates 7 AI teams for an 8-team Champions League bracket (user is the 8th).
 * Teams have overall between 80-90.
 */
router.post('/cl-draw', (req, res) => {
  // Shuffle and pick 7 team names
  const shuffled = [...CL_TEAM_NAMES].sort(() => Math.random() - 0.5);
  const teams = shuffled.slice(0, 7).map(name => {
    const overall = randomInRange(80, 90);
    const players = generateAITeam(overall);
    return { name, overall, players };
  });

  res.json({ teams });
});

/**
 * POST /api/dreamteam/cl-match
 * Simulates one CL match between the user's dream team and an AI team.
 * Body: { homePlayers, awayPlayers }
 */
router.post('/cl-match', (req, res) => {
  const langue = langueDe(req);
  const { homePlayers, awayPlayers } = req.body;

  if (!homePlayers || homePlayers.length < 11) {
    return res.status(400).json({ error: t('erreur.joueursMinimumRequisEquipe', langue) });
  }
  if (!awayPlayers || awayPlayers.length < 11) {
    return res.status(400).json({ error: t('erreur.equipeAdverseInvalide', langue) });
  }

  const homeSquad = homePlayers.slice(0, 11).map(p => ({
    ...p,
    is_starter: 1,
    stamina: p.stamina || 90,
    morale: p.morale || 80,
  }));

  const awaySquad = awayPlayers.slice(0, 11).map(p => ({
    ...p,
    is_starter: 1,
    stamina: p.stamina || 85,
    morale: p.morale || 75,
  }));

  const result = simulateMatch(homeSquad, awaySquad);

  res.json({
    homeGoals: result.homeGoals,
    awayGoals: result.awayGoals,
    events: result.events,
  });
});

/**
 * POST /api/dreamteam/start-career
 * Creates a manager + team in division 1 (R2), inserts the dreamteam players as the squad.
 * Skips the draft phase entirely.
 * Body: { username, teamName, players }
 */
router.post('/start-career', async (req, res) => {
  const langue = langueDe(req);
  const { username, teamName, players } = req.body;

  if (!username || !teamName || !players || players.length < 11) {
    return res.status(400).json({ error: t('erreur.requis.dreamteamCarriere', langue) });
  }

  const db = await getDb();

  // Create or reuse manager
  let manager = queryOne('SELECT * FROM managers WHERE username = ?', [username.trim()]);
  if (manager) {
    // Clear any existing teams
    const existingTeams = queryAll("SELECT id FROM teams WHERE manager_id = ? AND manager_id != 'AI'", [manager.id]);
    for (const t of existingTeams) {
      run('DELETE FROM players WHERE team_id = ?', [t.id]);
      run('DELETE FROM teams WHERE id = ?', [t.id]);
    }
    run('UPDATE managers SET budget = 20000000, reputation = 50 WHERE id = ?', [manager.id]);
    manager = queryOne('SELECT * FROM managers WHERE id = ?', [manager.id]);
  } else {
    const managerId = uuid();
    run('INSERT INTO managers (id, username, budget, reputation) VALUES (?, ?, 20000000, 50)', [managerId, username.trim()]);
    manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  }

  // Create team in division 1 (Regional 2)
  const teamId = uuid();
  run('INSERT INTO teams (id, manager_id, name, formation, division, season) VALUES (?, ?, ?, ?, 1, 1)', [teamId, manager.id, teamName.trim(), '4-3-3']);

  // Insert players into the team
  const starters = players.slice(0, 11);
  const subs = players.slice(11, 18);

  for (const p of starters) {
    const playerId = uuid();
    const value = Math.max(100000, Math.round((p.overall || 70) * (p.overall || 70) * 500));
    run(
      'INSERT INTO players (id, team_id, first_name, last_name, age, position, overall, pace, shooting, passing, dribbling, defending, physical, stamina, morale, value, is_starter) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,100,80,?,1)',
      [playerId, teamId, p.first_name, p.last_name, p.age || 25, p.position, p.overall, p.pace, p.shooting, p.passing, p.dribbling, p.defending, p.physical, value]
    );
  }

  for (const p of subs) {
    const playerId = uuid();
    const value = Math.max(100000, Math.round((p.overall || 70) * (p.overall || 70) * 500));
    run(
      'INSERT INTO players (id, team_id, first_name, last_name, age, position, overall, pace, shooting, passing, dribbling, defending, physical, stamina, morale, value, is_starter) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,100,70,?,0)',
      [playerId, teamId, p.first_name, p.last_name, p.age || 25, p.position, p.overall, p.pace, p.shooting, p.passing, p.dribbling, p.defending, p.physical, value]
    );
  }

  saveDb();

  const team = queryOne('SELECT * FROM teams WHERE id = ?', [teamId]);
  res.json({ manager, team });
});

module.exports = router;
