/**
 * Sélection de composition : un joueur indisponible ne doit jamais être aligné,
 * ni manuellement, ni par la composition automatique.
 *
 * La logique « Meilleur XI » vit côté client (Season.jsx) mais doit rester
 * cohérente avec la validation serveur : on reproduit ici l'algorithme pour
 * verrouiller la règle, et on vérifie que les deux côtés s'accordent.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const formations = require('../data/formations');
const discipline = require('../engine/discipline');

/** Réplique de isSelectable() de Season.jsx. */
const isSelectable = (p) => (p.suspended_matches || 0) === 0 && (p.injured_matches || 0) === 0;

/** Réplique de buildBestEleven() de Season.jsx, filtre inclus. */
function buildBestEleven(squad, formationSlots) {
  const next = {};
  const used = new Set();
  const selectionnables = squad.filter(isSelectable);

  const scoreFor = (p, slotPos) =>
    p.overall * formations.getPositionFit(p.position, slotPos)
    * (0.85 + Math.min(p.stamina, 100) / 100 * 0.15);

  const order = formationSlots
    .map((pos, idx) => ({ pos, idx }))
    .sort((a, b) => (formations.getPositionGroup(a.pos) === 'gk' ? 0 : 1)
                  - (formations.getPositionGroup(b.pos) === 'gk' ? 0 : 1));

  for (const { pos, idx } of order) {
    let best = null, bestScore = -1;
    for (const p of selectionnables) {
      if (used.has(p.id)) continue;
      const s = scoreFor(p, pos);
      if (s > bestScore) { bestScore = s; best = p; }
    }
    if (best) { next[idx] = best.id; used.add(best.id); }
  }
  return next;
}

function squadOf(n, mutate = () => ({})) {
  const postes = ['GAR', 'ARG', 'DC', 'DC', 'ARD', 'MG', 'MC', 'MC', 'MD', 'BU', 'BU',
                  'GAR', 'DC', 'MC', 'BU', 'ARG', 'MD', 'AIG'];
  return Array.from({ length: n }, (_, i) => ({
    id: 'p' + i,
    first_name: 'J', last_name: 'Joueur' + i,
    position: postes[i % postes.length],
    overall: 50 + (i % 25),
    stamina: 100, morale: 70,
    suspended_matches: 0, injured_matches: 0,
    ...mutate(i),
  }));
}

// =====================================================================
test('Meilleur XI : aucun joueur suspendu n’est retenu', () => {
  // Les meilleurs joueurs sont précisément ceux qui sont suspendus.
  const squad = squadOf(18, (i) => (i >= 14 ? { suspended_matches: 2, overall: 95 } : {}));
  const slots = formations.getFormationSlots('4-4-2');
  const xi = buildBestEleven(squad, slots);

  const retenus = Object.values(xi).map(id => squad.find(p => p.id === id));
  assert.equal(retenus.length, 11);
  for (const p of retenus) {
    assert.equal(p.suspended_matches, 0, `${p.last_name} est suspendu et a été aligné`);
  }
});

test('Meilleur XI : aucun joueur blessé n’est retenu', () => {
  const squad = squadOf(18, (i) => (i >= 13 ? { injured_matches: 4, overall: 99 } : {}));
  const slots = formations.getFormationSlots('4-3-3');
  const xi = buildBestEleven(squad, slots);

  const retenus = Object.values(xi).map(id => squad.find(p => p.id === id));
  assert.equal(retenus.length, 11);
  for (const p of retenus) {
    assert.equal(p.injured_matches, 0, `${p.last_name} est blessé et a été aligné`);
  }
});

test('Meilleur XI : la composition produite passe la validation serveur', () => {
  const squad = squadOf(18, (i) => (i % 5 === 0 ? { injured_matches: 2 } : i % 7 === 0 ? { suspended_matches: 1 } : {}));
  const slots = formations.getFormationSlots('4-2-3-1');
  const xi = buildBestEleven(squad, slots);

  for (const id of Object.values(xi)) {
    const p = squad.find(x => x.id === id);
    assert.ok(discipline.isAvailable(p),
      `le serveur rejetterait ${p.last_name} : ${discipline.unavailabilityReason(p)}`);
  }
});

test('Meilleur XI : effectif disponible insuffisant, aucune compo complète', () => {
  // 18 joueurs mais 10 seulement disponibles
  const squad = squadOf(18, (i) => (i >= 10 ? { injured_matches: 3 } : {}));
  const slots = formations.getFormationSlots('4-4-2');
  const xi = buildBestEleven(squad, slots);
  assert.ok(Object.keys(xi).length < slots.length,
    'on ne doit pas pouvoir remplir 11 postes avec 10 joueurs disponibles');
});

test('Meilleur XI : sans indisponibilité, les 11 postes sont pourvus', () => {
  const squad = squadOf(18);
  for (const f of Object.keys(formations.FORMATIONS)) {
    const slots = formations.getFormationSlots(f);
    const xi = buildBestEleven(squad, slots);
    assert.equal(Object.keys(xi).length, 11, `${f} : composition incomplète`);
    assert.equal(new Set(Object.values(xi)).size, 11, `${f} : un joueur occupe deux postes`);
  }
});

test('client et serveur appliquent la même règle de disponibilité', () => {
  const cas = [
    { suspended_matches: 0, injured_matches: 0, attendu: true },
    { suspended_matches: 1, injured_matches: 0, attendu: false },
    { suspended_matches: 0, injured_matches: 1, attendu: false },
    { suspended_matches: 2, injured_matches: 3, attendu: false },
  ];
  for (const c of cas) {
    assert.equal(isSelectable(c), discipline.isAvailable(c),
      `divergence client/serveur sur ${JSON.stringify(c)}`);
    assert.equal(isSelectable(c), c.attendu);
  }
});

test('le client filtre bien les indisponibles dans buildBestEleven', () => {
  // Vérifie que le code source contient réellement le garde-fou : si quelqu'un
  // retire le filtre, ce test échoue même si la réplique ci-dessus reste juste.
  const src = fs.readFileSync(path.join(__dirname, '../../client/src/pages/Season.jsx'), 'utf8');
  assert.match(src, /function isSelectable\s*\(/, 'isSelectable absent de Season.jsx');
  assert.match(src, /squad\.filter\(isSelectable\)/, 'buildBestEleven ne filtre plus les indisponibles');
});
