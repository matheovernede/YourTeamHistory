const test = require('node:test');
const assert = require('node:assert');

/**
 * Règle du cooldown d'entraînement, recopiée depuis server/routes/season.js.
 *
 * Elle y est enfermée dans une route, donc inatteignable depuis un test. La
 * garder ici en double est un pis-aller assumé : ces cas viennent d'un défaut
 * réel — l'action restait verrouillée 23 journées après un changement de
 * saison — et rien ne l'aurait rattrapé.
 */
const COOLDOWN = 3;

function etatEntrainement(team) {
  const joues = (team.wins || 0) + (team.draws || 0) + (team.losses || 0);
  const marque = team.last_training_matchday || 0;

  if (marque <= 0) return { disponible: true, restant: 0 };

  const journeeEntrainement = marque - 1;
  if (journeeEntrainement > joues) return { disponible: true, restant: 0 };

  const ecoulees = joues - journeeEntrainement;
  return ecoulees >= COOLDOWN
    ? { disponible: true, restant: 0 }
    : { disponible: false, restant: COOLDOWN - ecoulees };
}

/** Ce que la route enregistre après un entraînement. */
const apresEntrainement = (equipe) => ({
  ...equipe,
  last_training_matchday: (equipe.wins || 0) + (equipe.draws || 0) + (equipe.losses || 0) + 1,
});

const equipe = (joues, marque = 0) => ({ wins: joues, draws: 0, losses: 0, last_training_matchday: marque });

test('une equipe neuve peut s entrainer immediatement', () => {
  // Le defaut d'origine : 0 valait a la fois « jamais entraine » et
  // « entraine a la journee 0 », ce qui bloquait trois journees.
  assert.strictEqual(etatEntrainement(equipe(0)).disponible, true);
});

test('une equipe qui n a jamais utilise l action reste disponible', () => {
  assert.strictEqual(etatEntrainement(equipe(1)).disponible, true);
  assert.strictEqual(etatEntrainement(equipe(9)).disponible, true);
});

test('s entrainer verrouille l action pour trois journees', () => {
  const e = apresEntrainement(equipe(5));
  assert.strictEqual(etatEntrainement(e).disponible, false);
  assert.strictEqual(etatEntrainement(e).restant, 3);
});

test('le compteur descend a chaque journee jouee', () => {
  const e = apresEntrainement(equipe(5));
  assert.strictEqual(etatEntrainement({ ...e, wins: 6 }).restant, 2);
  assert.strictEqual(etatEntrainement({ ...e, wins: 7 }).restant, 1);
});

test('l action redevient disponible apres trois journees', () => {
  const e = apresEntrainement(equipe(5));
  assert.strictEqual(etatEntrainement({ ...e, wins: 8 }).disponible, true);
  assert.strictEqual(etatEntrainement({ ...e, wins: 8 }).restant, 0);
});

test('s entrainer avant la premiere journee verrouille bien l action', () => {
  // Sans le decalage, cet entrainement aurait ete indistinguable de « jamais
  // entraine » et l'action serait restee disponible.
  const e = apresEntrainement(equipe(0));
  assert.strictEqual(etatEntrainement(e).disponible, false);
  assert.strictEqual(etatEntrainement(e).restant, 3);
});

test('une nouvelle saison ne verrouille pas l action', () => {
  // Le defaut le plus visible : entraine a la 20e journee, l'action restait
  // bloquee 23 journees de la saison suivante.
  const finDeSaison = apresEntrainement(equipe(20));
  const nouvelleSaison = { ...finDeSaison, wins: 0, draws: 0, losses: 0 };
  assert.strictEqual(etatEntrainement(nouvelleSaison).disponible, true);
  assert.strictEqual(etatEntrainement(nouvelleSaison).restant, 0);
});

test('une valeur heritee d une saison passee est ignoree', () => {
  assert.strictEqual(etatEntrainement(equipe(2, 21)).disponible, true);
});

test('le cooldown ne renvoie jamais un compte negatif ou aberrant', () => {
  for (let joues = 0; joues <= 26; joues++) {
    for (let marque = 0; marque <= 27; marque++) {
      const { disponible, restant } = etatEntrainement(equipe(joues, marque));
      assert.ok(restant >= 0, `restant negatif (${joues}, ${marque})`);
      assert.ok(restant <= COOLDOWN, `restant aberrant : ${restant} (${joues}, ${marque})`);
      if (disponible) assert.strictEqual(restant, 0);
    }
  }
});
