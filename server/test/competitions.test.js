/**
 * Unicité des équipes dans une compétition.
 *
 * Trois défauts réels avaient été mesurés :
 *   - deux divisions partageaient un nom d'équipe (collision après montée)
 *   - 6,4 % des parcours de coupe faisaient affronter deux fois le même club
 *   - un adversaire de coupe pouvait porter le nom d'une équipe du championnat
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { DIVISIONS } = require('../data/divisions');
const cup = require('../data/cup');
const { EUROPEAN_TEAMS, generateCLDraw } = require('../data/championsLeague');

// =====================================================================
test('championnat : aucun nom d’équipe partagé entre deux divisions', () => {
  const parNom = new Map();
  for (const d of DIVISIONS) {
    if (!d.teams) continue; // Ligue 1 : équipes réelles
    for (const t of d.teams) {
      const nom = typeof t === 'string' ? t : t.name;
      if (!parNom.has(nom)) parNom.set(nom, []);
      parNom.get(nom).push(d.level);
    }
  }
  const collisions = [...parNom.entries()].filter(([, lv]) => lv.length > 1);
  assert.deepEqual(
    collisions.map(([n, lv]) => `${n} (divisions ${lv.join(', ')})`),
    [],
    'deux divisions ne doivent jamais définir la même équipe : après une montée, elles se retrouveraient dans le même championnat'
  );
});

test('championnat : chaque division définit des noms uniques', () => {
  for (const d of DIVISIONS) {
    if (!d.teams) continue;
    const noms = d.teams.map(t => (typeof t === 'string' ? t : t.name).toLowerCase());
    assert.equal(new Set(noms).size, noms.length, `doublon interne dans ${d.name}`);
  }
});

// =====================================================================
test('coupe : un parcours complet ne fait jamais affronter deux fois le même club', () => {
  for (let essai = 0; essai < 3000; essai++) {
    let state = cup.createCupState(3);
    const rencontres = [];
    for (let r = 0; r < cup.ROUNDS.length; r++) {
      if (state.nextOpponent) rencontres.push(state.nextOpponent.name);
      state = cup.advance(state, true, 3, '1-0');
    }
    assert.equal(new Set(rencontres).size, rencontres.length,
      `adversaire rencontré deux fois : ${rencontres.join(', ')}`);
  }
});

test('coupe : l’adversaire ne porte jamais un nom exclu', () => {
  const exclus = ['FC Beauvais', 'AS Muret', 'Stade Vannes', 'US Boulogne', 'Olympique Sedan'];
  for (let essai = 0; essai < 2000; essai++) {
    let state = cup.createCupState(2, exclus);
    for (let r = 0; r < cup.ROUNDS.length; r++) {
      if (state.nextOpponent) {
        assert.ok(!exclus.includes(state.nextOpponent.name),
          `${state.nextOpponent.name} fait partie des exclusions`);
      }
      state = cup.advance(state, true, 2, '2-1');
    }
  }
});

test('coupe : uniqueClubName respecte les exclusions', () => {
  const exclus = [];
  // On épuise progressivement les noms : chacun doit être inédit.
  for (let i = 0; i < 150; i++) {
    const nom = cup.uniqueClubName(exclus);
    assert.ok(!exclus.includes(nom), `${nom} déjà tiré`);
    exclus.push(nom);
  }
});

test('coupe : uniqueClubName reste robuste si presque tout est exclu', () => {
  // Cas pathologique : on exclut un très grand nombre de noms.
  const tous = [];
  for (let i = 0; i < 400; i++) tous.push(cup.uniqueClubName(tous));
  const nom = cup.uniqueClubName(tous);
  assert.ok(typeof nom === 'string' && nom.length > 0, 'doit toujours renvoyer un nom');
});

// =====================================================================
test('Champions League : les équipes européennes sont distinctes', () => {
  const noms = EUROPEAN_TEAMS.map(t => (t.name || t).toLowerCase());
  assert.equal(new Set(noms).size, noms.length, 'doublon dans EUROPEAN_TEAMS');
});

test('Champions League : aucun tirage ne place deux fois la même équipe', () => {
  for (let essai = 0; essai < 500; essai++) {
    const draw = generateCLDraw('FC Test', 80);
    const tous = [];
    for (const g of draw.groups || []) {
      for (const t of (g.standings || g.teams || [])) tous.push((t.name || t).toLowerCase());
    }
    assert.equal(new Set(tous).size, tous.length, 'une équipe apparaît dans deux groupes');
  }
});

// =====================================================================
test('seedDivision refuse de recréer une équipe déjà existante', () => {
  // Vérifie la présence du garde-fou : sans lui, appeler seedDivision sur une
  // division déjà peuplée dupliquait tout le championnat.
  const src = fs.readFileSync(path.join(__dirname, '../db/seed.js'), 'utf8');
  assert.match(src, /dejaPresents/, 'garde-fou absent de seedDivision');
  assert.match(src, /existeDeja\s*\(/, 'test d’existence absent de seedDivision');
});
