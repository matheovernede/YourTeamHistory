const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb, queryOne, queryAll, run, saveDb } = require('../db/schema');
const { simulateMatch, simulateAiMatchByStrength, applyMatchEffects } = require('../engine/match');
const { getRandomSponsors } = require('../data/sponsors');
const { DIVISIONS } = require('../data/divisions');
const { seedDivision } = require('../db/seed');
const { getRandomEvent, EVENTS } = require('../data/events');

const router = express.Router();

/**
 * Get the player's current division level.
 */
function getTeamDivision(team) {
  return team.division || 1;
}

/**
 * Get division metadata by level.
 */
function getDivisionInfo(level) {
  return DIVISIONS.find(d => d.level === level) || DIVISIONS[0];
}

router.get('/:teamId/status', (req, res) => {
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

  const division = getTeamDivision(team);
  const divisionInfo = getDivisionInfo(division);
  const totalMatches = 26;
  const played = team.wins + team.draws + team.losses;
  const remaining = totalMatches - played;

  // Only show AI teams + current player's team in the same division
  const standings = queryAll(`
    SELECT t.id, t.name, t.points, t.wins, t.draws, t.losses, t.goals_for, t.goals_against,
           (t.goals_for - t.goals_against) as goal_diff
    FROM teams t
    WHERE t.division = ? AND (t.manager_id = 'AI' OR t.id = ?)
    ORDER BY t.points DESC, goal_diff DESC, t.goals_for DESC
  `, [division, req.params.teamId]);

  const rank = standings.findIndex(t => t.id === req.params.teamId) + 1;

  res.json({
    season: team.season,
    matchday: played + 1,
    played,
    remaining,
    totalMatches,
    rank,
    standings,
    team,
    division: divisionInfo.name,
    divisionLevel: division,
  });
});

router.post('/:teamId/play-matchday', async (req, res) => {
  const db = await getDb();
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

  const played = team.wins + team.draws + team.losses;
  if (played >= 26) {
    return res.status(400).json({ error: 'Saison terminée ! Allez au mercato.', seasonOver: true });
  }

  const starterCount = queryOne('SELECT COUNT(*) as count FROM players WHERE team_id = ? AND is_starter = 1', [team.id]);
  if (!starterCount || starterCount.count < 11) {
    return res.status(400).json({ error: 'Composez votre équipe (11 titulaires) dans l\'onglet Compo avant de jouer !' });
  }

  const division = getTeamDivision(team);

  // Pick an opponent from the same division
  let aiTeams = queryAll("SELECT * FROM teams WHERE manager_id = 'AI' AND division = ?", [division]);
  if (aiTeams.length === 0) {
    // No AI teams in this division — seed them now
    await seedDivision(division);
    aiTeams = queryAll("SELECT * FROM teams WHERE manager_id = 'AI' AND division = ?", [division]);
    if (aiTeams.length === 0) return res.status(500).json({ error: "Pas d'adversaires dans cette division" });
  }
  const opponent = aiTeams[Math.floor(Math.random() * aiTeams.length)];

  const homePlayers = queryAll('SELECT * FROM players WHERE team_id = ?', [team.id]);
  const awayPlayers = queryAll('SELECT * FROM players WHERE team_id = ?', [opponent.id]);

  const difficulty = req.body.difficulty || 'normal';
  const result = simulateMatch(homePlayers, awayPlayers, { difficulty });
  const matchId = uuid();
  const week = played + 1;

  db.run(
    "INSERT INTO matches (id, season, week, home_team_id, away_team_id, home_goals, away_goals, played, events, played_at) VALUES (?,?,?,?,?,?,?,1,?,datetime('now'))",
    [matchId, team.season, week, team.id, opponent.id, result.homeGoals, result.awayGoals, JSON.stringify(result.events)]
  );

  let pointsEarned = 0;
  let resultText = '';
  let matchBonus = 0;
  const goalDiff = result.homeGoals - result.awayGoals;

  // Win bonus scales with division
  const winBonusByDiv = [100000, 200000, 400000, 700000, 1200000, 2500000, 5000000];
  const baseWinBonus = winBonusByDiv[division - 1] || 1000000;

  if (goalDiff > 0) {
    pointsEarned = 3;
    resultText = 'Victoire';
    matchBonus = goalDiff >= 4 ? baseWinBonus * 3 : goalDiff >= 2 ? baseWinBonus * 2 : baseWinBonus;
    db.run('UPDATE teams SET wins = wins + 1, points = points + 3, goals_for = goals_for + ?, goals_against = goals_against + ? WHERE id = ?', [result.homeGoals, result.awayGoals, team.id]);
    db.run('UPDATE managers SET budget = budget + ? WHERE id = ?', [matchBonus, team.manager_id]);
  } else if (goalDiff === 0) {
    pointsEarned = 1;
    resultText = 'Match nul';
    db.run('UPDATE teams SET draws = draws + 1, points = points + 1, goals_for = goals_for + ?, goals_against = goals_against + ? WHERE id = ?', [result.homeGoals, result.awayGoals, team.id]);
  } else {
    resultText = 'Défaite';
    db.run('UPDATE teams SET losses = losses + 1, goals_for = goals_for + ?, goals_against = goals_against + ? WHERE id = ?', [result.homeGoals, result.awayGoals, team.id]);
  }

  // Apply stamina/morale effects to player's team
  const won = result.homeGoals > result.awayGoals;
  const drew = result.homeGoals === result.awayGoals;
  applyMatchEffects(db, team.id, won, drew);

  // Simulate AI matches within the same division
  simulateAiMatches(db, team.season, week, team.id, division);
  saveDb();

  const updatedTeam = queryOne('SELECT * FROM teams WHERE id = ?', [team.id]);
  const newPlayed = updatedTeam.wins + updatedTeam.draws + updatedTeam.losses;
  const seasonOver = newPlayed >= 26;

  // Check if a random event triggers after this match
  const standings = queryAll("SELECT t.id FROM teams t WHERE t.division = ? AND (t.manager_id = 'AI' OR t.id = ?) ORDER BY t.points DESC", [division, team.id]);
  const currentRank = standings.findIndex(t => t.id === team.id) + 1;
  const isLosing = currentRank > Math.ceil(standings.length / 2);
  const event = getRandomEvent(week, isLosing);

  res.json({
    match: {
      id: matchId,
      opponent: opponent.name,
      homeGoals: result.homeGoals,
      awayGoals: result.awayGoals,
      events: result.events,
      pointsEarned,
      resultText,
      matchBonus,
      matchday: week,
    },
    team: updatedTeam,
    seasonOver,
    event: event || null,
  });
});

router.post('/:teamId/resolve-event', async (req, res) => {
  const { eventId, choiceId, managerId } = req.body;
  if (!eventId || !choiceId || !managerId) {
    return res.status(400).json({ error: 'eventId, choiceId et managerId requis' });
  }

  const db = await getDb();
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

  const event = EVENTS.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ error: 'Événement non trouvé' });

  const choice = event.choices.find(c => c.id === choiceId);
  if (!choice) return res.status(400).json({ error: 'Choix invalide' });

  const effects = choice.effects || {};
  const division = getTeamDivision(team);
  const divScale = [1, 2, 3, 5, 8, 15, 25][division - 1] || 1;

  // Handle chance-based outcomes
  if (effects.chance && Math.random() > effects.chance) {
    // Failed gamble
    const penalty = effects.reputation ? Math.abs(effects.reputation) : 10;
    db.run('UPDATE managers SET reputation = MAX(0, reputation - ?) WHERE id = ?', [penalty, managerId]);
    saveDb();
    const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
    return res.json({
      success: false,
      consequence: 'Le pari a échoué... Les conséquences sont lourdes.',
      manager: updatedManager,
      team,
    });
  }

  // Apply effects
  if (effects.budget) {
    const scaledBudget = effects.budget * divScale;
    db.run('UPDATE managers SET budget = MAX(0, budget + ?) WHERE id = ?', [scaledBudget, managerId]);
  }
  if (effects.morale) {
    db.run('UPDATE players SET morale = MAX(20, MIN(100, morale + ?)) WHERE team_id = ?', [effects.morale, req.params.teamId]);
  }
  if (effects.reputation) {
    db.run('UPDATE managers SET reputation = MAX(0, MIN(100, reputation + ?)) WHERE id = ?', [effects.reputation, managerId]);
  }
  if (effects.stamina_boost) {
    db.run('UPDATE players SET stamina = MAX(0, MIN(100, stamina + ?)) WHERE team_id = ?', [effects.stamina_boost, req.params.teamId]);
  }

  saveDb();

  const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  const updatedTeam = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);

  res.json({
    success: true,
    consequence: choice.consequence,
    manager: updatedManager,
    team: updatedTeam,
  });
});

/**
 * Only simulates matches between teams in the same division.
 */
function simulateAiMatches(db, season, week, excludeTeamId, division) {
  const aiTeams = queryAll("SELECT * FROM teams WHERE manager_id = 'AI' AND division = ?", [division]);
  const shuffled = [...aiTeams].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    const home = shuffled[i];
    const away = shuffled[i + 1];
    if (!away) break;

    // Get average overall of each team's starters for realistic simulation
    const homePlayers = queryAll('SELECT overall FROM players WHERE team_id = ? AND is_starter = 1', [home.id]);
    const awayPlayers = queryAll('SELECT overall FROM players WHERE team_id = ? AND is_starter = 1', [away.id]);

    const homeAvg = homePlayers.length > 0
      ? homePlayers.reduce((s, p) => s + p.overall, 0) / homePlayers.length
      : 60;
    const awayAvg = awayPlayers.length > 0
      ? awayPlayers.reduce((s, p) => s + p.overall, 0) / awayPlayers.length
      : 60;

    const result = simulateAiMatchByStrength(homeAvg, awayAvg);
    const { homeGoals, awayGoals } = result;

    if (homeGoals > awayGoals) {
      db.run('UPDATE teams SET wins = wins + 1, points = points + 3, goals_for = goals_for + ?, goals_against = goals_against + ? WHERE id = ?', [homeGoals, awayGoals, home.id]);
      db.run('UPDATE teams SET losses = losses + 1, goals_for = goals_for + ?, goals_against = goals_against + ? WHERE id = ?', [awayGoals, homeGoals, away.id]);
    } else if (homeGoals === awayGoals) {
      db.run('UPDATE teams SET draws = draws + 1, points = points + 1, goals_for = goals_for + ?, goals_against = goals_against + ? WHERE id = ?', [homeGoals, awayGoals, home.id]);
      db.run('UPDATE teams SET draws = draws + 1, points = points + 1, goals_for = goals_for + ?, goals_against = goals_against + ? WHERE id = ?', [awayGoals, homeGoals, away.id]);
    } else {
      db.run('UPDATE teams SET losses = losses + 1, goals_for = goals_for + ?, goals_against = goals_against + ? WHERE id = ?', [homeGoals, awayGoals, home.id]);
      db.run('UPDATE teams SET wins = wins + 1, points = points + 3, goals_for = goals_for + ?, goals_against = goals_against + ? WHERE id = ?', [awayGoals, homeGoals, away.id]);
    }
  }
}

/**
 * Management actions - costs scale with division level.
 * Division 1 (Regional 2) = cheap, Division 7 (Ligue 1) = expensive.
 */
function getManagementCosts(divisionLevel) {
  const scaleFactor = [1, 2.5, 5, 10, 20, 40, 70][divisionLevel - 1] || 1;
  return {
    training: 200000 * scaleFactor,      // 200k -> 14M
    cohesion: 150000 * scaleFactor,      // 150k -> 10.5M
    fitness: 500000 * scaleFactor,       // 500k -> 35M
    scout: 400000 * scaleFactor,         // 400k -> 28M
    medical: 600000 * scaleFactor,       // 600k -> 42M
  };
}

const MANAGEMENT_ACTIONS = [
  {
    id: 'training',
    name: 'Entrainement intensif',
    description: 'Booste le overall de tous les titulaires de +1. Limité à 1 fois par 3 journées.',
    icon: '🏋️',
    effect: '+1 OVR titulaires',
    cooldown: 3,
  },
  {
    id: 'cohesion',
    name: 'Stage de cohésion',
    description: "Renforce l'esprit d'équipe. +10 moral pour tout l'effectif.",
    icon: '🤝',
    effect: '+10 moral (tous)',
    cooldown: 0,
  },
  {
    id: 'fitness',
    name: 'Préparateur physique',
    description: 'Restaure 30 points de stamina pour tous les joueurs.',
    icon: '⚡',
    effect: '+30 stamina (tous)',
    cooldown: 0,
  },
  {
    id: 'scout',
    name: 'Recruteur',
    description: 'Améliore votre réseau. +3 réputation permanente.',
    icon: '🔍',
    effect: '+3 réputation',
    cooldown: 0,
  },
  {
    id: 'medical',
    name: 'Centre médical',
    description: 'Remet en forme les joueurs fatigués (stamina < 50). Stamina rétablie à 100.',
    icon: '🏥',
    effect: '100 stamina (joueurs < 50)',
    cooldown: 0,
  },
];

router.get('/:teamId/management', (req, res) => {
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

  const division = getTeamDivision(team);
  const costs = getManagementCosts(division);
  const played = team.wins + team.draws + team.losses;

  // Check if training is on cooldown (stored in teams.last_training_matchday)
  const lastTraining = team.last_training_matchday || 0;
  const trainingAvailable = (played - lastTraining) >= 3;

  const actions = MANAGEMENT_ACTIONS.map(action => ({
    ...action,
    cost: costs[action.id],
    available: action.id === 'training' ? trainingAvailable : true,
    cooldownRemaining: action.id === 'training' && !trainingAvailable ? 3 - (played - lastTraining) : 0,
  }));

  res.json({ actions, budget: null }); // budget comes from manager on client side
});

router.post('/:teamId/manage', async (req, res) => {
  const { actionId, managerId } = req.body;
  if (!actionId || !managerId) return res.status(400).json({ error: 'actionId et managerId requis' });

  const db = await getDb();
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  if (!manager) return res.status(404).json({ error: 'Manager non trouvé' });

  const division = getTeamDivision(team);
  const costs = getManagementCosts(division);
  const cost = costs[actionId];
  if (!cost) return res.status(400).json({ error: 'Action invalide' });

  if (manager.budget < cost) {
    return res.status(400).json({ error: 'Budget insuffisant' });
  }

  const played = team.wins + team.draws + team.losses;

  // Training cooldown check
  if (actionId === 'training') {
    const lastTraining = team.last_training_matchday || 0;
    if ((played - lastTraining) < 3) {
      return res.status(400).json({ error: 'Entrainement intensif en cooldown (attendre 3 journées)' });
    }
  }

  // Deduct cost
  db.run('UPDATE managers SET budget = budget - ? WHERE id = ?', [cost, managerId]);

  // Apply effect
  switch (actionId) {
    case 'training':
      db.run('UPDATE players SET overall = MIN(99, overall + 1) WHERE team_id = ? AND is_starter = 1', [req.params.teamId]);
      // Store last training matchday - use a column if available, otherwise we add it
      try {
        db.run('UPDATE teams SET last_training_matchday = ? WHERE id = ?', [played, req.params.teamId]);
      } catch (e) {
        // Column might not exist yet, try to add it
        try {
          db.run('ALTER TABLE teams ADD COLUMN last_training_matchday INTEGER DEFAULT 0');
          db.run('UPDATE teams SET last_training_matchday = ? WHERE id = ?', [played, req.params.teamId]);
        } catch (e2) {
          // Already exists, just update
          db.run('UPDATE teams SET last_training_matchday = ? WHERE id = ?', [played, req.params.teamId]);
        }
      }
      break;
    case 'cohesion':
      db.run('UPDATE players SET morale = MIN(100, morale + 10) WHERE team_id = ?', [req.params.teamId]);
      break;
    case 'fitness':
      db.run('UPDATE players SET stamina = MIN(100, stamina + 30) WHERE team_id = ?', [req.params.teamId]);
      break;
    case 'scout':
      db.run('UPDATE managers SET reputation = MIN(100, reputation + 3) WHERE id = ?', [managerId]);
      break;
    case 'medical':
      db.run('UPDATE players SET stamina = 100 WHERE team_id = ? AND stamina < 50', [req.params.teamId]);
      break;
    default:
      return res.status(400).json({ error: 'Action inconnue' });
  }

  saveDb();

  const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  const updatedTeam = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);

  res.json({
    success: true,
    action: MANAGEMENT_ACTIONS.find(a => a.id === actionId),
    cost,
    manager: updatedManager,
    team: updatedTeam,
  });
});

router.get('/:teamId/sponsors', (req, res) => {
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });
  const division = getTeamDivision(team);
  const sponsors = getRandomSponsors(division, 4);
  res.json(sponsors);
});

router.post('/:teamId/choose-sponsor', async (req, res) => {
  const { sponsorId, managerId } = req.body;
  if (!sponsorId || !managerId) return res.status(400).json({ error: 'sponsorId et managerId requis' });

  const db = await getDb();
  const { SPONSORS_BY_TIER } = require('../data/sponsors');
  const allSponsors = Object.values(SPONSORS_BY_TIER).flat();
  const sponsor = allSponsors.find(s => s.id === sponsorId);
  if (!sponsor) return res.status(404).json({ error: 'Sponsor non trouvé' });

  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);

  db.run('UPDATE managers SET budget = budget + ? WHERE id = ?', [sponsor.payment, managerId]);

  let newReputation = (manager.reputation || 50) + (sponsor.bonus.reputation || 0) + (sponsor.malus.reputation || 0);
  newReputation = Math.max(0, Math.min(100, newReputation));
  db.run('UPDATE managers SET reputation = ? WHERE id = ?', [newReputation, managerId]);

  const moraleChange = (sponsor.bonus.morale || 0) + (sponsor.malus.morale || 0);
  if (moraleChange !== 0) {
    db.run('UPDATE players SET morale = MAX(20, MIN(100, morale + ?)) WHERE team_id = ?', [moraleChange, req.params.teamId]);
  }

  if (sponsor.bonus.stamina_boost) {
    db.run('UPDATE players SET stamina = MIN(100, stamina + ?) WHERE team_id = ?', [sponsor.bonus.stamina_boost, req.params.teamId]);
  }

  saveDb();

  const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  res.json({ sponsor, newBudget: updatedManager.budget, newReputation: updatedManager.reputation });
});

router.post('/:teamId/end-season', async (req, res) => {
  const { managerId } = req.body;
  const db = await getDb();
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

  const division = getTeamDivision(team);
  const divisionInfo = getDivisionInfo(division);

  // Get standings for the player's division (AI + current player only)
  const standings = queryAll(`
    SELECT t.id, t.name, t.points, t.wins, t.draws, t.losses, t.goals_for, t.goals_against,
           (t.goals_for - t.goals_against) as goal_diff
    FROM teams t
    WHERE t.division = ? AND (t.manager_id = 'AI' OR t.id = ?)
    ORDER BY t.points DESC, goal_diff DESC, t.goals_for DESC
  `, [division, req.params.teamId]);

  const rank = standings.findIndex(t => t.id === req.params.teamId) + 1;
  const totalTeams = standings.length;

  // Determine promotion/relegation
  let promotion = false;
  let relegation = false;
  let newDivision = division;

  // Top 2 = promoted (if not already in Ligue 1)
  if (rank <= 2 && division < 7) {
    promotion = true;
    newDivision = division + 1;
  }
  // Bottom 2 = relegated (if not already in Regional 2)
  else if (rank > totalTeams - 2 && division > 1) {
    relegation = true;
    newDivision = division - 1;
  }

  // Prize money based on rank within division
  const prizes = divisionInfo.prizePool || [50000, 30000, 20000, 15000, 10000];
  let prizePool = 0;
  if (rank <= prizes.length) {
    prizePool = prizes[rank - 1];
  } else {
    prizePool = Math.max(5000, prizes[prizes.length - 1] - (rank - prizes.length) * 5000);
  }

  // Promotion bonus: significant reward for moving up
  let promotionBonus = 0;
  if (promotion) {
    const bonusByNewDiv = [0, 500000, 2000000, 5000000, 10000000, 20000000, 50000000];
    promotionBonus = bonusByNewDiv[newDivision - 1] || 5000000;
    prizePool += promotionBonus;
  }

  db.run('UPDATE managers SET budget = budget + ? WHERE id = ?', [prizePool, managerId]);

  const newSeason = team.season + 1;

  // Update player team: new season, new division, reset stats
  db.run('UPDATE teams SET season = ?, division = ?, points = 0, wins = 0, draws = 0, losses = 0, goals_for = 0, goals_against = 0 WHERE id = ?',
    [newSeason, newDivision, req.params.teamId]);

  // AI promotion/relegation in the same division
  const aiInDiv = queryAll("SELECT id, name, points, goals_for, goals_against FROM teams WHERE manager_id = 'AI' AND division = ? ORDER BY points DESC, (goals_for - goals_against) DESC", [division]);

  // Top 2 AI teams get promoted (if division < 7)
  if (division < 7) {
    const promoted = aiInDiv.slice(0, 2);
    for (const ai of promoted) {
      db.run('UPDATE teams SET division = ?, points = 0, wins = 0, draws = 0, losses = 0, goals_for = 0, goals_against = 0 WHERE id = ?', [division + 1, ai.id]);
    }
  }

  // Bottom 2 AI teams get relegated (if division > 1)
  if (division > 1) {
    const relegated = aiInDiv.slice(-2);
    for (const ai of relegated) {
      db.run('UPDATE teams SET division = ?, points = 0, wins = 0, draws = 0, losses = 0, goals_for = 0, goals_against = 0 WHERE id = ?', [division - 1, ai.id]);
    }
  }

  // Reset remaining AI teams in this division for new season
  db.run("UPDATE teams SET points = 0, wins = 0, draws = 0, losses = 0, goals_for = 0, goals_against = 0 WHERE manager_id = 'AI' AND division = ?", [division]);

  // Make sure the new division has enough AI teams (seed if needed)
  const aiInNewDiv = queryAll("SELECT id FROM teams WHERE manager_id = 'AI' AND division = ?", [newDivision]);
  if (aiInNewDiv.length < 10) {
    // Remove teams that are too few and reseed
    for (const ai of aiInNewDiv) {
      db.run('DELETE FROM players WHERE team_id = ?', [ai.id]);
      db.run('DELETE FROM teams WHERE id = ?', [ai.id]);
    }
    saveDb();
    await seedDivision(newDivision);
  } else {
    // Reset their stats for new season
    db.run("UPDATE teams SET points = 0, wins = 0, draws = 0, losses = 0, goals_for = 0, goals_against = 0 WHERE manager_id = 'AI' AND division = ?", [newDivision]);
  }

  // Reset Champions League state for new season
  db.run('UPDATE teams SET cl_data = NULL WHERE id = ?', [req.params.teamId]);

  // Pre-season: full recovery + aging
  db.run('UPDATE players SET stamina = 100, morale = 80 WHERE team_id = ?', [req.params.teamId]);
  db.run('UPDATE players SET age = age + 1 WHERE team_id = ?', [req.params.teamId]);

  saveDb();

  const newDivisionInfo = getDivisionInfo(newDivision);
  const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  const updatedTeam = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);

  res.json({
    seasonSummary: {
      season: team.season,
      rank,
      points: team.points,
      wins: team.wins,
      draws: team.draws,
      losses: team.losses,
      prizePool,
      divisionName: divisionInfo.name,
    },
    promotion,
    relegation,
    newDivision: newDivisionInfo.name,
    newDivisionLevel: newDivision,
    manager: updatedManager,
    team: updatedTeam,
  });
});

module.exports = router;
