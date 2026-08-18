/**
 * Club rival.
 *
 * Une saison de milieu de tableau n'a aucun enjeu : ni montée, ni descente,
 * vingt-six journées pour rien. Le rival donne à chaque exercice deux rendez-vous
 * qui comptent, quel que soit le classement.
 *
 * La rivalité est propre à la sauvegarde et vaut pour une division : monter d'un
 * échelon en fait naître une nouvelle, l'ancien rival n'étant plus sur la route.
 */

const { queryAll, queryOne } = require('../db/schema');
const { mulberry32, hashSeed } = require('./calendar');

/** Le moral encaisse deux fois plus fort, dans un sens comme dans l'autre. */
const INTENSITE_MORAL = 2;

/** La prime de victoire est majorée de moitié : un derby se monnaie. */
const PRIME_DERBY = 1.5;

/**
 * Désigne le rival de l'équipe, et le renouvelle si le club a changé de division.
 *
 * Le tirage découle d'une graine stable : la même sauvegarde retrouve toujours
 * le même rival, sans qu'il faille l'enregistrer avant de pouvoir l'afficher.
 */
function ensureRival(db, team) {
  const division = team.division || 1;

  const dejaValide = team.rival_team_id
    && team.rival_division === division
    && queryOne("SELECT id FROM teams WHERE id = ? AND manager_id = 'AI'", [team.rival_team_id]);

  if (dejaValide) return team.rival_team_id;

  const adversaires = queryAll(
    "SELECT id FROM teams WHERE manager_id = 'AI' AND division = ? ORDER BY id",
    [division]
  );
  if (adversaires.length === 0) return null;

  const rand = mulberry32(hashSeed(`rival-${team.id}-${division}`));
  const choisi = adversaires[Math.floor(rand() * adversaires.length)].id;

  db.run('UPDATE teams SET rival_team_id = ?, rival_division = ? WHERE id = ?', [choisi, division, team.id]);
  return choisi;
}

/** Informations d'affichage sur le rival, ou null s'il n'y en a pas. */
function infosRival(team) {
  if (!team || !team.rival_team_id) return null;
  const rival = queryOne('SELECT id, name FROM teams WHERE id = ?', [team.rival_team_id]);
  return rival ? { id: rival.id, name: rival.name } : null;
}

/** Cette rencontre est-elle le derby ? */
function estDerby(team, opponentId) {
  return Boolean(team && team.rival_team_id && opponentId && team.rival_team_id === opponentId);
}

module.exports = { ensureRival, infosRival, estDerby, INTENSITE_MORAL, PRIME_DERBY };
