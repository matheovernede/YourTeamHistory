const express = require('express');
const { queryAll, queryOne, run } = require('../db/schema');
const { computeStandings } = require('../engine/standings');
const { DIVISIONS } = require('../data/divisions');

const getDivisionInfo = (level) => DIVISIONS.find((d) => d.level === level) || DIVISIONS[0];

const router = express.Router();

/** Au-delà de ce délai sans activité, un manager n'est plus considéré en ligne. */
const DELAI_EN_LIGNE_MINUTES = 5;

/**
 * Enregistre l'activité d'un manager.
 *
 * Appelé depuis les routes que le client sollicite en jouant, ce qui suffit à
 * distinguer les joueurs présents de ceux qui ont fermé l'onglet il y a un mois.
 */
function touchManager(managerId) {
  if (!managerId || managerId === 'AI') return;
  try {
    run("UPDATE managers SET last_seen = datetime('now') WHERE id = ?", [managerId]);
  } catch (e) { /* colonne absente sur une base très ancienne */ }
}

function minutesDepuis(iso) {
  if (!iso) return null;
  // SQLite écrit « YYYY-MM-DD HH:MM:SS » en UTC : on le rend explicite,
  // sans quoi le navigateur l'interpréterait en heure locale.
  const date = new Date(iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return null;
  return (Date.now() - date.getTime()) / 60000;
}

/**
 * Classement de tous les managers humains.
 *
 * Il ne s'appuie pas sur la table `leaderboard`, qui n'était plus alimentée que
 * par un point du code et ignorait division comme palmarès. Tout est reconstruit
 * depuis les équipes, leur historique de saisons et le classement de chacune.
 *
 * L'ordre reflète la progression d'une carrière : la division atteinte prime,
 * car monter d'un échelon vaut mieux que dominer le sien ; viennent ensuite les
 * titres, puis les points de la saison en cours.
 */
router.get('/players', (req, res) => {
  const equipes = queryAll(`
    SELECT t.*, m.username, m.reputation, m.budget, m.last_seen
    FROM teams t
    JOIN managers m ON t.manager_id = m.id
    WHERE t.manager_id <> 'AI'
  `);

  const joueurs = equipes.map((t) => {
    const historique = queryAll(
      'SELECT season, division, rank, points, promoted, cup_result FROM season_history WHERE team_id = ?',
      [t.id]
    );

    // Le classement en cours est recalculé : les colonnes de l'équipe ne
    // décrivent que ses propres résultats, pas sa place dans la division.
    let rangDivision = null;
    let totalEquipes = null;
    try {
      const table = computeStandings(t.id);
      const ligne = table.find((l) => l.isPlayer);
      if (ligne) { rangDivision = ligne.rank; totalEquipes = table.length; }
    } catch (e) { /* sauvegarde incomplète : on affiche sans le rang */ }

    const minutes = minutesDepuis(t.last_seen);
    const division = t.division || 1;

    return {
      teamId: t.id,
      username: t.username,
      teamName: t.name,
      division,
      divisionName: getDivisionInfo(division).name,
      season: t.season || 1,
      rankInDivision: rangDivision,
      teamsInDivision: totalEquipes,
      played: (t.wins || 0) + (t.draws || 0) + (t.losses || 0),
      points: t.points || 0,
      wins: t.wins || 0,
      draws: t.draws || 0,
      losses: t.losses || 0,
      goalsFor: t.goals_for || 0,
      goalsAgainst: t.goals_against || 0,
      titles: t.titles || 0,
      cups: t.cups || 0,
      promotions: historique.filter((h) => h.promoted).length,
      seasonsPlayed: historique.length,
      bestDivision: historique.reduce((max, h) => Math.max(max, h.division || 1), division),
      reputation: t.reputation || 0,
      budget: t.budget || 0,
      online: minutes !== null && minutes <= DELAI_EN_LIGNE_MINUTES,
      minutesSinceSeen: minutes === null ? null : Math.floor(minutes),
    };
  });

  joueurs.sort((a, b) =>
    b.division - a.division ||
    b.titles - a.titles ||
    b.cups - a.cups ||
    b.points - a.points ||
    (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
    a.teamName.localeCompare(b.teamName)
  );

  res.json({
    players: joueurs.map((j, i) => ({ ...j, rank: i + 1 })),
    onlineCount: joueurs.filter((j) => j.online).length,
    totalCount: joueurs.length,
  });
});

/** Détail d'un manager : sa carrière saison par saison. */
router.get('/players/:teamId', (req, res) => {
  const team = queryOne(
    `SELECT t.*, m.username, m.reputation, m.budget, m.last_seen
     FROM teams t JOIN managers m ON t.manager_id = m.id
     WHERE t.id = ? AND t.manager_id <> 'AI'`,
    [req.params.teamId]
  );
  if (!team) return res.status(404).json({ error: 'Joueur introuvable' });

  const history = queryAll(
    'SELECT * FROM season_history WHERE team_id = ? ORDER BY season DESC',
    [req.params.teamId]
  );

  const meilleurs = queryAll(
    `SELECT first_name, last_name, position, overall, career_goals, career_appearances
     FROM players WHERE team_id = ? ORDER BY overall DESC LIMIT 5`,
    [req.params.teamId]
  );

  res.json({ team, history, topPlayers: meilleurs });
});

// Anciennes routes conservées : du code client pourrait encore les appeler.
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
module.exports.touchManager = touchManager;
