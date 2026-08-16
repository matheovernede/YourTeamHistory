const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'footmanager.db');

let db = null;
let dbReady = null;

function saveDb() {
  if (!db) return;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function getDb() {
  if (db) return db;
  if (dbReady) return dbReady;

  dbReady = (async () => {
    const SQL = await initSqlJs();
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
    db.run('PRAGMA foreign_keys = ON');
    initTables();
    return db;
  })();

  return dbReady;
}

function initTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS managers (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      budget INTEGER DEFAULT 20000000,
      reputation INTEGER DEFAULT 50
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      manager_id TEXT NOT NULL,
      name TEXT NOT NULL,
      formation TEXT DEFAULT '4-4-2',
      morale INTEGER DEFAULT 70,
      season INTEGER DEFAULT 1,
      division INTEGER DEFAULT 1,
      points INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      goals_for INTEGER DEFAULT 0,
      goals_against INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      position TEXT NOT NULL,
      overall INTEGER NOT NULL,
      pace INTEGER NOT NULL,
      shooting INTEGER NOT NULL,
      passing INTEGER NOT NULL,
      dribbling INTEGER NOT NULL,
      defending INTEGER NOT NULL,
      physical INTEGER NOT NULL,
      stamina INTEGER DEFAULT 100,
      morale INTEGER DEFAULT 70,
      value INTEGER NOT NULL,
      is_starter INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      season INTEGER NOT NULL,
      week INTEGER NOT NULL,
      home_team_id TEXT NOT NULL,
      away_team_id TEXT NOT NULL,
      home_goals INTEGER,
      away_goals INTEGER,
      played INTEGER DEFAULT 0,
      events TEXT,
      played_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      from_team_id TEXT,
      to_team_id TEXT,
      fee INTEGER NOT NULL,
      transferred_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id TEXT PRIMARY KEY,
      manager_id TEXT NOT NULL,
      team_name TEXT NOT NULL,
      season INTEGER NOT NULL,
      points INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      goals_for INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Migration: add division column to existing teams table if missing
  try {
    db.run('ALTER TABLE teams ADD COLUMN division INTEGER DEFAULT 1');
  } catch (e) {
    // Column already exists, ignore
  }

  // Migration: add last_training_matchday column for management cooldown tracking
  try {
    db.run('ALTER TABLE teams ADD COLUMN last_training_matchday INTEGER DEFAULT 0');
  } catch (e) {
    // Column already exists, ignore
  }

  // Migration: add cl_data column for Champions League state
  try {
    db.run('ALTER TABLE teams ADD COLUMN cl_data TEXT');
  } catch (e) {
    // Column already exists, ignore
  }

  // Migration: slot_index mémorise l'emplacement exact du titulaire dans la
  // formation (0-10). NULL = remplaçant ou placement non défini.
  try {
    db.run('ALTER TABLE players ADD COLUMN slot_index INTEGER DEFAULT NULL');
  } catch (e) {
    // Column already exists, ignore
  }

  // Migrations : discipline, blessures et statistiques individuelles.
  // Chaque ALTER est isolé : si une colonne existe déjà, les autres passent
  // quand même (une seule instruction groupée échouerait en bloc).
  const playerColumns = [
    'yellow_cards INTEGER DEFAULT 0',      // cumul sur la saison
    'red_cards INTEGER DEFAULT 0',
    'suspended_matches INTEGER DEFAULT 0', // journées de suspension restantes
    'injured_matches INTEGER DEFAULT 0',   // journées d'indisponibilité restantes
    'appearances INTEGER DEFAULT 0',       // matchs joués sur la saison
    'goals INTEGER DEFAULT 0',
    'career_appearances INTEGER DEFAULT 0',
    'career_goals INTEGER DEFAULT 0',
    'unhappy_streak INTEGER DEFAULT 0',   // journées consécutives de mécontentement
    'transfer_request INTEGER DEFAULT 0', // 1 = a officiellement demandé à partir
  ];
  for (const col of playerColumns) {
    try { db.run(`ALTER TABLE players ADD COLUMN ${col}`); } catch (e) { /* déjà présente */ }
  }

  const teamColumns = [
    'cup_data TEXT',              // état de la coupe nationale
    'titles INTEGER DEFAULT 0',   // championnats remportés
    'cups INTEGER DEFAULT 0',     // coupes remportées
  ];
  for (const col of teamColumns) {
    try { db.run(`ALTER TABLE teams ADD COLUMN ${col}`); } catch (e) { /* déjà présente */ }
  }

  // Historique des saisons : sans lui, la carrière n'a aucune mémoire.
  db.run(`
    CREATE TABLE IF NOT EXISTS season_history (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      season INTEGER NOT NULL,
      division INTEGER NOT NULL,
      division_name TEXT,
      rank INTEGER,
      points INTEGER,
      wins INTEGER,
      draws INTEGER,
      losses INTEGER,
      goals_for INTEGER,
      goals_against INTEGER,
      promoted INTEGER DEFAULT 0,
      relegated INTEGER DEFAULT 0,
      cup_result TEXT,
      top_scorer TEXT,
      top_scorer_goals INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results[0] || null;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

module.exports = { getDb, queryAll, queryOne, run, saveDb };
