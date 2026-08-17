/**
 * Moral et départs.
 *
 * Régression corrigée : l'apaisement exigeait à la fois un moral au vert ET
 * l'absence de tout grief. Un remplaçant conservant en permanence le grief
 * « manque de temps de jeu » continuait donc de réclamer son transfert même
 * avec un moral au maximum — remonter le moral n'avait aucun effet.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const morale = require('../engine/morale');

/** Base de données factice, suffisante pour observer les UPDATE émis. */
function fakeDb(players) {
  const rows = players.map(p => ({ ...p }));
  const db = {
    run(sql, params = []) {
      const id = params[params.length - 1];
      const row = rows.find(r => r.id === id);
      if (!row) return;
      if (/unhappy_streak = 0, transfer_request = 0/.test(sql)) {
        row.unhappy_streak = 0; row.transfer_request = 0;
      } else if (/SET unhappy_streak = \?/.test(sql)) {
        row.unhappy_streak = params[0];
      } else if (/SET transfer_request = 1/.test(sql)) {
        row.transfer_request = 1;
      } else if (/SET morale = \?/.test(sql)) {
        row.morale = params[0];
      }
    },
  };
  // refreshAppeasement filtre en SQL sur le moral : la base factice doit
  // reproduire ce filtre, sinon elle apaiserait aussi les joueurs au moral bas.
  const queryAll = (sql = '', params = []) => {
    if (/morale >= \?/.test(sql)) {
      const seuil = params[1];
      return rows.filter(r => r.morale >= seuil && (r.unhappy_streak > 0 || r.transfer_request === 1));
    }
    return rows;
  };
  return { db, queryAll, rows };
}

const remplacant = (over = {}) => ({
  id: 'p1', first_name: 'Jean', last_name: 'Banc',
  position: 'MC', overall: 70, is_starter: 0, appearances: 0,
  morale: 100, unhappy_streak: 0, transfer_request: 0,
  ...over,
});

// =====================================================================
test('un joueur au moral maximal ne demande jamais à partir', () => {
  const { db, queryAll, rows } = fakeDb([remplacant()]);
  // 20 journées : bien au-delà du seuil de départ
  for (let j = 1; j <= 20; j++) {
    morale.updateDiscontent(db, queryAll, 'T', { matchday: j, division: 3 });
    // On maintient le moral au maximum, comme le ferait un manager attentif
    rows[0].morale = 100;
  }
  assert.equal(rows[0].transfer_request, 0, 'il ne doit pas réclamer son transfert');
  assert.equal(rows[0].unhappy_streak, 0, 'le compteur doit rester à zéro');
});

test('remonter le moral annule une demande déjà déposée', () => {
  const { db, queryAll, rows } = fakeDb([
    remplacant({ morale: 25, unhappy_streak: 7, transfer_request: 1 }),
  ]);

  // Le manager remonte le moral au vert
  rows[0].morale = 90;
  morale.updateDiscontent(db, queryAll, 'T', { matchday: 12, division: 3 });

  assert.equal(rows[0].transfer_request, 0, 'la demande doit être annulée');
  assert.equal(rows[0].unhappy_streak, 0, 'le compteur doit être remis à zéro');
});

test('un remplaçant laissé de côté finit malgré tout par partir', () => {
  // Sans intervention du manager, le grief érode le moral jusqu'au départ.
  const { db, queryAll, rows } = fakeDb([remplacant({ morale: 80 })]);
  for (let j = 1; j <= 26; j++) {
    morale.updateDiscontent(db, queryAll, 'T', { matchday: j, division: 3 });
  }
  assert.ok(rows[0].morale < 80, 'le grief doit éroder le moral');
  assert.equal(rows[0].transfer_request, 1, 'il doit finir par demander à partir');
});

test('le moral s’érode progressivement, pas d’un coup', () => {
  const { db, queryAll, rows } = fakeDb([remplacant({ morale: 100 })]);
  morale.updateDiscontent(db, queryAll, 'T', { matchday: 8, division: 3 });
  const apresUn = rows[0].morale;
  assert.ok(apresUn < 100 && apresUn >= 100 - morale.MORALE_DRAIN - 1,
    `une seule journée ne doit coûter que ${morale.MORALE_DRAIN} points, obtenu ${100 - apresUn}`);
  assert.equal(rows[0].unhappy_streak, 0,
    'tant que le moral reste au vert, aucun mécontentement ne s’installe');
});

test('un titulaire heureux n’est jamais inquiété', () => {
  const { db, queryAll, rows } = fakeDb([
    remplacant({ is_starter: 1, appearances: 20, morale: 85, overall: 60 }),
  ]);
  for (let j = 1; j <= 26; j++) {
    morale.updateDiscontent(db, queryAll, 'T', { matchday: j, division: 3 });
  }
  assert.equal(rows[0].transfer_request, 0);
  assert.equal(rows[0].unhappy_streak, 0);
});

test('refreshAppeasement apaise immédiatement, sans attendre un match', () => {
  const { db, queryAll, rows } = fakeDb([
    remplacant({ morale: 90, unhappy_streak: 8, transfer_request: 1 }),
    remplacant({ id: 'p2', morale: 30, unhappy_streak: 8, transfer_request: 1 }),
  ]);

  const apaises = morale.refreshAppeasement(db, queryAll, 'T');

  assert.equal(rows[0].transfer_request, 0, 'le joueur au moral haut doit être apaisé');
  assert.equal(rows[1].transfer_request, 1, 'celui au moral bas doit rester mécontent');
  assert.equal(apaises.length, 1);
});

test('le seuil d’apaisement est atteignable par les leviers du jeu', () => {
  // L’action de cohésion donne +10, un dialogue jusqu’à +25 : partir du plancher
  // doit rester possible sans être instantané.
  assert.ok(morale.MORALE_APPEASED <= 70,
    'un seuil trop haut rendrait l’apaisement hors de portée');
  assert.ok(morale.MORALE_APPEASED > morale.MORALE_UNHAPPY,
    'la zone d’apaisement doit être au-dessus du seuil de mécontentement');
});
