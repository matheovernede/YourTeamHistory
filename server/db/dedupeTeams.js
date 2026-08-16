/**
 * Nettoyage : supprime les équipes IA en double.
 *
 * Des sauvegardes créées avant l'ajout du garde-fou dans seedDivision peuvent
 * contenir plusieurs équipes portant le même nom, ce qui produit des classements
 * incohérents. Ce script conserve, pour chaque nom, l'équipe la plus fournie en
 * joueurs et supprime les autres — jamais une équipe appartenant à un joueur.
 *
 * Lancement : node server/db/dedupeTeams.js
 */

const { getDb, queryAll, saveDb } = require('./schema');

async function dedupeTeams({ dryRun = false } = {}) {
  const db = await getDb();

  const teams = queryAll(`
    SELECT t.id, t.name, t.division, t.manager_id,
           (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id) AS squad
    FROM teams t
    ORDER BY t.name
  `);

  const parNom = new Map();
  for (const t of teams) {
    const cle = (t.name || '').toLowerCase();
    if (!parNom.has(cle)) parNom.set(cle, []);
    parNom.get(cle).push(t);
  }

  const supprimees = [];
  for (const [, groupe] of parNom) {
    if (groupe.length < 2) continue;

    // Une équipe de joueur n'est jamais supprimée ; sinon on garde la plus fournie.
    const joueur = groupe.filter(t => t.manager_id !== 'AI');
    const candidats = joueur.length ? groupe.filter(t => t.manager_id === 'AI')
                                    : groupe.slice().sort((a, b) => b.squad - a.squad).slice(1);

    for (const t of candidats) {
      supprimees.push(t);
      if (!dryRun) {
        db.run('DELETE FROM players WHERE team_id = ?', [t.id]);
        db.run('DELETE FROM matches WHERE home_team_id = ? OR away_team_id = ?', [t.id, t.id]);
        db.run('DELETE FROM teams WHERE id = ?', [t.id]);
      }
    }
  }

  if (!dryRun && supprimees.length) saveDb();
  return supprimees;
}

if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');
  dedupeTeams({ dryRun })
    .then(sup => {
      if (!sup.length) {
        console.log('Aucun doublon : rien à faire.');
        return;
      }
      console.log(`${dryRun ? 'À supprimer' : 'Supprimées'} : ${sup.length} équipe(s) en double`);
      for (const t of sup) {
        console.log(`   ${t.name}  (division ${t.division}, ${t.squad} joueurs, ${t.manager_id === 'AI' ? 'IA' : 'JOUEUR'})`);
      }
      if (dryRun) console.log('\nRelancez sans --dry-run pour appliquer.');
    })
    .catch(e => { console.error('Erreur :', e.message); process.exitCode = 1; });
}

module.exports = { dedupeTeams };
