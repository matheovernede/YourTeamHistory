/**
 * Source de vérité des formations et de la taxonomie des postes (côté serveur).
 *
 * IMPORTANT : l'ORDRE des postes de chaque formation doit rester strictement
 * identique à celui de client/src/data/formations.js, car le client envoie la
 * composition sous forme d'un tableau de 11 identifiants indexé par slot.
 * Toute modification ici doit être répercutée côté client (et inversement).
 */

const FORMATIONS = {
  '4-4-2':   ['GAR', 'ARG', 'DC', 'DC', 'ARD', 'MG', 'MC', 'MC', 'MD', 'BU', 'BU'],
  '4-3-3':   ['GAR', 'ARG', 'DC', 'DC', 'ARD', 'MC', 'MC', 'MC', 'AIG', 'BU', 'AID'],
  '3-5-2':   ['GAR', 'DC', 'DC', 'DC', 'MG', 'MC', 'MC', 'MC', 'MD', 'BU', 'BU'],
  '4-2-3-1': ['GAR', 'ARG', 'DC', 'DC', 'ARD', 'MDF', 'MDF', 'AIG', 'MOC', 'AID', 'BU'],
  '5-3-2':   ['GAR', 'PG', 'DC', 'DC', 'DC', 'PD', 'MC', 'MC', 'MC', 'BU', 'BU'],
  '3-4-3':   ['GAR', 'DC', 'DC', 'DC', 'MG', 'MC', 'MC', 'MD', 'AIG', 'BU', 'AID'],
  '4-1-4-1': ['GAR', 'ARG', 'DC', 'DC', 'ARD', 'MDF', 'MG', 'MC', 'MC', 'MD', 'BU'],
};

const DEFAULT_FORMATION = '4-4-2';

const GK_POSITIONS  = ['GAR'];
const DEF_POSITIONS = ['DC', 'ARG', 'ARD', 'PG', 'PD'];
const MID_POSITIONS = ['MC', 'MOC', 'MDF', 'MG', 'MD'];
const ATT_POSITIONS = ['BU', 'AIG', 'AID'];

const ALL_POSITIONS = [...GK_POSITIONS, ...DEF_POSITIONS, ...MID_POSITIONS, ...ATT_POSITIONS];

function getPositionGroup(pos) {
  if (GK_POSITIONS.includes(pos)) return 'gk';
  if (DEF_POSITIONS.includes(pos)) return 'def';
  if (MID_POSITIONS.includes(pos)) return 'mid';
  if (ATT_POSITIONS.includes(pos)) return 'att';
  return 'att';
}

function getFormationSlots(formation) {
  return FORMATIONS[formation] || FORMATIONS[DEFAULT_FORMATION];
}

function isValidFormation(formation) {
  return Object.prototype.hasOwnProperty.call(FORMATIONS, formation);
}

/**
 * Coefficient d'adéquation d'un joueur à un poste donné.
 *
 * Règle : un joueur est pleinement à l'aise partout dans SA LIGNE. Un buteur
 * vaut un ailier, un défenseur central vaut un latéral, un milieu défensif vaut
 * un meneur. La pénalité n'apparaît qu'en changeant de ligne.
 *
 * 0 (même ligne) = 1.00  |  1 (ligne voisine) = 0.78
 * 2 (deux lignes) = 0.64 |  3 = 0.50
 */
const GROUP_DISTANCE = {
  gk:  { gk: 0, def: 1, mid: 2, att: 3 },
  def: { gk: 1, def: 0, mid: 1, att: 2 },
  mid: { gk: 2, def: 1, mid: 0, att: 1 },
  att: { gk: 3, def: 2, mid: 1, att: 0 },
};

const DISTANCE_FIT = { 0: 1, 1: 0.78, 2: 0.64, 3: 0.5 };

function getPositionFit(playerPos, slotPos) {
  if (!slotPos) return 1;
  if (playerPos === slotPos) return 1;

  const playerGroup = getPositionGroup(playerPos);
  const slotGroup = getPositionGroup(slotPos);

  // Un joueur de champ dans les buts (ou un gardien sur le terrain) est très pénalisé.
  if (playerGroup === 'gk' && slotGroup !== 'gk') return 0.45;
  if (slotGroup === 'gk' && playerGroup !== 'gk') return 0.4;

  const distance = GROUP_DISTANCE[playerGroup][slotGroup];
  return DISTANCE_FIT[distance] ?? 0.6;
}

/**
 * Pondération des lignes induite par la formation.
 * Empiler les défenseurs solidifie le bloc mais assèche l'attaque, et inversement.
 */
function getFormationWeights(formation) {
  const slots = getFormationSlots(formation);
  let def = 0, mid = 0, att = 0;

  for (const pos of slots) {
    const group = getPositionGroup(pos);
    if (group === 'def') def++;
    else if (group === 'mid') mid++;
    else if (group === 'att') att++;
  }

  // Référence : 4 défenseurs, 4 milieux, 2 attaquants (le 4-4-2).
  // Les coefficients sont volontairement marqués pour que le choix tactique
  // soit perceptible sur une saison, sans écraser la qualité des joueurs.
  return {
    defense:  1 + (def - 4) * 0.09,
    midfield: 1 + (mid - 4) * 0.09,
    attack:   1 + (att - 2) * 0.10,
    counts: { def, mid, att },
  };
}

module.exports = {
  FORMATIONS,
  DEFAULT_FORMATION,
  ALL_POSITIONS,
  GK_POSITIONS,
  DEF_POSITIONS,
  MID_POSITIONS,
  ATT_POSITIONS,
  getPositionGroup,
  getFormationSlots,
  isValidFormation,
  getPositionFit,
  getFormationWeights,
};
