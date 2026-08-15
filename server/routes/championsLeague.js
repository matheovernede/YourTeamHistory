const express = require('express');
const { getDb, queryOne, queryAll, run, saveDb } = require('../db/schema');
const { simulateMatch, simulateAiMatchByStrength, applyMatchEffects } = require('../engine/match');
const { EUROPEAN_TEAMS, CL_PRIZES, generateCLDraw, generateGroupFixtures } = require('../data/championsLeague');

const router = express.Router();

/**
 * Helper: get or parse CL state from team's cl_data column.
 */
function getCLState(team) {
  if (!team.cl_data) return null;
  try {
    return JSON.parse(team.cl_data);
  } catch (e) {
    return null;
  }
}

/**
 * Helper: save CL state to the team's cl_data column.
 */
function saveCLState(teamId, clState) {
  run('UPDATE teams SET cl_data = ? WHERE id = ?', [JSON.stringify(clState), teamId]);
}

/**
 * Helper: calculate the player's team overall from their starters.
 */
function getPlayerTeamOverall(teamId) {
  const starters = queryAll('SELECT overall FROM players WHERE team_id = ? AND is_starter = 1', [teamId]);
  if (starters.length === 0) return 70;
  return Math.round(starters.reduce((s, p) => s + p.overall, 0) / starters.length);
}

/**
 * GET /:teamId/cl/status
 * Returns the current Champions League state for the team.
 */
router.get('/:teamId/cl/status', (req, res) => {
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: 'Equipe non trouvee' });

  if (team.division < 7) {
    return res.status(403).json({ error: 'La Champions League est accessible uniquement en Ligue 1 (division 7)', locked: true });
  }

  const clState = getCLState(team);
  if (!clState) {
    return res.json({ active: false, message: 'Champions League non initialisee. Jouez un match de championnat pour lancer la phase de groupes.' });
  }

  // Determine next match info
  let nextMatch = null;
  if (clState.phase === 'group') {
    if (clState.currentMatchday < 6) {
      const md = clState.fixtures[clState.currentMatchday];
      const playerMatch = md.find(m => m.home === team.name || m.away === team.name);
      if (playerMatch) {
        nextMatch = { ...playerMatch, matchday: clState.currentMatchday + 1 };
      }
    }
  } else if (clState.phase === 'quarter_final' || clState.phase === 'semi_final' || clState.phase === 'final') {
    const ko = clState.knockout;
    if (ko && ko.nextMatch) {
      nextMatch = ko.nextMatch;
    }
  }

  res.json({
    active: true,
    phase: clState.phase,
    groups: clState.groups,
    currentMatchday: clState.currentMatchday,
    fixtures: clState.fixtures,
    results: clState.results || [],
    knockout: clState.knockout || null,
    nextMatch,
    eliminated: clState.eliminated || false,
    winner: clState.winner || false,
    prizes: CL_PRIZES,
    totalEarnings: clState.totalEarnings || 0,
  });
});

/**
 * POST /:teamId/cl/init
 * Initialize CL for the current season (called automatically or manually).
 */
router.post('/:teamId/cl/init', async (req, res) => {
  const db = await getDb();
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: 'Equipe non trouvee' });

  if (team.division < 7) {
    return res.status(403).json({ error: 'La Champions League est accessible uniquement en Ligue 1 (division 7)', locked: true });
  }

  const existing = getCLState(team);
  if (existing && !existing.eliminated && !existing.winner) {
    return res.status(400).json({ error: 'Champions League deja en cours' });
  }

  const playerOverall = getPlayerTeamOverall(team.id);
  const groups = generateCLDraw(team.name, playerOverall);
  const fixtures = generateGroupFixtures(groups);

  const clState = {
    phase: 'group',
    groups,
    fixtures,
    currentMatchday: 0,
    results: [],
    knockout: null,
    eliminated: false,
    winner: false,
    totalEarnings: 0,
  };

  saveCLState(team.id, clState);

  res.json({ success: true, message: 'Champions League initialisee !', groups });
});

/**
 * POST /:teamId/cl/play
 * Play the next CL match.
 */
router.post('/:teamId/cl/play', async (req, res) => {
  const db = await getDb();
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: 'Equipe non trouvee' });

  if (team.division < 7) {
    return res.status(403).json({ error: 'Champions League non accessible', locked: true });
  }

  let clState = getCLState(team);
  if (!clState) {
    return res.status(400).json({ error: 'Champions League non initialisee. Utilisez /cl/init d\'abord.' });
  }

  if (clState.eliminated) {
    return res.status(400).json({ error: 'Vous avez ete elimine de la Champions League cette saison.' });
  }

  if (clState.winner) {
    return res.status(400).json({ error: 'Vous avez deja remporte la Champions League cette saison !' });
  }

  if (clState.phase === 'group') {
    return playGroupMatch(db, team, clState, res);
  } else {
    return playKnockoutMatch(db, team, clState, res);
  }
});

/**
 * Play a group stage match.
 */
function playGroupMatch(db, team, clState, res) {
  if (clState.currentMatchday >= 6) {
    // Group stage done, advance to knockouts
    advanceToKnockouts(clState, team.name);
    saveCLState(team.id, clState);

    if (clState.eliminated) {
      return res.json({
        phase: 'group_ended',
        eliminated: true,
        message: 'Vous n\'avez pas termine dans le top 2 de votre groupe. Elimine !',
        groups: clState.groups,
        totalEarnings: clState.totalEarnings,
      });
    }

    return res.json({
      phase: 'knockout_start',
      message: 'Phase de groupes terminee ! Vous etes qualifie pour les quarts de finale !',
      groups: clState.groups,
      knockout: clState.knockout,
      totalEarnings: clState.totalEarnings,
    });
  }

  const md = clState.currentMatchday;
  const matchdayFixtures = clState.fixtures[md];

  // Find player's match
  const playerMatch = matchdayFixtures.find(m => m.home === team.name || m.away === team.name);
  if (!playerMatch) {
    // Player has no match this day (shouldn't happen), skip
    clState.currentMatchday++;
    saveCLState(team.id, clState);
    return res.json({ message: 'Pas de match cette journee, on avance.', phase: 'group', currentMatchday: clState.currentMatchday });
  }

  const isHome = playerMatch.home === team.name;
  const opponentName = isHome ? playerMatch.away : playerMatch.home;

  // Find opponent overall from group standings
  let opponentOverall = 80;
  for (const group of clState.groups) {
    const opp = group.standings.find(t => t.name === opponentName);
    if (opp) { opponentOverall = opp.overall; break; }
  }

  // Simulate player's match using full match engine
  const homePlayers = queryAll('SELECT * FROM players WHERE team_id = ?', [team.id]);
  let matchResult;

  if (isHome) {
    matchResult = simulateMatch(homePlayers, generateFakePlayers(opponentOverall), { homeIsPlayer: true });
  } else {
    matchResult = simulateMatch(generateFakePlayers(opponentOverall), homePlayers, { homeIsPlayer: false });
  }

  const playerGoals = isHome ? matchResult.homeGoals : matchResult.awayGoals;
  const opponentGoals = isHome ? matchResult.awayGoals : matchResult.homeGoals;

  // Apply stamina/morale effects
  const won = playerGoals > opponentGoals;
  const drew = playerGoals === opponentGoals;
  applyMatchEffects(db, team.id, won, drew);

  // Update group standings for player's match
  updateGroupStandings(clState.groups, team.name, opponentName, playerGoals, opponentGoals);

  // Simulate all other group matches for this matchday
  for (const fixture of matchdayFixtures) {
    if (fixture.home === team.name || fixture.away === team.name) continue;

    let homeOvr = 80, awayOvr = 80;
    for (const group of clState.groups) {
      const h = group.standings.find(t => t.name === fixture.home);
      const a = group.standings.find(t => t.name === fixture.away);
      if (h) homeOvr = h.overall;
      if (a) awayOvr = a.overall;
    }

    const aiResult = simulateAiMatchByStrength(homeOvr, awayOvr);
    updateGroupStandings(clState.groups, fixture.home, fixture.away, aiResult.homeGoals, aiResult.awayGoals);
  }

  // Record result
  const resultEntry = {
    matchday: md + 1,
    phase: 'group',
    home: isHome ? team.name : opponentName,
    away: isHome ? opponentName : team.name,
    homeGoals: matchResult.homeGoals,
    awayGoals: matchResult.awayGoals,
    events: matchResult.events,
  };
  clState.results.push(resultEntry);
  clState.currentMatchday++;

  // Group stage prize (earned for participating)
  if (md === 0) {
    clState.totalEarnings += CL_PRIZES.group_stage;
  }

  saveCLState(team.id, clState);
  saveDb();

  // Check if group stage is over after this match
  let phaseComplete = clState.currentMatchday >= 6;

  res.json({
    phase: 'group',
    matchday: md + 1,
    result: {
      opponent: opponentName,
      playerGoals,
      opponentGoals,
      isHome,
      events: matchResult.events,
      resultText: won ? 'Victoire' : drew ? 'Match nul' : 'Defaite',
    },
    groups: clState.groups,
    currentMatchday: clState.currentMatchday,
    phaseComplete,
    totalEarnings: clState.totalEarnings,
  });
}

/**
 * Play a knockout match (QF, SF, Final).
 */
function playKnockoutMatch(db, team, clState, res) {
  const ko = clState.knockout;
  if (!ko || !ko.nextMatch) {
    return res.status(400).json({ error: 'Pas de match knockout en attente.' });
  }

  const match = ko.nextMatch;
  const isHome = match.leg === 1 ? true : match.leg === 2 ? false : true; // Final is neutral
  const opponentName = match.opponent;
  const opponentOverall = match.opponentOverall;

  const homePlayers = queryAll('SELECT * FROM players WHERE team_id = ?', [team.id]);
  let matchResult;

  if (isHome || clState.phase === 'final') {
    matchResult = simulateMatch(homePlayers, generateFakePlayers(opponentOverall), { homeIsPlayer: true });
  } else {
    matchResult = simulateMatch(generateFakePlayers(opponentOverall), homePlayers, { homeIsPlayer: false });
  }

  const playerGoals = (isHome || clState.phase === 'final') ? matchResult.homeGoals : matchResult.awayGoals;
  const opponentGoals = (isHome || clState.phase === 'final') ? matchResult.awayGoals : matchResult.homeGoals;

  // Apply effects
  const won = playerGoals > opponentGoals;
  const drew = playerGoals === opponentGoals;
  applyMatchEffects(db, team.id, won, drew);

  // Record result
  const resultEntry = {
    phase: clState.phase,
    leg: match.leg,
    opponent: opponentName,
    playerGoals,
    opponentGoals,
    isHome,
    events: matchResult.events,
  };
  clState.results.push(resultEntry);

  // Handle knockout progression
  if (clState.phase === 'final') {
    // Single match final
    if (playerGoals > opponentGoals) {
      clState.winner = true;
      clState.totalEarnings += CL_PRIZES.final + CL_PRIZES.winner_bonus;
      ko.nextMatch = null;
    } else if (playerGoals < opponentGoals) {
      clState.eliminated = true;
      clState.totalEarnings += CL_PRIZES.final;
      ko.nextMatch = null;
    } else {
      // Draw in final -> penalties (random)
      const penaltyWin = Math.random() < 0.5;
      resultEntry.penalties = true;
      resultEntry.penaltyWin = penaltyWin;
      if (penaltyWin) {
        clState.winner = true;
        clState.totalEarnings += CL_PRIZES.final + CL_PRIZES.winner_bonus;
      } else {
        clState.eliminated = true;
        clState.totalEarnings += CL_PRIZES.final;
      }
      ko.nextMatch = null;
    }
  } else {
    // Two-legged tie (QF or SF)
    if (match.leg === 1) {
      // Store first leg result, set up second leg
      ko.firstLegPlayerGoals = playerGoals;
      ko.firstLegOpponentGoals = opponentGoals;
      ko.nextMatch = {
        opponent: opponentName,
        opponentOverall,
        leg: 2,
        phase: clState.phase,
      };
    } else {
      // Second leg - determine aggregate winner
      const aggPlayer = ko.firstLegPlayerGoals + playerGoals;
      const aggOpponent = ko.firstLegOpponentGoals + opponentGoals;

      resultEntry.aggregate = { player: aggPlayer, opponent: aggOpponent };

      if (aggPlayer > aggOpponent) {
        // Player advances
        advanceKnockout(clState, team.name);
      } else if (aggPlayer < aggOpponent) {
        // Eliminated
        clState.eliminated = true;
        if (clState.phase === 'quarter_final') clState.totalEarnings += CL_PRIZES.quarter_final;
        else if (clState.phase === 'semi_final') clState.totalEarnings += CL_PRIZES.semi_final;
      } else {
        // Aggregate draw -> away goals rule? Let's use penalties (simpler)
        const penaltyWin = Math.random() < 0.5;
        resultEntry.penalties = true;
        resultEntry.penaltyWin = penaltyWin;
        if (penaltyWin) {
          advanceKnockout(clState, team.name);
        } else {
          clState.eliminated = true;
          if (clState.phase === 'quarter_final') clState.totalEarnings += CL_PRIZES.quarter_final;
          else if (clState.phase === 'semi_final') clState.totalEarnings += CL_PRIZES.semi_final;
        }
      }
    }
  }

  // Simulate other knockout matches (AI vs AI) when player finishes a round
  if (ko.otherMatches && match.leg === 2 && !clState.eliminated) {
    simulateOtherKnockoutMatches(ko);
  }

  saveCLState(team.id, clState);
  saveDb();

  res.json({
    phase: clState.phase,
    result: {
      opponent: opponentName,
      playerGoals,
      opponentGoals,
      isHome,
      leg: match.leg,
      events: matchResult.events,
      resultText: won ? 'Victoire' : drew ? 'Match nul' : 'Defaite',
      aggregate: resultEntry.aggregate || null,
      penalties: resultEntry.penalties || false,
      penaltyWin: resultEntry.penaltyWin,
    },
    knockout: clState.knockout,
    eliminated: clState.eliminated,
    winner: clState.winner,
    totalEarnings: clState.totalEarnings,
  });
}

/**
 * Advance from group stage to knockouts.
 */
function advanceToKnockouts(clState, playerTeamName) {
  // Get top 2 from each group
  const qualified = [];
  for (const group of clState.groups) {
    // Sort standings
    group.standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const diffA = a.goalsFor - a.goalsAgainst;
      const diffB = b.goalsFor - b.goalsAgainst;
      if (diffB !== diffA) return diffB - diffA;
      return b.goalsFor - a.goalsFor;
    });
    qualified.push({ ...group.standings[0], groupPos: 1, group: group.name });
    qualified.push({ ...group.standings[1], groupPos: 2, group: group.name });
  }

  // Check if player qualified
  const playerQualified = qualified.find(t => t.name === playerTeamName);
  if (!playerQualified) {
    clState.eliminated = true;
    clState.totalEarnings += CL_PRIZES.group_stage;
    return;
  }

  // Prize for qualifying to QF
  clState.totalEarnings += CL_PRIZES.quarter_final;

  // Draw QF: 1st of group vs 2nd of different group
  const firsts = qualified.filter(t => t.groupPos === 1);
  const seconds = qualified.filter(t => t.groupPos === 2).sort(() => Math.random() - 0.5);

  // Match firsts with seconds from different groups
  const qfPairings = [];
  const usedSeconds = new Set();

  for (const first of firsts) {
    for (const second of seconds) {
      if (second.group !== first.group && !usedSeconds.has(second.name)) {
        qfPairings.push({ teamA: first, teamB: second });
        usedSeconds.add(second.name);
        break;
      }
    }
  }

  // Find player's QF pairing
  const playerPairing = qfPairings.find(p => p.teamA.name === playerTeamName || p.teamB.name === playerTeamName);
  const otherPairings = qfPairings.filter(p => p.teamA.name !== playerTeamName && p.teamB.name !== playerTeamName);

  let opponent;
  if (playerPairing.teamA.name === playerTeamName) {
    opponent = playerPairing.teamB;
  } else {
    opponent = playerPairing.teamA;
  }

  clState.phase = 'quarter_final';
  clState.knockout = {
    nextMatch: {
      opponent: opponent.name,
      opponentOverall: opponent.overall,
      leg: 1,
      phase: 'quarter_final',
    },
    firstLegPlayerGoals: 0,
    firstLegOpponentGoals: 0,
    otherMatches: otherPairings.map(p => ({
      teamA: { name: p.teamA.name, overall: p.teamA.overall },
      teamB: { name: p.teamB.name, overall: p.teamB.overall },
    })),
    remainingTeams: qfPairings.map(p => [p.teamA, p.teamB]).flat().filter(t => t.name !== playerTeamName),
  };
}

/**
 * Advance the player to the next knockout round.
 */
function advanceKnockout(clState, playerTeamName) {
  const ko = clState.knockout;

  // Simulate other matches to determine next opponents
  simulateOtherKnockoutMatches(ko);

  if (clState.phase === 'quarter_final') {
    clState.phase = 'semi_final';
    clState.totalEarnings += CL_PRIZES.semi_final;

    // Pick an opponent from remaining teams
    const remaining = ko.advancedTeams || ko.remainingTeams || [];
    const nextOpponent = remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : { name: 'FC Unknown', overall: 82 };

    ko.nextMatch = {
      opponent: nextOpponent.name,
      opponentOverall: nextOpponent.overall,
      leg: 1,
      phase: 'semi_final',
    };
    ko.firstLegPlayerGoals = 0;
    ko.firstLegOpponentGoals = 0;
    ko.otherMatches = remaining.filter(t => t.name !== nextOpponent.name).slice(0, 2).map((t, i, arr) => ({
      teamA: t,
      teamB: arr[(i + 1) % arr.length] || { name: 'FC Unknown', overall: 82 },
    }));
  } else if (clState.phase === 'semi_final') {
    clState.phase = 'final';

    // Pick final opponent
    const remaining = ko.advancedTeams || ko.remainingTeams || [];
    const finalOpponent = remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : { name: 'FC Unknown', overall: 85 };

    ko.nextMatch = {
      opponent: finalOpponent.name,
      opponentOverall: finalOpponent.overall,
      leg: 1, // single match
      phase: 'final',
    };
    ko.otherMatches = [];
  }
}

/**
 * Simulate other knockout matches between AI teams.
 */
function simulateOtherKnockoutMatches(ko) {
  if (!ko.otherMatches || ko.otherMatches.length === 0) {
    ko.advancedTeams = ko.remainingTeams || [];
    return;
  }

  const advanced = [];
  for (const match of ko.otherMatches) {
    const leg1 = simulateAiMatchByStrength(match.teamA.overall, match.teamB.overall);
    const leg2 = simulateAiMatchByStrength(match.teamB.overall, match.teamA.overall);
    const aggA = leg1.homeGoals + leg2.awayGoals;
    const aggB = leg1.awayGoals + leg2.homeGoals;

    if (aggA >= aggB) {
      advanced.push(match.teamA);
    } else {
      advanced.push(match.teamB);
    }
  }
  ko.advancedTeams = advanced;
}

/**
 * Generate fake players array for CL opponent simulation.
 * Creates 11 "starters" with the given overall rating (small variance).
 */
function generateFakePlayers(teamOverall) {
  const positions = ['GAR', 'DC', 'DC', 'ARG', 'ARD', 'MC', 'MC', 'MOC', 'AIG', 'AID', 'BU'];
  return positions.map((pos, i) => {
    const variance = Math.floor(Math.random() * 5) - 2; // -2 to +2
    const ovr = Math.max(60, Math.min(95, teamOverall + variance));
    return {
      id: `fake_${i}`,
      first_name: 'CL',
      last_name: `Player${i + 1}`,
      position: pos,
      overall: ovr,
      shooting: ovr,
      passing: ovr,
      dribbling: ovr,
      defending: ovr,
      physical: ovr,
      pace: ovr,
      stamina: 85 + Math.floor(Math.random() * 15),
      morale: 75 + Math.floor(Math.random() * 20),
      is_starter: 1,
    };
  });
}

/**
 * Update group standings after a match.
 */
function updateGroupStandings(groups, homeTeam, awayTeam, homeGoals, awayGoals) {
  for (const group of groups) {
    const home = group.standings.find(t => t.name === homeTeam);
    const away = group.standings.find(t => t.name === awayTeam);
    if (home && away) {
      home.played++;
      away.played++;
      home.goalsFor += homeGoals;
      home.goalsAgainst += awayGoals;
      away.goalsFor += awayGoals;
      away.goalsAgainst += homeGoals;

      if (homeGoals > awayGoals) {
        home.wins++;
        home.points += 3;
        away.losses++;
      } else if (homeGoals === awayGoals) {
        home.draws++;
        away.draws++;
        home.points += 1;
        away.points += 1;
      } else {
        away.wins++;
        away.points += 3;
        home.losses++;
      }
      break;
    }
  }
}

module.exports = router;
