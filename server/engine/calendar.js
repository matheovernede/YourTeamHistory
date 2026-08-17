/**
 * Calendrier de championnat.
 *
 * Jusqu'ici la journée était tirée au sort : l'adversaire du joueur au hasard,
 * puis les équipes IA appariées aléatoirement. Résultat, une équipe pouvait
 * jouer trois fois quand une autre n'avait pas encore joué, et le classement
 * comparait des équipes n'ayant pas disputé le même nombre de matchs.
 *
 * On génère désormais un vrai calendrier aller-retour par la méthode du
 * carrousel (ronde de Berger) : à chaque journée, toutes les équipes jouent
 * une fois et une seule, et chacune affronte toutes les autres deux fois —
 * une fois à domicile, une fois à l'extérieur.
 *
 * Le calendrier est déterministe : il découle d'une graine (saison + division),
 * donc inutile de le stocker en base. La même saison redonne toujours les
 * mêmes affiches, y compris après un redémarrage du serveur.
 */

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Transforme une chaîne de graine en entier. */
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mélange déterministe (Fisher-Yates piloté par la graine). */
function seededShuffle(items, rand) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Championnat aller simple : n-1 journées, chaque équipe joue une fois par
 * journée. Si le nombre d'équipes est impair, une place est laissée vacante
 * et l'équipe qui tombe dessus est exempte ce jour-là.
 */
function singleRoundRobin(teamIds) {
  const list = [...teamIds];
  if (list.length % 2 === 1) list.push(null); // place vacante = journée de repos

  const n = list.length;
  const fixed = list[0];
  const rotating = list.slice(1);
  const rounds = [];

  for (let r = 0; r < n - 1; r++) {
    const rot = rotating.slice(r).concat(rotating.slice(0, r));
    const round = [];

    // L'équipe fixe alterne domicile et extérieur pour ne pas être
    // systématiquement d'un côté du terrain.
    round.push(r % 2 === 0 ? [fixed, rot[0]] : [rot[0], fixed]);

    for (let i = 1; i < n / 2; i++) {
      round.push([rot[i], rot[n - 1 - i]]);
    }

    rounds.push(round.filter(([h, a]) => h !== null && a !== null));
  }

  return rounds;
}

/**
 * Calendrier complet aller-retour.
 * @param {string[]} teamIds  identifiants des équipes de la division
 * @param {string}   seed     graine (ex. "3-2" pour saison 3, division 2)
 * @returns {Array<Array<[string,string]>>} journées, chacune = liste d'affiches
 */
function buildSeasonFixtures(teamIds, seed) {
  const unique = [...new Set(teamIds)].filter(Boolean);
  if (unique.length < 2) return [];

  // On trie avant de mélanger : l'ordre d'arrivée depuis la base ne doit pas
  // influer sur le calendrier, seule la graine le détermine.
  const rand = mulberry32(hashSeed(seed));
  const ordered = seededShuffle([...unique].sort(), rand);

  const aller = singleRoundRobin(ordered);
  // Le retour reprend les mêmes affiches en inversant les terrains.
  const retour = aller.map((round) => round.map(([h, a]) => [a, h]));

  return [...aller, ...retour];
}

/**
 * Affiches d'une journée donnée.
 * @param {number} week  numéro de journée, à partir de 1
 */
function fixturesForWeek(teamIds, seed, week) {
  const fixtures = buildSeasonFixtures(teamIds, seed);
  if (fixtures.length === 0) return [];
  // Si la saison compte plus de journées que le calendrier (division
  // incomplète), on repart au début plutôt que de ne rien renvoyer.
  const index = (Math.max(1, week) - 1) % fixtures.length;
  return fixtures[index];
}

/**
 * Trouve l'affiche d'une équipe pour une journée.
 * @returns {{opponentId: string, isHome: boolean}|null} null si l'équipe est exempte
 */
function findFixture(teamIds, seed, week, teamId) {
  const round = fixturesForWeek(teamIds, seed, week);
  for (const [home, away] of round) {
    if (home === teamId) return { opponentId: away, isHome: true };
    if (away === teamId) return { opponentId: home, isHome: false };
  }
  return null;
}

/**
 * Graine du championnat d'une sauvegarde.
 *
 * Elle inclut l'identifiant de l'équipe du joueur : chaque partie a donc son
 * propre calendrier et son propre championnat, même si deux joueurs évoluent
 * dans la même division avec les mêmes adversaires.
 */
function seedFor(teamId, season, division) {
  return `${teamId}-${season}-${division}`;
}

module.exports = {
  buildSeasonFixtures,
  fixturesForWeek,
  findFixture,
  singleRoundRobin,
  seedFor,
  mulberry32,
  hashSeed,
};
