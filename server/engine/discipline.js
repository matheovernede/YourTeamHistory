/**
 * Discipline, blessures et statistiques individuelles.
 *
 * Regroupé ici plutôt que dispersé dans les routes : le championnat, la coupe
 * et la Champions League appliquent exactement les mêmes règles.
 */

/** Nombre de cartons jaunes déclenchant une suspension. */
const YELLOW_THRESHOLD = 3;
/** Journées de suspension pour un carton rouge. */
const RED_SUSPENSION = 2;

/**
 * Applique les suites d'un match à l'effectif du joueur :
 * cartons, suspensions, blessures, matchs joués et buts.
 *
 * @returns {{suspensions: Array, injuries: Array}} de quoi informer l'utilisateur
 */
function applyMatchConsequences(db, queryOne, teamId, { cards = [], injuries = [], scorers = [] } = {}) {
  const notices = { suspensions: [], injuries: [] };

  // --- Matchs joués : uniquement les titulaires réellement alignés
  db.run('UPDATE players SET appearances = appearances + 1, career_appearances = career_appearances + 1 WHERE team_id = ? AND is_starter = 1', [teamId]);

  // --- Buts
  for (const s of scorers) {
    if (!s.playerId) continue;
    db.run('UPDATE players SET goals = goals + 1, career_goals = career_goals + 1 WHERE id = ? AND team_id = ?', [s.playerId, teamId]);
  }

  // --- Cartons
  for (const c of cards) {
    if (!c.playerId) continue;
    const p = queryOne('SELECT * FROM players WHERE id = ? AND team_id = ?', [c.playerId, teamId]);
    if (!p) continue;

    if (c.red) {
      db.run('UPDATE players SET red_cards = red_cards + 1, suspended_matches = suspended_matches + ? WHERE id = ?', [RED_SUSPENSION, c.playerId]);
      notices.suspensions.push({
        player: `${p.first_name} ${p.last_name}`,
        matches: RED_SUSPENSION,
        reason: 'carton rouge',
      });
      continue;
    }

    const total = (p.yellow_cards || 0) + 1;
    db.run('UPDATE players SET yellow_cards = ? WHERE id = ?', [total, c.playerId]);

    // Suspension à chaque multiple du seuil : 3e, 6e, 9e carton...
    if (total % YELLOW_THRESHOLD === 0) {
      db.run('UPDATE players SET suspended_matches = suspended_matches + 1 WHERE id = ?', [c.playerId]);
      notices.suspensions.push({
        player: `${p.first_name} ${p.last_name}`,
        matches: 1,
        reason: `${total} cartons jaunes`,
      });
    }
  }

  // --- Blessures
  for (const inj of injuries) {
    if (!inj.playerId) continue;
    const p = queryOne('SELECT * FROM players WHERE id = ? AND team_id = ?', [inj.playerId, teamId]);
    if (!p) continue;
    // Un joueur blessé sort du onze : sinon il resterait aligné sans pouvoir jouer.
    db.run('UPDATE players SET injured_matches = ?, is_starter = 0, slot_index = NULL, stamina = MIN(stamina, 40) WHERE id = ?', [inj.matches, inj.playerId]);
    notices.injuries.push({
      player: `${p.first_name} ${p.last_name}`,
      matches: inj.matches,
    });
  }

  return notices;
}

/**
 * Décompte d'une journée les suspensions et blessures en cours.
 * À appeler APRÈS avoir appliqué les conséquences du match, pour que la
 * sanction du jour ne soit pas purgée par le match qui l'a provoquée.
 */
function tickAvailability(db, teamId) {
  db.run('UPDATE players SET suspended_matches = MAX(0, suspended_matches - 1) WHERE team_id = ? AND suspended_matches > 0', [teamId]);
  db.run('UPDATE players SET injured_matches = MAX(0, injured_matches - 1) WHERE team_id = ? AND injured_matches > 0', [teamId]);
}

/** Un joueur suspendu ou blessé ne peut pas être aligné. */
function isAvailable(player) {
  return (player.suspended_matches || 0) === 0 && (player.injured_matches || 0) === 0;
}

function unavailabilityReason(player) {
  if ((player.suspended_matches || 0) > 0) {
    const n = player.suspended_matches;
    return `suspendu (${n} match${n > 1 ? 's' : ''})`;
  }
  if ((player.injured_matches || 0) > 0) {
    const n = player.injured_matches;
    return `blessé (${n} match${n > 1 ? 's' : ''})`;
  }
  return null;
}

/** Remet les compteurs de saison à zéro, en conservant les totaux de carrière. */
function resetSeasonStats(db, teamId) {
  db.run(`UPDATE players SET
            yellow_cards = 0, red_cards = 0,
            suspended_matches = 0, injured_matches = 0,
            appearances = 0, goals = 0
          WHERE team_id = ?`, [teamId]);
}

module.exports = {
  YELLOW_THRESHOLD,
  RED_SUSPENSION,
  applyMatchConsequences,
  tickAvailability,
  isAvailable,
  unavailabilityReason,
  resetSeasonStats,
};
