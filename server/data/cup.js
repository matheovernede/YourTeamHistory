/**
 * Coupe nationale — élimination directe, en parallèle du championnat.
 *
 * Contrairement à la Champions League réservée à l'élite, la coupe est ouverte
 * à toutes les divisions : c'est là que l'intérêt réside, un club de Régional 2
 * pouvant affronter un club professionnel.
 *
 * L'état tient dans une colonne texte (teams.cup_data), comme la Champions
 * League : pas de table dédiée, la compétition est propre à chaque équipe.
 */

const ROUNDS = [
  { id: 'r64', name: '64es de finale', minMatchday: 3 },
  { id: 'r32', name: '32es de finale', minMatchday: 6 },
  { id: 'r16', name: '16es de finale', minMatchday: 10 },
  { id: 'r8', name: 'Huitièmes de finale', minMatchday: 13 },
  { id: 'qf', name: 'Quarts de finale', minMatchday: 16 },
  { id: 'sf', name: 'Demi-finales', minMatchday: 19 },
  { id: 'final', name: 'Finale', minMatchday: 23 },
];

/** Dotation par tour atteint, mise à l'échelle de la division. */
const ROUND_PRIZE = {
  r64: 20000, r32: 45000, r16: 90000,
  r8: 180000, qf: 350000, sf: 700000, final: 1500000,
};
const WINNER_BONUS = 2500000;

const CLUB_PREFIXES = ['FC', 'AS', 'US', 'SC', 'RC', 'Stade', 'Olympique', 'Sporting', 'Union', 'Racing'];
const CLUB_CITIES = [
  'Beauvais', 'Chartres', 'Vannes', 'Épinal', 'Chambly', 'Bastia', 'Cholet', 'Concarneau',
  'Rumilly', 'Sedan', 'Hyères', 'Martigues', 'Fréjus', 'Bergerac', 'Poissy', 'Villefranche',
  'Le Puy', 'Sète', 'Aubagne', 'Marignane', 'Romorantin', 'Blois', 'Lorient', 'Nîmes',
  'Guingamp', 'Laval', 'Rodez', 'Amiens', 'Pau', 'Quevilly', 'Annecy', 'Grenoble',
];

function randomClubName(rng = Math.random) {
  const prefix = CLUB_PREFIXES[Math.floor(rng() * CLUB_PREFIXES.length)];
  const city = CLUB_CITIES[Math.floor(rng() * CLUB_CITIES.length)];
  return `${prefix} ${city}`;
}

/**
 * Tire un nom de club en évitant une liste d'exclusions.
 *
 * Nécessaire pour deux raisons : sans cela on pouvait affronter deux fois le
 * même club dans un même parcours (6,4 % des cas mesurés), et l'adversaire
 * pouvait porter le nom d'une équipe du championnat, voire celui du club du
 * joueur.
 */
function uniqueClubName(exclude = [], rng = Math.random) {
  const interdits = new Set(exclude.filter(Boolean).map(n => n.toLowerCase()));

  // Le nombre de combinaisons dépasse largement les exclusions possibles ;
  // la boucle bornée protège malgré tout d'un cas pathologique.
  for (let i = 0; i < 200; i++) {
    const nom = randomClubName(rng);
    if (!interdits.has(nom.toLowerCase())) return nom;
  }

  // Repli déterministe : on parcourt toutes les combinaisons dans l'ordre.
  for (const prefix of CLUB_PREFIXES) {
    for (const city of CLUB_CITIES) {
      const nom = `${prefix} ${city}`;
      if (!interdits.has(nom.toLowerCase())) return nom;
    }
  }
  return randomClubName(rng); // toutes prises : cas théorique
}

/** Noms déjà rencontrés au cours d'un parcours de coupe. */
function metOpponents(state) {
  if (!state) return [];
  const noms = (state.history || []).map(h => h.opponent);
  if (state.nextOpponent) noms.push(state.nextOpponent.name);
  return noms;
}

/**
 * Niveau de l'adversaire pour un tour donné.
 * Plus la compétition avance, plus les clubs rencontrés sont relevés : un club
 * amateur peut tomber sur un professionnel en fin de parcours.
 */
function opponentOverallForRound(roundId, playerDivision) {
  const base = [46, 52, 58, 64, 70, 76, 82];
  const idx = ROUNDS.findIndex(r => r.id === roundId);
  const roundBase = base[idx >= 0 ? idx : 0];

  // L'adversaire suit aussi le niveau du club : rester réaliste sans être injouable.
  const divisionFloor = 42 + (playerDivision - 1) * 6;
  const level = Math.max(roundBase, divisionFloor) + Math.floor(Math.random() * 7) - 3;
  return Math.max(40, Math.min(88, level));
}

/**
 * Crée l'état initial de la coupe pour une saison.
 * @param {string[]} exclude noms à ne jamais tirer (club du joueur, équipes du championnat)
 */
function createCupState(playerDivision, exclude = []) {
  return {
    roundIndex: 0,
    eliminated: false,
    won: false,
    history: [],
    excluded: exclude,
    nextOpponent: {
      name: uniqueClubName(exclude),
      overall: opponentOverallForRound(ROUNDS[0].id, playerDivision),
    },
  };
}

function getRound(state) {
  return ROUNDS[state.roundIndex] || null;
}

/** Le tour est-il jouable à cette journée de championnat ? */
function isRoundAvailable(state, matchday) {
  if (!state || state.eliminated || state.won) return false;
  const round = getRound(state);
  return !!round && matchday >= round.minMatchday;
}

/**
 * Fait avancer la coupe après un match.
 * @returns le nouvel état, enrichi du résultat du tour
 */
function advance(state, playerWon, playerDivision, score) {
  const round = getRound(state);
  if (!round) return state;

  const entry = {
    round: round.id,
    roundName: round.name,
    opponent: state.nextOpponent ? state.nextOpponent.name : 'Inconnu',
    score,
    won: playerWon,
  };
  const history = [...state.history, entry];

  if (!playerWon) {
    return { ...state, eliminated: true, history, nextOpponent: null };
  }

  const nextIndex = state.roundIndex + 1;
  if (nextIndex >= ROUNDS.length) {
    return { ...state, won: true, history, nextOpponent: null };
  }

  // On exclut les clubs déjà rencontrés dans ce parcours, en plus des
  // exclusions permanentes (club du joueur, équipes du championnat).
  const exclusions = [...(state.excluded || []), ...history.map(h => h.opponent)];

  return {
    ...state,
    roundIndex: nextIndex,
    history,
    nextOpponent: {
      name: uniqueClubName(exclusions),
      overall: opponentOverallForRound(ROUNDS[nextIndex].id, playerDivision),
    },
  };
}

/** Dotation obtenue pour avoir disputé ce tour. */
function prizeForRound(roundId) {
  return ROUND_PRIZE[roundId] || 0;
}

/** Libellé du parcours, pour l'historique de saison. */
function describeResult(state) {
  if (!state) return 'Non disputée';
  if (state.won) return 'Vainqueur';
  if (!state.eliminated) {
    const r = getRound(state);
    return r ? `En lice (${r.name})` : 'En lice';
  }
  const last = state.history[state.history.length - 1];
  return last ? `Éliminé en ${last.roundName.toLowerCase()}` : 'Éliminé';
}

module.exports = {
  ROUNDS,
  ROUND_PRIZE,
  WINNER_BONUS,
  createCupState,
  getRound,
  isRoundAvailable,
  advance,
  prizeForRound,
  describeResult,
  opponentOverallForRound,
  randomClubName,
  uniqueClubName,
  metOpponents,
};
