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
  app.listen(PORT, () => {
    console.log(`⚽ Foot Manager API running on http://localhost:${PORT}`);
  });
}

start();
