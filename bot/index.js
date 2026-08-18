/**
 * Bot Discord de supervision.
 *
 * Répond à /version en comparant la version déployée sur le serveur avec le
 * dernier commit de GitHub. Le doute « est-ce que c'est en ligne ? » se
 * tranchait jusqu'ici en se connectant en SSH ; il se tranche maintenant
 * depuis Discord.
 *
 * Le bot se connecte en sortie vers Discord : aucun port entrant n'est
 * nécessaire, ce qui convient à un serveur derrière une box.
 */

const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { execSync } = require('child_process');

const TOKEN = process.env.DISCORD_TOKEN;
const API_LOCALE = process.env.API_URL || 'http://127.0.0.1:3001';
const DEPOT = process.env.GITHUB_REPO || 'matheovernede/YourTeamHistory';
const DOSSIER_SAUVEGARDES = process.env.BACKUP_DIR || '/var/backups/yourteamhistory';

if (!TOKEN) {
  console.error('DISCORD_TOKEN absent : le bot ne peut pas démarrer.');
  process.exit(1);
}

const VERT = 0x2eb257;
const ORANGE = 0xf5a623;
const ROUGE = 0xe74c3c;

/** État du serveur, lu sur sa propre sonde de santé. */
async function etatServeur() {
  try {
    const r = await fetch(`${API_LOCALE}/api/health`, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return { enLigne: false, erreur: `HTTP ${r.status}` };
    return { enLigne: true, ...(await r.json()) };
  } catch (e) {
    return { enLigne: false, erreur: e.message };
  }
}

/** Dernier commit de la branche master sur GitHub. */
async function dernierCommit() {
  try {
    const r = await fetch(`https://api.github.com/repos/${DEPOT}/commits/master`, {
      headers: { 'User-Agent': 'yourteamhistory-bot', Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return { ok: false, erreur: `HTTP ${r.status}` };

    const d = await r.json();
    return {
      ok: true,
      sha: d.sha.slice(0, 7),
      message: (d.commit.message || '').split('\n')[0],
      date: d.commit.author && d.commit.author.date,
    };
  } catch (e) {
    return { ok: false, erreur: e.message };
  }
}

/**
 * Nombre de commits d'écart. Renvoie null si la comparaison échoue : mieux vaut
 * ne rien afficher qu'un chiffre faux.
 */
async function ecart(depuis, jusqua) {
  try {
    const r = await fetch(`https://api.github.com/repos/${DEPOT}/compare/${depuis}...${jusqua}`, {
      headers: { 'User-Agent': 'yourteamhistory-bot' },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.ahead_by;
  } catch {
    return null;
  }
}

/** Date de la sauvegarde la plus récente, pour signaler un système muet. */
function derniereSauvegarde() {
  try {
    const sortie = execSync(
      `ls -t ${DOSSIER_SAUVEGARDES}/footmanager_*.db.gz 2>/dev/null | head -1`,
      { encoding: 'utf8', shell: '/bin/bash' }
    ).trim();
    if (!sortie) return null;

    const stat = execSync(`stat -c %Y "${sortie}"`, { encoding: 'utf8' }).trim();
    const heures = (Date.now() / 1000 - Number(stat)) / 3600;
    return { fichier: sortie.split('/').pop(), heures };
  } catch {
    return null;
  }
}

function duree(secondes) {
  if (!secondes && secondes !== 0) return 'inconnue';
  const j = Math.floor(secondes / 86400);
  const h = Math.floor((secondes % 86400) / 3600);
  const m = Math.floor((secondes % 3600) / 60);
  if (j > 0) return `${j} j ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

async function construireRapport() {
  const [serveur, github] = await Promise.all([etatServeur(), dernierCommit()]);

  if (!serveur.enLigne) {
    return new EmbedBuilder()
      .setColor(ROUGE)
      .setTitle('🔴 Le serveur ne répond pas')
      .setDescription(`Impossible de lire la version déployée.\n\`${serveur.erreur}\``)
      .setTimestamp();
  }

  if (!github.ok) {
    return new EmbedBuilder()
      .setColor(ORANGE)
      .setTitle('🟠 GitHub injoignable')
      .setDescription(`Le serveur tourne en \`${serveur.version}\`, mais la version de référence n'a pas pu être lue.\n\`${github.erreur}\``)
      .setTimestamp();
  }

  const identiques = serveur.version === github.sha;
  const retard = identiques ? null : await ecart(serveur.version, github.sha);

  const embed = new EmbedBuilder()
    .setColor(identiques ? VERT : ORANGE)
    .setTitle(identiques ? '🟢 Serveur à jour' : '🟠 Le serveur est en retard')
    .addFields(
      { name: 'Serveur', value: `\`${serveur.version}\``, inline: true },
      { name: 'GitHub', value: `\`${github.sha}\``, inline: true },
      { name: 'En ligne depuis', value: duree(serveur.uptimeSeconds), inline: true }
    )
    .setTimestamp();

  if (!identiques) {
    const combien = retard === null
      ? "Le serveur n'a pas la dernière version."
      : `Le serveur a **${retard} commit${retard > 1 ? 's' : ''}** de retard.`;
    embed.setDescription(
      `${combien}\n\nDernier commit : ${github.message}\n\n` +
      "Un envoi sur \`master\` déclenche normalement le déploiement : s'il n'est pas passé, regarde l'onglet Actions."
    );
  } else {
    embed.setDescription(`Dernier commit déployé : ${github.message}`);
  }

  embed.addFields({
    name: 'Mémoire',
    value: serveur.memory ? `${serveur.memory.rssMB} Mo` : 'inconnue',
    inline: true,
  });

  const sauvegarde = derniereSauvegarde();
  if (sauvegarde) {
    const alerte = sauvegarde.heures > 26 ? ' ⚠️' : '';
    embed.addFields({
      name: 'Dernière sauvegarde',
      value: `il y a ${duree(sauvegarde.heures * 3600)}${alerte}`,
      inline: true,
    });
  } else {
    embed.addFields({ name: 'Dernière sauvegarde', value: 'aucune trouvée ⚠️', inline: true });
  }

  return embed;
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commande = new SlashCommandBuilder()
  .setName('version')
  .setDescription('Compare la version déployée sur le serveur et celle de GitHub');

const commandeStats = new SlashCommandBuilder()
  .setName('stats')
  .setDescription("Où les joueurs s'arrêtent : de l'inscription au premier match");

const LIBELLES = {
  inscription: 'Inscrits',
  club_cree: 'Club créé',
  effectif_pret: 'Effectif constitué',
  premier_match: 'Premier match joué',
  saison_finie: 'Saison terminée',
};

async function rapportEntonnoir() {
  const r = await fetch(`${API_LOCALE}/api/leaderboard/funnel`, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) {
    return new EmbedBuilder().setColor(ROUGE).setTitle('🔴 Statistiques indisponibles')
      .setDescription(`Le serveur a répondu ${r.status}.`);
  }

  const d = await r.json();
  const depart = d.steps[0] ? d.steps[0].count : 0;

  const lignes = d.steps.map((e) => {
    // Une barre vaut mieux qu'un pourcentage seul pour voir où ça décroche.
    const pleines = Math.round((e.shareOfStart / 100) * 12);
    const barre = '█'.repeat(pleines) + '░'.repeat(12 - pleines);
    return `\`${barre}\` **${e.count}** · ${e.shareOfStart}%  ${LIBELLES[e.step] || e.step}`;
  });

  const embed = new EmbedBuilder()
    .setColor(depart > 0 ? VERT : ORANGE)
    .setTitle('Parcours des joueurs')
    .setDescription(lignes.join('\n'))
    .setTimestamp();

  if (d.biggestDrop && depart > 0) {
    embed.addFields({
      name: 'Plus grosse perte',
      value: `${LIBELLES[d.biggestDrop.step] || d.biggestDrop.step} — seuls ${d.biggestDrop.shareOfPrevious}% de l'étape précédente y arrivent.`,
    });
  }

  return embed;
}

client.once('clientReady', async () => {
  console.log(`Bot connecté : ${client.user.tag}`);

  // Enregistrement par serveur Discord : la commande est utilisable
  // immédiatement, là où l'enregistrement global demande jusqu'à une heure.
  for (const guilde of client.guilds.cache.values()) {
    try {
      await guilde.commands.create(commande.toJSON());
      await guilde.commands.create(commandeStats.toJSON());
      console.log(`Commandes /version et /stats disponibles sur « ${guilde.name} »`);
    } catch (e) {
      console.error(`Enregistrement impossible sur « ${guilde.name} » :`, e.message);
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (!['version', 'stats'].includes(interaction.commandName)) return;

  // Les rapports interrogent des services distants : on accuse réception tout
  // de suite, sans quoi Discord considère la commande en échec au bout de 3 s.
  await interaction.deferReply();
  try {
    const embed = interaction.commandName === 'stats'
      ? await rapportEntonnoir()
      : await construireRapport();
    await interaction.editReply({ embeds: [embed] });
  } catch (e) {
    console.error('Réponse impossible :', e);
    await interaction.editReply(`Erreur pendant la vérification : ${e.message}`).catch(() => {});
  }
});

client.on('error', (e) => console.error('Erreur du client Discord :', e.message));

client.login(TOKEN);
