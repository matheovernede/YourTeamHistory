const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { v4: uuid } = require('uuid');

// Ne jamais charger ni modifier la base de développement pendant ces tests.
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'yth-mercato-'));
process.env.DB_PATH = path.join(temp, 'test.db');
const { getDb, queryOne, queryAll, saveDb } = require('../db/schema');
const { getFormationSlots } = require('../data/formations');
const { analyzeTeam, simulateMatch, applyMatchEffects } = require('../engine/match');
const { currentWindow } = require('../engine/market');
let db, server, base;

before(async () => {
  db = await getDb();
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use('/api/draft', require('../routes/draft'));
  app.use('/api/team', require('../routes/team'));
  app.use('/api/manager', require('../routes/manager'));
  app.use('/api/transfer', require('../routes/transfer'));
  app.use('/api/season', require('../routes/season'));
  app.use('/api/season', require('../routes/cup'));
  app.use('/api/season', require('../routes/championsLeague'));
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  // Le dossier a été créé par ce test, dans le répertoire temporaire système.
  assert.equal(path.dirname(path.resolve(temp)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(temp).startsWith('yth-mercato-'));
  fs.rmSync(temp, { recursive: true, force: true });
});

async function request(route, body, method = 'POST', expected = 200) {
  const response = await fetch(base + route, {
    method: body === undefined ? 'GET' : method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  assert.equal(response.status, expected, JSON.stringify(data));
  return data;
}

function career(count = 18) {
  const managerId = uuid(), teamId = uuid();
  db.run('INSERT INTO managers (id, username, budget) VALUES (?,?,100000000)', [managerId, managerId]);
  db.run('INSERT INTO teams (id, manager_id, name) VALUES (?,?,?)', [teamId, managerId, `Club ${teamId}`]);
  const slots = getFormationSlots('4-4-2');
  for (let i = 0; i < count; i++) {
    db.run(`INSERT INTO players (id, team_id, first_name, last_name, age, position, overall,
      pace, shooting, passing, dribbling, defending, physical, value, is_starter, slot_index, morale)
      VALUES (?,?,?,?,22,?,65,65,65,65,65,65,65,100000,?,?,90)`,
    [uuid(), teamId, 'Test', String(i), slots[i % 11], i < 11 ? 1 : 0, i < 11 ? i : null]);
  }
  return { managerId, teamId };
}

const market = (c) => request(`/draft/available?teamId=${c.teamId}`);
const sign = (c, offer, mode = 'buy', expected = 200) => request('/draft/buy', { ...c, offerId: offer.id, mode }, 'POST', expected);
const negotiate = (c, offer, amount, expected = 200) => request('/draft/negotiate', { ...c, offerId: offer.id, amount }, 'POST', expected);

test('marché et négociations persistants, prix serveur, signature unique', async () => {
  const c = career();
  const offers = await market(c);
  assert.ok(offers.length > 0);
  assert.deepEqual(await market(c), offers);
  const offer = offers.find(p => p.loanFee !== null);
  assert.equal(offer.minimum_price, undefined);
  const budget = queryOne('SELECT budget FROM managers WHERE id = ?', [c.managerId]).budget;
  const counter = await negotiate(c, offer, 1);
  assert.ok(counter.counterPrice < offer.value);
  assert.equal(counter.attemptsLeft, 2);
  assert.equal(queryOne('SELECT budget FROM managers WHERE id = ?', [c.managerId]).budget, budget);
  assert.deepEqual((await market(c)).find(p => p.id === offer.id), counter);
  await negotiate(c, offer, 1, 400);
  await negotiate(c, offer, -50, 400);
  await negotiate(c, offer, 1.5, 400);
  await negotiate(c, offer, offer.value + 1, 400);
  const second = await negotiate(c, offer, 2);
  const third = await negotiate(c, offer, 3);
  assert.ok(third.counterPrice <= second.counterPrice);
  assert.equal(third.attemptsLeft, 0);
  await negotiate(c, offer, offer.value, 409);
  // Le prix et les attributs forgés dans le corps ne sont jamais utilisés.
  const signed = await request('/draft/buy', { ...c, offerId: offer.id, price: 0, player: { value: 0, overall: 99 } });
  assert.equal(signed.paid, third.counterPrice);
  assert.equal(signed.player.overall, offer.overall);
  assert.equal(signed.newBudget, budget - third.counterPrice);
  await sign(c, offer, 'buy', 409);
  assert.equal((await market(c)).some(p => p.id === offer.id), false);
});

test('offre acceptée, budget et propriété vérifiés avant débit', async () => {
  const c = career(), other = career();
  const [offer] = await market(c);
  const minimum = queryOne('SELECT minimum_price FROM market_offers WHERE id = ?', [offer.id]).minimum_price;
  const accepted = await negotiate(c, offer, minimum);
  assert.equal(accepted.agreedPrice, minimum);
  assert.equal(accepted.counterPrice, null);
  await sign({ teamId: c.teamId, managerId: other.managerId }, offer, 'buy', 403);
  await sign(other, offer, 'buy', 409);
  db.run('UPDATE managers SET budget = ? WHERE id = ?', [minimum - 1, c.managerId]);
  await sign(c, offer, 'buy', 400);
  assert.equal(queryOne('SELECT status FROM market_offers WHERE id = ?', [offer.id]).status, 'accepted');
  db.run('UPDATE managers SET budget = ? WHERE id = ?', [minimum, c.managerId]);
  const signed = await sign(c, offer);
  assert.equal(signed.newBudget, 0);
  assert.equal(signed.paid, minimum);
});

test('prêts : limite, vente interdite, sauvegarde et retour de fin de saison', async () => {
  const c = career();
  const offers = (await market(c)).filter(p => p.loanFee !== null);
  const loans = [];
  for (const offer of offers.slice(0, 3)) {
    const loan = await sign(c, offer, 'loan');
    assert.equal(loan.paid, Math.round(offer.value * .2));
    assert.equal(loan.player.loan_end_season, 1);
    loans.push(loan.player);
  }
  await sign(c, offers[3], 'loan', 400);
  const beforeSale = queryOne('SELECT budget FROM managers WHERE id = ?', [c.managerId]).budget;
  await request('/transfer/sell', { managerId: c.managerId, playerId: loans[0].id }, 'POST', 400);
  assert.equal(queryOne('SELECT budget FROM managers WHERE id = ?', [c.managerId]).budget, beforeSale);
  await request(`/team/${c.teamId}/tactic`, { managerId: c.managerId, tactic: 'counter' }, 'PUT');
  const save = await request(`/manager/${c.managerId}/save`);
  assert.equal(save.version, 3);
  const imported = await request(`/manager/${c.managerId}/load`, { saveData: save });
  assert.equal(imported.team.tactic, 'counter');
  assert.equal(queryAll('SELECT id FROM players WHERE team_id = ? AND loan_end_season = 1', [c.teamId]).length, 3);
  const bad = structuredClone(save);
  bad.teams[0].players[0].loan_end_season = -1;
  await request(`/manager/${c.managerId}/load`, { saveData: bad }, 'POST', 400);
  assert.equal(queryAll('SELECT id FROM players WHERE team_id = ?', [c.teamId]).length, 21);
  const corrupt = structuredClone(save);
  corrupt.teams[0].players[1].id = corrupt.teams[0].players[0].id;
  await request(`/manager/${c.managerId}/load`, { saveData: corrupt }, 'POST', 400);
  assert.equal(queryAll('SELECT id FROM players WHERE team_id = ?', [c.teamId]).length, 21);
  await request(`/season/${c.teamId}/end-season`, { managerId: c.managerId }, 'POST', 400);
  assert.equal(queryAll('SELECT id FROM players WHERE team_id = ? AND loan_end_season = 1', [c.teamId]).length, 3);
  db.run('UPDATE teams SET wins = 26, points = 78 WHERE id = ?', [c.teamId]);
  const end = await request(`/season/${c.teamId}/end-season`, { managerId: c.managerId, difficulty: 'easy' });
  assert.equal(end.team.season, 2);
  assert.equal(end.team.tactic, 'counter');
  assert.equal(end.seasonSummary.loanReturns.length, 3);
  for (const loan of loans) assert.equal(queryOne('SELECT id FROM players WHERE id = ?', [loan.id]), null);
  assert.equal(end.manager.budget, beforeSale + end.seasonSummary.prizePool);
  assert.equal(currentWindow(end.team), 'summer');
});

test('fenêtres été/hiver et offres périmées contrôlées côté serveur', async () => {
  const c = career();
  const [summer] = await market(c);
  await request('/draft/finish', c);
  await sign(c, summer, 'buy', 400);
  await request('/draft/auto', c, 'POST', 400);
  db.run('UPDATE teams SET wins = 13 WHERE id = ?', [c.teamId]);
  const winter = await market(c);
  assert.ok(winter.length <= 14);
  const loanOffer = winter.find(p => p.loanFee !== null);
  assert.equal(loanOffer.loanFee, Math.round(loanOffer.value * .12));
  await sign(c, summer, 'buy', 409);
  const winterLoan = await sign(c, loanOffer, 'loan');
  assert.equal(winterLoan.player.loan_end_season, 1);
  await request('/draft/finish', c);
  assert.equal(queryOne('SELECT winter_window_season FROM teams WHERE id = ?', [c.teamId]).winter_window_season, 1);
  await sign(c, winter[1], 'buy', 400);
  // Deuxième clic ou ancien onglet : terminer de nouveau reste sans effet.
  assert.equal((await request('/draft/finish', c)).team.wins, 13);
});

test('tactiques : arbitrages dans le moteur, fatigue et persistance', async () => {
  const c = career();
  const players = queryAll('SELECT * FROM players WHERE team_id = ?', [c.teamId]);
  const balanced = simulateMatch(players, players);
  assert.deepEqual(balanced.tactics, { home: 'balanced', away: 'balanced' });
  const pressing = simulateMatch(players, players, { homeTactic: 'pressing' });
  const block = simulateMatch(players, players, { homeTactic: 'low_block' });
  const possession = simulateMatch(players, players, { homeTactic: 'possession' });
  assert.ok(pressing.expectedGoals.home > balanced.expectedGoals.home);
  assert.ok(pressing.expectedGoals.away > balanced.expectedGoals.away);
  assert.ok(block.expectedGoals.home < balanced.expectedGoals.home);
  assert.ok(block.expectedGoals.away < balanced.expectedGoals.away);
  assert.ok(possession.possession > balanced.possession);
  const away = simulateMatch(players, players, { awayTactic: 'pressing', homeIsPlayer: false });
  assert.ok(away.expectedGoals.away > balanced.expectedGoals.away);
  const tired = players.map(p => ({ ...p, stamina: 30 }));
  const { applyTactic } = require('../engine/tactics');
  const rating = analyzeTeam(tired);
  assert.equal(applyTactic(rating, 'pressing', tired).attack, rating.attack);
  await request(`/team/${c.teamId}/tactic`, { managerId: c.managerId, tactic: 'pressing' }, 'PUT');
  await request(`/team/${c.teamId}/tactic`, { managerId: 'stranger', tactic: 'balanced' }, 'PUT', 403);
  await request(`/team/${c.teamId}/tactic`, { managerId: c.managerId, tactic: '__proto__' }, 'PUT', 400);
  applyMatchEffects(db, c.teamId, true, false, 1, 'pressing');
  assert.equal(queryOne('SELECT stamina FROM players WHERE team_id = ? AND is_starter = 1', [c.teamId]).stamina, 85);
  assert.equal(queryOne('SELECT stamina FROM players WHERE team_id = ? AND is_starter = 0', [c.teamId]).stamina, 100);
  saveDb();
  const SQL = await require('sql.js')();
  const reopened = new SQL.Database(fs.readFileSync(process.env.DB_PATH));
  assert.equal(reopened.exec(`SELECT tactic FROM teams WHERE id = '${c.teamId}'`)[0].values[0][0], 'pressing');
  assert.ok(reopened.exec('SELECT COUNT(*) FROM market_offers')[0].values[0][0] > 0);
  reopened.close();
});

test('tactiques transmises en championnat et dans les deux coupes, domicile et extérieur', async () => {
  const c = career();
  const eleven = queryAll('SELECT id, slot_index FROM players WHERE team_id = ? AND is_starter = 1', [c.teamId]);
  const recover = () => {
    db.run('UPDATE players SET stamina = 100, injured_matches = 0, suspended_matches = 0 WHERE team_id = ?', [c.teamId]);
    for (const p of eleven) db.run('UPDATE players SET is_starter = 1, slot_index = ? WHERE id = ?', [p.slot_index, p.id]);
  };
  const checkFitness = (expected) => {
    const fit = queryAll('SELECT stamina FROM players WHERE team_id = ? AND is_starter = 1', [c.teamId]);
    assert.ok(fit.length >= 10);
    assert.ok(fit.every(p => p.stamina === expected));
  };
  await request(`/team/${c.teamId}/tactic`, { managerId: c.managerId, tactic: 'pressing' }, 'PUT');
  const sides = new Set();
  // La journée 14 inverse le terrain de la journée 1, quelle que soit la graine.
  for (const played of [0, 13]) {
    db.run('UPDATE teams SET wins = ?, draws = 0, losses = 0 WHERE id = ?', [played, c.teamId]);
    recover();
    const { match } = await request(`/season/${c.teamId}/play-matchday`, { difficulty: 'normal' });
    assert.equal(match.tactics[match.isHome ? 'home' : 'away'], 'pressing');
    sides.add(match.isHome);
    checkFitness(85);
  }
  assert.equal(sides.size, 2);
  recover();
  db.run('UPDATE teams SET wins = 8 WHERE id = ?', [c.teamId]);
  const cup = await request(`/season/${c.teamId}/cup/play`, { difficulty: 'normal' });
  assert.equal(cup.tactics.home, 'pressing');
  checkFitness(88);
  db.run('UPDATE teams SET division = 7 WHERE id = ?', [c.teamId]);
  await request(`/season/${c.teamId}/cl/init`, {});
  const clSides = new Set();
  for (let i = 0; i < 6; i++) {
    recover();
    const { result } = await request(`/season/${c.teamId}/cl/play`, {});
    assert.equal(result.tactics[result.isHome ? 'home' : 'away'], 'pressing');
    clSides.add(result.isHome);
    checkFitness(85);
  }
  assert.equal(clSides.size, 2);
  // Les phases à élimination directe utilisent un chemin de simulation distinct.
  for (const leg of [1, 2]) {
    recover();
    db.run('UPDATE teams SET cl_data = ? WHERE id = ?', [JSON.stringify({
      phase: 'quarter_final', results: [], totalEarnings: 0,
      knockout: { nextMatch: { opponent: 'Test Europe', opponentOverall: 70, leg }, firstLegPlayerGoals: 0, firstLegOpponentGoals: 100 },
    }), c.teamId]);
    const { result } = await request(`/season/${c.teamId}/cl/play`, {});
    assert.equal(result.tactics[leg === 1 ? 'home' : 'away'], 'pressing');
    checkFitness(85);
  }
});

test('recrutement refusé à 35 joueurs et import des anciennes sauvegardes', async () => {
  const c = career(35);
  const [offer] = await market(c);
  const budget = queryOne('SELECT budget FROM managers WHERE id = ?', [c.managerId]).budget;
  await sign(c, offer, 'buy', 400);
  await sign(c, offer, 'loan', 400);
  assert.equal(queryOne('SELECT budget FROM managers WHERE id = ?', [c.managerId]).budget, budget);
  const save = await request(`/manager/${c.managerId}/save`);
  save.version = 2;
  delete save.teams[0].tactic;
  delete save.teams[0].summer_window_season;
  for (const p of save.teams[0].players) delete p.loan_end_season;
  const imported = await request(`/manager/${c.managerId}/load`, { saveData: save });
  assert.equal(imported.team.tactic, 'balanced');
  assert.equal(queryAll('SELECT id FROM players WHERE team_id = ? AND loan_end_season IS NOT NULL', [c.teamId]).length, 0);
});
