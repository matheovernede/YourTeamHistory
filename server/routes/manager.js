const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb, queryOne, queryAll, run, saveDb } = require('../db/schema');
const { langueDe, t } = require('../i18n');
const { marquer } = require('../engine/funnel');
const { normalizeTactic } = require('../engine/tactics');

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
    run('DELETE FROM market_offers WHERE team_id = ?', [t.id]);
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

  saveData.version = 3;
  saveData.exportedAt = new Date().toISOString();
  res.json(saveData);
});

router.post('/:id/load', async (req, res) => {
  const langue = langueDe(req);
  const { saveData } = req.body;
  if (!saveData || !saveData.manager || !Array.isArray(saveData.teams) || saveData.teams.length === 0) {
    return res.status(400).json({ error: t('erreur.sauvegardeInvalide', langue) });
  }

  const managerId = req.params.id;
  if (!queryOne('SELECT id FROM managers WHERE id = ?', [managerId])) return res.status(404).json({ error: t('erreur.managerIntrouvable', langue) });

  // Valider les nouvelles données avant d'effacer la partie en cours.
  for (const team of saveData.teams) {
    if (!team || typeof team.id !== 'string' || !Array.isArray(team.players) || team.players.some(p =>
      !p || (p.loan_end_season != null && (!Number.isSafeInteger(p.loan_end_season) || p.loan_end_season < (team.season || 1))))) {
      return res.status(400).json({ error: t('erreur.sauvegardeInvalide', langue) });
    }
    const owner = queryOne('SELECT manager_id FROM teams WHERE id = ?', [team.id]);
    if (owner && owner.manager_id !== managerId) return res.status(403).json({ error: t('recruitment.notYourTeam', langue) });
  }

  const db = await getDb();
  db.run('BEGIN TRANSACTION');
  try {
    // Une seule sauvegarde après l'import ; une erreur restaure la partie intacte.
    const run = (sql, params) => db.run(sql, params);
    // Clear existing data for this manager
    const existingTeams = queryAll("SELECT id FROM teams WHERE manager_id = ?", [managerId]);
    for (const t of existingTeams) {
      run('DELETE FROM market_offers WHERE team_id = ?', [t.id]);
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
      run('UPDATE teams SET tactic = ?, summer_window_season = ?, winter_window_season = ? WHERE id = ?',
        [normalizeTactic(team.tactic), team.summer_window_season || 0, team.winter_window_season || 0, team.id]);
      const teamFields = ['cup_data', 'cl_data', 'titles', 'cups', 'last_training_matchday', 'rival_team_id', 'rival_division'];
      for (const key of teamFields) {
        if (team[key] !== undefined) run(`UPDATE teams SET ${key} = ? WHERE id = ?`, [team[key], team.id]);
      }

      for (const p of (team.players || [])) {
        run('INSERT INTO players (id, team_id, first_name, last_name, age, position, overall, pace, shooting, passing, dribbling, defending, physical, stamina, morale, value, is_starter) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [p.id, team.id, p.first_name, p.last_name, p.age, p.position, p.overall, p.pace, p.shooting, p.passing, p.dribbling, p.defending, p.physical, p.stamina, p.morale, p.value, p.is_starter]);
        const playerFields = ['loan_end_season', 'slot_index', 'yellow_cards', 'red_cards', 'suspended_matches', 'injured_matches', 'appearances', 'goals', 'career_appearances', 'career_goals', 'unhappy_streak', 'transfer_request'];
        for (const key of playerFields) {
          if (p[key] !== undefined) run(`UPDATE players SET ${key} = ? WHERE id = ?`, [p[key], p.id]);
        }
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

    db.run('COMMIT');
  } catch (error) {
    db.run('ROLLBACK');
    return res.status(400).json({ error: t('erreur.sauvegardeInvalide', langue) });
  }
  saveDb();
  const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  const updatedTeam = queryOne("SELECT * FROM teams WHERE manager_id = ? AND manager_id != 'AI'", [managerId]);
  res.json({ manager: updatedManager, team: updatedTeam });
});

module.exports = router;
