const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb, queryOne, queryAll, run, saveDb } = require('../db/schema');
const { simulateMatch, simulateAiMatchByStrength, applyMatchEffects } = require('../engine/match');
const { getRandomSponsors } = require('../data/sponsors');
const { DIVISIONS } = require('../data/divisions');
const { seedDivision } = require('../db/seed');
const { getRandomEvent, buildEventContext, EVENTS } = require('../data/events');
const {
  applyMatchConsequences,
  tickAvailability,
  isAvailable,
  unavailabilityReason,
  resetSeasonStats,
} = require('../engine/discipline');
const { evolveSquad, retireOldPlayers, runAiTransferWindow } = require('../engine/progression');
const { findFixture, seedFor } = require('../engine/calendar');
const { computeStandings } = require('../engine/standings');
const { touchManager } = require('./leaderboard');
const {
  updateDiscontent,
  resolveDepartures,
  resetDiscontent,
  refreshAppeasement,
  moodLabel,
  grievances,
  squadMedian,
  REQUEST_THRESHOLD,
  DEPARTURE_THRESHOLD,
} = require('../engine/morale');
const { describeResult: describeCupResult, ROUNDS: CUP_ROUNDS, getRound: getCupRound } = require('../data/cup');
const {
  langueDe,
  t,
  localiserDonnee,
  localiserEvenement,
  localiserDialogue,
  localiserConsequence,
  localiserReponse,
} = require('../i18n');

const router = express.Router();

/**
 * Get the player's current division level.
 */
function getTeamDivision(team) {
  return team.division || 1;
}

/**
 * Get division metadata by level.
 */
function getDivisionInfo(level) {
  return DIVISIONS.find(d => d.level === level) || DIVISIONS[0];
}

/**
 * Nom de division destiné à l'affichage.
 *
 * À n'utiliser QUE dans une réponse HTTP : le nom français reste l'identifiant
 * écrit en base (season_history.division_name), sans quoi deux sauvegardes
 * menées dans deux langues ne seraient plus comparables.
 */
function nomDivision(info, langue) {
  return localiserDonnee('divisions', info.name, langue);
}

/**
 * Motifs de mécontentement traduits.
 *
 * server/engine/morale.js produit un petit nombre de motifs figés, en français.
 * On les traduit à la sortie via cette table : le moteur reste inchangé, et un
 * motif qu'on n'aurait pas prévu passe tel quel plutôt que de disparaître.
 */
const MOTIFS_MORAL = {
  'moral au plus bas': 'moral.griefs.moralBas',
  'manque de temps de jeu': 'moral.griefs.tempsDeJeu',
  'ambition sportive': 'moral.griefs.ambition',
  'insatisfaction persistante': 'moral.griefs.insatisfaction',
};

function traduireMotifs(motifs, langue) {
  if (!Array.isArray(motifs)) return motifs;
  return motifs.map(motif => (MOTIFS_MORAL[motif] ? t(MOTIFS_MORAL[motif], langue) : motif));
}

/**
 * Bilan de coupe affiché en fin de saison.
 *
 * `describeResult` assemble son texte en français (« Éliminé en » + nom du tour
 * en minuscules) : il n'est donc pas traduisible tel quel, on le reconstruit.
 * La valeur ÉCRITE EN BASE reste celle de describeResult, en français.
 */
function libelleCoupe(state, langue) {
  if (!state) return t('coupe.resultat.nonDisputee', langue);
  if (state.won) return t('coupe.resultat.vainqueur', langue);

  const nomTour = (round, minuscule) => {
    const cle = `coupe.${minuscule ? 'toursMinuscule' : 'tours'}.${round.id}`;
    const texte = t(cle, langue);
    return texte === cle ? round.name : texte;
  };

  if (!state.eliminated) {
    const round = getCupRound(state);
    return round
      ? t('coupe.resultat.enLiceTour', langue, { tour: nomTour(round, false) })
      : t('coupe.resultat.enLice', langue);
  }

  const dernier = (state.history || [])[(state.history || []).length - 1];
  if (!dernier) return t('coupe.resultat.elimine', langue);
  const tour = CUP_ROUNDS.find(r => r.id === dernier.round);
  const nom = tour ? nomTour(tour, true) : String(dernier.roundName || '').toLowerCase();
  return t('coupe.resultat.elimineTour', langue, { tour: nom });
}

router.get('/:teamId/status', (req, res) => {
  const langue = langueDe(req);
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: t('erreur.equipeIntrouvable', langue) });

  // Le client interroge cette route en permanence : c'est le meilleur signal
  // de présence dont on dispose sans ouvrir de connexion permanente.
  touchManager(team.manager_id);

  const division = getTeamDivision(team);
  const divisionInfo = getDivisionInfo(division);
  const totalMatches = 26;
  const played = team.wins + team.draws + team.losses;
  const remaining = totalMatches - played;

  // Classement propre à cette sauvegarde : recalculé depuis son calendrier et
  // ses résultats, jamais lu dans les colonnes partagées des équipes IA.
  const standings = computeStandings(req.params.teamId);
  const rank = standings.findIndex(t => t.id === req.params.teamId) + 1;

  res.json({
    season: team.season,
    matchday: played + 1,
    played,
    remaining,
    totalMatches,
    rank,
    standings,
    team,
    division: nomDivision(divisionInfo, langue),
    divisionLevel: division,
  });
});

router.post('/:teamId/play-matchday', async (req, res) => {
  const langue = langueDe(req);
  const db = await getDb();
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: t('erreur.equipeIntrouvable', langue) });

  const played = team.wins + team.draws + team.losses;
  if (played >= 26) {
    return res.status(400).json({ error: t('erreur.saisonTerminee', langue), seasonOver: true });
  }

  const starterCount = queryOne('SELECT COUNT(*) as count FROM players WHERE team_id = ? AND is_starter = 1', [team.id]);
  if (!starterCount || starterCount.count < 11) {
    return res.status(400).json({ error: t('erreur.composeEquipe', langue) });
  }

  const division = getTeamDivision(team);

  // Pick an opponent from the same division
  let aiTeams = queryAll("SELECT * FROM teams WHERE manager_id = 'AI' AND division = ?", [division]);
  if (aiTeams.length === 0) {
    // No AI teams in this division — seed them now
    const diff = req.body.difficulty || 'normal';
    await seedDivision(division, diff);
    aiTeams = queryAll("SELECT * FROM teams WHERE manager_id = 'AI' AND division = ?", [division]);
    if (aiTeams.length === 0) return res.status(500).json({ error: t('erreur.pasDadversairesDivision', langue) });
  }
  const week = played + 1;

  // Le calendrier impose l'adversaire et le terrain. Auparavant l'adversaire
  // était tiré au sort et le joueur recevait à chaque match : il bénéficiait
  // donc de l'avantage du terrain sur les 26 journées, ce qui gonflait son
  // classement, et pouvait affronter cinq fois la même équipe.
  // La graine inclut l'équipe du joueur : chaque sauvegarde a son calendrier.
  const poolIds = [team.id, ...aiTeams.map((t) => t.id)];
  const seed = seedFor(team.id, team.season, division);
  const fixture = findFixture(poolIds, seed, week, team.id);

  // Division au nombre impair d'équipes : le joueur peut être exempt. On lui
  // donne un adversaire de secours plutôt que de bloquer sa progression.
  const opponentId = fixture
    ? fixture.opponentId
    : aiTeams[week % aiTeams.length].id;
  const isHome = fixture ? fixture.isHome : true;
  const opponent = queryOne('SELECT * FROM teams WHERE id = ?', [opponentId]);
  if (!opponent) return res.status(500).json({ error: t('erreur.pasDadversairesDivision', langue) });

  const myPlayers = queryAll('SELECT * FROM players WHERE team_id = ?', [team.id]);
  const oppPlayers = queryAll('SELECT * FROM players WHERE team_id = ?', [opponent.id]);

  const result = simulateMatch(
    isHome ? myPlayers : oppPlayers,
    isHome ? oppPlayers : myPlayers,
    {
      homeFormation: isHome ? team.formation : opponent.formation,
      awayFormation: isHome ? opponent.formation : team.formation,
      difficulty: req.body.difficulty || 'normal',
      homeIsPlayer: isHome,
    }
  );

  // À partir d'ici on raisonne du point de vue du joueur, quel que soit le terrain.
  const side = isHome ? 'home' : 'away';
  const myGoals = isHome ? result.homeGoals : result.awayGoals;
  const oppGoals = isHome ? result.awayGoals : result.homeGoals;

  const matchId = uuid();

  db.run(
    "INSERT INTO matches (id, season, week, home_team_id, away_team_id, home_goals, away_goals, played, events, played_at) VALUES (?,?,?,?,?,?,?,1,?,datetime('now'))",
    [matchId, team.season, week, isHome ? team.id : opponent.id, isHome ? opponent.id : team.id, result.homeGoals, result.awayGoals, JSON.stringify(result.events)]
  );

  // Les compteurs des équipes IA ne sont plus tenus en base : ils sont
  // communs à toutes les sauvegardes et les corrompaient mutuellement. Le
  // classement les recalcule depuis le calendrier de cette partie.

  let pointsEarned = 0;
  let resultText = '';
  let matchBonus = 0;
  const goalDiff = myGoals - oppGoals;

  // Win bonus scales with division
  const winBonusByDiv = [100000, 200000, 400000, 700000, 1200000, 2500000, 5000000];
  const baseWinBonus = winBonusByDiv[division - 1] || 1000000;

  if (goalDiff > 0) {
    pointsEarned = 3;
    resultText = 'Victoire';
    matchBonus = goalDiff >= 4 ? baseWinBonus * 3 : goalDiff >= 2 ? baseWinBonus * 2 : baseWinBonus;
    db.run('UPDATE managers SET budget = budget + ? WHERE id = ?', [matchBonus, team.manager_id]);
  } else if (goalDiff === 0) {
    pointsEarned = 1;
    resultText = 'Match nul';
  } else {
    resultText = 'Défaite';
  }

  // `resultText` GARDE sa valeur française : le client en dérive un nom de
  // classe CSS (.result-tag.victoire / .match-nul / .défaite, voir
  // client/src/pages/Season.css). Le traduire casserait la mise en forme, et
  // ferait de ce champ une donnée d'affichage alors qu'il sert d'identifiant.
  // Le libellé lisible voyage donc à part, dans `resultLabel`.
  const resultLabel = t(
    goalDiff > 0 ? 'match.victoire' : goalDiff === 0 ? 'match.nul' : 'match.defaite',
    langue
  );

  recordResult(db, team.id, myGoals, oppGoals);

  // Apply stamina/morale effects to player's team
  const won = goalDiff > 0;
  const drew = goalDiff === 0;
  applyMatchEffects(db, team.id, won, drew);

  // Discipline, blessures et statistiques individuelles.
  // L'ordre compte : on applique d'abord les suites du match, puis on décompte
  // une journée — sinon la sanction du jour serait purgée immédiatement.
  const consequences = applyMatchConsequences(db, queryOne, team.id, {
    cards: result.cards ? result.cards[side] : [],
    injuries: result.injuries ? result.injuries[side] : [],
    scorers: (result.scorers || []).filter(s => s.team === side),
  });
  tickAvailability(db, team.id);

  // Mécontentement : évalué après le match, pour tenir compte du résultat
  // et du temps de jeu qui viennent d'être enregistrés.
  const mood = updateDiscontent(db, queryAll, team.id, {
    matchday: week,
    division,
    difficulty: req.body.difficulty || 'normal',
  });

  // Les autres affiches de la journée ne sont plus jouées ici : elles sont
  // recalculées à la demande par computeStandings, propre à cette sauvegarde.
  saveDb();

  const updatedTeam = queryOne('SELECT * FROM teams WHERE id = ?', [team.id]);
  const newPlayed = updatedTeam.wins + updatedTeam.draws + updatedTeam.losses;
  const seasonOver = newPlayed >= 26;

  // Check if a random event triggers after this match
  const standings = computeStandings(team.id);
  const currentRank = standings.findIndex(t => t.id === team.id) + 1;
  const isLosing = currentRank > Math.ceil(standings.length / 2);

  // Contexte enrichi : classement, trésorerie, taille d'effectif et série en
  // cours, pour que les événements collent à la situation réelle du club.
  const recentForEvents = queryAll(
    `SELECT home_team_id, home_goals, away_goals FROM matches
     WHERE (home_team_id = ? OR away_team_id = ?) AND played = 1
     ORDER BY season DESC, week DESC LIMIT 5`,
    [team.id, team.id]
  ).map(mt => {
    const isHome = mt.home_team_id === team.id;
    const scored = isHome ? mt.home_goals : mt.away_goals;
    const conceded = isHome ? mt.away_goals : mt.home_goals;
    return { outcome: scored > conceded ? 'win' : scored === conceded ? 'draw' : 'loss' };
  });

  const managerRow = queryOne('SELECT budget FROM managers WHERE id = ?', [team.manager_id]);
  const squadCount = queryOne('SELECT COUNT(*) as count FROM players WHERE team_id = ?', [team.id]);

  const event = getRandomEvent(buildEventContext({
    matchday: week,
    team: updatedTeam,
    rank: currentRank,
    totalTeams: standings.length,
    isLosing,
    budget: managerRow ? managerRow.budget : 0,
    squadSize: squadCount ? squadCount.count : 0,
    recentMatches: recentForEvents,
  }));

  res.json({
    match: {
      id: matchId,
      opponent: opponent.name,
      // Le joueur ne reçoit plus systématiquement : le score doit donc être
      // lu de son point de vue, sans quoi une victoire à l'extérieur
      // s'afficherait comme une défaite.
      isHome,
      goalsFor: myGoals,
      goalsAgainst: oppGoals,
      homeGoals: result.homeGoals,
      awayGoals: result.awayGoals,
      events: result.events,
      pointsEarned,
      resultText,
      resultLabel,
      matchBonus,
      matchday: week,
      suspensions: consequences.suspensions,
      injuries: consequences.injuries,
      // Les motifs viennent du moteur de moral, en français : ils sont traduits
      // ici, à la frontière HTTP, sans toucher au moteur.
      transferRequests: mood.requests.map(r => ({ ...r, reasons: traduireMotifs(r.reasons, langue) })),
      moraleWarnings: mood.warnings.map(w => ({ ...w, reasons: traduireMotifs(w.reasons, langue) })),
    },
    team: updatedTeam,
    seasonOver,
    event: localiserEvenement(event, langue) || null,
  });
});

router.post('/:teamId/resolve-event', async (req, res) => {
  const langue = langueDe(req);
  const { eventId, choiceId, managerId } = req.body;
  if (!eventId || !choiceId || !managerId) {
    return res.status(400).json({ error: t('erreur.requis.eventChoiceManager', langue) });
  }

  const db = await getDb();
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: t('erreur.equipeIntrouvable', langue) });

  const event = EVENTS.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ error: t('erreur.evenementIntrouvable', langue) });

  const choice = event.choices.find(c => c.id === choiceId);
  if (!choice) return res.status(400).json({ error: t('erreur.choixInvalide', langue) });

  const effects = choice.effects || {};
  const division = getTeamDivision(team);
  const divScale = [1, 2, 3, 5, 8, 15, 25][division - 1] || 1;

  // Handle chance-based outcomes
  if (effects.chance && Math.random() > effects.chance) {
    // Failed gamble
    const penalty = effects.reputation ? Math.abs(effects.reputation) : 10;
    db.run('UPDATE managers SET reputation = MAX(0, reputation - ?) WHERE id = ?', [penalty, managerId]);
    saveDb();
    const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
    return res.json({
      success: false,
      consequence: t('evenement.pariEchoue', langue),
      manager: updatedManager,
      team,
    });
  }

  // ---- Mouvements d'effectif : un choix qui annonce une arrivée ou un départ
  // doit réellement la produire, sinon la récompense est offerte gratuitement.
  const squad = queryAll('SELECT * FROM players WHERE team_id = ?', [req.params.teamId]);
  let arrival = null;
  let departure = null;

  if (effects.remove_player) {
    // Garde-fou : on ne descend jamais sous les 11 joueurs, sinon la saison
    // devient injouable. Le marché échoue alors, sans contrepartie.
    if (squad.length <= 11) {
      saveDb();
      const mgr = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
      return res.json({
        success: false,
        consequence: t('evenement.effectifTropCourt', langue, { nombre: squad.length }),
        manager: mgr,
        team,
      });
    }
    departure = pickPlayerToRemove(squad, effects.remove_player);
  }

  if (effects.bench_player) {
    const target = pickPlayerToRemove(squad, effects.bench_player);
    if (target) {
      db.run('UPDATE players SET is_starter = 0, slot_index = NULL WHERE id = ?', [target.id]);
    }
  }

  // Faute de système de blessure, une indisponibilité est modélisée par une
  // chute de forme ciblée : sous 50 le moteur pénalise réellement le joueur,
  // et la récupération (+15 par journée sur le banc) fait office de convalescence.
  let drained = null;
  if (effects.drain_player) {
    drained = pickPlayerToRemove(squad, effects.drain_player.target || 'random');
    if (drained) {
      db.run('UPDATE players SET stamina = ? WHERE id = ?', [
        Math.max(0, Math.min(100, effects.drain_player.stamina ?? 0)),
        drained.id,
      ]);
    }
  }

  // Apply effects
  if (effects.budget) {
    const scaledBudget = effects.budget * divScale;
    db.run('UPDATE managers SET budget = MAX(0, budget + ?) WHERE id = ?', [scaledBudget, managerId]);
  }
  if (effects.morale) {
    db.run('UPDATE players SET morale = MAX(20, MIN(100, morale + ?)) WHERE team_id = ?', [effects.morale, req.params.teamId]);
  }
  if (effects.reputation) {
    db.run('UPDATE managers SET reputation = MAX(0, MIN(100, reputation + ?)) WHERE id = ?', [effects.reputation, managerId]);
  }
  if (effects.stamina_boost) {
    db.run('UPDATE players SET stamina = MAX(0, MIN(100, stamina + ?)) WHERE team_id = ?', [effects.stamina_boost, req.params.teamId]);
  }

  if (departure) {
    // Libère l'emplacement pour ne pas laisser un trou dans la composition.
    db.run('DELETE FROM players WHERE id = ?', [departure.id]);
  }

  if (effects.recruit_player) {
    const { createPlayerForTeam } = require('../data/playerGenerator');
    arrival = createPlayerForTeam(db, req.params.teamId, effects.recruit_player);
  }

  // Un événement qui remonte le moral apaise aussi immédiatement.
  refreshAppeasement(db, queryAll, req.params.teamId);

  saveDb();

  const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  const updatedTeam = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);

  // On enrichit la conséquence pour que le joueur voie concrètement l'effet.
  // Le texte de base vient de server/data/events.js, en français : il passe par
  // localiserConsequence, qui va chercher sa traduction par (eventId, choiceId).
  let consequence = localiserConsequence(eventId, choiceId, choice.consequence, langue);
  if (arrival) {
    consequence += ' ' + t('evenement.arrivee', langue, {
      prenom: arrival.first_name, nom: arrival.last_name,
      poste: arrival.position, niveau: arrival.overall, age: arrival.age,
    });
  }
  if (departure) {
    consequence += ' ' + t('evenement.depart', langue, {
      prenom: departure.first_name, nom: departure.last_name,
      poste: departure.position, niveau: departure.overall,
    });
  }
  if (drained) {
    consequence += ' ' + t('evenement.diminue', langue, {
      prenom: drained.first_name, nom: drained.last_name,
    });
  }

  res.json({
    success: true,
    consequence,
    arrival,
    departure,
    manager: updatedManager,
    team: updatedTeam,
  });
});

/** Sélectionne le joueur concerné par un départ ou une mise au banc. */
function pickPlayerToRemove(squad, criterion) {
  if (squad.length === 0) return null;
  const sorted = [...squad];
  switch (criterion) {
    case 'best':
    case 'captain':
      return sorted.sort((a, b) => b.overall - a.overall)[0];
    case 'worst':
      return sorted.sort((a, b) => a.overall - b.overall)[0];
    case 'oldest':
      return sorted.sort((a, b) => b.age - a.age)[0];
    case 'youngest':
      return sorted.sort((a, b) => a.age - b.age)[0];
    case 'starter': {
      const starters = sorted.filter(p => p.is_starter);
      const pool = starters.length ? starters : sorted;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    case 'random':
    default:
      return sorted[Math.floor(Math.random() * sorted.length)];
  }
}

/**
 * Only simulates matches between teams in the same division.
 */
function recordResult(db, teamId, scored, conceded) {
  if (scored > conceded) {
    db.run('UPDATE teams SET wins = wins + 1, points = points + 3, goals_for = goals_for + ?, goals_against = goals_against + ? WHERE id = ?', [scored, conceded, teamId]);
  } else if (scored === conceded) {
    db.run('UPDATE teams SET draws = draws + 1, points = points + 1, goals_for = goals_for + ?, goals_against = goals_against + ? WHERE id = ?', [scored, conceded, teamId]);
  } else {
    db.run('UPDATE teams SET losses = losses + 1, goals_for = goals_for + ?, goals_against = goals_against + ? WHERE id = ?', [scored, conceded, teamId]);
  }
}



/**
 * Management actions - costs scale with division level.
 * Division 1 (Regional 2) = cheap, Division 7 (Ligue 1) = expensive.
 */
function getManagementCosts(divisionLevel) {
  const scaleFactor = [1, 2.5, 5, 10, 20, 40, 70][divisionLevel - 1] || 1;
  return {
    training: 200000 * scaleFactor,      // 200k -> 14M
    cohesion: 150000 * scaleFactor,      // 150k -> 10.5M
    fitness: 500000 * scaleFactor,       // 500k -> 35M
    scout: 400000 * scaleFactor,         // 400k -> 28M
    medical: 600000 * scaleFactor,       // 600k -> 42M
  };
}

/**
 * Actions de gestion.
 *
 * Seules les données de jeu restent ici (identifiant, icône, cooldown) : les
 * textes vivent dans les dictionnaires et sont rattachés par `id`. Les garder
 * en dur aurait obligé à dupliquer la liste par langue, donc à maintenir les
 * cooldowns en double.
 */
const MANAGEMENT_ACTIONS = [
  { id: 'training', icon: '🏋️', cooldown: 3 },
  { id: 'cohesion', icon: '🤝', cooldown: 0 },
  { id: 'fitness', icon: '⚡', cooldown: 0 },
  { id: 'scout', icon: '🔍', cooldown: 0 },
  { id: 'medical', icon: '🏥', cooldown: 0 },
];

/** Action de gestion enrichie de ses textes, dans la langue demandée. */
function actionLocalisee(action, langue) {
  if (!action) return action;
  return {
    ...action,
    name: t(`gestion.${action.id}.nom`, langue),
    description: t(`gestion.${action.id}.description`, langue),
    effect: t(`gestion.${action.id}.effet`, langue),
  };
}

router.get('/:teamId/conversations', (req, res) => {
  const langue = langueDe(req);
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: t('erreur.equipeIntrouvable', langue) });

  // Conversations happen roughly once every 3 matchdays (~35% chance)
  if (Math.random() > 0.35) {
    return res.json({ conversation: null });
  }

  const { getRandomConversation, buildContext } = require('../data/conversations');
  const players = queryAll('SELECT * FROM players WHERE team_id = ?', [req.params.teamId]);
  if (players.length === 0) return res.json({ conversation: null });

  // Derniers résultats, du plus récent au plus ancien : alimente les dialogues
  // qui réagissent aux séries (spirale de défaites, dynamique de victoires...).
  const recent = queryAll(
    `SELECT home_team_id, home_goals, away_goals FROM matches
     WHERE (home_team_id = ? OR away_team_id = ?) AND played = 1
     ORDER BY season DESC, week DESC LIMIT 5`,
    [team.id, team.id]
  ).map(m => {
    const isHome = m.home_team_id === team.id;
    const scored = isHome ? m.home_goals : m.away_goals;
    const conceded = isHome ? m.away_goals : m.home_goals;
    return { outcome: scored > conceded ? 'win' : scored === conceded ? 'draw' : 'loss' };
  });

  const context = buildContext(team, players, recent);

  // Un joueur mécontent doit avoir la priorité pour venir s'expliquer : avec un
  // tirage purement aléatoire, les dialogues de départ ne sortaient jamais.
  const contrariés = players.filter(p => p.transfer_request || (p.unhappy_streak || 0) >= 2);
  const bassin = contrariés.length && Math.random() < 0.7 ? contrariés : players;
  const player = bassin[Math.floor(Math.random() * bassin.length)];

  const conversation = getRandomConversation(player, context);
  if (!conversation) return res.json({ conversation: null });

  // Traduction avant l'ajout du joueur : localiserDialogue ne connaît que les
  // champs du dialogue et recopierait tel quel ce qu'on aurait greffé dessus.
  const dialogue = localiserDialogue(conversation, langue);

  res.json({
    conversation: { ...dialogue, player: { id: player.id, first_name: player.first_name, last_name: player.last_name, position: player.position, overall: player.overall, morale: player.morale, stamina: player.stamina, age: player.age } },
  });
});

router.post('/:teamId/resolve-conversation', async (req, res) => {
  const langue = langueDe(req);
  const { conversationId, choiceId, playerId, managerId } = req.body;
  if (!conversationId || !choiceId || !playerId) {
    return res.status(400).json({ error: t('erreur.requis.conversationChoicePlayer', langue) });
  }

  const db = await getDb();
  const { CONVERSATIONS } = require('../data/conversations');
  const conv = CONVERSATIONS.find(c => c.id === conversationId);
  if (!conv) return res.status(404).json({ error: t('erreur.conversationIntrouvable', langue) });

  const choice = conv.choices.find(c => c.id === choiceId);
  if (!choice) return res.status(400).json({ error: t('erreur.choixInvalide', langue) });

  const effects = choice.effects || {};
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  const division = getTeamDivision(team);
  const divScale = [1, 2, 3, 5, 8, 15, 25][division - 1] || 1;

  // Apply effects to the specific player
  if (effects.morale) {
    db.run('UPDATE players SET morale = MAX(20, MIN(100, morale + ?)) WHERE id = ?', [effects.morale, playerId]);
  }

  // Un choix peut enterrer la procédure de départ. Sans cet effet, promettre
  // quoi que ce soit dans un dialogue n'aurait aucune portée réelle.
  if (effects.clear_discontent) {
    db.run('UPDATE players SET unhappy_streak = 0, transfer_request = 0 WHERE id = ?', [playerId]);
  }
  // À l'inverse, un choix peut précipiter le départ.
  if (effects.force_transfer) {
    db.run('UPDATE players SET transfer_request = 1, unhappy_streak = MAX(unhappy_streak, ?) WHERE id = ?',
      [DEPARTURE_THRESHOLD, playerId]);
  }
  if (effects.stamina) {
    db.run('UPDATE players SET stamina = MAX(0, MIN(100, stamina + ?)) WHERE id = ?', [effects.stamina, playerId]);
  }
  if (effects.overall) {
    db.run('UPDATE players SET overall = MIN(99, overall + ?) WHERE id = ?', [effects.overall, playerId]);
  }
  if (effects.budget && managerId) {
    const scaledBudget = effects.budget * divScale;
    db.run('UPDATE managers SET budget = MAX(0, budget + ?) WHERE id = ?', [scaledBudget, managerId]);
  }

  // Un moral remonté au vert doit apaiser sur-le-champ, sans attendre le
  // match suivant : sinon le dialogue paraît sans effet.
  const apaises = refreshAppeasement(db, queryAll, req.params.teamId);

  saveDb();

  const updatedPlayer = queryOne('SELECT * FROM players WHERE id = ?', [playerId]);
  const updatedManager = managerId ? queryOne('SELECT * FROM managers WHERE id = ?', [managerId]) : null;

  res.json({
    // Réplique du joueur : retrouvée par (conversationId, choiceId) dans la
    // traduction, la source française restant server/data/conversations.js.
    response: localiserReponse(conversationId, choiceId, choice.response, langue),
    effects,
    player: updatedPlayer,
    manager: updatedManager,
    appeased: apaises,
  });
});

router.get('/:teamId/management', (req, res) => {
  const langue = langueDe(req);
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: t('erreur.equipeIntrouvable', langue) });

  const division = getTeamDivision(team);
  const costs = getManagementCosts(division);
  const played = team.wins + team.draws + team.losses;

  // Check if training is on cooldown (stored in teams.last_training_matchday)
  const lastTraining = team.last_training_matchday || 0;
  const trainingAvailable = (played - lastTraining) >= 3;

  const actions = MANAGEMENT_ACTIONS.map(action => ({
    ...actionLocalisee(action, langue),
    cost: costs[action.id],
    available: action.id === 'training' ? trainingAvailable : true,
    cooldownRemaining: action.id === 'training' && !trainingAvailable ? 3 - (played - lastTraining) : 0,
  }));

  res.json({ actions, budget: null }); // budget comes from manager on client side
});

router.post('/:teamId/manage', async (req, res) => {
  const langue = langueDe(req);
  const { actionId, managerId } = req.body;
  if (!actionId || !managerId) return res.status(400).json({ error: t('erreur.requis.actionManager', langue) });

  const db = await getDb();
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: t('erreur.equipeIntrouvable', langue) });

  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  if (!manager) return res.status(404).json({ error: t('erreur.managerIntrouvable', langue) });

  const division = getTeamDivision(team);
  const costs = getManagementCosts(division);
  const cost = costs[actionId];
  if (!cost) return res.status(400).json({ error: t('erreur.actionInvalide', langue) });

  if (manager.budget < cost) {
    return res.status(400).json({ error: t('erreur.budgetInsuffisant', langue) });
  }

  const played = team.wins + team.draws + team.losses;

  // Training cooldown check
  if (actionId === 'training') {
    const lastTraining = team.last_training_matchday || 0;
    if ((played - lastTraining) < 3) {
      return res.status(400).json({ error: t('erreur.entrainementCooldown', langue) });
    }
  }

  // Deduct cost
  db.run('UPDATE managers SET budget = budget - ? WHERE id = ?', [cost, managerId]);

  // Apply effect
  switch (actionId) {
    case 'training':
      db.run('UPDATE players SET overall = MIN(99, overall + 1) WHERE team_id = ? AND is_starter = 1', [req.params.teamId]);
      // Store last training matchday - use a column if available, otherwise we add it
      try {
        db.run('UPDATE teams SET last_training_matchday = ? WHERE id = ?', [played, req.params.teamId]);
      } catch (e) {
        // Column might not exist yet, try to add it
        try {
          db.run('ALTER TABLE teams ADD COLUMN last_training_matchday INTEGER DEFAULT 0');
          db.run('UPDATE teams SET last_training_matchday = ? WHERE id = ?', [played, req.params.teamId]);
        } catch (e2) {
          // Already exists, just update
          db.run('UPDATE teams SET last_training_matchday = ? WHERE id = ?', [played, req.params.teamId]);
        }
      }
      break;
    case 'cohesion':
      db.run('UPDATE players SET morale = MIN(100, morale + 10) WHERE team_id = ?', [req.params.teamId]);
      break;
    case 'fitness':
      db.run('UPDATE players SET stamina = MIN(100, stamina + 30) WHERE team_id = ?', [req.params.teamId]);
      break;
    case 'scout':
      db.run('UPDATE managers SET reputation = MIN(100, reputation + 3) WHERE id = ?', [managerId]);
      break;
    case 'medical':
      db.run('UPDATE players SET stamina = 100 WHERE team_id = ? AND stamina < 50', [req.params.teamId]);
      break;
    default:
      return res.status(400).json({ error: t('erreur.actionInconnue', langue) });
  }

  // Une action qui remonte le moral (cohésion) doit apaiser immédiatement.
  const apaisesAction = refreshAppeasement(db, queryAll, req.params.teamId);

  saveDb();

  const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  const updatedTeam = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);

  res.json({
    success: true,
    action: actionLocalisee(MANAGEMENT_ACTIONS.find(a => a.id === actionId), langue),
    cost,
    manager: updatedManager,
    team: updatedTeam,
    appeased: apaisesAction,
  });
});

/**
 * Copie d'un sponsor dont le nom et la description sont traduits.
 *
 * `id`, `payment`, `bonus` et `malus` sont inchangés : c'est l'`id` que le
 * client renvoie pour signer, et lui seul est utilisé côté serveur.
 */
function sponsorLocalise(sponsor, langue) {
  if (!sponsor) return sponsor;
  return {
    ...sponsor,
    name: localiserDonnee('sponsors', sponsor.name, langue),
    description: localiserDonnee('sponsorDescriptions', sponsor.description, langue),
  };
}

router.get('/:teamId/sponsors', (req, res) => {
  const langue = langueDe(req);
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: t('erreur.equipeIntrouvable', langue) });
  const division = getTeamDivision(team);
  const sponsors = getRandomSponsors(division, 4);
  res.json(sponsors.map(s => sponsorLocalise(s, langue)));
});

router.post('/:teamId/choose-sponsor', async (req, res) => {
  const langue = langueDe(req);
  const { sponsorId, managerId } = req.body;
  if (!sponsorId || !managerId) return res.status(400).json({ error: t('erreur.requis.sponsorManager', langue) });

  const db = await getDb();
  const { SPONSORS_BY_TIER } = require('../data/sponsors');
  const allSponsors = Object.values(SPONSORS_BY_TIER).flat();
  const sponsor = allSponsors.find(s => s.id === sponsorId);
  if (!sponsor) return res.status(404).json({ error: t('erreur.sponsorIntrouvable', langue) });

  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);

  db.run('UPDATE managers SET budget = budget + ? WHERE id = ?', [sponsor.payment, managerId]);

  let newReputation = (manager.reputation || 50) + (sponsor.bonus.reputation || 0) + (sponsor.malus.reputation || 0);
  newReputation = Math.max(0, Math.min(100, newReputation));
  db.run('UPDATE managers SET reputation = ? WHERE id = ?', [newReputation, managerId]);

  const moraleChange = (sponsor.bonus.morale || 0) + (sponsor.malus.morale || 0);
  if (moraleChange !== 0) {
    db.run('UPDATE players SET morale = MAX(20, MIN(100, morale + ?)) WHERE team_id = ?', [moraleChange, req.params.teamId]);
  }

  if (sponsor.bonus.stamina_boost) {
    db.run('UPDATE players SET stamina = MIN(100, stamina + ?) WHERE team_id = ?', [sponsor.bonus.stamina_boost, req.params.teamId]);
  }

  saveDb();

  const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  res.json({ sponsor: sponsorLocalise(sponsor, langue), newBudget: updatedManager.budget, newReputation: updatedManager.reputation });
});

router.post('/:teamId/end-season', async (req, res) => {
  const langue = langueDe(req);
  const { managerId } = req.body;
  const db = await getDb();
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: t('erreur.equipeIntrouvable', langue) });

  const division = getTeamDivision(team);
  const divisionInfo = getDivisionInfo(division);

  // Classement de cette sauvegarde uniquement.
  const standings = computeStandings(req.params.teamId);
  const rank = standings.findIndex(t => t.id === req.params.teamId) + 1;
  const totalTeams = standings.length;

  // Determine promotion/relegation
  let promotion = false;
  let relegation = false;
  let newDivision = division;

  // Top 2 = promoted (if not already in Ligue 1)
  if (rank <= 2 && division < 7) {
    promotion = true;
    newDivision = division + 1;
  }
  // Bottom 2 = relegated (if not already in Regional 2)
  else if (rank > totalTeams - 2 && division > 1) {
    relegation = true;
    newDivision = division - 1;
  }

  // Prize money based on rank within division
  const prizes = divisionInfo.prizePool || [50000, 30000, 20000, 15000, 10000];
  let prizePool = 0;
  if (rank <= prizes.length) {
    prizePool = prizes[rank - 1];
  } else {
    prizePool = Math.max(5000, prizes[prizes.length - 1] - (rank - prizes.length) * 5000);
  }

  // Promotion bonus: significant reward for moving up
  let promotionBonus = 0;
  if (promotion) {
    const bonusByNewDiv = [0, 500000, 2000000, 5000000, 10000000, 20000000, 50000000];
    promotionBonus = bonusByNewDiv[newDivision - 1] || 5000000;
    prizePool += promotionBonus;
  }

  db.run('UPDATE managers SET budget = budget + ? WHERE id = ?', [prizePool, managerId]);

  const newSeason = team.season + 1;

  // Update player team: new season, new division, reset stats
  db.run('UPDATE teams SET season = ?, division = ?, points = 0, wins = 0, draws = 0, losses = 0, goals_for = 0, goals_against = 0 WHERE id = ?',
    [newSeason, newDivision, req.params.teamId]);

  // Les équipes IA ne changent plus de division en fin de saison.
  //
  // Ce déplacement était global : il s'appliquait à la base entière alors qu'il
  // ne concernait qu'une sauvegarde. Deux conséquences, toutes deux visibles
  // dans le classement. D'une part la division du joueur perdait 4 équipes par
  // saison sans qu'aucune n'arrive, jusqu'à des championnats à 17 équipes.
  // D'autre part, terminer une saison réorganisait la division des autres
  // parties en cours.
  //
  // Chaque sauvegarde a désormais son propre championnat, calculé par
  // computeStandings ; les effectifs des divisions restent donc fixes.

  // Make sure the new division has enough AI teams (seed if needed)
  const aiInNewDiv = queryAll("SELECT id FROM teams WHERE manager_id = 'AI' AND division = ?", [newDivision]);
  if (aiInNewDiv.length < 10) {
    // Remove teams that are too few and reseed
    for (const ai of aiInNewDiv) {
      db.run('DELETE FROM players WHERE team_id = ?', [ai.id]);
      db.run('DELETE FROM teams WHERE id = ?', [ai.id]);
    }
    saveDb();
    const diff = req.body.difficulty || 'normal';
    await seedDivision(newDivision, diff);
  } else {
    // Reset their stats for new season
    db.run("UPDATE teams SET points = 0, wins = 0, draws = 0, losses = 0, goals_for = 0, goals_against = 0 WHERE manager_id = 'AI' AND division = ?", [newDivision]);
  }

  // ---- Bilan individuel AVANT remise à zéro des compteurs ----
  const scorers = queryAll(
    'SELECT first_name, last_name, goals, appearances FROM players WHERE team_id = ? AND goals > 0 ORDER BY goals DESC, appearances ASC LIMIT 5',
    [req.params.teamId]
  );
  const topScorer = scorers[0] || null;

  // ---- Coupe : résultat puis remise à zéro ----
  const cupState = team.cup_data ? (() => { try { return JSON.parse(team.cup_data); } catch { return null; } })() : null;
  const cupResult = describeCupResult(cupState);
  if (cupState && cupState.won) {
    // Le compteur de coupes est déjà incrémenté à la victoire, rien à faire ici.
  }
  db.run('UPDATE teams SET cup_data = NULL WHERE id = ?', [req.params.teamId]);

  // Titre de champion
  if (rank === 1) {
    db.run('UPDATE teams SET titles = COALESCE(titles, 0) + 1 WHERE id = ?', [req.params.teamId]);
  }

  // ---- Historique : sans lui, la carrière n'a aucune mémoire ----
  db.run(
    `INSERT INTO season_history
       (id, team_id, season, division, division_name, rank, points, wins, draws, losses,
        goals_for, goals_against, promoted, relegated, cup_result, top_scorer, top_scorer_goals)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [uuid(), req.params.teamId, team.season, division, divisionInfo.name, rank,
     team.points, team.wins, team.draws, team.losses, team.goals_for, team.goals_against,
     promotion ? 1 : 0, relegation ? 1 : 0, cupResult,
     topScorer ? `${topScorer.first_name} ${topScorer.last_name}` : null,
     topScorer ? topScorer.goals : 0]
  );

  // Reset Champions League state for new season
  db.run('UPDATE teams SET cl_data = NULL WHERE id = ?', [req.params.teamId]);

  // ---- Intersaison de l'effectif du joueur ----
  // Les mécontents partent AVANT la progression : inutile de faire évoluer
  // un joueur qui quitte le club.
  const departures = resolveDepartures(db, queryAll, queryOne, req.params.teamId, managerId, {
    matchday: team.wins + team.draws + team.losses,
    division,
    difficulty: req.body.difficulty || 'normal',
  });

  // Progression selon l'âge et le temps de jeu, puis départs des plus âgés.
  const progression = evolveSquad(db, queryAll, req.params.teamId, 26);
  const retirements = retireOldPlayers(db, queryAll, req.params.teamId, { minSquad: 14 });

  db.run('UPDATE players SET stamina = 100, morale = 80 WHERE team_id = ?', [req.params.teamId]);
  resetSeasonStats(db, req.params.teamId);
  resetDiscontent(db, req.params.teamId);

  // ---- Mercato des équipes IA : le championnat doit vivre ----
  const aiTeams = queryAll("SELECT id, division FROM teams WHERE manager_id = 'AI'");
  for (const ai of aiTeams) {
    const info = getDivisionInfo(ai.division || 1);
    const range = info && info.overallRange ? info.overallRange : [50, 60];
    try {
      runAiTransferWindow(db, queryAll, queryOne, ai.id, range, { targetSquad: 18 });
    } catch (e) {
      // Une équipe IA en échec ne doit pas bloquer la fin de saison du joueur.
    }
  }

  saveDb();

  const newDivisionInfo = getDivisionInfo(newDivision);
  const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  const updatedTeam = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  const history = queryAll('SELECT * FROM season_history WHERE team_id = ? ORDER BY season DESC', [req.params.teamId]);

  res.json({
    seasonSummary: {
      season: team.season,
      rank,
      points: team.points,
      wins: team.wins,
      draws: team.draws,
      losses: team.losses,
      prizePool,
      // Les noms de division et le bilan de coupe sont traduits ICI seulement :
      // les mêmes valeurs, en français, viennent d'être écrites dans
      // season_history (division_name, cup_result) et y restent la référence.
      divisionName: nomDivision(divisionInfo, langue),
      cupResult: libelleCoupe(cupState, langue),
      topScorer: topScorer ? `${topScorer.first_name} ${topScorer.last_name}` : null,
      topScorerGoals: topScorer ? topScorer.goals : 0,
      scorers,
      progression: progression.slice(0, 8),
      retirements,
      departures: departures.map(d => ({ ...d, reasons: traduireMotifs(d.reasons, langue) })),
    },
    promotion,
    relegation,
    newDivision: nomDivision(newDivisionInfo, langue),
    newDivisionLevel: newDivision,
    manager: updatedManager,
    team: updatedTeam,
    history,
  });
});

/** Historique des saisons passées, pour le palmarès. */
router.get('/:teamId/history', (req, res) => {
  const history = queryAll('SELECT * FROM season_history WHERE team_id = ? ORDER BY season DESC', [req.params.teamId]);
  const team = queryOne('SELECT titles, cups FROM teams WHERE id = ?', [req.params.teamId]);
  res.json({ history, titles: team ? team.titles || 0 : 0, cups: team ? team.cups || 0 : 0 });
});

/** Statistiques individuelles de la saison en cours. */
router.get('/:teamId/stats', (req, res) => {
  const players = queryAll(
    `SELECT id, first_name, last_name, position, overall, appearances, goals,
            yellow_cards, red_cards, suspended_matches, injured_matches,
            career_appearances, career_goals, morale, unhappy_streak, transfer_request
     FROM players WHERE team_id = ?
     ORDER BY goals DESC, appearances ASC`,
    [req.params.teamId]
  );
  res.json({ players });
});

/** Joueurs mécontents, pour que le manager puisse réagir avant les départs. */
router.get('/:teamId/mood', (req, res) => {
  const langue = langueDe(req);
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [req.params.teamId]);
  if (!team) return res.status(404).json({ error: t('erreur.equipeIntrouvable', langue) });

  const matchday = team.wins + team.draws + team.losses;
  const division = getTeamDivision(team);
  const players = queryAll('SELECT * FROM players WHERE team_id = ?', [req.params.teamId]);
  // Même contexte qu'au moment de l'évaluation, sinon les griefs affichés
  // ne correspondent pas à ceux qui ont fait monter le compteur.
  const ctx = { matchday, division, squadMedianOverall: squadMedian(players) };

  const unhappy = players
    .map(p => {
      const mood = moodLabel(p);
      if (!mood) return null;
      const reasons = grievances(p, ctx);
      return {
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        position: p.position,
        overall: p.overall,
        morale: p.morale,
        streak: p.unhappy_streak || 0,
        transferRequest: !!p.transfer_request,
        // Un joueur peut avoir un compteur en cours alors que son grief vient de
        // se résorber : on affiche alors un motif générique plutôt que rien.
        reasons: traduireMotifs(reasons.length ? reasons : ['insatisfaction persistante'], langue),
        matchesBeforeLeaving: Math.max(0, DEPARTURE_THRESHOLD - (p.unhappy_streak || 0)),
        ...mood,
        // `mood.level` reste l'identifiant technique ('leaving', 'unhappy',
        // 'low') dont le client dérive sa mise en forme ; seul `label` est
        // traduit, et il doit l'être APRÈS l'étalement de `mood`.
        label: t(`moral.etat.${mood.level}`, langue),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.streak - a.streak);

  res.json({
    unhappy,
    requestThreshold: REQUEST_THRESHOLD,
    departureThreshold: DEPARTURE_THRESHOLD,
  });
});

module.exports = router;
