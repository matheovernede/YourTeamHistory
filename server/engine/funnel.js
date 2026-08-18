/**
 * Étapes franchies par les joueurs.
 *
 * Cinq personnes se sont inscrites en une journée, une seule a créé un club,
 * aucune n'a joué de match — et ces chiffres, il a fallu les reconstituer à la
 * main dans la base. On les enregistre désormais au passage.
 *
 * Chaque étape n'est comptée qu'une fois par manager : on mesure une
 * progression, pas une fréquentation.
 */

const { v4: uuid } = require('uuid');
const { queryAll } = require('../db/schema');

/** Ordre du parcours, du premier écran au premier match. */
const ETAPES = ['inscription', 'club_cree', 'effectif_pret', 'premier_match', 'saison_finie'];

/**
 * Enregistre le franchissement d'une étape.
 *
 * Volontairement silencieux en cas d'échec : une mesure ne doit jamais faire
 * échouer l'action du joueur qu'elle observe.
 */
function marquer(db, managerId, etape) {
  if (!managerId || managerId === 'AI' || !ETAPES.includes(etape)) return;
  try {
    // La contrainte d'unicité fait le tri : inutile de vérifier avant d'écrire.
    db.run(
      'INSERT OR IGNORE INTO funnel_events (id, manager_id, step) VALUES (?,?,?)',
      [uuid(), managerId, etape]
    );
  } catch (e) { /* une mesure absente vaut mieux qu'une action interrompue */ }
}

/**
 * Compte les joueurs ayant atteint chaque étape, et le taux de passage.
 * @param {number} [jours] limite la mesure aux N derniers jours
 */
function entonnoir(jours) {
  const condition = jours ? `WHERE created_at >= datetime('now', '-${parseInt(jours, 10)} days')` : '';
  const lignes = queryAll(
    `SELECT step, COUNT(DISTINCT manager_id) AS n FROM funnel_events ${condition} GROUP BY step`
  );

  const compte = Object.fromEntries(lignes.map((l) => [l.step, l.n]));
  const depart = compte.inscription || 0;

  return ETAPES.map((etape, i) => {
    const n = compte[etape] || 0;
    const precedent = i === 0 ? n : compte[ETAPES[i - 1]] || 0;
    return {
      step: etape,
      count: n,
      // Part des inscrits arrivés jusque-là, et perte par rapport à l'étape d'avant.
      shareOfStart: depart ? Math.round((n / depart) * 100) : 0,
      shareOfPrevious: precedent ? Math.round((n / precedent) * 100) : 0,
    };
  });
}

module.exports = { marquer, entonnoir, ETAPES };
