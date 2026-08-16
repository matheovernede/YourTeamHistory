const { v4: uuid } = require('uuid');

/**
 * Génération de joueurs à la volée (pépites du centre de formation,
 * recrues promises aux supporters, pistons imposés par un sponsor...).
 *
 * Produit des profils cohérents avec le schéma `players` : les statistiques
 * détaillées sont dérivées du poste, pour qu'un gardien ne soit pas un ailier
 * déguisé et que le moteur de match les évalue correctement.
 */

const FIRST_NAMES = [
  'Yanis', 'Enzo', 'Rayan', 'Nolan', 'Mathis', 'Ilyes', 'Théo', 'Noah',
  'Adam', 'Gabin', 'Sofiane', 'Amine', 'Lucas', 'Ethan', 'Naël', 'Maël',
  'Ibrahim', 'Aaron', 'Kylian', 'Younes', 'Tiago', 'Léo', 'Malo', 'Célian',
  'Moussa', 'Ismaël', 'Bilal', 'Axel', 'Jibril', 'Sacha',
];

const LAST_NAMES = [
  'Diallo', 'Traoré', 'Bakayoko', 'Mendy', 'Lefèvre', 'Moreau', 'Barbier',
  'Nguyen', 'Camara', 'Roussel', 'Fontaine', 'Perrin', 'Legrand', 'Marchand',
  'Cissé', 'Dumas', 'Guérin', 'Renard', 'Béchu', 'Ollivier', 'Sagna',
  'Vasseur', 'Berthelot', 'Kouassi', 'Delaunay', 'Maillard', 'Bonnet',
  'Hervé', 'Sylla', 'Thibault',
];

/**
 * Pondération des attributs par poste : [pace, shooting, passing, dribbling, defending, physical].
 * 1 = attribut clé du poste, valeurs basses = attribut secondaire.
 */
const POSITION_PROFILES = {
  GAR: { pace: 0.35, shooting: 0.15, passing: 0.55, dribbling: 0.3, defending: 1, physical: 0.95 },
  DC:  { pace: 0.7,  shooting: 0.4,  passing: 0.65, dribbling: 0.55, defending: 1, physical: 1 },
  ARG: { pace: 1,    shooting: 0.5,  passing: 0.8,  dribbling: 0.8, defending: 0.9, physical: 0.8 },
  ARD: { pace: 1,    shooting: 0.5,  passing: 0.8,  dribbling: 0.8, defending: 0.9, physical: 0.8 },
  PG:  { pace: 1,    shooting: 0.55, passing: 0.85, dribbling: 0.85, defending: 0.85, physical: 0.8 },
  PD:  { pace: 1,    shooting: 0.55, passing: 0.85, dribbling: 0.85, defending: 0.85, physical: 0.8 },
  MDF: { pace: 0.7,  shooting: 0.5,  passing: 0.85, dribbling: 0.7, defending: 1, physical: 0.95 },
  MC:  { pace: 0.75, shooting: 0.7,  passing: 1,    dribbling: 0.9, defending: 0.8, physical: 0.8 },
  MOC: { pace: 0.8,  shooting: 0.85, passing: 1,    dribbling: 1, defending: 0.45, physical: 0.6 },
  MG:  { pace: 0.95, shooting: 0.7,  passing: 0.9,  dribbling: 0.95, defending: 0.6, physical: 0.7 },
  MD:  { pace: 0.95, shooting: 0.7,  passing: 0.9,  dribbling: 0.95, defending: 0.6, physical: 0.7 },
  AIG: { pace: 1,    shooting: 0.85, passing: 0.75, dribbling: 1, defending: 0.3, physical: 0.6 },
  AID: { pace: 1,    shooting: 0.85, passing: 0.75, dribbling: 1, defending: 0.3, physical: 0.6 },
  BU:  { pace: 0.9,  shooting: 1,    passing: 0.6,  dribbling: 0.85, defending: 0.25, physical: 0.9 },
};

const ALL_POSITIONS = Object.keys(POSITION_PROFILES);

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/** Valeur marchande, alignée sur la formule utilisée pour l'effectif de départ. */
function computeValue(overall, age) {
  return Math.max(50000, Math.round(overall * overall * 1200 * (1 - (age - 25) * 0.018)));
}

/**
 * Fabrique un joueur sans l'insérer en base.
 * @param {object} opts
 * @param {[number,number]} opts.ageRange
 * @param {[number,number]} opts.overallRange
 * @param {string}   opts.position  poste imposé (aléatoire si absent)
 * @param {string[]} opts.positions ensemble de postes possibles
 */
function makePlayer({ ageRange = [16, 19], overallRange = [45, 58], position, positions } = {}) {
  const pos = position || pick(positions && positions.length ? positions : ALL_POSITIONS);
  const profile = POSITION_PROFILES[pos] || POSITION_PROFILES.MC;

  const age = randInt(ageRange[0], ageRange[1]);
  const overall = randInt(overallRange[0], overallRange[1]);

  // Chaque attribut gravite autour du niveau global, pondéré par le poste.
  const attr = weight => clamp(Math.round(overall * (0.55 + weight * 0.5) + randInt(-4, 4)), 15, 99);

  return {
    first_name: pick(FIRST_NAMES),
    last_name: pick(LAST_NAMES),
    age,
    position: pos,
    overall,
    pace: attr(profile.pace),
    shooting: attr(profile.shooting),
    passing: attr(profile.passing),
    dribbling: attr(profile.dribbling),
    defending: attr(profile.defending),
    physical: attr(profile.physical),
    value: computeValue(overall, age),
  };
}

/**
 * Fabrique un joueur ET l'insère dans l'effectif. Il arrive sur le banc :
 * la composition existante n'est jamais bousculée.
 * @returns le joueur inséré, avec son id
 */
function createPlayerForTeam(db, teamId, opts = {}) {
  const p = makePlayer(opts);
  const id = uuid();

  db.run(
    `INSERT INTO players
      (id, team_id, first_name, last_name, age, position, overall,
       pace, shooting, passing, dribbling, defending, physical,
       stamina, morale, value, is_starter, slot_index)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,100,?,?,0,NULL)`,
    [
      id, teamId, p.first_name, p.last_name, p.age, p.position, p.overall,
      p.pace, p.shooting, p.passing, p.dribbling, p.defending, p.physical,
      opts.morale ?? 80, p.value,
    ]
  );

  return { ...p, id, team_id: teamId, stamina: 100, morale: opts.morale ?? 80, is_starter: 0, slot_index: null };
}

module.exports = { makePlayer, createPlayerForTeam, POSITION_PROFILES, computeValue };
