const test = require('node:test');
const assert = require('node:assert');
const { buildSeasonFixtures, fixturesForWeek, findFixture, seedFor, mulberry32, hashSeed } = require('../engine/calendar');
const { simulateAiMatchByStrength } = require('../engine/match');

const equipes = (n) => Array.from({ length: n }, (_, i) => `t${i + 1}`);

test('14 equipes donnent exactement 26 journees (aller-retour)', () => {
  const fixtures = buildSeasonFixtures(equipes(14), 's1-d1');
  assert.strictEqual(fixtures.length, 26);
});

test('chaque equipe joue une fois et une seule par journee', () => {
  const ids = equipes(14);
  const fixtures = buildSeasonFixtures(ids, 's1-d1');

  fixtures.forEach((round, i) => {
    assert.strictEqual(round.length, 7, `journee ${i + 1} : 7 affiches attendues`);
    const engages = round.flat();
    assert.strictEqual(new Set(engages).size, 14, `journee ${i + 1} : doublon d'equipe`);
  });
});

test('toutes les equipes ont le meme nombre de matchs joues en fin de saison', () => {
  const ids = equipes(14);
  const fixtures = buildSeasonFixtures(ids, 's1-d1');

  const joues = Object.fromEntries(ids.map((id) => [id, 0]));
  fixtures.flat().forEach(([h, a]) => { joues[h]++; joues[a]++; });

  // C'etait le bug : 0 a 3 matchs joues selon les equipes apres 3 journees.
  Object.entries(joues).forEach(([id, n]) => {
    assert.strictEqual(n, 26, `${id} devrait avoir joue 26 matchs`);
  });
});

test('chaque equipe en affronte une autre deux fois, une a domicile une a l exterieur', () => {
  const ids = equipes(14);
  const fixtures = buildSeasonFixtures(ids, 's1-d1');

  const confrontations = new Map();
  fixtures.flat().forEach(([h, a]) => {
    const cle = [h, a].sort().join('|');
    if (!confrontations.has(cle)) confrontations.set(cle, { domicile: new Set() });
    confrontations.get(cle).domicile.add(h);
  });

  assert.strictEqual(confrontations.size, (14 * 13) / 2, 'toutes les paires doivent se rencontrer');
  confrontations.forEach((v, cle) => {
    assert.strictEqual(v.domicile.size, 2, `${cle} : les deux equipes doivent recevoir une fois`);
  });
});

test('le calendrier est deterministe : meme graine, meme calendrier', () => {
  const a = buildSeasonFixtures(equipes(14), 's3-d2');
  const b = buildSeasonFixtures(equipes(14), 's3-d2');
  assert.deepStrictEqual(a, b);
});

test('une graine differente donne un calendrier different', () => {
  const a = buildSeasonFixtures(equipes(14), 's1-d1');
  const b = buildSeasonFixtures(equipes(14), 's2-d1');
  assert.notDeepStrictEqual(a, b);
});

test("l'ordre d'arrivee des equipes n'influe pas sur le calendrier", () => {
  const a = buildSeasonFixtures(equipes(14), 's1-d1');
  const b = buildSeasonFixtures([...equipes(14)].reverse(), 's1-d1');
  assert.deepStrictEqual(a, b);
});

test('un nombre impair d equipes laisse une exemptee, jamais de doublon', () => {
  const ids = equipes(13);
  const fixtures = buildSeasonFixtures(ids, 's1-d3');

  fixtures.forEach((round, i) => {
    assert.strictEqual(round.length, 6, `journee ${i + 1} : 6 affiches (une equipe exemptee)`);
    const engages = round.flat();
    assert.strictEqual(new Set(engages).size, 12, `journee ${i + 1} : doublon d'equipe`);
  });
});

test('findFixture donne un adversaire et un terrain coherents', () => {
  const ids = equipes(14);
  const f = findFixture(ids, 's1-d1', 1, 't1');

  assert.ok(f, 'une affiche doit exister');
  assert.notStrictEqual(f.opponentId, 't1', 'une equipe ne peut pas s affronter elle-meme');

  const round = fixturesForWeek(ids, 's1-d1', 1);
  const affiche = round.find(([h, a]) => h === 't1' || a === 't1');
  assert.deepStrictEqual(
    f.isHome ? [ 't1', f.opponentId ] : [ f.opponentId, 't1' ],
    affiche
  );
});

test('le joueur alterne domicile et exterieur sur la saison', () => {
  const ids = equipes(14);
  let domicile = 0;
  for (let week = 1; week <= 26; week++) {
    const f = findFixture(ids, 's1-d1', week, 't1');
    if (f && f.isHome) domicile++;
  }
  // Le joueur recevait ses 26 matchs : avantage du terrain permanent.
  assert.strictEqual(domicile, 13, '13 matchs a domicile, 13 a l exterieur');
});

test('au-dela du calendrier, les journees rebouclent sans planter', () => {
  const round = fixturesForWeek(equipes(14), 's1-d1', 40);
  assert.strictEqual(round.length, 7);
});

test('deux sauvegardes ont des calendriers distincts', () => {
  const ids = equipes(14);
  const a = buildSeasonFixtures(ids, seedFor('sauvegarde-A', 1, 1));
  const b = buildSeasonFixtures(ids, seedFor('sauvegarde-B', 1, 1));
  assert.notDeepStrictEqual(a, b, 'chaque partie doit avoir son propre championnat');
});

test('un match IA rejoue avec la meme graine donne le meme score', () => {
  const graine = () => mulberry32(hashSeed('partie-1|3|equipeA|equipeB'));
  const un = simulateAiMatchByStrength(72, 68, graine());
  const deux = simulateAiMatchByStrength(72, 68, graine());
  // Sans cette garantie, le classement changerait a chaque affichage.
  assert.deepStrictEqual(un, deux);
});

test('deux affiches differentes ne partagent pas le meme score', () => {
  const scores = new Set();
  for (let week = 1; week <= 20; week++) {
    const r = simulateAiMatchByStrength(72, 68, mulberry32(hashSeed(`p|${week}|A|B`)));
    scores.add(`${r.homeGoals}-${r.awayGoals}`);
  }
  assert.ok(scores.size > 1, 'les resultats doivent varier d une journee a l autre');
});

test('sans graine fournie, la simulation reste aleatoire', () => {
  const scores = new Set();
  for (let i = 0; i < 60; i++) {
    const r = simulateAiMatchByStrength(72, 68);
    scores.add(`${r.homeGoals}-${r.awayGoals}`);
  }
  assert.ok(scores.size > 1, 'le comportement par defaut ne doit pas etre fige');
});
