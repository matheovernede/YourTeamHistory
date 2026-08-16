const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb, queryOne, queryAll, saveDb } = require('../db/schema');
const { simulateMatch } = require('../engine/match');
const { applyMatchConsequences, tickAvailability } = require('../engine/discipline');
const { STARTERS_REQUIRED } = require('../data/rules');
const cup = require('../data/cup');

const router = express.Router();

function getTeamDivision(team) {
  return team.division || 1;
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
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

  const matchday = team.wins + team.draws + team.losses;
  let state = readState(team);
  if (!state) state = cup.createCupState(getTeamDivision(team), excludedNames(team));

  res.json({
    state,
    round: cup.getRound(state),
    available: cup.isRoundAvailable(state, matchday),
    matchday,
    rounds: cup.ROUNDS,
    resultLabel: cup.describeResult(state),
  });
});

router.post('/:teamId/cup/play', async (req, res) => {
  const db = await getDb();
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: 'Équipe non trouvée' });

  const matchday = team.wins + team.draws + team.losses;
  let state = readState(team);
  if (!state) {
    state = cup.createCupState(getTeamDivision(team), excludedNames(team));
    writeState(db, team.id, state);
  }

  if (state.won) return res.status(400).json({ error: 'Vous avez déjà remporté la coupe cette saison' });
  if (state.eliminated) return res.status(400).json({ error: 'Vous êtes éliminé de la coupe cette saison' });

  const round = cup.getRound(state);
  if (!round) return res.status(400).json({ error: 'Aucun tour à disputer' });
  if (matchday < round.minMatchday) {
    return res.status(400).json({
      error: `${round.name} : disputable à partir de la journée ${round.minMatchday} (vous en êtes à ${matchday})`,
    });
  }

  const players = queryAll('SELECT * FROM players WHERE team_id = ?', [team.id]);
  const starters = players.filter(p => p.is_starter);
  if (starters.length < STARTERS_REQUIRED) {
    return res.status(400).json({ error: `Composez votre équipe (${STARTERS_REQUIRED} titulaires) avant de jouer la coupe !` });
  }

  const opponentOverall = state.nextOpponent ? state.nextOpponent.overall : 55;
  const opponentName = state.nextOpponent ? state.nextOpponent.name : 'Adversaire';

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
    round: round.name,
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
    state: nextState,
    nextRound: cup.getRound(nextState),
    team: updatedTeam,
    manager,
  });
});

module.exports = router;
