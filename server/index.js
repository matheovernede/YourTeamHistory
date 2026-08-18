const express = require('express');
const cors = require('cors');
const { getDb } = require('./db/schema');

const managerRoutes = require('./routes/manager');
const teamRoutes = require('./routes/team');
const matchRoutes = require('./routes/match');
const transferRoutes = require('./routes/transfer');
const leaderboardRoutes = require('./routes/leaderboard');
const draftRoutes = require('./routes/draft');
const seasonRoutes = require('./routes/season');
const championsLeagueRoutes = require('./routes/championsLeague');
const dreamteamRoutes = require('./routes/dreamteam');
const cupRoutes = require('./routes/cup');

const app = express();
const PORT = process.env.PORT || 3001;

// Le front peut être hébergé ailleurs (Vercel, Netlify…) et appeler cette API
// depuis un autre domaine. ALLOWED_ORIGINS restreint alors qui a le droit
// d'appeler. Non défini, on autorise tout : c'est le cas quand le serveur sert
// lui-même le front, où la question ne se pose pas.
const originesAutorisees = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors(
  originesAutorisees.length > 0
    ? {
        origin(origin, callback) {
          // Sans origine : appel direct (curl, sonde de supervision), on laisse passer.
          if (!origin || originesAutorisees.includes(origin)) return callback(null, true);
          callback(new Error(`Origine non autorisée : ${origin}`));
        },
      }
    : undefined
));

app.use(express.json());

app.use('/api/manager', managerRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/draft', draftRoutes);
app.use('/api/season', seasonRoutes);
app.use('/api/season', championsLeagueRoutes);
app.use('/api/dreamteam', dreamteamRoutes);
app.use('/api/season', cupRoutes);

app.get('/api/health', (req, res) => {
  // uptime et memoire servent au diagnostic a distance : un uptime qui repart
  // sans cesse de zero trahit un processus qui redemarre en boucle, ce qu'on ne
  // peut pas distinguer d'un serveur simplement lent vu du dehors.
  const mem = process.memoryUsage();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    pid: process.pid,
    memory: {
      rssMB: Math.round(mem.rss / 1048576),
      heapUsedMB: Math.round(mem.heapUsed / 1048576),
    },
  });
});

// Service du front, uniquement s'il est présent à côté du serveur.
//
// Quand le site est hébergé ailleurs (Vercel), ce dossier n'existe pas et le
// serveur se comporte en API seule. Sans ce test, chaque page demandée
// répondait une erreur de fichier introuvable au lieu d'un franc 404.
const path = require('path');
const fs = require('fs');
const clientDist = path.join(__dirname, '..', 'client', 'dist');
const frontPresent = fs.existsSync(path.join(clientDist, 'index.html'));

if (frontPresent) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ service: 'YourTeamHistory API', frontend: 'hébergé séparément' });
  });
}

async function start() {
  const db = await getDb();
  const { queryAll, run: dbRun, saveDb } = require('./db/schema');
  const orphanTeams = queryAll("SELECT id FROM teams WHERE manager_id != 'AI' AND id NOT IN (SELECT id FROM teams WHERE manager_id IN (SELECT id FROM managers))");
  for (const t of orphanTeams) {
    dbRun('DELETE FROM players WHERE team_id = ?', [t.id]);
    dbRun('DELETE FROM teams WHERE id = ?', [t.id]);
  }
  if (orphanTeams.length > 0) saveDb();

  // Auto-réparation : les sauvegardes créées avant le garde-fou de seedDivision
  // peuvent contenir des équipes IA en double, ce qui casse les classements.
  // Seules les équipes IA sont concernées, jamais celles d'un joueur.
  const { dedupeTeams } = require('./db/dedupeTeams');
  const doublons = await dedupeTeams();
  if (doublons.length > 0) {
    console.log(`Nettoyage : ${doublons.length} équipe(s) IA en double supprimée(s).`);
  }

  // Recomplètement des divisions incomplètes. seedDivision ignore les noms
  // déjà présents, l'opération est donc sans risque de doublon.
  const { seedDivision } = require('./db/seed');
  const { AI_PAR_DIVISION, rebalanceDivisions } = require('./engine/divisions');
  let recompletees = 0;
  for (let level = 1; level <= 7; level++) {
    const avant = queryAll("SELECT id FROM teams WHERE manager_id = 'AI' AND division = ?", [level]).length;
    if (avant >= AI_PAR_DIVISION) continue;
    try {
      await seedDivision(level, 'normal');
      const apres = queryAll("SELECT id FROM teams WHERE manager_id = 'AI' AND division = ?", [level]).length;
      if (apres > avant) {
        console.log(`  division ${level} recomplétée : ${avant} -> ${apres} équipes`);
        recompletees++;
      }
    } catch (e) {
      console.log(`  division ${level} non recomplétée : ${e.message}`);
    }
  }

  // Remise à niveau des effectifs : chaque division doit compter exactement
  // 13 équipes IA, sinon le calendrier aller-retour de 26 journées ne tombe
  // pas juste et le classement compare des équipes n'ayant pas joué autant
  // de matchs. Répare les sauvegardes d'avant la correction des montées.
  const equilibrage = rebalanceDivisions(db);
  const bouge = equilibrage.deplacees + equilibrage.dissoutes;
  if (bouge > 0) {
    console.log(`Équilibrage des divisions : ${equilibrage.deplacees} redistribuée(s), ${equilibrage.dissoutes} dissoute(s).`);
  }

  if (doublons.length > 0 || recompletees > 0 || bouge > 0) saveDb();

  // HOST : sur un serveur derrière un reverse proxy, écouter sur 127.0.0.1
  // suffit et évite d'exposer directement le port applicatif.
  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`⚽ Foot Manager API running on ${HOST}:${PORT}`);
    console.log(`   base de données : ${require('./db/schema').DB_PATH}`);
  });
}

// Un plantage non intercepté tue le processus en silence : l'hébergeur le
// relance et, vu du navigateur, le site « charge à l'infini » le temps du
// redémarrage. On trace la cause avant de rendre la main.
process.on('uncaughtException', (err) => {
  console.error('PLANTAGE non intercepté :', err && err.stack ? err.stack : err);
  process.exit(1);
});

process.on('unhandledRejection', (raison) => {
  console.error('PROMESSE rejetée sans traitement :', raison);
});

start().catch((err) => {
  console.error('ÉCHEC DU DÉMARRAGE :', err && err.stack ? err.stack : err);
  process.exit(1);
});
