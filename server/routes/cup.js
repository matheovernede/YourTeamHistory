const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb, queryOne, queryAll, saveDb } = require('../db/schema');
const { simulateMatch } = require('../engine/match');
const { applyMatchConsequences, tickAvailability } = require('../engine/discipline');
const { STARTERS_REQUIRED } = require('../data/rules');
const cup = require('../data/cup');
const { langueDe, t } = require('../i18n');

const router = express.Router();

function getTeamDivision(team) {
  return team.division || 1;
}

/**
 * Nom d'un tour de coupe, traduit.
 *
 * server/data/cup.js reste la source de vérité (identifiants, journées
 * minimales, dotations) : on n'y touche pas, on traduit uniquement à la sortie
 * en s'appuyant sur `round.id`. Si un tour inconnu apparaissait, `t` renverrait
 * la clé ; on préfère alors le nom d'origine, d'où le repli explicite.
 */
function nomTour(round, langue, minuscule = false) {
  if (!round) return null;
  const cle = `coupe.${minuscule ? 'toursMinuscule' : 'tours'}.${round.id}`;
  const texte = t(cle, langue);
  return texte === cle ? round.name : texte;
}

/** Copie d'un tour dont le nom est traduit. L'objet d'origine n'est pas modifié. */
function tourLocalise(round, langue) {
  return round ? { ...round, name: nomTour(round, langue) } : round;
}

/**
 * Libellé du parcours en coupe.
 *
 * On reconstruit ici ce que `cup.describeResult` produit en français, au lieu
 * de traduire sa sortie : le texte y est assemblé (« Éliminé en » + nom du tour
 * en minuscules) et n'est donc pas traduisible tel quel. Le français reste
 * identique au caractère près.
 */
function libelleResultat(state, langue) {
  if (!state) return t('coupe.resultat.nonDisputee', langue);
  if (state.won) return t('coupe.resultat.vainqueur', langue);

  if (!state.eliminated) {
    const round = cup.getRound(state);
    return round
      ? t('coupe.resultat.enLiceTour', langue, { tour: nomTour(round, langue) })
      : t('coupe.resultat.enLice', langue);
  }

  const dernier = state.history[state.history.length - 1];
  if (!dernier) return t('coupe.resultat.elimine', langue);

  // `dernier.round` est l'identifiant du tour, conservé dans l'historique :
  // c'est lui qui permet de retrouver la traduction, pas le nom stocké.
  const tour = cup.ROUNDS.find(r => r.id === dernier.round);
  const nom = tour ? nomTour(tour, langue, true) : dernier.roundName.toLowerCase();
  return t('coupe.resultat.elimineTour', langue, { tour: nom });
}

/**
 * Copie de l'état de coupe avec les noms de tours traduits dans l'historique.
 * Indispensable de travailler sur une copie : l'état d'origine est celui qui
 * part en base (colonne teams.cup_data) et doit rester en français.
 */
function etatLocalise(state, langue) {
  if (!state || !Array.isArray(state.history)) return state;
  return {
    ...state,
    history: state.history.map(h => {
      const tour = cup.ROUNDS.find(r => r.id === h.round);
      return tour ? { ...h, roundName: nomTour(tour, langue) } : h;
    }),
  };
}

/** Adversaire fictif, généré au niveau demandé. */
function generateOpponent(overall) {
  const positions = ['GAR', 'ARG', 'DC', 'DC', 'ARD', 'MDF', 'MC', 'MOC', 'AIG', 'AID', 'BU'];
  return positions.map((position, i) => ({
    id: `cup-${i}`,
    first_name: 'J',
    last_name: `Adv${i}`,
    position,
    overall,
    pace: overall, shooting: overall, passing: overall,
    dribbling: overall, defending: overall, physical: overall,
    stamina: 100, morale: 75, is_starter: 1, slot_index: i,
  }));
}

function readState(team) {
  if (!team.cup_data) return null;
  try { return JSON.parse(team.cup_data); } catch { return null; }
}

/**
 * Noms qu'un adversaire de coupe ne doit jamais porter : celui du club du
 * joueur et ceux de toutes les équipes existantes. Sans cela on pouvait
 * affronter son propre club, ou un club déjà présent au championnat.
 */
function excludedNames(team) {
  const autres = queryAll('SELECT name FROM teams').map(t => t.name);
  return [team.name, ...autres];
}

function writeState(db, teamId, state) {
  db.run('UPDATE teams SET cup_data = ? WHERE id = ?', [JSON.stringify(state), teamId]);
}

router.get('/:teamId/cup/status', (req, res) => {
  const langue = langueDe(req);
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: t('erreur.equipeIntrouvable', langue) });

  const matchday = team.wins + team.draws + team.losses;
  let state = readState(team);
  if (!state) state = cup.createCupState(getTeamDivision(team), excludedNames(team));

  res.json({
    state: etatLocalise(state, langue),
    round: tourLocalise(cup.getRound(state), langue),
    available: cup.isRoundAvailable(state, matchday),
    matchday,
    rounds: cup.ROUNDS.map(r => tourLocalise(r, langue)),
    resultLabel: libelleResultat(state, langue),
  });
});

router.post('/:teamId/cup/play', async (req, res) => {
  const langue = langueDe(req);
  const db = await getDb();
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: t('erreur.equipeIntrouvable', langue) });

  const matchday = team.wins + team.draws + team.losses;
  let state = readState(team);
  if (!state) {
    state = cup.createCupState(getTeamDivision(team), excludedNames(team));
    writeState(db, team.id, state);
  }

  if (state.won) return res.status(400).json({ error: t('erreur.coupe.dejaRemportee', langue) });
  if (state.eliminated) return res.status(400).json({ error: t('erreur.coupe.elimine', langue) });

  const round = cup.getRound(state);
  if (!round) return res.status(400).json({ error: t('erreur.coupe.aucunTour', langue) });
  if (matchday < round.minMatchday) {
    return res.status(400).json({
      error: t('erreur.coupe.tourIndisponible', langue, {
        tour: nomTour(round, langue),
        journee: round.minMatchday,
        actuelle: matchday,
      }),
    });
  }

  const players = queryAll('SELECT * FROM players WHERE team_id = ?', [team.id]);
  const starters = players.filter(p => p.is_starter);
  if (starters.length < STARTERS_REQUIRED) {
    return res.status(400).json({ error: t('erreur.coupe.composeEquipe', langue, { titulaires: STARTERS_REQUIRED }) });
  }

  const opponentOverall = state.nextOpponent ? state.nextOpponent.overall : 55;
  const opponentName = state.nextOpponent ? state.nextOpponent.name : t('coupe.adversaireInconnu', langue);

  const result = simulateMatch(players, generateOpponent(opponentOverall), {
    homeFormation: team.formation,
    difficulty: req.body.difficulty || 'normal',
    homeIsPlayer: true,
  });

  // En coupe, pas de match nul : prolongation puis tirs au but.
  let { homeGoals, awayGoals } = result;
  let shootout = null;
  if (homeGoals === awayGoals) {
    const homePen = Math.floor(Math.random() * 3) + 3;
    let awayPen = Math.floor(Math.random() * 3) + 3;
    if (awayPen === homePen) awayPen = homePen > 3 ? homePen - 1 : homePen + 1;
    shootout = { home: homePen, away: awayPen };
  }
  const playerWon = shootout ? shootout.home > shootout.away : homeGoals > awayGoals;

  const score = shootout
    ? `${homeGoals}-${awayGoals} (${shootout.home}-${shootout.away} t.a.b.)`
    : `${homeGoals}-${awayGoals}`;

  // Conséquences réelles : la coupe fatigue, blesse et suspend comme le championnat.
  const consequences = applyMatchConsequences(db, queryOne, team.id, {
    cards: result.cards ? result.cards.home : [],
    injuries: result.injuries ? result.injuries.home : [],
    scorers: (result.scorers || []).filter(s => s.team === 'home'),
  });
  tickAvailability(db, team.id);
  db.run('UPDATE players SET stamina = MAX(0, stamina - 8) WHERE team_id = ? AND is_starter = 1', [team.id]);

  // Dotation, mise à l'échelle de la division
  const division = getTeamDivision(team);
  const divScale = [1, 2, 3, 5, 8, 15, 25][division - 1] || 1;
  let prize = cup.prizeForRound(round.id) * divScale;

  const nextState = cup.advance(state, playerWon, division, score);
  if (nextState.won) {
    prize += cup.WINNER_BONUS * divScale;
    db.run('UPDATE teams SET cups = COALESCE(cups, 0) + 1 WHERE id = ?', [team.id]);
  }

  if (prize > 0) {
    db.run('UPDATE managers SET budget = budget + ? WHERE id = ?', [prize, team.manager_id]);
  }
  writeState(db, team.id, nextState);
  saveDb();

  const updatedTeam = queryOne('SELECT * FROM teams WHERE id = ?', [team.id]);
  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [team.manager_id]);

  res.json({
    round: nomTour(round, langue),
    opponent: opponentName,
    homeGoals,
    awayGoals,
    shootout,
    score,
    won: playerWon,
    eliminated: nextState.eliminated,
    cupWon: nextState.won,
    prize,
    events: result.events,
    suspensions: consequences.suspensions,
    injuries: consequences.injuries,
    // L'état parti en base (writeState, juste au-dessus) est l'original en
    // français ; seule la copie renvoyée au client est traduite.
    state: etatLocalise(nextState, langue),
    nextRound: tourLocalise(cup.getRound(nextState), langue),
    team: updatedTeam,
    manager,
  });
});

module.exports = router;
