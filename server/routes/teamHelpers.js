const { v4: uuid } = require('uuid');
const { PLAYER_POOL_FOR_USER } = require('../data/realPlayers');

const LIGUE1_PLAYERS = [
  { first_name: 'Moses', last_name: 'Simon', age: 30, position: 'AIG', overall: 77, pace: 88, shooting: 70, passing: 68, dribbling: 80, defending: 28, physical: 62 },
  { first_name: 'Habib', last_name: 'Diarra', age: 23, position: 'MC', overall: 75, pace: 70, shooting: 68, passing: 72, dribbling: 72, defending: 68, physical: 72 },
  { first_name: 'Kamory', last_name: 'Doumbia', age: 24, position: 'MC', overall: 75, pace: 72, shooting: 70, passing: 70, dribbling: 74, defending: 66, physical: 74 },
  { first_name: 'Mory', last_name: 'Diaw', age: 31, position: 'GAR', overall: 76, pace: 36, shooting: 10, passing: 48, dribbling: 22, defending: 76, physical: 74 },
  { first_name: 'Steve', last_name: 'Mounié', age: 31, position: 'BU', overall: 74, pace: 68, shooting: 74, passing: 58, dribbling: 65, defending: 28, physical: 80 },
  { first_name: 'Romain', last_name: 'Faivre', age: 28, position: 'MOC', overall: 76, pace: 72, shooting: 70, passing: 76, dribbling: 80, defending: 30, physical: 55 },
  { first_name: 'Himad', last_name: 'Abdelli', age: 25, position: 'AIG', overall: 74, pace: 80, shooting: 68, passing: 68, dribbling: 76, defending: 26, physical: 58 },
  { first_name: 'Birger', last_name: 'Meling', age: 30, position: 'ARG', overall: 76, pace: 76, shooting: 52, passing: 74, dribbling: 72, defending: 74, physical: 68 },
  { first_name: 'Loïc', last_name: 'Badé', age: 26, position: 'DC', overall: 78, pace: 76, shooting: 35, passing: 58, dribbling: 52, defending: 80, physical: 80 },
  { first_name: 'Warmed', last_name: 'Omari', age: 22, position: 'DC', overall: 76, pace: 72, shooting: 35, passing: 60, dribbling: 55, defending: 78, physical: 76 },
  { first_name: 'Ibrahim', last_name: 'Amadou', age: 33, position: 'MC', overall: 74, pace: 62, shooting: 58, passing: 66, dribbling: 62, defending: 76, physical: 80 },
  { first_name: 'Andy', last_name: 'Diouf', age: 23, position: 'ARD', overall: 75, pace: 82, shooting: 52, passing: 68, dribbling: 72, defending: 72, physical: 72 },
  { first_name: 'Jérémy', last_name: 'Le Douaron', age: 25, position: 'AID', overall: 76, pace: 86, shooting: 72, passing: 62, dribbling: 74, defending: 28, physical: 68 },
  { first_name: 'Martin', last_name: 'Terrier', age: 29, position: 'AIG', overall: 78, pace: 78, shooting: 78, passing: 72, dribbling: 78, defending: 32, physical: 62 },
  { first_name: 'Enzo', last_name: 'Le Fée', age: 26, position: 'MC', overall: 77, pace: 68, shooting: 68, passing: 78, dribbling: 78, defending: 62, physical: 62 },
  { first_name: 'Lorenz', last_name: 'Assignon', age: 26, position: 'ARD', overall: 77, pace: 84, shooting: 58, passing: 70, dribbling: 74, defending: 74, physical: 74 },
  { first_name: 'Ibrahim', last_name: 'Sangaré', age: 28, position: 'MC', overall: 79, pace: 68, shooting: 65, passing: 74, dribbling: 72, defending: 78, physical: 82 },
  { first_name: 'Gaëtan', last_name: 'Laborde', age: 32, position: 'BU', overall: 76, pace: 72, shooting: 76, passing: 68, dribbling: 72, defending: 35, physical: 74 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateStarterSquad(db, teamId, teamLevel) {
  const allPlayers = shuffle([...PLAYER_POOL_FOR_USER, ...LIGUE1_PLAYERS]);

  const positions = { GAR: 1, DC: 2, ARG: 1, ARD: 1, MC: 2, MOC: 1, AIG: 1, AID: 1, BU: 1 };
  const subPositions = { GAR: 1, DC: 1, ARG: 1, MC: 2, AID: 1, BU: 1 };

  const starters = [];
  const subs = [];

  for (const [pos, count] of Object.entries(positions)) {
    const available = allPlayers.filter(p => p.position === pos && !starters.includes(p));
    for (let i = 0; i < count && i < available.length; i++) {
      starters.push(available[i]);
    }
  }

  for (const [pos, count] of Object.entries(subPositions)) {
    const available = allPlayers.filter(p => p.position === pos && !starters.includes(p) && !subs.includes(p));
    for (let i = 0; i < count && i < available.length; i++) {
      subs.push(available[i]);
    }
  }

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

module.exports = { generateStarterSquad };
