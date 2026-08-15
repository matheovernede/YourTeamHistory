const express = require('express');
const { queryAll } = require('../db/schema');

const router = express.Router();

router.get('/', (req, res) => {
  const leaderboard = queryAll(`
    SELECT l.*, m.username
    FROM leaderboard l
    JOIN managers m ON l.manager_id = m.id
    WHERE l.manager_id != 'AI'
    ORDER BY l.points DESC, l.wins DESC, l.goals_for DESC
    LIMIT 50
  `);
  res.json(leaderboard);
});

router.get('/season/:season', (req, res) => {
  const leaderboard = queryAll(`
    SELECT l.*, m.username
    FROM leaderboard l
    JOIN managers m ON l.manager_id = m.id
    WHERE l.season = ? AND l.manager_id != 'AI'
    ORDER BY l.points DESC, l.wins DESC, l.goals_for DESC
    LIMIT 50
  `, [parseInt(req.params.season)]);
  res.json(leaderboard);
});

module.exports = router;
