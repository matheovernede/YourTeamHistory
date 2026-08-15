const { getDb, queryOne, run, saveDb } = require('./schema');
const { v4: uuid } = require('uuid');
const { DIVISIONS } = require('../data/divisions');
const { REAL_TEAMS } = require('../data/realPlayers');

// French first/last names for generating amateur players
const FIRST_NAMES = [
  'Lucas', 'Hugo', 'Mathis', 'Nathan', 'Enzo', 'Thomas', 'Théo', 'Noah', 'Maxime', 'Antoine',
  'Baptiste', 'Alexis', 'Clément', 'Romain', 'Julien', 'Quentin', 'Nicolas', 'Kevin', 'Dylan', 'Jérémy',
  'Pierre', 'Florian', 'Valentin', 'Axel', 'Adrien', 'Benjamin', 'Guillaume', 'Vincent', 'Damien', 'Fabien',
  'Mehdi', 'Youssef', 'Karim', 'Sofiane', 'Ibrahim', 'Moussa', 'Mamadou', 'Abdoulaye', 'Omar', 'Bilal',
  'Corentin', 'Gauthier', 'Erwan', 'Loïc', 'Sylvain', 'Cédric', 'Franck', 'Sébastien', 'Ludovic', 'Christophe',
];

const LAST_NAMES = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
  'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
  'Morel', 'Girard', 'André', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Legrand',
  'Garnier', 'Faure', 'Rousseau', 'Blanc', 'Guérin', 'Muller', 'Henry', 'Roussel', 'Nicolas', 'Perrin',
  'Diallo', 'Traoré', 'Camara', 'Diop', 'Koné', 'Bamba', 'Touré', 'Coulibaly', 'Sylla', 'Ba',
  'Fernandez', 'Lopez', 'Pereira', 'Da Silva', 'Santos', 'Rodrigues', 'Ferreira', 'Alves', 'Oliveira', 'Costa',
];

const POSITIONS_TEMPLATE = ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'RW', 'LW', 'ST', 'GK', 'CB', 'CM', 'RW', 'ST', 'LB', 'CM'];

function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePlayer(position, overallMin, overallMax) {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const age = randomInRange(18, 35);
  const overall = randomInRange(overallMin, overallMax);

  // Generate stats based on position and overall
  let pace, shooting, passing, dribbling, defending, physical;

  switch (position) {
    case 'GK':
      pace = randomInRange(25, 45);
      shooting = randomInRange(8, 18);
      passing = randomInRange(overall - 20, overall - 5);
      dribbling = randomInRange(15, 35);
      defending = randomInRange(overall - 5, overall + 3);
      physical = randomInRange(overall - 12, overall - 2);
      break;
    case 'CB':
      pace = randomInRange(overall - 20, overall - 5);
      shooting = randomInRange(overall - 30, overall - 15);
      passing = randomInRange(overall - 15, overall - 5);
      dribbling = randomInRange(overall - 20, overall - 8);
      defending = randomInRange(overall - 3, overall + 5);
      physical = randomInRange(overall - 5, overall + 3);
      break;
    case 'RB': case 'LB':
      pace = randomInRange(overall - 2, overall + 8);
      shooting = randomInRange(overall - 20, overall - 8);
      passing = randomInRange(overall - 8, overall + 2);
      dribbling = randomInRange(overall - 8, overall + 2);
      defending = randomInRange(overall - 5, overall + 3);
      physical = randomInRange(overall - 8, overall + 2);
      break;
    case 'CM':
      pace = randomInRange(overall - 12, overall + 2);
      shooting = randomInRange(overall - 10, overall + 2);
      passing = randomInRange(overall - 2, overall + 6);
      dribbling = randomInRange(overall - 5, overall + 5);
      defending = randomInRange(overall - 10, overall + 2);
      physical = randomInRange(overall - 5, overall + 5);
      break;
    case 'CAM':
      pace = randomInRange(overall - 8, overall + 3);
      shooting = randomInRange(overall - 3, overall + 5);
      passing = randomInRange(overall, overall + 8);
      dribbling = randomInRange(overall, overall + 8);
      defending = randomInRange(overall - 25, overall - 12);
      physical = randomInRange(overall - 12, overall - 2);
      break;
    case 'LW': case 'RW':
      pace = randomInRange(overall + 2, overall + 12);
      shooting = randomInRange(overall - 5, overall + 5);
      passing = randomInRange(overall - 8, overall + 2);
      dribbling = randomInRange(overall, overall + 10);
      defending = randomInRange(overall - 35, overall - 20);
      physical = randomInRange(overall - 15, overall - 5);
      break;
    case 'ST':
      pace = randomInRange(overall - 5, overall + 8);
      shooting = randomInRange(overall + 2, overall + 10);
      passing = randomInRange(overall - 15, overall - 5);
      dribbling = randomInRange(overall - 5, overall + 5);
      defending = randomInRange(overall - 35, overall - 20);
      physical = randomInRange(overall - 5, overall + 5);
      break;
    default:
      pace = randomInRange(overall - 10, overall + 5);
      shooting = randomInRange(overall - 10, overall + 5);
      passing = randomInRange(overall - 5, overall + 5);
      dribbling = randomInRange(overall - 5, overall + 5);
      defending = randomInRange(overall - 10, overall + 5);
      physical = randomInRange(overall - 5, overall + 5);
  }

  // Clamp all stats between 1 and 99
  const clamp = v => Math.max(1, Math.min(99, v));

  return {
    first_name: firstName,
    last_name: lastName,
    age,
    position,
    overall,
    pace: clamp(pace),
    shooting: clamp(shooting),
    passing: clamp(passing),
    dribbling: clamp(dribbling),
    defending: clamp(defending),
    physical: clamp(physical),
  };
}

function generateTeamPlayers(overallMin, overallMax) {
  return POSITIONS_TEMPLATE.map(pos => generatePlayer(pos, overallMin, overallMax));
}

/**
 * Seed AI teams for a given division level.
 * If division 7 (Ligue 1), uses real teams from realPlayers.js.
 * Otherwise, generates procedural players.
 */
async function seedDivision(divisionLevel) {
  const db = await getDb();
  const division = DIVISIONS.find(d => d.level === divisionLevel);
  if (!division) throw new Error(`Division ${divisionLevel} not found`);

  // Ensure AI manager exists
  db.run("INSERT OR IGNORE INTO managers (id, username, budget) VALUES ('AI', 'CPU', 999999999)");

  if (divisionLevel === 7 && REAL_TEAMS && REAL_TEAMS.length > 0) {
    // Ligue 1: use real teams
    for (const team of REAL_TEAMS) {
      const teamId = uuid();
      db.run("INSERT INTO teams (id, manager_id, name, formation, division) VALUES (?, 'AI', ?, ?, ?)",
        [teamId, team.name, team.formation, divisionLevel]);

      const starters = team.players.slice(0, 11);
      const subs = team.players.slice(11);

      for (const p of starters) {
        const value = Math.max(500000, Math.round(p.overall * p.overall * 1200 * (1 - (p.age - 25) * 0.018)));
        db.run(
          "INSERT INTO players (id, team_id, first_name, last_name, age, position, overall, pace, shooting, passing, dribbling, defending, physical, stamina, morale, value, is_starter) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,100,80,?,1)",
          [uuid(), teamId, p.first_name, p.last_name, p.age, p.position, p.overall, p.pace, p.shooting, p.passing, p.dribbling, p.defending, p.physical, value]
        );
      }

      for (const p of subs) {
        const value = Math.max(500000, Math.round(p.overall * p.overall * 1200 * (1 - (p.age - 25) * 0.018)));
        db.run(
          "INSERT INTO players (id, team_id, first_name, last_name, age, position, overall, pace, shooting, passing, dribbling, defending, physical, stamina, morale, value, is_starter) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,100,70,?,0)",
          [uuid(), teamId, p.first_name, p.last_name, p.age, p.position, p.overall, p.pace, p.shooting, p.passing, p.dribbling, p.defending, p.physical, value]
        );
      }
    }
    console.log(`Seeded ${REAL_TEAMS.length} real teams for Ligue 1.`);
  } else {
    // Generate procedural teams
    const [overallMin, overallMax] = division.overallRange;
    for (const teamDef of division.teams) {
      const teamId = uuid();
      db.run("INSERT INTO teams (id, manager_id, name, formation, division) VALUES (?, 'AI', ?, ?, ?)",
        [teamId, teamDef.name, teamDef.formation, divisionLevel]);

      const players = generateTeamPlayers(overallMin, overallMax);
      const starters = players.slice(0, 11);
      const subs = players.slice(11);

      for (const p of starters) {
        const value = Math.max(10000, Math.round(p.overall * p.overall * 100 * (1 - (p.age - 25) * 0.015)));
        db.run(
          "INSERT INTO players (id, team_id, first_name, last_name, age, position, overall, pace, shooting, passing, dribbling, defending, physical, stamina, morale, value, is_starter) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,100,70,?,1)",
          [uuid(), teamId, p.first_name, p.last_name, p.age, p.position, p.overall, p.pace, p.shooting, p.passing, p.dribbling, p.defending, p.physical, value]
        );
      }

      for (const p of subs) {
        const value = Math.max(10000, Math.round(p.overall * p.overall * 80 * (1 - (p.age - 25) * 0.015)));
        db.run(
          "INSERT INTO players (id, team_id, first_name, last_name, age, position, overall, pace, shooting, passing, dribbling, defending, physical, stamina, morale, value, is_starter) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,100,65,?,0)",
          [uuid(), teamId, p.first_name, p.last_name, p.age, p.position, p.overall, p.pace, p.shooting, p.passing, p.dribbling, p.defending, p.physical, value]
        );
      }
    }
    console.log(`Seeded ${division.teams.length} teams for ${division.name} (division ${divisionLevel}).`);
  }

  saveDb();
}

/**
 * Main seed function: seeds AI teams for the starting division (Regional 2).
 * Called at startup to ensure opponents exist.
 */
async function seedStartingDivision() {
  const db = await getDb();

  const existing = queryOne("SELECT COUNT(*) as count FROM teams WHERE manager_id = ?", ['AI']);
  if (existing && existing.count > 0) {
    console.log('AI teams already exist, skipping seed.');
    return;
  }

  await seedDivision(1); // Regional 2
}

seedStartingDivision();

module.exports = { seedDivision, generateTeamPlayers, generatePlayer };
