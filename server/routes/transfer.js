const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb, queryOne, queryAll, run, saveDb } = require('../db/schema');
const { SQUAD_MAX, SQUAD_MIN_TO_SELL } = require('../data/rules');
const { langueDe, t } = require('../i18n');

const router = express.Router();

router.get('/market', (req, res) => {
  const players = queryAll(`
    SELECT p.*, t.name as team_name
    FROM players p
    JOIN teams t ON p.team_id = t.id
    WHERE t.manager_id = 'AI'
    ORDER BY p.overall DESC
    LIMIT 30
  `);
  res.json(players);
});

router.post('/buy', async (req, res) => {
  const langue = langueDe(req);
  const { playerId, teamId, managerId } = req.body;
  if (!playerId || !teamId || !managerId) {
    return res.status(400).json({ error: t('erreur.requis.playerTeamManager', langue) });
  }

  const db = await getDb();
  const player = queryOne('SELECT * FROM players WHERE id = ?', [playerId]);
  if (!player) return res.status(404).json({ error: t('erreur.joueurIntrouvable', langue) });

  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  if (!manager) return res.status(404).json({ error: t('erreur.managerIntrouvable', langue) });

  if (manager.budget < player.value) {
    return res.status(400).json({ error: t('erreur.budgetInsuffisant', langue), needed: player.value, available: manager.budget });
  }

  const myPlayers = queryOne('SELECT COUNT(*) as count FROM players WHERE team_id = ?', [teamId]);
  if (myPlayers.count >= SQUAD_MAX) {
    return res.status(400).json({ error: t('erreur.effectifMaximum', langue, { nombre: SQUAD_MAX }) });
  }

  db.run('UPDATE managers SET budget = budget - ? WHERE id = ?', [player.value, managerId]);
  const oldTeamId = player.team_id;
  db.run('UPDATE players SET team_id = ?, is_starter = 0 WHERE id = ?', [teamId, playerId]);
  db.run('INSERT INTO transfers (id, player_id, from_team_id, to_team_id, fee) VALUES (?,?,?,?,?)', [uuid(), playerId, oldTeamId, teamId, player.value]);
  saveDb();

  const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  res.json({ success: true, player, newBudget: updatedManager.budget });
});

router.post('/sell', async (req, res) => {
  const langue = langueDe(req);
  const { playerId, managerId } = req.body;
  if (!playerId || !managerId) {
    return res.status(400).json({ error: t('erreur.requis.playerManager', langue) });
  }

  const db = await getDb();
  const player = queryOne('SELECT * FROM players WHERE id = ?', [playerId]);
  if (!player) return res.status(404).json({ error: t('erreur.joueurIntrouvable', langue) });

  const team = queryOne('SELECT * FROM teams WHERE id = ? AND manager_id = ?', [player.team_id, managerId]);
  if (!team) return res.status(403).json({ error: t('erreur.joueurPasAVous', langue) });

  const playerCount = queryOne('SELECT COUNT(*) as count FROM players WHERE team_id = ?', [player.team_id]);
  if (playerCount.count <= SQUAD_MIN_TO_SELL) {
    return res.status(400).json({ error: t('erreur.effectifMinimum', langue, { nombre: SQUAD_MIN_TO_SELL }) });
  }

  const sellPrice = Math.round(player.value * 0.8);
  db.run('UPDATE managers SET budget = budget + ? WHERE id = ?', [sellPrice, managerId]);
  db.run('DELETE FROM players WHERE id = ?', [playerId]);
  db.run('INSERT INTO transfers (id, player_id, from_team_id, to_team_id, fee) VALUES (?,?,?,NULL,?)', [uuid(), playerId, player.team_id, sellPrice]);
  saveDb();

  const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  res.json({ success: true, sellPrice, newBudget: updatedManager.budget });
});

module.exports = router;
