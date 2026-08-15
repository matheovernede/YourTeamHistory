const express = require('express');
const { v4: uuid } = require('uuid');
const { queryOne, queryAll, run } = require('../db/schema');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username } = req.body;
  if (!username || username.trim().length < 2) {
    return res.status(400).json({ error: 'Pseudo requis (min 2 caractères)' });
  }

  const existing = queryOne('SELECT * FROM managers WHERE username = ?', [username.trim()]);
  if (existing) {
    return res.json({ ...existing, existing: true });
  }

  const id = uuid();
  run('INSERT INTO managers (id, username, budget, reputation) VALUES (?, ?, 30000000, 50)', [id, username.trim()]);
  const created = queryOne('SELECT * FROM managers WHERE id = ?', [id]);
  res.json({ ...created, existing: false });
});

router.get('/:id', (req, res) => {
  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [req.params.id]);
  if (!manager) return res.status(404).json({ error: 'Manager non trouvé' });
  res.json(manager);
});

router.get('/:id/team', (req, res) => {
  const team = queryOne("SELECT * FROM teams WHERE manager_id = ? AND manager_id != 'AI'", [req.params.id]);
  if (!team) return res.status(404).json({ error: "Pas encore d'équipe" });
  res.json(team);
});

router.post('/reset', (req, res) => {
  const { managerId } = req.body;
  if (!managerId) return res.status(400).json({ error: 'managerId requis' });

  const teams = queryAll("SELECT id FROM teams WHERE manager_id = ?", [managerId]);
  for (const t of teams) {
    run('DELETE FROM players WHERE team_id = ?', [t.id]);
    run('DELETE FROM teams WHERE id = ?', [t.id]);
  }
  run('UPDATE managers SET budget = 30000000, reputation = 50 WHERE id = ?', [managerId]);

  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  res.json(manager);
});

module.exports = router;
