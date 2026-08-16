/**
 * Tests du moteur de jeu — exécutables avec `npm test` (node:test, sans dépendance).
 *
 * Couvre les règles qui ont déjà causé des régressions :
 *   - le placement et la formation doivent influencer le résultat
 *   - un joueur est à l'aise partout dans sa ligne
 *   - client et serveur doivent partager les mêmes valeurs d'adéquation
 *   - le marché doit rester filtrable sans planter
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const match = require('../engine/match');
const formations = require('../data/formations');
const progression = require('../engine/progression');
const discipline = require('../engine/discipline');
const cup = require('../data/cup');
const rules = require('../data/rules');
const { DRAFT_POOL, calculateDraftPrice } = require('../data/draftPool');

// ---------- outils ----------
function makePlayer(pos, i, slot, over = 70, extra = {}) {
  return {
    id: 'p' + i, first_name: 'J', last_name: 'Test' + i,
    position: pos, overall: over,
    pace: over, shooting: over, passing: over,
    dribbling: over, defending: over, physical: over,
    stamina: 100, morale: 70, is_starter: 1, slot_index: slot,
    ...extra,
  };
}
const buildXI = (formation, over = 70) =>
  formations.getFormationSlots(formation).map((p, i) => makePlayer(p, i, i, over));

// =====================================================================
test('formations : chaque schéma compte exactement 11 postes', () => {
  for (const [name, slots] of Object.entries(formations.FORMATIONS)) {
    assert.equal(slots.length, 11, `${name} devrait avoir 11 postes`);
  }
});

test('formations : tous les postes utilisés sont connus de la taxonomie', () => {
  const connus = new Set([...formations.GK_POSITIONS, ...formations.DEF_POSITIONS,
                          ...formations.MID_POSITIONS, ...formations.ATT_POSITIONS]);
  for (const slots of Object.values(formations.FORMATIONS)) {
    for (const p of slots) assert.ok(connus.has(p), `poste inconnu : ${p}`);
  }
});

test('adéquation : un joueur est pleinement à l’aise partout dans sa ligne', () => {
  const lignes = [formations.DEF_POSITIONS, formations.MID_POSITIONS, formations.ATT_POSITIONS];
  for (const ligne of lignes) {
    for (const a of ligne) {
      for (const b of ligne) {
        assert.equal(formations.getPositionFit(a, b), 1, `${a} vers ${b} devrait valoir 1`);
      }
    }
  }
});

test('adéquation : changer de ligne est pénalisé, le gardien surtout', () => {
  assert.equal(formations.getPositionFit('MC', 'BU'), 0.78);   // ligne voisine
  assert.equal(formations.getPositionFit('DC', 'BU'), 0.64);   // deux lignes
  assert.equal(formations.getPositionFit('GAR', 'DC'), 0.45);  // gardien sur le terrain
  assert.equal(formations.getPositionFit('BU', 'GAR'), 0.40);  // joueur de champ dans les buts
});

test('adéquation : client et serveur partagent la même table', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const lire = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
  const extraire = (src) => (src.match(/const DISTANCE_FIT = \{[^}]*\}/) || [''])[0];
  assert.equal(
    extraire(lire('../data/formations.js')),
    extraire(lire('../../client/src/data/formations.js')),
    'DISTANCE_FIT diffère entre client et serveur'
  );
});

// =====================================================================
test('moteur : permuter les joueurs dans une ligne ne change rien', () => {
  const exact = buildXI('4-3-3');
  const permute = ['GAR', 'ARD', 'DC', 'DC', 'ARG', 'MC', 'MC', 'MC', 'BU', 'AID', 'AIG']
    .map((p, i) => makePlayer(p, i, i));

  const a = match.analyzeTeam(exact, '4-3-3');
  const b = match.analyzeTeam(permute, '4-3-3');
  const r = (x) => Math.round(x * 100) / 100;

  assert.equal(r(a.attack), r(b.attack));
  assert.equal(r(a.midfield), r(b.midfield));
  assert.equal(r(a.defense), r(b.defense));
});

test('moteur : mélanger les lignes dégrade réellement l’équipe', () => {
  const bon = buildXI('4-4-2');
  const chaos = ['GAR', 'BU', 'BU', 'AIG', 'AID', 'MC', 'MC', 'MG', 'MD', 'DC', 'DC']
    .map((p, i) => makePlayer(p, i, i));

  const a = match.analyzeTeam(bon, '4-4-2');
  const b = match.analyzeTeam(chaos, '4-4-2');
  assert.ok(b.attack < a.attack - 5, 'l’attaque devrait chuter');
  assert.ok(b.defense < a.defense - 5, 'la défense devrait chuter');
});

test('moteur : une équipe sans slot_index garde le comportement historique', () => {
  const legacy = buildXI('4-4-2').map(p => { const c = { ...p }; delete c.slot_index; return c; });
  const a = match.analyzeTeam(legacy);
  assert.ok(a.attack > 60 && a.defense > 60, 'les équipes IA ne doivent pas être pénalisées');
});

test('moteur : la formation modifie l’équilibre des lignes', () => {
  const off = formations.getFormationWeights('3-4-3');
  const def = formations.getFormationWeights('5-3-2');
  assert.ok(off.attack > def.attack, '3-4-3 doit être plus offensif que 5-3-2');
  assert.ok(def.defense > off.defense, '5-3-2 doit être plus défensif que 3-4-3');
});

test('moteur : la difficulté influence désormais la simulation', () => {
  const nous = buildXI('4-4-2', 70);
  const eux = buildXI('4-4-2', 70);
  const serie = (difficulty) => {
    let buts = 0;
    for (let i = 0; i < 3000; i++) {
      buts += match.simulateMatch(nous, eux, {
        homeFormation: '4-4-2', awayFormation: '4-4-2', difficulty, homeIsPlayer: true,
      }).awayGoals;
    }
    return buts / 3000;
  };
  const facile = serie('easy');
  const difficile = serie('hard');
  assert.ok(difficile > facile,
    `l’adversaire doit marquer plus en difficile (facile ${facile.toFixed(2)}, difficile ${difficile.toFixed(2)})`);
});

test('moteur : un match produit des événements exploitables', () => {
  const nous = buildXI('4-4-2');
  const eux = buildXI('4-4-2');
  let vuBut = false, vuCarton = false;
  for (let i = 0; i < 200; i++) {
    const r = match.simulateMatch(nous, eux, { homeFormation: '4-4-2', awayFormation: '4-4-2' });
    assert.ok(Array.isArray(r.events));
    assert.ok(r.cards && r.injuries && r.scorers, 'cards, injuries et scorers doivent être renvoyés');
    for (const e of r.events) {
      if (e.type === 'goal') { vuBut = true; assert.ok(e.playerId, 'un but doit porter l’identifiant du buteur'); }
      if (e.type === 'yellow_card' || e.type === 'red_card') { vuCarton = true; assert.ok(e.playerId); }
    }
  }
  assert.ok(vuBut, 'aucun but sur 200 matchs');
  assert.ok(vuCarton, 'aucun carton sur 200 matchs');
});

test('moteur : les scores restent dans des bornes crédibles', () => {
  const nous = buildXI('4-4-2');
  const eux = buildXI('4-4-2');
  for (let i = 0; i < 1000; i++) {
    const r = match.simulateMatch(nous, eux, { homeFormation: '4-4-2', awayFormation: '4-4-2' });
    assert.ok(r.homeGoals >= 0 && r.homeGoals <= 7);
    assert.ok(r.awayGoals >= 0 && r.awayGoals <= 7);
  }
});

// =====================================================================
test('discipline : disponibilité et motif', () => {
  assert.equal(discipline.isAvailable({ suspended_matches: 0, injured_matches: 0 }), true);
  assert.equal(discipline.isAvailable({ suspended_matches: 1, injured_matches: 0 }), false);
  assert.equal(discipline.isAvailable({ suspended_matches: 0, injured_matches: 3 }), false);
  assert.match(discipline.unavailabilityReason({ suspended_matches: 2, injured_matches: 0 }), /suspendu/);
  assert.match(discipline.unavailabilityReason({ suspended_matches: 0, injured_matches: 4 }), /blessé/);
  assert.equal(discipline.unavailabilityReason({ suspended_matches: 0, injured_matches: 0 }), null);
});

// =====================================================================
test('progression : les jeunes progressent, les vétérans déclinent', () => {
  const moyenne = (age, appearances) => {
    let total = 0;
    for (let i = 0; i < 800; i++) {
      total += progression.evolvePlayer({ age, overall: 65, appearances, pace: 65, shooting: 65, passing: 65, dribbling: 65, defending: 65, physical: 65 }, 26).delta;
    }
    return total / 800;
  };
  assert.ok(moyenne(18, 20) > 1, 'un jeune titulaire doit progresser');
  assert.ok(moyenne(35, 20) < 0, 'un vétéran doit décliner');
  assert.ok(moyenne(19, 20) > moyenne(19, 0), 'jouer doit accélérer la progression');
});

test('progression : le niveau reste dans des bornes valides', () => {
  for (const age of [16, 20, 25, 30, 35, 40]) {
    for (let i = 0; i < 300; i++) {
      const ev = progression.evolvePlayer({ age, overall: 50, appearances: 10, pace: 50, shooting: 50, passing: 50, dribbling: 50, defending: 50, physical: 50 }, 26);
      assert.ok(ev.overall >= 30 && ev.overall <= 99, `niveau hors bornes : ${ev.overall}`);
      assert.ok(ev.value > 0, 'la valeur doit rester positive');
      for (const k of ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical']) {
        assert.ok(ev.stats[k] >= 10 && ev.stats[k] <= 99, `${k} hors bornes`);
      }
    }
  }
});

// =====================================================================
test('coupe : le parcours va des 64es à la finale', () => {
  let state = cup.createCupState(1);
  assert.equal(state.roundIndex, 0);
  assert.equal(state.eliminated, false);

  for (let i = 0; i < cup.ROUNDS.length; i++) {
    assert.ok(cup.getRound(state), 'un tour doit être disponible');
    state = cup.advance(state, true, 1, '2-0');
  }
  assert.equal(state.won, true, 'gagner tous les tours doit donner la coupe');
  assert.equal(state.history.length, cup.ROUNDS.length);
});

test('coupe : une défaite élimine', () => {
  let state = cup.createCupState(3);
  state = cup.advance(state, false, 3, '0-1');
  assert.equal(state.eliminated, true);
  assert.equal(cup.isRoundAvailable(state, 99), false);
  assert.match(cup.describeResult(state), /Éliminé/);
});

test('coupe : un tour n’est jouable qu’à partir de sa journée', () => {
  const state = cup.createCupState(1);
  const round = cup.getRound(state);
  assert.equal(cup.isRoundAvailable(state, round.minMatchday - 1), false);
  assert.equal(cup.isRoundAvailable(state, round.minMatchday), true);
});

// =====================================================================
test('dialogues : toutes les clés d’effets sont gérées par le serveur', () => {
  const { CONVERSATIONS } = require('../data/conversations');
  // Doit refléter exactement ce que resolve-conversation sait appliquer.
  const gerees = new Set(['morale', 'stamina', 'overall', 'budget', 'clear_discontent', 'force_transfer']);
  const inconnues = [];
  for (const c of CONVERSATIONS) {
    for (const ch of c.choices) {
      for (const k of Object.keys(ch.effects || {})) {
        if (!gerees.has(k)) inconnues.push(`${c.id}.${ch.id}.${k}`);
      }
    }
  }
  assert.deepEqual(inconnues, [], 'effets non appliqués par le serveur');
});

test('dialogues : les identifiants et les choix sont uniques', () => {
  const { CONVERSATIONS } = require('../data/conversations');
  const vus = new Set();
  for (const c of CONVERSATIONS) {
    assert.ok(!vus.has(c.id), `dialogue dupliqué : ${c.id}`);
    vus.add(c.id);
    const choix = new Set();
    for (const ch of c.choices) {
      assert.ok(!choix.has(ch.id), `choix dupliqué dans ${c.id} : ${ch.id}`);
      choix.add(ch.id);
      assert.ok(ch.text && ch.response, `${c.id}.${ch.id} incomplet`);
    }
  }
});

test('dialogues : un joueur qui veut partir a toujours de quoi discuter', () => {
  const { getRandomConversation, buildContext } = require('../data/conversations');
  const partant = {
    age: 26, morale: 30, stamina: 80, overall: 70, is_starter: 0,
    position: 'MC', transfer_request: 1, unhappy_streak: 6,
  };
  const ctx = buildContext({ wins: 5, draws: 3, losses: 8, division: 3, season: 2 }, [partant], []);

  const vus = new Set();
  for (let i = 0; i < 2000; i++) {
    const c = getRandomConversation(partant, ctx);
    assert.ok(c, 'un dialogue doit toujours être disponible');
    vus.add(c.id);
  }
  assert.ok(vus.has('transfer_request_talk'), 'le dialogue de départ doit pouvoir sortir');

  // Au moins un choix doit permettre d’annuler la procédure, sinon le dialogue
  // serait purement décoratif.
  const { CONVERSATIONS } = require('../data/conversations');
  const conv = CONVERSATIONS.find(c => c.id === 'transfer_request_talk');
  assert.ok(conv.choices.some(ch => ch.effects && ch.effects.clear_discontent),
    'aucun choix ne permet de retenir le joueur');
});

test('dialogues : les dialogues de départ ne sortent pas pour un joueur satisfait', () => {
  const { getRandomConversation, buildContext } = require('../data/conversations');
  const heureux = {
    age: 26, morale: 85, stamina: 90, overall: 60, is_starter: 1,
    position: 'MC', transfer_request: 0, unhappy_streak: 0, appearances: 20,
  };
  const ctx = buildContext({ wins: 12, draws: 4, losses: 3, division: 3, season: 2 }, [heureux], []);

  const interdits = ['transfer_request_talk', 'wants_out_playtime', 'wants_out_ambition', 'farewell', 'unhappy_warning'];
  for (let i = 0; i < 1500; i++) {
    const c = getRandomConversation(heureux, ctx);
    assert.ok(!interdits.includes(c.id), `${c.id} ne devrait pas sortir pour un joueur satisfait`);
  }
});

test('moral : les griefs sont correctement identifiés', () => {
  const morale = require('../engine/morale');

  assert.deepEqual(morale.grievances({ morale: 80, overall: 60, is_starter: 1, appearances: 20 }, { matchday: 20, division: 1 }), [],
    'un titulaire au moral haut ne doit avoir aucun grief');

  assert.ok(morale.grievances({ morale: 25, overall: 60, is_starter: 1, appearances: 20 }, { matchday: 20, division: 1 })
    .includes('moral au plus bas'));

  assert.ok(morale.grievances({ morale: 80, overall: 70, is_starter: 0, appearances: 1 }, { matchday: 20, division: 1 })
    .includes('manque de temps de jeu'), 'un bon joueur peu utilisé doit se plaindre');

  assert.ok(morale.grievances({ morale: 80, overall: 85, is_starter: 1, appearances: 20 }, { matchday: 20, division: 1 })
    .includes('ambition sportive'), 'un joueur trop fort pour sa division doit vouloir partir');
});

test('moral : un joueur satisfait ne déclenche jamais de départ', () => {
  const morale = require('../engine/morale');
  const heureux = { morale: 85, overall: 60, is_starter: 1, appearances: 20, unhappy_streak: 0, transfer_request: 0 };
  assert.equal(morale.moodLabel(heureux), null);
});

test('moral : les paliers de la procédure sont cohérents', () => {
  const morale = require('../engine/morale');
  assert.ok(morale.REQUEST_THRESHOLD > 0, 'il faut un délai avant la demande');
  assert.ok(morale.DEPARTURE_THRESHOLD > morale.REQUEST_THRESHOLD,
    'le départ doit venir après la demande, pour laisser réagir');
  assert.ok(morale.MORALE_APPEASED > morale.MORALE_UNHAPPY,
    'la zone d’apaisement doit être au-dessus du seuil de mécontentement');
});

test('moral : l’étiquette reflète l’avancement de la procédure', () => {
  const morale = require('../engine/morale');
  assert.equal(morale.moodLabel({ morale: 30, unhappy_streak: 0, transfer_request: 0 }).level, 'low');
  assert.equal(morale.moodLabel({ morale: 30, unhappy_streak: 3, transfer_request: 0 }).level, 'unhappy');
  assert.equal(morale.moodLabel({ morale: 30, unhappy_streak: 8, transfer_request: 1 }).level, 'leaving');
});

// =====================================================================
test('marché : le pool est cohérent et complet', () => {
  assert.ok(DRAFT_POOL.length > 500, `pool trop petit : ${DRAFT_POOL.length}`);

  const requis = new Set();
  Object.values(formations.FORMATIONS).forEach(f => f.forEach(p => requis.add(p)));
  const dispo = new Set(DRAFT_POOL.map(p => p.position));
  for (const p of requis) assert.ok(dispo.has(p), `aucun joueur au poste ${p}`);

  const champs = ['first_name', 'last_name', 'age', 'position', 'overall', 'tier'];
  for (const p of DRAFT_POOL) {
    for (const c of champs) assert.ok(p[c] !== undefined && p[c] !== null, `${p.last_name} : ${c} manquant`);
    assert.ok(calculateDraftPrice(p) > 0, `${p.last_name} : prix invalide`);
  }
});

test('marché : aucun doublon, accents normalisés', () => {
  const cle = (p) => `${p.first_name}${p.last_name}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/gi, '').toLowerCase();
  const vus = new Map();
  for (const p of DRAFT_POOL) {
    const k = cle(p);
    assert.ok(!vus.has(k), `doublon : ${p.first_name} ${p.last_name}`);
    vus.set(k, true);
  }
});

test('règles : client et serveur annoncent les mêmes limites d’effectif', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const client = fs.readFileSync(path.join(__dirname, '../../client/src/data/rules.js'), 'utf8');
  const lire = (nom) => Number((client.match(new RegExp(`${nom}\\s*=\\s*(\\d+)`)) || [])[1]);

  assert.equal(lire('SQUAD_MAX'), rules.SQUAD_MAX, 'SQUAD_MAX diffère');
  assert.equal(lire('SQUAD_WARN'), rules.SQUAD_WARN, 'SQUAD_WARN diffère');
  // Côté client le seuil est exprimé en « effectif minimum pour vendre »,
  // côté serveur en « refus si inférieur ou égal » : d'où le +1.
  assert.equal(lire('SQUAD_MIN_SELL'), rules.SQUAD_MIN_TO_SELL + 1, 'seuil de vente incohérent');
});
