const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb, queryOne, queryAll, run, saveDb } = require('../db/schema');
const { DRAFT_POOL, calculateDraftPrice } = require('../data/draftPool');
const { SQUAD_MAX, RECOMMENDED, LINE_POSITIONS, countByLine } = require('../data/rules');
const { langueDe, t } = require('../i18n');
const { marquer } = require('../engine/funnel');

const router = express.Router();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Mercato d'hiver : marché restreint et plus cher.
 *
 * Un club ne se reconstruit pas en janvier. Sans ces limites, la fenêtre
 * hivernale rendrait celle d'été accessoire : on attendrait la mi-saison pour
 * recruter en connaissant déjà son classement.
 */
const HIVER_TAILLE_MARCHE = 14;   // contre 42 en été
const HIVER_SURCOUT = 1.3;        // +30 % : la concurrence sait que vous êtes pressé

/**
 * Construit un marché de recrutement.
 *
 * Extrait de la route pour que le recrutement automatique tire dans exactement
 * le même vivier que le marché affiché : un bouton qui proposerait d'autres
 * joueurs que la liste sous les yeux serait incompréhensible.
 */
function construireMarche({ division, reputation, difficulty, teamId, window, taille }) {
  const divLevel = parseInt(division) || 1;
  const rep = parseInt(reputation) || 50;
  const diff = difficulty || 'normal';
  const hiver = window === 'winter';

  // Get current squad names to exclude from market
  let ownedNames = new Set();
  if (teamId) {
    const myPlayers = queryAll('SELECT first_name, last_name FROM players WHERE team_id = ?', [teamId]);
    myPlayers.forEach(p => ownedNames.add(`${p.first_name}_${p.last_name}`));
  }

  // Reputation bonus: higher rep = better chance of seeing top players
  // rep 0-30: low attraction, 30-60: normal, 60-80: good, 80+: elite
  const repBonus = Math.max(0, (rep - 30) / 70); // 0 to 1 scale

  // Legends: very rare, chance increases with reputation and division
  // rep 50 + div 1 = ~1% chance per legend, rep 90 + div 7 = ~20%
  const legendChance = Math.min(0.25, 0.01 + repBonus * 0.12 + (divLevel - 1) * 0.02);

  // Difficulty affects tier access
  const tierBonus = diff === 'easy' ? 0.25 : diff === 'hard' ? -0.05 : 0;

  /**
   * Paliers accessibles selon la division du club.
   *   core  : toujours proposés
   *   reach : un cran au-dessus, probabilité liée à la réputation
   *   rare  : deux crans au-dessus, rare et très dépendant de la réputation
   * Un club de Régional 2 ne recrute donc pas en Ligue 1, mais peut dénicher
   * une pépite de National 3 s'il est bien coté.
   */
  const DIVISION_TIERS = {
    1: { core: ['r2', 'r1'],           reach: ['n3'],     rare: ['n2'] },
    2: { core: ['r1', 'n3'],           reach: ['n2'],     rare: ['n1'] },
    3: { core: ['n3', 'n2'],           reach: ['n1'],     rare: ['ligue2'] },
    4: { core: ['n2', 'n1'],           reach: ['ligue2'], rare: ['ligue1'] },
    5: { core: ['n1', 'ligue2'],       reach: ['ligue1'], rare: ['elite'] },
    6: { core: ['ligue2', 'ligue1'],   reach: ['elite'],  rare: [] },
    7: { core: ['ligue1', 'elite'],    reach: [],         rare: [] },
  };

  const access = DIVISION_TIERS[Math.max(1, Math.min(7, divLevel))] || DIVISION_TIERS[1];
  const reachChance = Math.max(0, Math.min(0.9, 0.20 + repBonus * 0.45 + tierBonus));
  const rareChance = Math.max(0, Math.min(0.4, 0.03 + repBonus * 0.20 + tierBonus));

  // `let` et non `const` : la liste est réassignée juste en dessous pour
  // retirer les joueurs déjà dans l'effectif.
  let filtered = DRAFT_POOL.filter(p => {
    if (p.tier === 'legend') return Math.random() < legendChance;
    if (access.core.includes(p.tier)) return true;
    if (access.reach.includes(p.tier)) return Math.random() < reachChance;
    if (access.rare.includes(p.tier)) return Math.random() < rareChance;
    return false;
  });

  // Exclude players already in the team
  if (ownedNames.size > 0) {
    filtered = filtered.filter(p => !ownedNames.has(`${p.first_name}_${p.last_name}`));
  }

  const shuffled = shuffle(filtered);
  let selection = shuffled.slice(0, taille || (hiver ? HIVER_TAILLE_MARCHE : 42));

  // High reputation attracts better players: sort by overall and keep more top ones
  if (rep >= 70) {
    selection.sort((a, b) => b.overall - a.overall);
    // Keep the top half as-is, re-shuffle the rest
    const top = selection.slice(0, Math.floor(selection.length * 0.4));
    const rest = shuffle(selection.slice(Math.floor(selection.length * 0.4)));
    selection = [...top, ...rest];
  }

  return selection.map(p => ({
    ...p,
    id: uuid(),
    value: Math.round(calculateDraftPrice(p) * (hiver ? HIVER_SURCOUT : 1)),
  }));
}

router.get('/available', (req, res) => {
  const { division, reputation, teamId, difficulty, window } = req.query;
  res.json(construireMarche({ division, reputation, teamId, difficulty, window }));
});

/**
 * Recrutement automatique d'un effectif complet.
 *
 * Quatre visiteurs sur cinq abandonnaient devant l'écran de recrutement :
 * choisir onze joueurs un par un, sur des critères qu'on ne comprend pas encore,
 * avant d'avoir vu à quoi ressemble un match. Ce bouton donne une équipe
 * cohérente en un clic, quitte à l'ajuster ensuite.
 *
 * L'effectif visé est celui que le jeu recommande déjà (rules.js) :
 * 2 gardiens, 6 défenseurs, 6 milieux, 4 attaquants.
 */
router.post('/auto', async (req, res) => {
  const langue = langueDe(req);
  const { managerId, teamId, difficulty } = req.body;
  if (!managerId || !teamId) {
    return res.status(400).json({ error: t('erreur.requis.managerTeam', langue) });
  }

  const db = await getDb();
  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  const team = queryOne('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!manager) return res.status(404).json({ error: t('erreur.managerIntrouvable', langue) });
  if (!team) return res.status(404).json({ error: t('erreur.equipeIntrouvable', langue) });

  const effectif = queryAll('SELECT position FROM players WHERE team_id = ?', [teamId]);
  const presents = countByLine(effectif);

  // On complète ce qui manque : le bouton reste utile sur un effectif entamé.
  const manquants = {};
  let aRecruter = 0;
  for (const [ligne, cible] of Object.entries(RECOMMENDED)) {
    const besoin = Math.max(0, cible - (presents[ligne] || 0));
    manquants[ligne] = besoin;
    aRecruter += besoin;
  }

  const placesLibres = SQUAD_MAX - effectif.length;
  if (aRecruter === 0 || placesLibres <= 0) {
    return res.json({ recruited: 0, newBudget: manager.budget, squadSize: effectif.length, complete: true });
  }

  // Un marché large : il faut de quoi remplir chaque ligne même après filtrage.
  const marche = construireMarche({
    division: team.division || 1,
    reputation: manager.reputation || 50,
    difficulty,
    teamId,
    taille: 160,
  });

  const parLigne = { GAR: [], DEF: [], MIL: [], ATT: [] };
  for (const joueur of marche) {
    for (const [ligne, postes] of Object.entries(LINE_POSITIONS)) {
      if (postes.includes(joueur.position)) { parLigne[ligne].push(joueur); break; }
    }
  }
  // Du meilleur au moins bon : on essaie d'abord le haut du panier.
  Object.values(parLigne).forEach((l) => l.sort((a, b) => b.overall - a.overall));

  const retenus = [];
  const pris = new Set();
  let budget = manager.budget;
  const ordre = ['GAR', 'DEF', 'MIL', 'ATT'];

  /** Coût des `nombre` joueurs les moins chers d'une ligne, hors déjà retenus. */
  const coutPlancher = (ligne, nombre) => {
    const prix = parLigne[ligne].filter((j) => !pris.has(j.id)).map((j) => j.value).sort((a, b) => a - b);
    let total = 0;
    for (let i = 0; i < nombre; i++) {
      if (prix[i] === undefined) return Infinity; // pas assez de joueurs disponibles
      total += prix[i];
    }
    return total;
  };

  /** Somme minimale pour honorer un objectif complet. */
  const coutObjectif = (objectif) =>
    ordre.reduce((s, l) => s + (objectif[l] > 0 ? coutPlancher(l, objectif[l]) : 0), 0);

  /**
   * Objectif réellement finançable.
   *
   * Viser l'effectif conseillé sans vérifier qu'on peut se le payer conduisait
   * à des équipes sans gardien : les premières lignes étaient écartées faute de
   * réserve suffisante, et le budget partait dans les suivantes. On retient donc
   * le meilleur objectif que le budget permet d'atteindre EN ENTIER.
   */
  const objectifs = [
    manquants,
    // Onze de départ complet : le strict nécessaire pour disputer un match.
    { GAR: Math.min(1, manquants.GAR), DEF: Math.min(4, manquants.DEF), MIL: Math.min(4, manquants.MIL), ATT: Math.min(2, manquants.ATT) },
    // Dernier filet : un gardien et de quoi aligner une défense.
    { GAR: Math.min(1, manquants.GAR), DEF: Math.min(3, manquants.DEF), MIL: Math.min(3, manquants.MIL), ATT: Math.min(1, manquants.ATT) },
  ];

  const objectif = objectifs.find((o) => coutObjectif(o) <= budget);

  const signer = (j) => {
    retenus.push(j);
    pris.add(j.id);
    budget -= j.value;
  };

  if (objectif) {
    // Objectif finançable en entier : on prend le meilleur joueur possible à
    // chaque poste, en gardant de quoi honorer ceux qui restent.
    for (const ligne of ordre) {
      for (let i = 0; i < objectif[ligne]; i++) {
        if (retenus.length >= placesLibres) break;

        const apres = {};
        ordre.forEach((l) => {
          const dejaTraitee = ordre.indexOf(l) < ordre.indexOf(ligne);
          apres[l] = dejaTraitee ? 0 : l === ligne ? objectif[l] - i - 1 : objectif[l];
        });

        const candidat = parLigne[ligne].find((j) => {
          if (pris.has(j.id) || j.value > budget) return false;
          pris.add(j.id);
          const reste = ordre.reduce((s, l) => s + (apres[l] > 0 ? coutPlancher(l, apres[l]) : 0), 0);
          pris.delete(j.id);
          return budget - j.value >= reste;
        });

        if (!candidat) break;
        signer(candidat);
      }
    }
  } else {
    // Budget insuffisant même pour le filet de sécurité. On abandonne toute
    // réserve — c'est elle qui bloquait tout et laissait l'équipe sans gardien —
    // et on achète le moins cher disponible, une ligne après l'autre en boucle.
    // Le gardien passe donc en premier, puis l'effectif s'étoffe par tours.
    const restants = { ...manquants };
    let progresse = true;

    while (progresse && retenus.length < placesLibres) {
      progresse = false;
      for (const ligne of ordre) {
        if (restants[ligne] <= 0 || retenus.length >= placesLibres) continue;

        const candidat = [...parLigne[ligne]]
          .filter((j) => !pris.has(j.id) && j.value <= budget)
          .sort((a, b) => a.value - b.value)[0];

        if (!candidat) { restants[ligne] = 0; continue; }
        signer(candidat);
        restants[ligne]--;
        progresse = true;
      }
    }
  }

  const degrade = !objectif;

  // Objectif réduit atteint et budget encore disponible : on complète vers
  // l'effectif conseillé, en commençant par les lignes les plus dégarnies.
  if (!degrade && retenus.length < aRecruter) {
    for (const ligne of ordre) {
      const dejaPris = retenus.filter((j) => LINE_POSITIONS[ligne].includes(j.position)).length;
      for (let i = dejaPris; i < manquants[ligne]; i++) {
        if (retenus.length >= placesLibres) break;
        const candidat = [...parLigne[ligne]]
          .sort((a, b) => a.value - b.value)
          .find((j) => !pris.has(j.id) && j.value <= budget);
        if (!candidat) break;
        retenus.push(candidat);
        pris.add(candidat.id);
        budget -= candidat.value;
      }
    }
  }

  for (const j of retenus) {
    db.run(
      "INSERT INTO players (id, team_id, first_name, last_name, age, position, overall, pace, shooting, passing, dribbling, defending, physical, stamina, morale, value, is_starter) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,100,80,?,0)",
      [uuid(), teamId, j.first_name, j.last_name, j.age, j.position, j.overall, j.pace, j.shooting, j.passing, j.dribbling, j.defending, j.physical, j.value]
    );
  }
  db.run('UPDATE managers SET budget = ? WHERE id = ?', [budget, managerId]);
  saveDb();

  const squad = queryAll('SELECT position FROM players WHERE team_id = ?', [teamId]);
  res.json({
    recruited: retenus.length,
    spent: manager.budget - budget,
    newBudget: budget,
    squadSize: squad.length,
    byLine: countByLine(squad),
  });
});

router.post('/buy', async (req, res) => {
  const langue = langueDe(req);
  const { managerId, teamId, player } = req.body;
  if (!managerId || !teamId || !player) {
    return res.status(400).json({ error: t('erreur.requis.managerTeamPlayer', langue) });
  }

  const db = await getDb();
  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  if (!manager) return res.status(404).json({ error: t('erreur.managerIntrouvable', langue) });

  if (manager.budget < player.value) {
    return res.status(400).json({ error: t('erreur.budgetInsuffisant', langue) });
  }

  const playerCount = queryOne('SELECT COUNT(*) as count FROM players WHERE team_id = ?', [teamId]);
  if (playerCount && playerCount.count >= SQUAD_MAX) {
    return res.status(400).json({ error: t('erreur.effectifMaximum', langue, { nombre: SQUAD_MAX }) });
  }

  db.run('UPDATE managers SET budget = budget - ? WHERE id = ?', [player.value, managerId]);
  db.run(
    "INSERT INTO players (id, team_id, first_name, last_name, age, position, overall, pace, shooting, passing, dribbling, defending, physical, stamina, morale, value, is_starter) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,100,80,?,0)",
    [uuid(), teamId, player.first_name, player.last_name, player.age, player.position, player.overall, player.pace, player.shooting, player.passing, player.dribbling, player.defending, player.physical, player.value]
  );
  saveDb();

  const updatedManager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);
  const squad = queryAll('SELECT * FROM players WHERE team_id = ? ORDER BY overall DESC', [teamId]);

  res.json({ newBudget: updatedManager.budget, squadSize: squad.length });
});

router.post('/finish', async (req, res) => {
  const langue = langueDe(req);
  const { managerId, teamId, window } = req.body;
  if (!managerId || !teamId) {
    return res.status(400).json({ error: t('erreur.requis.managerTeam', langue) });
  }

  const playerCount = queryOne('SELECT COUNT(*) as count FROM players WHERE team_id = ?', [teamId]);
  if (!playerCount || playerCount.count < 11) {
    return res.status(400).json({ error: t('erreur.minimumOnzeJoueurs', langue, { nombre: playerCount ? playerCount.count : 0 }) });
  }

  // L'effectif est constitué : c'est ici que quatre visiteurs sur cinq
  // s'arrêtaient, d'où la mesure à cet endroit précis.
  marquer({ run }, managerId, 'effectif_pret');

  if (window === 'winter') {
    // On marque la fenêtre comme utilisée pour la saison en cours, et on
    // s'arrête là : la composition est en place depuis treize journées, la
    // vider obligerait à tout refaire pour une ou deux recrues.
    const equipe = queryOne('SELECT season FROM teams WHERE id = ?', [teamId]);
    run('UPDATE teams SET winter_window_season = ? WHERE id = ?', [equipe ? equipe.season : 1, teamId]);
  } else {
    // Entre deux saisons, l'effectif a pu changer en profondeur : on repart
    // d'une composition vierge. slot_index doit être vidé en même temps, sinon
    // d'anciens emplacements survivent et faussent la reconstruction.
    run('UPDATE players SET is_starter = 0, slot_index = NULL WHERE team_id = ?', [teamId]);
  }

  const team = queryOne('SELECT * FROM teams WHERE id = ?', [teamId]);
  const manager = queryOne('SELECT * FROM managers WHERE id = ?', [managerId]);

  res.json({ team, manager });
});

module.exports = router;
