const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb, queryOne, queryAll, run, saveDb } = require('../db/schema');

const router = express.Router();

router.post('/create', async (req, res) => {
  const { managerId, teamName } = req.body;
  if (!managerId || !teamName) {
    return res.status(400).json({ error: 'managerId et teamName requis' });
  }

  const db = await getDb();
  const existing = queryOne("SELECT id FROM teams WHERE manager_id = ? AND manager_id != 'AI'", [managerId]);
  if (existing) {
    return res.status(400).json({ error: 'Vous avez déjà une équipe' });
  }

  const teamId = uuid();
  db.run('INSERT INTO teams (id, manager_id, name, division) VALUES (?, ?, ?, 1)', [teamId, managerId, teamName.trim()]);
  saveDb();

  const team = queryOne('SELECT * FROM teams WHERE id = ?', [teamId]);
  res.json({ team });
});

router.get('/:teamId/players', (req, res) => {
  const players = queryAll('SELECT * FROM players WHERE team_id = ? ORDER BY is_starter DESC, position', [req.params.teamId]);
  res.json(players);
});

router.put('/:teamId/formation', (req, res) => {
  const { formation } = req.body;
  const validFormations = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2', '3-4-3', '4-1-4-1'];
  if (!validFormations.includes(formation)) {
    return res.status(400).json({ error: 'Formation invalide' });
  }

  run('UPDATE teams SET formation = ? WHERE id = ?', [formation, req.params.teamId]);
  res.json({ success: true, formation });
});

router.put('/:teamId/lineup', (req, res) => {
  const { starterIds } = req.body;
  if (!starterIds || starterIds.length !== 11) {
    return res.status(400).json({ error: 'Exactement 11 titulaires requis' });
  }

  run('UPDATE players SET is_starter = 0 WHERE team_id = ?', [req.params.teamId]);
  for (const playerId of starterIds) {
    run('UPDATE players SET is_starter = 1 WHERE id = ? AND team_id = ?', [playerId, req.params.teamId]);
  }

  const players = queryAll('SELECT * FROM players WHERE team_id = ? ORDER BY is_starter DESC, position', [req.params.teamId]);
  res.json(players);
});

router.post('/:teamId/train', (req, res) => {
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

  run(`UPDATE players SET stamina = MIN(100, stamina + 20), morale = MIN(100, morale + 3) WHERE team_id = ?`, [req.params.teamId]);
  run(`UPDATE players SET overall = MIN(99, overall + 1) WHERE team_id = ? AND age < 28`, [req.params.teamId]);

  const players = queryAll('SELECT * FROM players WHERE team_id = ? ORDER BY is_starter DESC, position', [req.params.teamId]);
  res.json({ message: 'Entraînement terminé !', players });
});

module.exports = router;
