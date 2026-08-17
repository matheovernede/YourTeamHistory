/**
 * Mécontentement et départs de joueurs.
 *
 * Jusqu'ici le moral n'avait aucune conséquence durable : un joueur pouvait
 * rester à 20 de moral toute sa carrière sans réagir. Désormais l'insatisfaction
 * s'accumule, débouche sur une demande de transfert, puis sur un départ si rien
 * n'est fait.
 *
 * Le processus est volontairement lent et réversible : le joueur prévient bien
 * avant de partir, et remonter son moral annule tout.
 */

/**
 * Seuils calibrés sur une saison de 26 journées.
 *
 * Une première version plaçait le seuil à 40 de moral avec une demande après
 * 5 journées : la procédure ne se déclenchait jamais avant la toute fin de
 * saison, le moral ne baissant que de 4 points par défaite depuis 80.
 * Les valeurs ci-dessous rendent le mécanisme atteignable sans être punitif.
 */

/** Moral en dessous duquel un joueur commence à se lasser. */
const MORALE_UNHAPPY = 52;
/** Moral au-dessus duquel le mécontentement se dissipe. */
const MORALE_APPEASED = 65;

/** Journées de mécontentement avant une demande de transfert. */
const REQUEST_THRESHOLD = 4;
/** Journées supplémentaires avant que le départ ne devienne inévitable. */
const DEPARTURE_THRESHOLD = 9;

/** Effectif en dessous duquel aucun départ n'est autorisé. */
const MIN_SQUAD_AFTER_DEPARTURE = 14;

/** Points de moral perdus par journée tant qu'un grief subsiste. */
const MORALE_DRAIN = 4;

/**
 * Difficultés où un joueur ne quitte jamais le club de son propre chef.
 * Le mécontentement reste visible et le moral continue d'agir sur les
 * performances, mais aucun départ n'est imposé au manager.
 */
const NO_DEPARTURE_DIFFICULTIES = ['easy'];

function departuresAllowed(difficulty) {
  return !NO_DEPARTURE_DIFFICULTIES.includes(difficulty);
}

/**
 * Raisons de mécontentement autres que le moral brut.
 * Renvoie la liste des griefs, pour pouvoir l'expliquer au joueur.
 */
function grievances(player, ctx = {}) {
  const list = [];

  if ((player.morale || 70) < MORALE_UNHAPPY) list.push('moral au plus bas');

  // Un bon joueur laissé sur le banc finit par se lasser.
  // Le niveau est comparé à l'EFFECTIF et non à une valeur absolue : en Régional
  // aucun joueur n'atteignait le seuil fixe, le grief ne se déclenchait jamais.
  const reference = ctx.squadMedianOverall ?? 0;
  const benchedLong = !player.is_starter
    && (player.overall || 0) >= reference
    && (ctx.matchday || 0) >= 6
    && (player.appearances || 0) < Math.floor((ctx.matchday || 0) * 0.3);
  if (benchedLong) list.push('manque de temps de jeu');

  // Un joueur nettement au-dessus du niveau de sa division veut voir plus haut.
  const divisionCeiling = 46 + (ctx.division || 1) * 6;
  if ((player.overall || 0) > divisionCeiling + 12) list.push('ambition sportive');

  return list;
}

/** Niveau médian d'un effectif, référence pour le grief de temps de jeu. */
function squadMedian(players) {
  if (!players || players.length === 0) return 0;
  const notes = players.map(p => p.overall || 0).sort((a, b) => a - b);
  return notes[Math.floor(notes.length / 2)];
}

/**
 * Met à jour le mécontentement de tout l'effectif après une journée.
 * À appeler une fois par journée de championnat.
 *
 * @returns {{requests: Array, warnings: Array}} nouvelles demandes et alertes
 */
function updateDiscontent(db, queryAll, teamId, ctx = {}) {
  const players = queryAll('SELECT * FROM players WHERE team_id = ?', [teamId]);
  const requests = [];
  const warnings = [];
  const context = { ...ctx, squadMedianOverall: squadMedian(players) };
  const autorise = departuresAllowed(ctx.difficulty);

  for (const p of players) {
    const griefs = grievances(p, context);
    const streak = p.unhappy_streak || 0;
    let morale = p.morale || 70;

    // 1. Un grief use le joueur. C'est par l'érosion du moral qu'un motif
    //    d'insatisfaction se traduit en mécontentement, jamais directement.
    if (griefs.length > 0 && !griefs.includes('moral au plus bas')) {
      morale = Math.max(20, morale - MORALE_DRAIN);
      db.run('UPDATE players SET morale = ? WHERE id = ?', [morale, p.id]);
    }

    // 2. Le moral prime sur tout le reste : un joueur véritablement heureux
    //    reste, même s'il joue peu ou se sent trop fort pour la division.
    //    Une version précédente exigeait EN PLUS l'absence de grief, si bien
    //    qu'un remplaçant au moral maximal continuait de réclamer son départ :
    //    remonter son moral n'avait alors aucun effet.
    if (morale >= MORALE_APPEASED) {
      if (streak > 0 || p.transfer_request) {
        db.run('UPDATE players SET unhappy_streak = 0, transfer_request = 0 WHERE id = ?', [p.id]);
      }
      continue;
    }

    // 3. Sans grief actif, le contentieux se résorbe doucement.
    if (griefs.length === 0) {
      if (streak > 0) db.run('UPDATE players SET unhappy_streak = ? WHERE id = ?', [streak - 1, p.id]);
      continue;
    }

    // 4. Grief actif ET moral bas : le mécontentement s'installe.
    const next = streak + 1;
    db.run('UPDATE players SET unhappy_streak = ? WHERE id = ?', [next, p.id]);

    // En difficulté facile, le mécontentement s'affiche mais ne débouche jamais
    // sur une demande de transfert : le manager n'est pas mis sous pression.
    if (!autorise) {
      if (p.transfer_request) {
        db.run('UPDATE players SET transfer_request = 0 WHERE id = ?', [p.id]);
      }
      continue;
    }

    // Alerte à mi-parcours : le joueur doit prévenir avant de claquer la porte.
    if (next === Math.floor(REQUEST_THRESHOLD / 2) + 1) {
      warnings.push({
        id: p.id,
        player: `${p.first_name} ${p.last_name}`,
        reasons: griefs,
      });
    }

    if (next >= REQUEST_THRESHOLD && !p.transfer_request) {
      db.run('UPDATE players SET transfer_request = 1 WHERE id = ?', [p.id]);
      requests.push({
        id: p.id,
        player: `${p.first_name} ${p.last_name}`,
        position: p.position,
        overall: p.overall,
        reasons: griefs,
      });
    }
  }

  return { requests, warnings };
}

/**
 * Départs effectifs, à la fin de la saison.
 * Ne partent que ceux dont le mécontentement est allé jusqu'au bout, et jamais
 * au point de rendre l'effectif injouable.
 *
 * @returns {Array} joueurs partis, avec l'indemnité perçue
 */
function resolveDepartures(db, queryAll, queryOne, teamId, managerId, ctx = {}) {
  // En difficulté facile, personne ne s'en va de son propre chef.
  if (!departuresAllowed(ctx.difficulty)) return [];

  const players = queryAll('SELECT * FROM players WHERE team_id = ? ORDER BY unhappy_streak DESC', [teamId]);
  const departures = [];
  let remaining = players.length;
  // Le contexte est nécessaire pour retrouver les griefs : sans lui, le motif
  // du départ s'affichait vide dans le bilan de saison.
  const context = { ...ctx, squadMedianOverall: squadMedian(players) };

  for (const p of players) {
    if (remaining <= MIN_SQUAD_AFTER_DEPARTURE) break;
    if (!p.transfer_request) continue;
    if ((p.unhappy_streak || 0) < DEPARTURE_THRESHOLD) continue;

    // Un joueur qui force son départ se vend mal : 60% de sa valeur.
    const fee = Math.round((p.value || 0) * 0.6);
    if (fee > 0 && managerId) {
      db.run('UPDATE managers SET budget = budget + ? WHERE id = ?', [fee, managerId]);
    }
    db.run('DELETE FROM players WHERE id = ?', [p.id]);
    remaining--;

    const motifs = grievances(p, context);
    departures.push({
      player: `${p.first_name} ${p.last_name}`,
      position: p.position,
      overall: p.overall,
      fee,
      reasons: motifs.length ? motifs : ['insatisfaction persistante'],
    });
  }

  return departures;
}

/** Remet les compteurs à zéro (intersaison : chacun repart sur de bonnes bases). */
function resetDiscontent(db, teamId) {
  db.run('UPDATE players SET unhappy_streak = 0, transfer_request = 0 WHERE team_id = ?', [teamId]);
}

/**
 * Apaise immédiatement tout joueur dont le moral est repassé au vert.
 *
 * À appeler après toute action qui remonte le moral (entraînement de cohésion,
 * dialogue, événement) : sans cela, il fallait attendre la journée suivante pour
 * voir la demande de transfert disparaître, et l'action semblait sans effet.
 *
 * @returns {Array} joueurs effectivement apaisés
 */
function refreshAppeasement(db, queryAll, teamId) {
  const apaises = queryAll(
    `SELECT id, first_name, last_name FROM players
     WHERE team_id = ? AND morale >= ? AND (unhappy_streak > 0 OR transfer_request = 1)`,
    [teamId, MORALE_APPEASED]
  );
  for (const p of apaises) {
    db.run('UPDATE players SET unhappy_streak = 0, transfer_request = 0 WHERE id = ?', [p.id]);
  }
  return apaises.map(p => `${p.first_name} ${p.last_name}`);
}

/** Étiquette lisible de l'état d'un joueur, pour l'interface. */
function moodLabel(player) {
  if (player.transfer_request) return { level: 'leaving', label: 'Demande à partir' };
  const streak = player.unhappy_streak || 0;
  if (streak >= Math.floor(REQUEST_THRESHOLD / 2)) return { level: 'unhappy', label: 'Mécontent' };
  if ((player.morale || 70) < MORALE_UNHAPPY) return { level: 'low', label: 'Moral bas' };
  return null;
}

module.exports = {
  MORALE_UNHAPPY,
  MORALE_APPEASED,
  MORALE_DRAIN,
  REQUEST_THRESHOLD,
  DEPARTURE_THRESHOLD,
  MIN_SQUAD_AFTER_DEPARTURE,
  grievances,
  squadMedian,
  updateDiscontent,
  resolveDepartures,
  resetDiscontent,
  refreshAppeasement,
  moodLabel,
};
