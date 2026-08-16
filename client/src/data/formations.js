/**
 * Formations côté client : mêmes postes que server/data/formations.js,
 * enrichis des coordonnées d'affichage sur le terrain.
 *
 * IMPORTANT : l'ORDRE des slots doit rester strictement identique à celui du
 * serveur — le client envoie la composition sous forme d'un tableau de 11
 * identifiants indexé par slot, et le moteur de match résout le poste à partir
 * de cet index. Toute modification ici doit être répercutée côté serveur.
 *
 * Repère : l'équipe attaque vers le haut (gardien en y=90, attaquants en y≈15).
 */

export const FORMATION_POSITIONS = {
  '4-4-2': [
    { pos: 'GAR', x: 50, y: 90 }, { pos: 'ARG', x: 20, y: 72 }, { pos: 'DC', x: 38, y: 72 },
    { pos: 'DC', x: 62, y: 72 }, { pos: 'ARD', x: 80, y: 72 }, { pos: 'MG', x: 20, y: 45 },
    { pos: 'MC', x: 38, y: 45 }, { pos: 'MC', x: 62, y: 45 }, { pos: 'MD', x: 80, y: 45 },
    { pos: 'BU', x: 38, y: 18 }, { pos: 'BU', x: 62, y: 18 },
  ],
  '4-3-3': [
    { pos: 'GAR', x: 50, y: 90 }, { pos: 'ARG', x: 20, y: 72 }, { pos: 'DC', x: 38, y: 72 },
    { pos: 'DC', x: 62, y: 72 }, { pos: 'ARD', x: 80, y: 72 }, { pos: 'MC', x: 30, y: 48 },
    { pos: 'MC', x: 50, y: 45 }, { pos: 'MC', x: 70, y: 48 }, { pos: 'AIG', x: 22, y: 18 },
    { pos: 'BU', x: 50, y: 15 }, { pos: 'AID', x: 78, y: 18 },
  ],
  '3-5-2': [
    { pos: 'GAR', x: 50, y: 90 }, { pos: 'DC', x: 30, y: 72 }, { pos: 'DC', x: 50, y: 72 },
    { pos: 'DC', x: 70, y: 72 }, { pos: 'MG', x: 15, y: 48 }, { pos: 'MC', x: 35, y: 48 },
    { pos: 'MC', x: 50, y: 45 }, { pos: 'MC', x: 65, y: 48 }, { pos: 'MD', x: 85, y: 48 },
    { pos: 'BU', x: 38, y: 18 }, { pos: 'BU', x: 62, y: 18 },
  ],
  '4-2-3-1': [
    { pos: 'GAR', x: 50, y: 90 }, { pos: 'ARG', x: 20, y: 72 }, { pos: 'DC', x: 38, y: 72 },
    { pos: 'DC', x: 62, y: 72 }, { pos: 'ARD', x: 80, y: 72 }, { pos: 'MDF', x: 38, y: 52 },
    { pos: 'MDF', x: 62, y: 52 }, { pos: 'AIG', x: 22, y: 32 }, { pos: 'MOC', x: 50, y: 32 },
    { pos: 'AID', x: 78, y: 32 }, { pos: 'BU', x: 50, y: 15 },
  ],
  '5-3-2': [
    { pos: 'GAR', x: 50, y: 90 }, { pos: 'PG', x: 15, y: 68 }, { pos: 'DC', x: 32, y: 74 },
    { pos: 'DC', x: 50, y: 74 }, { pos: 'DC', x: 68, y: 74 }, { pos: 'PD', x: 85, y: 68 },
    { pos: 'MC', x: 30, y: 45 }, { pos: 'MC', x: 50, y: 42 }, { pos: 'MC', x: 70, y: 45 },
    { pos: 'BU', x: 38, y: 18 }, { pos: 'BU', x: 62, y: 18 },
  ],
  '3-4-3': [
    { pos: 'GAR', x: 50, y: 90 }, { pos: 'DC', x: 30, y: 72 }, { pos: 'DC', x: 50, y: 72 },
    { pos: 'DC', x: 70, y: 72 }, { pos: 'MG', x: 18, y: 48 }, { pos: 'MC', x: 40, y: 48 },
    { pos: 'MC', x: 60, y: 48 }, { pos: 'MD', x: 82, y: 48 }, { pos: 'AIG', x: 22, y: 18 },
    { pos: 'BU', x: 50, y: 15 }, { pos: 'AID', x: 78, y: 18 },
  ],
  '4-1-4-1': [
    { pos: 'GAR', x: 50, y: 90 }, { pos: 'ARG', x: 20, y: 72 }, { pos: 'DC', x: 38, y: 72 },
    { pos: 'DC', x: 62, y: 72 }, { pos: 'ARD', x: 80, y: 72 }, { pos: 'MDF', x: 50, y: 56 },
    { pos: 'MG', x: 18, y: 38 }, { pos: 'MC', x: 40, y: 38 }, { pos: 'MC', x: 60, y: 38 },
    { pos: 'MD', x: 82, y: 38 }, { pos: 'BU', x: 50, y: 15 },
  ],
};

export const FORMATION_NAMES = Object.keys(FORMATION_POSITIONS);
export const DEFAULT_FORMATION = '4-4-2';

const GK_POSITIONS = ['GAR'];
const DEF_POSITIONS = ['DC', 'ARG', 'ARD', 'PG', 'PD'];
const MID_POSITIONS = ['MC', 'MOC', 'MDF', 'MG', 'MD'];
const ATT_POSITIONS = ['BU', 'AIG', 'AID'];

export function getPositionGroup(pos) {
  if (GK_POSITIONS.includes(pos)) return 'gk';
  if (DEF_POSITIONS.includes(pos)) return 'def';
  if (MID_POSITIONS.includes(pos)) return 'mid';
  if (ATT_POSITIONS.includes(pos)) return 'att';
  return 'att';
}

/**
 * Disposition complète pour l'AFFICHAGE : [{ pos, x, y }, ...].
 * Utiliser uniquement pour dessiner le terrain.
 */
export function getFormationLayout(formation) {
  return FORMATION_POSITIONS[formation] || FORMATION_POSITIONS[DEFAULT_FORMATION];
}

/**
 * Postes de la formation, sous forme de CHAÎNES : ['GAR', 'ARG', ...].
 * Même contrat que getFormationSlots() de server/data/formations.js — c'est ce
 * que doit consommer toute la logique (adéquation, contrôles, composition auto).
 */
export function getFormationSlots(formation) {
  return getFormationLayout(formation).map(s => s.pos);
}

/**
 * Doit rester aligné sur getPositionFit() de server/data/formations.js.
 * Un joueur est pleinement à l'aise partout dans SA LIGNE (distance 0 = 1.00) :
 * un buteur vaut un ailier, un défenseur central vaut un latéral.
 */
const GROUP_DISTANCE = {
  gk:  { gk: 0, def: 1, mid: 2, att: 3 },
  def: { gk: 1, def: 0, mid: 1, att: 2 },
  mid: { gk: 2, def: 1, mid: 0, att: 1 },
  att: { gk: 3, def: 2, mid: 1, att: 0 },
};

const DISTANCE_FIT = { 0: 1, 1: 0.78, 2: 0.64, 3: 0.5 };

export function getPositionFit(playerPos, slotPos) {
  if (!slotPos) return 1;
  if (playerPos === slotPos) return 1;

  const playerGroup = getPositionGroup(playerPos);
  const slotGroup = getPositionGroup(slotPos);

  if (playerGroup === 'gk' && slotGroup !== 'gk') return 0.45;
  if (slotGroup === 'gk' && playerGroup !== 'gk') return 0.4;

  return DISTANCE_FIT[GROUP_DISTANCE[playerGroup][slotGroup]] ?? 0.6;
}

/** Libellé lisible du niveau d'adéquation, pour l'interface. */
export function getFitLabel(fit) {
  if (fit >= 1)    return { label: 'Dans sa ligne', tone: 'perfect' };
  if (fit >= 0.75) return { label: 'Ligne voisine', tone: 'good' };
  if (fit >= 0.6)  return { label: 'Deux lignes d\'écart', tone: 'warn' };
  return { label: 'Poste inadapté', tone: 'bad' };
}
