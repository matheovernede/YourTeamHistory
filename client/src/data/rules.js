/**
 * Règles d'effectif — miroir de server/data/rules.js.
 * Toute modification doit être répercutée des deux côtés.
 */

/** Effectif maximum : au-delà, tout recrutement est refusé. */
export const SQUAD_MAX = 35;

/** Effectif minimum pour qu'une vente soit acceptée par le serveur. */
export const SQUAD_MIN_SELL = 15;

/** Titulaires requis pour disputer un match. */
export const STARTERS_REQUIRED = 11;

/** Seuil à partir duquel l'interface invite à dégraisser. */
export const SQUAD_WARN = 20;

/** Regroupement des postes par ligne, aligné sur formations.js. */
export const LINE_POSITIONS = {
  GAR: ['GAR'],
  DEF: ['DC', 'ARG', 'ARD', 'PG', 'PD'],
  MIL: ['MC', 'MOC', 'MDF', 'MG', 'MD'],
  ATT: ['BU', 'AIG', 'AID'],
};

/** Compte les joueurs par ligne. */
export function countByLine(players) {
  const counts = { GAR: 0, DEF: 0, MIL: 0, ATT: 0 };
  for (const p of players) {
    for (const [line, list] of Object.entries(LINE_POSITIONS)) {
      if (list.includes(p.position)) { counts[line]++; break; }
    }
  }
  return counts;
}

/**
 * Effectif conseillé par ligne pour disputer une saison sereinement
 * (un onze + de la rotation).
 */
export const RECOMMENDED = { GAR: 2, DEF: 6, MIL: 6, ATT: 4 };
