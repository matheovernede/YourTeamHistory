/**
 * Règles chiffrées de gestion d'effectif, centralisées ici.
 *
 * Ces valeurs étaient auparavant recopiées dans draft.js et transfer.js, ce qui
 * rendait tout ajustement risqué. Le client garde sa propre copie dans
 * client/src/pages/Season.jsx (SQUAD_MAX / SQUAD_MIN_SELL / SQUAD_WARN) :
 * toute modification ici doit y être répercutée.
 */

/** Effectif maximum : au-delà, tout recrutement est refusé. */
const SQUAD_MAX = 35;

/**
 * Effectif minimum pour pouvoir vendre. La vente est refusée si l'effectif
 * est INFÉRIEUR OU ÉGAL à cette valeur — il faut donc SQUAD_MIN_SELL + 1
 * joueurs pour vendre.
 */
const SQUAD_MIN_TO_SELL = 14;

/** Titulaires requis pour disputer un match. */
const STARTERS_REQUIRED = 11;

/** Seuil à partir duquel l'interface invite à dégraisser. */
const SQUAD_WARN = 20;

module.exports = {
  SQUAD_MAX,
  SQUAD_MIN_TO_SELL,
  STARTERS_REQUIRED,
  SQUAD_WARN,
};
