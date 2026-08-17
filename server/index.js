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

app.use(cors());
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
const path = require('path');
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

async function start() {
  await getDb();
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

  // Recomplètement des divisions trop peu fournies. Vérifié à chaque démarrage
  // et non seulement après un nettoyage : une division peut aussi se vider au
  // fil des montées et descentes. seedDivision ignore les noms déjà présents,
  // l'opération est donc sans risque de doublon.
  const { seedDivision } = require('./db/seed');
  let recompletees = 0;
  for (let level = 1; level <= 7; level++) {
    const avant = queryAll("SELECT id FROM teams WHERE manager_id = 'AI' AND division = ?", [level]).length;
    if (avant >= 10) continue;
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
  if (doublons.length > 0 || recompletees > 0) saveDb();

  // HOST : sur un serveur derrière un reverse proxy, écouter sur 127.0.0.1
  // suffit et évite d'exposer directement le port applicatif.
  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`⚽ Foot Manager API running on ${HOST}:${PORT}`);
    console.log(`   base de données : ${require('./db/schema').DB_PATH}`);
  });
}

start();
