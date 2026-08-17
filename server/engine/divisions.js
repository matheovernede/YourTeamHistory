/**
 * Effectifs des divisions.
 *
 * Chaque championnat doit compter 13 équipes IA. Avec l'équipe du joueur cela
 * fait 14, soit exactement 26 journées en aller-retour — le nombre de journées
 * d'une saison.
 *
 * Sans cette contrainte, le calendrier ne peut pas être équitable : une
 * division à 17 équipes laisse des exemptés à chaque journée et le classement
 * compare alors des équipes n'ayant pas joué le même nombre de matchs.
 */

const { queryAll } = require('../db/schema');

const AI_PAR_DIVISION = 13;
const NB_DIVISIONS = 7;

/** Équipes IA d'une division, de la meilleure à la moins bonne. */
function aiRanked(division) {
  return queryAll(
    "SELECT id, name, points, goals_for, goals_against FROM teams WHERE manager_id = 'AI' AND division = ? ORDER BY points DESC, (goals_for - goals_against) DESC, goals_for DESC",
    [division]
  );
}

/** Déplace des équipes vers une division et remet leurs compteurs à zéro. */
function moveTeams(db, ids, targetDivision) {
  for (const id of ids) {
    db.run(
      'UPDATE teams SET division = ?, points = 0, wins = 0, draws = 0, losses = 0, goals_for = 0, goals_against = 0 WHERE id = ?',
      [targetDivision, id]
    );
  }
}

/** Nombre de matchs déjà disputés par une équipe. */
function matchCount(teamId) {
  const r = queryAll(
    'SELECT COUNT(*) as n FROM matches WHERE home_team_id = ? OR away_team_id = ?',
    [teamId, teamId]
  );
  return r[0] ? r[0].n : 0;
}

/** Dissout une équipe IA : son effectif part avec elle. */
function dissolveTeam(db, id) {
  db.run('DELETE FROM players WHERE team_id = ?', [id]);
  db.run('DELETE FROM teams WHERE id = ?', [id]);
}

/**
 * Ramène chaque division à 13 équipes IA.
 *
 * Répare les sauvegardes créées avant la correction des montées/descentes, où
 * chaque division perdait ou gagnait 4 équipes par saison. Le surplus est
 * d'abord reversé aux divisions incomplètes ; s'il reste des équipes en trop
 * (le championnat comptait plus d'équipes que de places au total), elles sont
 * dissoutes.
 *
 * L'ordre de conservation protège l'historique : une équipe déjà affrontée par
 * un joueur est gardée en priorité, car l'historique des matchs la référence
 * et sa suppression effacerait ces rencontres.
 */
function rebalanceDivisions(db) {
  const surplus = [];
  const manques = [];

  for (let d = 1; d <= NB_DIVISIONS; d++) {
    const equipes = aiRanked(d).map((t) => ({ ...t, matchs: matchCount(t.id) }));

    // On garde d'abord celles qui ont un passé, puis les mieux classées.
    equipes.sort((a, b) => (b.matchs - a.matchs) || (b.points - a.points));

    if (equipes.length > AI_PAR_DIVISION) {
      surplus.push(...equipes.slice(AI_PAR_DIVISION));
    } else if (equipes.length < AI_PAR_DIVISION) {
      manques.push({ division: d, nombre: AI_PAR_DIVISION - equipes.length });
    }
  }

  let deplacees = 0;
  let manqueRestant = 0;

  for (const manque of manques) {
    const lot = surplus.splice(0, manque.nombre);
    if (lot.length > 0) {
      moveTeams(db, lot.map((t) => t.id), manque.division);
      deplacees += lot.length;
    }
    manqueRestant += manque.nombre - lot.length;
  }

  // Plus de places disponibles : on dissout, en commençant par les équipes
  // sans passé pour préserver l'historique des joueurs.
  surplus.sort((a, b) => a.matchs - b.matchs);
  let dissoutes = 0;
  for (const equipe of surplus) {
    dissolveTeam(db, equipe.id);
    dissoutes++;
  }

  return { deplacees, dissoutes, manqueRestant };
}

module.exports = {
  AI_PAR_DIVISION,
  NB_DIVISIONS,
  aiRanked,
  moveTeams,
  rebalanceDivisions,
};
