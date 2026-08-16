const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb, queryOne, queryAll, run, saveDb } = require('../db/schema');
const { isValidFormation, getFormationSlots, getPositionGroup } = require('../data/formations');
const { isAvailable, unavailabilityReason } = require('../engine/discipline');

const router = express.Router();

router.post('/create', async (req, res) => {
  const { managerId, teamName, difficulty } = req.body;
  if (!managerId || !teamName) {
    return res.status(400).json({ error: 'managerId et teamName requis' });
  }

  const db = await getDb();
  const existing = queryOne("SELECT id FROM teams WHERE manager_id = ? AND manager_id != 'AI'", [managerId]);
  if (existing) {
    return res.status(400).json({ error: 'Vous avez déjà une équipe' });
  }

  // Budget selon difficulté: facile = 30M, normal = 20M, difficile = 12M
  const budgets = { easy: 30000000, normal: 20000000, hard: 12000000 };
  const budget = budgets[difficulty] || budgets.normal;
  db.run('UPDATE managers SET budget = ? WHERE id = ?', [budget, managerId]);

  const teamId = uuid();
  db.run('INSERT INTO teams (id, manager_id, name, division) VALUES (?, ?, ?, 1)', [teamId, managerId, teamName.trim()]);
  saveDb();

  const team = queryOne('SELECT * FROM teams WHERE id = ?', [teamId]);
  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  res.json({ team, manager });
});

router.get('/:teamId/players', (req, res) => {
  const players = queryAll('SELECT * FROM players WHERE team_id = ? ORDER BY is_starter DESC, slot_index, position', [req.params.teamId]);
  res.json(players);
});

router.put('/:teamId/formation', (req, res) => {
  const { formation } = req.body;
  if (!isValidFormation(formation)) {
    return res.status(400).json({ error: 'Formation invalide' });
  }

  run('UPDATE teams SET formation = ? WHERE id = ?', [formation, req.params.teamId]);
  res.json({ success: true, formation });
});

/**
 * Enregistre la composition.
 * `slots` : tableau de 11 identifiants indexé par emplacement de la formation
 *           (source de vérité si fourni).
 * `starterIds` : ancien format, conservé pour compatibilité — le placement est
 *                alors reconstruit automatiquement.
 */
router.put('/:teamId/lineup', async (req, res) => {
  const { starterIds, slots } = req.body;
  const teamId = req.params.teamId;

  const team = queryOne('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

  const formationSlots = getFormationSlots(team.formation);
  // Les colonnes de disponibilité et le nom sont nécessaires pour refuser
  // clairement un joueur suspendu ou blessé.
  const squad = queryAll(
    'SELECT id, first_name, last_name, position, suspended_matches, injured_matches FROM players WHERE team_id = ?',
    [teamId]
  );
  const squadById = new Map(squad.map(p => [p.id, p]));

  // Détermine le placement final : soit fourni, soit reconstruit depuis starterIds.
  let placement;
  if (Array.isArray(slots)) {
    if (slots.length !== formationSlots.length) {
      return res.status(400).json({ error: `La composition doit contenir ${formationSlots.length} emplacements` });
    }
    placement = slots;
  } else if (Array.isArray(starterIds)) {
    placement = buildPlacement(starterIds, formationSlots, squadById);
  } else {
    return res.status(400).json({ error: 'Composition manquante' });
  }

  // Validations métier
  const filled = placement.filter(Boolean);
  if (filled.length !== 11) {
    return res.status(400).json({ error: `Exactement 11 titulaires requis (actuellement ${filled.length})` });
  }
  if (new Set(filled).size !== filled.length) {
    return res.status(400).json({ error: 'Un joueur ne peut occuper deux emplacements' });
  }
  const unknown = filled.find(id => !squadById.has(id));
  if (unknown) {
    return res.status(400).json({ error: 'Un joueur sélectionné n\'appartient pas à l\'équipe' });
  }

  // Un joueur suspendu ou blessé ne peut pas être aligné.
  const indisponibles = filled
    .map(id => squadById.get(id))
    .filter(p => p && !isAvailable(p))
    .map(p => `${p.first_name} ${p.last_name} (${unavailabilityReason(p)})`);
  if (indisponibles.length) {
    return res.status(400).json({
      error: `Joueur${indisponibles.length > 1 ? 's' : ''} indisponible${indisponibles.length > 1 ? 's' : ''} : ${indisponibles.join(', ')}`,
    });
  }

  // Écriture groupée : un seul flush disque au lieu d'un par joueur.
  const db = await getDb();
  db.run('UPDATE players SET is_starter = 0, slot_index = NULL WHERE team_id = ?', [teamId]);
  placement.forEach((playerId, idx) => {
    if (!playerId) return;
    db.run('UPDATE players SET is_starter = 1, slot_index = ? WHERE id = ? AND team_id = ?', [idx, playerId, teamId]);
  });
  saveDb();

  const players = queryAll('SELECT * FROM players WHERE team_id = ? ORDER BY is_starter DESC, slot_index, position', [teamId]);
  res.json(players);
});

/** Place au mieux une liste de titulaires sur les emplacements d'une formation. */
function buildPlacement(starterIds, formationSlots, squadById) {
  const placement = new Array(formationSlots.length).fill(null);
  const remaining = starterIds.filter(id => squadById.has(id));

  // 1re passe : poste exact. 2e passe : même groupe. 3e passe : au remplissage.
  const passes = [
    (player, slotPos) => player.position === slotPos,
    (player, slotPos) => getPositionGroup(player.position) === getPositionGroup(slotPos),
    () => true,
  ];

  for (const matches of passes) {
    formationSlots.forEach((slotPos, idx) => {
      if (placement[idx]) return;
      const found = remaining.findIndex(id => matches(squadById.get(id), slotPos));
      if (found !== -1) {
        placement[idx] = remaining[found];
        remaining.splice(found, 1);
      }
    });
  }

  return placement;
}

router.post('/:teamId/train', (req, res) => {
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

  run(`UPDATE players SET stamina = MIN(100, stamina + 20), morale = MIN(100, morale + 3) WHERE team_id = ?`, [req.params.teamId]);
  run(`UPDATE players SET overall = MIN(99, overall + 1) WHERE team_id = ? AND age < 28`, [req.params.teamId]);

  const players = queryAll('SELECT * FROM players WHERE team_id = ? ORDER BY is_starter DESC, slot_index, position', [req.params.teamId]);
  res.json({ message: 'Entraînement terminé !', players });
});

module.exports = router;
