/**
 * Classement d'une sauvegarde.
 *
 * Les équipes IA sont communes à tout le serveur : une seule ligne par équipe
 * en base. Tant que leurs points y étaient stockés, deux parties situées dans
 * la même division se corrompaient mutuellement — une partie arrivée à la 22e
 * journée voyait des adversaires n'en ayant disputé que 5, puisque chaque
 * sauvegarde avançait dans la saison à son propre rythme.
 *
 * Le classement n'est donc plus un état conservé mais un calcul. Il se déduit
 * de trois éléments, tous propres à la sauvegarde :
 *   - le calendrier, déterministe à partir de la graine de la partie ;
 *   - les résultats réels du joueur, enregistrés dans la table `matches` ;
 *   - les matchs entre équipes IA, rejoués à l'identique grâce à un aléa
 *     lui aussi déterministe.
 *
 * Deux parties dans la même division ont ainsi chacune leur championnat, sans
 * aucune donnée partagée ni table supplémentaire.
 */

const { queryAll, queryOne } = require('../db/schema');
const { fixturesForWeek, seedFor, mulberry32, hashSeed } = require('./calendar');
const { simulateAiMatchByStrength } = require('./match');

/** Aléa propre à une rencontre : même affiche, même journée, même résultat. */
function randFor(seed, week, homeId, awayId) {
  return mulberry32(hashSeed(`${seed}|${week}|${homeId}|${awayId}`));
}

/** Force d'une équipe, stable sur toute une saison (l'effectif ne bouge qu'au mercato). */
function strengthOf(teamId, cache) {
  if (cache.has(teamId)) return cache.get(teamId);
  const rows = queryAll('SELECT overall FROM players WHERE team_id = ?', [teamId]);
  const valeur = rows.length > 0
    ? rows.reduce((s, p) => s + p.overall, 0) / rows.length
    : 60;
  cache.set(teamId, valeur);
  return valeur;
}

function ligneVide(id, name, isPlayer) {
  return { id, name, isPlayer, points: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0 };
}

function enregistrer(ligne, marques, encaisses) {
  if (!ligne) return;
  ligne.goals_for += marques;
  ligne.goals_against += encaisses;
  if (marques > encaisses) { ligne.wins++; ligne.points += 3; }
  else if (marques === encaisses) { ligne.draws++; ligne.points += 1; }
  else { ligne.losses++; }
}

/**
 * Classement de la division du joueur, à jour de sa progression.
 *
 * @param {string} teamId  équipe du joueur
 * @returns {Array} lignes triées, avec `rank` et `played`
 */
function computeStandings(teamId) {
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!team) return [];

  const division = team.division || 1;
  const ai = queryAll(
    "SELECT id, name FROM teams WHERE manager_id = 'AI' AND division = ? ORDER BY id",
    [division]
  );

  const table = new Map();
  table.set(team.id, ligneVide(team.id, team.name, true));
  ai.forEach((t) => table.set(t.id, ligneVide(t.id, t.name, false)));

  const pool = [team.id, ...ai.map((t) => t.id)];
  const seed = seedFor(team.id, team.season, division);
  const journees = team.wins + team.draws + team.losses;

  // Résultats réels du joueur, indexés par journée.
  const mesMatchs = new Map();
  queryAll(
    'SELECT week, home_team_id, away_team_id, home_goals, away_goals FROM matches WHERE season = ? AND (home_team_id = ? OR away_team_id = ?)',
    [team.season, team.id, team.id]
  ).forEach((m) => mesMatchs.set(m.week, m));

  const forces = new Map();
  const simuler = (week, homeId, awayId) => simulateAiMatchByStrength(
    strengthOf(homeId, forces),
    strengthOf(awayId, forces),
    randFor(seed, week, homeId, awayId)
  );

  // Vrai quand l'historique détaillé manque : la sauvegarde a été importée sur
  // un serveur neuf, où seuls les totaux de l'équipe ont été restaurés.
  let historiqueIncomplet = false;

  for (let week = 1; week <= journees; week++) {
    for (const [homeId, awayId] of fixturesForWeek(pool, seed, week)) {
      let butsHome;
      let butsAway;

      if (homeId === team.id || awayId === team.id) {
        const m = mesMatchs.get(week);

        if (m) {
          // On se repère sur l'identifiant du joueur, le seul qui survive à un
          // import : sur un serveur neuf, les équipes IA ont de nouveaux
          // identifiants et ceux enregistrés dans le match ne valent plus rien.
          const jetaisADomicile = m.home_team_id === team.id;
          const mesButs = jetaisADomicile ? m.home_goals : m.away_goals;
          const sesButs = jetaisADomicile ? m.away_goals : m.home_goals;
          butsHome = homeId === team.id ? mesButs : sesButs;
          butsAway = homeId === team.id ? sesButs : mesButs;
        } else {
          // On comble la journée pour que l'adversaire ait bien joué son match,
          // sinon lui seul afficherait un total inférieur aux autres. La ligne
          // du joueur, elle, sera remplacée par ses totaux réels plus bas.
          historiqueIncomplet = true;
          ({ homeGoals: butsHome, awayGoals: butsAway } = simuler(week, homeId, awayId));
        }
      } else {
        ({ homeGoals: butsHome, awayGoals: butsAway } = simuler(week, homeId, awayId));
      }

      enregistrer(table.get(homeId), butsHome, butsAway);
      enregistrer(table.get(awayId), butsAway, butsHome);
    }
  }

  // Les totaux stockés sur l'équipe font foi : ils sont exacts et voyagent
  // toujours avec la sauvegarde, contrairement au détail des rencontres.
  if (historiqueIncomplet) {
    const ligne = table.get(team.id);
    ligne.wins = team.wins;
    ligne.draws = team.draws;
    ligne.losses = team.losses;
    ligne.goals_for = team.goals_for;
    ligne.goals_against = team.goals_against;
    ligne.points = team.points;
  }

  return [...table.values()]
    .sort((a, b) =>
      b.points - a.points ||
      (b.goals_for - b.goals_against) - (a.goals_for - a.goals_against) ||
      b.goals_for - a.goals_for ||
      a.name.localeCompare(b.name)
    )
    .map((ligne, i) => ({
      ...ligne,
      rank: i + 1,
      played: ligne.wins + ligne.draws + ligne.losses,
      goal_diff: ligne.goals_for - ligne.goals_against,
    }));
}

/** Place du joueur dans sa division. */
function playerRank(teamId) {
  const table = computeStandings(teamId);
  const ligne = table.find((t) => t.isPlayer);
  return { rank: ligne ? ligne.rank : 0, totalTeams: table.length, standings: table };
}

module.exports = { computeStandings, playerRank };
