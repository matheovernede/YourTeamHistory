const express = require('express');
const { v4: uuid } = require('uuid');
const { queryOne, queryAll, run } = require('../db/schema');
const { langueDe, t } = require('../i18n');
const { marquer } = require('../engine/funnel');

const router = express.Router();

router.post('/register', (req, res) => {
  const langue = langueDe(req);
  const { username } = req.body;
  if (!username || username.trim().length < 2) {
    return res.status(400).json({ error: t('erreur.pseudoRequis', langue) });
  }

  const existing = queryOne('SELECT * FROM managers WHERE username = ?', [username.trim()]);
  if (existing) {
    return res.json({ ...existing, existing: true });
  }

  const id = uuid();
  run('INSERT INTO managers (id, username, budget, reputation) VALUES (?, ?, 20000000, 50)', [id, username.trim()]);
  marquer({ run }, id, 'inscription');
  const created = queryOne('SELECT * FROM managers WHERE id = ?', [id]);
  res.json({ ...created, existing: false });
});

router.get('/:id', (req, res) => {
  const langue = langueDe(req);
  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [req.params.id]);
  if (!manager) return res.status(404).json({ error: t('erreur.managerIntrouvable', langue) });
  res.json(manager);
});

router.get('/:id/team', (req, res) => {
  const langue = langueDe(req);
  const team = queryOne("SELECT * FROM teams WHERE manager_id = ? AND manager_id != 'AI'", [req.params.id]);
  if (!team) return res.status(404).json({ error: t('erreur.pasEncoreEquipe', langue) });
  res.json(team);
});

router.post('/reset', (req, res) => {
  const langue = langueDe(req);
  const { managerId } = req.body;
  if (!managerId) return res.status(400).json({ error: t('erreur.requis.managerId', langue) });

  const teams = queryAll("SELECT id FROM teams WHERE manager_id = ?", [managerId]);
  for (const t of teams) {
    run('DELETE FROM players WHERE team_id = ?', [t.id]);
    run('DELETE FROM teams WHERE id = ?', [t.id]);
  }
  run('UPDATE managers SET budget = 20000000, reputation = 50 WHERE id = ?', [managerId]);

  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  res.json(manager);
});

router.get('/:id/save', (req, res) => {
  const langue = langueDe(req);
  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [req.params.id]);
  if (!manager) return res.status(404).json({ error: t('erreur.managerIntrouvable', langue) });

  const teams = queryAll("SELECT * FROM teams WHERE manager_id = ?", [req.params.id]);
  const saveData = { manager, teams: [] };

  for (const team of teams) {
    const players = queryAll('SELECT * FROM players WHERE team_id = ?', [team.id]);

    // Le détail des rencontres accompagne l'équipe : le classement s'en déduit.
    // Sans lui, une sauvegarde rechargée sur un serveur neuf afficherait un
    // championnat où le joueur n'aurait disputé aucun match.
    // Les faits de match ne sont pas repris : ils alourdiraient le fichier
    // sans servir au classement.
    const matches = queryAll(
      'SELECT season, week, home_team_id, away_team_id, home_goals, away_goals, played_at FROM matches WHERE home_team_id = ? OR away_team_id = ? ORDER BY season, week',
      [team.id, team.id]
    );

    saveData.teams.push({ ...team, players, matches });
  }

  saveData.version = 2;
  saveData.exportedAt = new Date().toISOString();
  res.json(saveData);
});

router.post('/:id/load', (req, res) => {
  const langue = langueDe(req);
  const { saveData } = req.body;
  if (!saveData || !saveData.manager || !saveData.teams) {
    return res.status(400).json({ error: t('erreur.sauvegardeInvalide', langue) });
  }

  const managerId = req.params.id;

  // Clear existing data for this manager
  const existingTeams = queryAll("SELECT id FROM teams WHERE manager_id = ?", [managerId]);
  for (const t of existingTeams) {
    run('DELETE FROM matches WHERE home_team_id = ? OR away_team_id = ?', [t.id, t.id]);
    run('DELETE FROM players WHERE team_id = ?', [t.id]);
    run('DELETE FROM teams WHERE id = ?', [t.id]);
  }

  // Restore manager
  run('UPDATE managers SET budget = ?, reputation = ? WHERE id = ?',
    [saveData.manager.budget, saveData.manager.reputation, managerId]);

  // Restore teams and players
  for (const team of saveData.teams) {
    run('INSERT INTO teams (id, manager_id, name, formation, morale, season, division, points, wins, draws, losses, goals_for, goals_against) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [team.id, managerId, team.name, team.formation, team.morale || 70, team.season || 1, team.division || 1, team.points || 0, team.wins || 0, team.draws || 0, team.losses || 0, team.goals_for || 0, team.goals_against || 0]);

    for (const p of (team.players || [])) {
      run('INSERT INTO players (id, team_id, first_name, last_name, age, position, overall, pace, shooting, passing, dribbling, defending, physical, stamina, morale, value, is_starter) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [p.id, team.id, p.first_name, p.last_name, p.age, p.position, p.overall, p.pace, p.shooting, p.passing, p.dribbling, p.defending, p.physical, p.stamina, p.morale, p.value, p.is_starter]);
    }

    // Rencontres disputées : le classement de la saison en cours en découle.
    // Absentes des sauvegardes d'avant la version 2, d'où le repli sur les
    // totaux de l'équipe côté calcul du classement.
    for (const m of (team.matches || [])) {
      run(
        "INSERT INTO matches (id, season, week, home_team_id, away_team_id, home_goals, away_goals, played, events, played_at) VALUES (?,?,?,?,?,?,?,1,'[]',?)",
        [uuid(), m.season, m.week, m.home_team_id, m.away_team_id, m.home_goals, m.away_goals, m.played_at || null]
      );
    }
  }

  const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  const updatedTeam = queryOne("SELECT * FROM teams WHERE manager_id = ? AND manager_id != 'AI'", [managerId]);
  res.json({ manager: updatedManager, team: updatedTeam });
});

module.exports = router;
