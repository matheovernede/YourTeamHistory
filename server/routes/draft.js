const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb, queryOne, queryAll, run, saveDb } = require('../db/schema');
const { DRAFT_POOL, calculateDraftPrice } = require('../data/draftPool');
const { SQUAD_MAX } = require('../data/rules');
const { langueDe, t } = require('../i18n');

const router = express.Router();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

router.get('/available', (req, res) => {
  const { division, reputation, teamId, difficulty } = req.query;
  const divLevel = parseInt(division) || 1;
  const rep = parseInt(reputation) || 50;
  const diff = difficulty || 'normal';

  // Get current squad names to exclude from market
  let ownedNames = new Set();
  if (teamId) {
    const { queryAll } = require('../db/schema');
    const myPlayers = queryAll('SELECT first_name, last_name FROM players WHERE team_id = ?', [teamId]);
    myPlayers.forEach(p => ownedNames.add(`${p.first_name}_${p.last_name}`));
  }

  // Reputation bonus: higher rep = better chance of seeing top players
  // rep 0-30: low attraction, 30-60: normal, 60-80: good, 80+: elite
  const repBonus = Math.max(0, (rep - 30) / 70); // 0 to 1 scale

  // Legends: very rare, chance increases with reputation and division
  // rep 50 + div 1 = ~1% chance per legend, rep 90 + div 7 = ~20%
  const legendChance = Math.min(0.25, 0.01 + repBonus * 0.12 + (divLevel - 1) * 0.02);

  // Difficulty affects tier access
  const tierBonus = diff === 'easy' ? 0.25 : diff === 'hard' ? -0.05 : 0;

  /**
   * Paliers accessibles selon la division du club.
   *   core  : toujours proposés
   *   reach : un cran au-dessus, probabilité liée à la réputation
   *   rare  : deux crans au-dessus, rare et très dépendant de la réputation
   * Un club de Régional 2 ne recrute donc pas en Ligue 1, mais peut dénicher
   * une pépite de National 3 s'il est bien coté.
   */
  const DIVISION_TIERS = {
    1: { core: ['r2', 'r1'],           reach: ['n3'],     rare: ['n2'] },
    2: { core: ['r1', 'n3'],           reach: ['n2'],     rare: ['n1'] },
    3: { core: ['n3', 'n2'],           reach: ['n1'],     rare: ['ligue2'] },
    4: { core: ['n2', 'n1'],           reach: ['ligue2'], rare: ['ligue1'] },
    5: { core: ['n1', 'ligue2'],       reach: ['ligue1'], rare: ['elite'] },
    6: { core: ['ligue2', 'ligue1'],   reach: ['elite'],  rare: [] },
    7: { core: ['ligue1', 'elite'],    reach: [],         rare: [] },
  };

  const access = DIVISION_TIERS[Math.max(1, Math.min(7, divLevel))] || DIVISION_TIERS[1];
  const reachChance = Math.max(0, Math.min(0.9, 0.20 + repBonus * 0.45 + tierBonus));
  const rareChance = Math.max(0, Math.min(0.4, 0.03 + repBonus * 0.20 + tierBonus));

  // `let` et non `const` : la liste est réassignée juste en dessous pour
  // retirer les joueurs déjà dans l'effectif.
  let filtered = DRAFT_POOL.filter(p => {
    if (p.tier === 'legend') return Math.random() < legendChance;
    if (access.core.includes(p.tier)) return true;
    if (access.reach.includes(p.tier)) return Math.random() < reachChance;
    if (access.rare.includes(p.tier)) return Math.random() < rareChance;
    return false;
  });

  // Exclude players already in the team
  if (ownedNames.size > 0) {
    filtered = filtered.filter(p => !ownedNames.has(`${p.first_name}_${p.last_name}`));
  }

  const shuffled = shuffle(filtered);
  let selection = shuffled.slice(0, 42);

  // High reputation attracts better players: sort by overall and keep more top ones
  if (rep >= 70) {
    selection.sort((a, b) => b.overall - a.overall);
    // Keep the top half as-is, re-shuffle the rest
    const top = selection.slice(0, Math.floor(selection.length * 0.4));
    const rest = shuffle(selection.slice(Math.floor(selection.length * 0.4)));
    selection = [...top, ...rest];
  }

  const players = selection.map(p => ({
    ...p,
    id: uuid(),
    value: calculateDraftPrice(p),
  }));

  res.json(players);
});

router.post('/buy', async (req, res) => {
  const langue = langueDe(req);
  const { managerId, teamId, player } = req.body;
  if (!managerId || !teamId || !player) {
    return res.status(400).json({ error: t('erreur.requis.managerTeamPlayer', langue) });
  }

  const db = await getDb();
  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  if (!manager) return res.status(404).json({ error: t('erreur.managerIntrouvable', langue) });

  if (manager.budget < player.value) {
    return res.status(400).json({ error: t('erreur.budgetInsuffisant', langue) });
  }

  const playerCount = queryOne('SELECT COUNT(*) as count FROM players WHERE team_id = ?', [teamId]);
  if (playerCount && playerCount.count >= SQUAD_MAX) {
    return res.status(400).json({ error: t('erreur.effectifMaximum', langue, { nombre: SQUAD_MAX }) });
  }

  db.run('UPDATE managers SET budget = budget - ? WHERE id = ?', [player.value, managerId]);
  db.run(
    "INSERT INTO players (id, team_id, first_name, last_name, age, position, overall, pace, shooting, passing, dribbling, defending, physical, stamina, morale, value, is_starter) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,100,80,?,0)",
    [uuid(), teamId, player.first_name, player.last_name, player.age, player.position, player.overall, player.pace, player.shooting, player.passing, player.dribbling, player.defending, player.physical, player.value]
  );
  saveDb();

  const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  const squad = queryAll('SELECT * FROM players WHERE team_id = ? ORDER BY overall DESC', [teamId]);

  res.json({ newBudget: updatedManager.budget, squadSize: squad.length });
});

router.post('/finish', async (req, res) => {
  const langue = langueDe(req);
  const { managerId, teamId } = req.body;
  if (!managerId || !teamId) {
    return res.status(400).json({ error: t('erreur.requis.managerTeam', langue) });
  }

  const playerCount = queryOne('SELECT COUNT(*) as count FROM players WHERE team_id = ?', [teamId]);
  if (!playerCount || playerCount.count < 11) {
    return res.status(400).json({ error: t('erreur.minimumOnzeJoueurs', langue, { nombre: playerCount ? playerCount.count : 0 }) });
  }

  // Leave lineup empty — player must organize their squad manually.
  // slot_index doit être vidé en même temps, sinon d'anciens emplacements
  // survivent au mercato et faussent la reconstruction de la composition.
  run('UPDATE players SET is_starter = 0, slot_index = NULL WHERE team_id = ?', [teamId]);

  const team = queryOne('SELECT * FROM teams WHERE id = ?', [teamId]);
  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);

  res.json({ team, manager });
});

module.exports = router;
