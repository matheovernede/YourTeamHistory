const { v4: uuid } = require('uuid');
const { getDb, queryAll, queryOne, saveDb } = require('../db/schema');
const { SQUAD_MAX } = require('../data/rules');

const MAX_LOANS = 3;
const MAX_ATTEMPTS = 3;

function currentWindow(team) {
  const played = (team.wins || 0) + (team.draws || 0) + (team.losses || 0);
  if (played === 0 && team.summer_window_season !== team.season) return 'summer';
  if (played >= 13 && played < 26 && team.winter_window_season !== team.season) return 'winter';
  return null;
}

function marketError(key, status = 400) {
  return Object.assign(new Error(key), { status, marketKey: `recruitment.${key}` });
}

function ownedTeam(teamId, managerId) {
  const team = queryOne('SELECT * FROM teams WHERE id = ? AND manager_id = ?', [teamId || '', managerId || '']);
  if (!team || team.manager_id === 'AI') throw marketError('notYourTeam', 403);
  return team;
}

function requireWindow(team) {
  const window = currentWindow(team);
  if (!window) throw marketError('closed');
  return window;
}

function publicOffer(row) {
  const player = JSON.parse(row.player_data);
  return {
    ...player, id: row.id, value: row.asking_price,
    agreedPrice: row.agreed_price, lastOffer: row.last_offer,
    counterPrice: row.attempts && row.agreed_price === null ? purchasePrice(row) : null,
    attemptsLeft: MAX_ATTEMPTS - row.attempts,
    negotiationStatus: row.status,
    // Les légendes se recrutent définitivement ; elles ne sont pas prêtées.
    loanFee: player.tier === 'legend' ? null : Math.max(1, Math.round(row.asking_price * (row.window === 'winter' ? 0.12 : 0.20))),
    loanEndSeason: row.season,
  };
}

async function getMarket(team, build) {
  const db = await getDb();
  const window = requireWindow(team);
  let rows = queryAll('SELECT * FROM market_offers WHERE team_id = ? AND season = ? AND window = ?', [team.id, team.season, window]);
  if (!rows.length) {
    for (const p of build(window)) {
      // La marge dépend du joueur et de la fenêtre ; elle reste stable après
      // un redémarrage et n'est jamais communiquée au navigateur.
      const ratio = (window === 'winter' ? 0.91 : 0.82) + Math.random() * 0.07;
      db.run(`INSERT INTO market_offers
        (id, team_id, season, window, player_data, asking_price, minimum_price)
        VALUES (?,?,?,?,?,?,?)`, [uuid(), team.id, team.season, window, JSON.stringify(p), p.value, Math.ceil(p.value * ratio)]);
    }
    saveDb();
    rows = queryAll('SELECT * FROM market_offers WHERE team_id = ? AND season = ? AND window = ?', [team.id, team.season, window]);
  }
  const names = new Set(queryAll('SELECT first_name, last_name FROM players WHERE team_id = ?', [team.id]).map(p => `${p.first_name}_${p.last_name}`));
  return rows.filter(r => r.status !== 'signed').map(publicOffer).filter(p => !names.has(`${p.first_name}_${p.last_name}`));
}

function getOffer(team, offerId) {
  const window = requireWindow(team);
  const offer = queryOne('SELECT * FROM market_offers WHERE id = ? AND team_id = ? AND season = ? AND window = ?', [offerId || '', team.id, team.season, window]);
  if (!offer || offer.status === 'signed') throw marketError('expired', 409);
  const p = JSON.parse(offer.player_data);
  if (queryOne('SELECT id FROM players WHERE team_id = ? AND first_name = ? AND last_name = ?', [team.id, p.first_name, p.last_name])) throw marketError('alreadyOwned', 409);
  return offer;
}

async function negotiate({ teamId, managerId, offerId, amount }) {
  const db = await getDb();
  const team = ownedTeam(teamId, managerId);
  const offer = getOffer(team, offerId);
  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > offer.asking_price) throw marketError('invalidAmount');
  if (amount > manager.budget) throw marketError('budget');
  if (offer.agreed_price !== null || offer.attempts >= MAX_ATTEMPTS) throw marketError('finished', 409);
  if (offer.last_offer !== null && amount <= offer.last_offer) throw marketError('increaseOffer');
  const attempts = offer.attempts + 1;
  const accepted = amount >= offer.minimum_price;
  // Une contre-offre est ferme et peut être signée immédiatement. Il reste
  // possible de négocier à nouveau tant que le nombre d'essais le permet.
  db.run('UPDATE market_offers SET attempts = ?, last_offer = ?, agreed_price = ?, status = ? WHERE id = ?',
    [attempts, amount, accepted ? amount : null, accepted ? 'accepted' : 'counter', offer.id]);
  saveDb();
  return publicOffer(queryOne('SELECT * FROM market_offers WHERE id = ?', [offer.id]));
}

function purchasePrice(offer) {
  if (offer.agreed_price !== null) return offer.agreed_price;
  if (!offer.attempts) return offer.asking_price;
  return Math.max(offer.minimum_price, Math.round(offer.asking_price - (offer.asking_price - offer.minimum_price) * offer.attempts / MAX_ATTEMPTS));
}

async function sign({ teamId, managerId, offerId, mode = 'buy' }) {
  const db = await getDb();
  const team = ownedTeam(teamId, managerId);
  const offer = getOffer(team, offerId);
  if (!['buy', 'loan'].includes(mode)) throw marketError('invalidMode');
  const p = JSON.parse(offer.player_data);
  const loan = mode === 'loan';
  const terms = publicOffer(offer);
  if (loan && terms.loanFee === null) throw marketError('noLoan');
  const squad = queryAll('SELECT * FROM players WHERE team_id = ?', [team.id]);
  if (squad.length >= SQUAD_MAX) throw marketError('full');
  if (loan && squad.filter(p => p.loan_end_season !== null).length >= MAX_LOANS) throw marketError('loanLimit');
  const price = loan ? terms.loanFee : purchasePrice(offer);
  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  if (!manager || manager.budget < price) throw marketError('budget');
  const playerId = uuid();
  db.run('BEGIN TRANSACTION');
  try {
    db.run('UPDATE managers SET budget = budget - ? WHERE id = ?', [price, managerId]);
    db.run(`INSERT INTO players (id, team_id, first_name, last_name, age, position, overall,
      pace, shooting, passing, dribbling, defending, physical, stamina, morale, value, is_starter, loan_end_season)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,100,80,?,0,?)`,
    [playerId, team.id, p.first_name, p.last_name, p.age, p.position, p.overall, p.pace, p.shooting, p.passing, p.dribbling, p.defending, p.physical, offer.asking_price, loan ? team.season : null]);
    db.run("UPDATE market_offers SET status = 'signed' WHERE id = ?", [offer.id]);
    db.run('INSERT INTO transfers (id, player_id, from_team_id, to_team_id, fee) VALUES (?,?,NULL,?,?)', [uuid(), playerId, team.id, price]);
    db.run('COMMIT');
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
  saveDb();
  return { newBudget: manager.budget - price, paid: price, squadSize: squad.length + 1, player: queryOne('SELECT * FROM players WHERE id = ?', [playerId]) };
}

function expireLoans(db, teamId, season) {
  const players = queryAll('SELECT * FROM players WHERE team_id = ? AND loan_end_season <= ?', [teamId, season]);
  db.run('DELETE FROM players WHERE team_id = ? AND loan_end_season <= ?', [teamId, season]);
  return players.map(p => `${p.first_name} ${p.last_name}`);
}

module.exports = { MAX_LOANS, MAX_ATTEMPTS, currentWindow, ownedTeam, requireWindow, getMarket, negotiate, sign, expireLoans, purchasePrice, publicOffer };
