const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb, queryOne, queryAll, run, saveDb } = require('../db/schema');
const { simulateMatch, applyMatchEffects } = require('../engine/match');

const router = express.Router();

router.post('/play', async (req, res) => {
  const { teamId } = req.body;
  if (!teamId) return res.status(400).json({ error: 'teamId requis' });

  const db = await getDb();
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

  const division = team.division || 1;
  const aiTeams = queryAll("SELECT id FROM teams WHERE manager_id = 'AI' AND division = ?", [division]);
  if (aiTeams.length === 0) return res.status(500).json({ error: "Pas d'adversaires disponibles" });

  const opponent = aiTeams[Math.floor(Math.random() * aiTeams.length)];
  const opponentTeam = queryOne('SELECT * FROM teams WHERE id = ?', [opponent.id]);

  const homePlayers = queryAll('SELECT * FROM players WHERE team_id = ?', [teamId]);
  const awayPlayers = queryAll('SELECT * FROM players WHERE team_id = ?', [opponent.id]);

  const result = simulateMatch(homePlayers, awayPlayers);

  const matchId = uuid();
  const week = team.wins + team.draws + team.losses + 1;

  db.run(
    "INSERT INTO matches (id, season, week, home_team_id, away_team_id, home_goals, away_goals, played, events, played_at) VALUES (?,?,?,?,?,?,?,1,?,datetime('now'))",
    [matchId, team.season, week, teamId, opponent.id, result.homeGoals, result.awayGoals, JSON.stringify(result.events)]
  );

  let pointsEarned = 0;
  if (result.homeGoals > result.awayGoals) {
    pointsEarned = 3;
    db.run('UPDATE teams SET wins = wins + 1, points = points + 3, goals_for = goals_for + ?, goals_against = goals_against + ? WHERE id = ?', [result.homeGoals, result.awayGoals, teamId]);
    applyMatchEffects(db, teamId, true, false);
  } else if (result.homeGoals === result.awayGoals) {
    pointsEarned = 1;
    db.run('UPDATE teams SET draws = draws + 1, points = points + 1, goals_for = goals_for + ?, goals_against = goals_against + ? WHERE id = ?', [result.homeGoals, result.awayGoals, teamId]);
    applyMatchEffects(db, teamId, false, true);
  } else {
    db.run('UPDATE teams SET losses = losses + 1, goals_for = goals_for + ?, goals_against = goals_against + ? WHERE id = ?', [result.homeGoals, result.awayGoals, teamId]);
    applyMatchEffects(db, teamId, false, false);
  }

  saveDb();

  const updatedTeam = queryOne('SELECT * FROM teams WHERE id = ?', [teamId]);

  db.run(
    "INSERT OR REPLACE INTO leaderboard (id, manager_id, team_name, season, points, wins, goals_for, updated_at) VALUES (?,?,?,?,?,?,?,datetime('now'))",
    [team.manager_id, team.manager_id, team.name, team.season, updatedTeam.points, updatedTeam.wins, updatedTeam.goals_for]
  );
  saveDb();

  res.json({
    match: {
      id: matchId,
      opponent: opponentTeam.name,
      homeGoals: result.homeGoals,
      awayGoals: result.awayGoals,
      events: result.events,
      pointsEarned
    },
    team: updatedTeam
  });
});

router.get('/history/:teamId', (req, res) => {
  const matches = queryAll(`
    SELECT m.*, t1.name as home_name, t2.name as away_name
    FROM matches m
    JOIN teams t1 ON m.home_team_id = t1.id
    JOIN teams t2 ON m.away_team_id = t2.id
    WHERE m.home_team_id = ? OR m.away_team_id = ?
    ORDER BY m.played_at DESC
    LIMIT 20
  `, [req.params.teamId, req.params.teamId]);
  res.json(matches);
});

module.exports = router;
