/**
 * Évolution des joueurs entre deux saisons, et vie du marché côté IA.
 *
 * Auparavant un joueur ne faisait que vieillir d'un an : aucun jeune ne perçait,
 * aucun vétéran ne déclinait. La courbe ci-dessous rend les effectifs vivants et
 * donne un intérêt réel au recrutement de jeunes.
 */

const { makePlayer, computeValue } = require('../data/playerGenerator');

/**
 * Potentiel de progression par tranche d'âge, en points de niveau par saison.
 * Un joueur de 18 ans peut gagner gros, un trentenaire décline inévitablement.
 */
function ageDelta(age) {
  if (age <= 18) return { min: 2, max: 6 };
  if (age <= 21) return { min: 1, max: 5 };
  if (age <= 24) return { min: 0, max: 3 };
  if (age <= 27) return { min: -1, max: 2 };
  if (age <= 30) return { min: -2, max: 1 };
  if (age <= 33) return { min: -4, max: 0 };
  return { min: -6, max: -1 };
}

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Fait évoluer un joueur d'une saison.
 * Le temps de jeu compte : un jeune qui n'a pas joué progresse beaucoup moins.
 *
 * @param {object} player            ligne de la table players
 * @param {number} totalMatchdays    nombre de journées de la saison écoulée
 * @returns {{overall:number, delta:number, stats:object}}
 */
function evolvePlayer(player, totalMatchdays = 26) {
  const age = (player.age || 25) + 1;
  const { min, max } = ageDelta(age);

  // Part de matchs disputés : 0 (jamais joué) à 1 (toujours titulaire)
  const played = clamp((player.appearances || 0) / Math.max(1, totalMatchdays), 0, 1);

  let delta = randInt(min, max);

  // Le temps de jeu module uniquement la progression, jamais le déclin :
  // un vétéran décline qu'il joue ou non.
  if (delta > 0) {
    const factor = 0.35 + played * 0.65; // 35% du gain sans jouer, 100% en titulaire
    delta = Math.round(delta * factor);
  }
  // Un jeune totalement inutilisé stagne, voire régresse légèrement.
  if (age <= 23 && played < 0.15 && delta >= 0) delta = randInt(-1, 0);

  const overall = clamp((player.overall || 50) + delta, 30, 99);

  // Les attributs suivent la même tendance, avec un peu de bruit.
  const shift = (v) => clamp(Math.round((v || 50) + delta + randInt(-1, 1)), 10, 99);
  const stats = {
    pace: shift(player.pace),
    shooting: shift(player.shooting),
    passing: shift(player.passing),
    dribbling: shift(player.dribbling),
    defending: shift(player.defending),
    physical: shift(player.physical),
  };

  // La vitesse décline plus vite que le reste avec l'âge.
  if (age >= 30) stats.pace = clamp(stats.pace - randInt(1, 3), 10, 99);

  return { age, overall, delta, stats, value: computeValue(overall, age) };
}

/** Applique l'évolution à tout un effectif. */
function evolveSquad(db, queryAll, teamId, totalMatchdays = 26) {
  const players = queryAll('SELECT * FROM players WHERE team_id = ?', [teamId]);
  const changes = [];

  for (const p of players) {
    const ev = evolvePlayer(p, totalMatchdays);
    db.run(
      `UPDATE players SET age = ?, overall = ?, value = ?,
         pace = ?, shooting = ?, passing = ?, dribbling = ?, defending = ?, physical = ?
       WHERE id = ?`,
      [ev.age, ev.overall, ev.value,
       ev.stats.pace, ev.stats.shooting, ev.stats.passing,
       ev.stats.dribbling, ev.stats.defending, ev.stats.physical, p.id]
    );
    if (ev.delta !== 0) {
      changes.push({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        age: ev.age,
        from: p.overall,
        to: ev.overall,
        delta: ev.delta,
      });
    }
  }

  changes.sort((a, b) => b.delta - a.delta);
  return changes;
}

/**
 * Les joueurs trop âgés raccrochent. Sans cela, les effectifs IA vieillissent
 * indéfiniment et le niveau du championnat s'effondre au fil des saisons.
 */
function retireOldPlayers(db, queryAll, teamId, { minSquad = 14 } = {}) {
  const players = queryAll('SELECT * FROM players WHERE team_id = ? ORDER BY age DESC', [teamId]);
  const retired = [];

  for (const p of players) {
    if (players.length - retired.length <= minSquad) break;
    const age = p.age || 25;
    // Probabilité croissante à partir de 34 ans, certaine à 40.
    const chance = age >= 40 ? 1 : age >= 34 ? (age - 33) * 0.18 : 0;
    if (chance > 0 && Math.random() < chance) {
      db.run('DELETE FROM players WHERE id = ?', [p.id]);
      retired.push({ name: `${p.first_name} ${p.last_name}`, age, overall: p.overall });
    }
  }
  return retired;
}

/**
 * Mercato des équipes IA : elles perdent leurs plus âgés et recrutent pour
 * revenir à l'effectif cible, avec un niveau cohérent avec leur division.
 * Sans cela le monde est figé : les adversaires ne bougent jamais.
 */
function runAiTransferWindow(db, queryAll, queryOne, teamId, divisionRange, { targetSquad = 18, totalMatchdays = 26 } = {}) {
  evolveSquad(db, queryAll, teamId, totalMatchdays);
  const retired = retireOldPlayers(db, queryAll, teamId, { minSquad: 13 });

  // Quelques départs supplémentaires pour renouveler le groupe.
  const squad = queryAll('SELECT * FROM players WHERE team_id = ? ORDER BY overall ASC', [teamId]);
  const departures = [];
  const maxDepartures = Math.min(2, Math.max(0, squad.length - 13));
  for (let i = 0; i < maxDepartures; i++) {
    if (Math.random() < 0.45) {
      const p = squad[i];
      db.run('DELETE FROM players WHERE id = ?', [p.id]);
      departures.push(`${p.first_name} ${p.last_name}`);
    }
  }

  // Recrutement jusqu'à l'effectif cible.
  const current = queryOne('SELECT COUNT(*) as count FROM players WHERE team_id = ?', [teamId]);
  const missing = Math.max(0, targetSquad - (current ? current.count : 0));
  const [lo, hi] = divisionRange;
  const arrivals = [];

  const { v4: uuid } = require('uuid');
  for (let i = 0; i < missing; i++) {
    const p = makePlayer({ ageRange: [18, 31], overallRange: [lo, hi] });
    const id = uuid();
    db.run(
      `INSERT INTO players
        (id, team_id, first_name, last_name, age, position, overall,
         pace, shooting, passing, dribbling, defending, physical,
         stamina, morale, value, is_starter, slot_index)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,100,75,?,0,NULL)`,
      [id, teamId, p.first_name, p.last_name, p.age, p.position, p.overall,
       p.pace, p.shooting, p.passing, p.dribbling, p.defending, p.physical, p.value]
    );
    arrivals.push(`${p.first_name} ${p.last_name}`);
  }

  return { retired, departures, arrivals };
}

module.exports = {
  ageDelta,
  evolvePlayer,
  evolveSquad,
  retireOldPlayers,
  runAiTransferWindow,
};
