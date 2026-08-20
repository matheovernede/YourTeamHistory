/**
 * Bot Discord de YourTeamHistory.
 *
 * Deux rôles distincts :
 *
 *   - la supervision, pour toi : /version, /serveur, /stats répondent aux
 *     questions qui obligeaient à ouvrir une session SSH ;
 *   - l'animation, pour la communauté : les faits marquants des joueurs sont
 *     annoncés d'eux-mêmes, et le bot affiche en permanence combien de managers
 *     sont connectés.
 *
 * Le bot se connecte en sortie vers Discord : aucun port entrant n'est
 * nécessaire, ce qui convient à une machine derrière une box.
 */

const {
  Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, ActivityType,
} = require('discord.js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.DISCORD_TOKEN;
const API_LOCALE = process.env.API_URL || 'http://127.0.0.1:3001';
const DEPOT = process.env.GITHUB_REPO || 'matheovernede/YourTeamHistory';
const DOSSIER_SAUVEGARDES = process.env.BACKUP_DIR || '/var/backups/yourteamhistory';
const CERTIFICAT = process.env.CERT_PATH || '/etc/nginx/certs/api.yourteamhistory.com.crt';
/** Salon des annonces publiques. Vide : les annonces sont désactivées. */
const SALON_ANNONCES = process.env.ANNOUNCE_CHANNEL_ID || '';
/** Salon des mises à jour. Vide : les annonces de version sont désactivées. */
const SALON_MISES_A_JOUR = process.env.UPDATE_CHANNEL_ID || '';
/** Journal des versions, lu depuis le code déployé. */
const JOURNAL = process.env.CHANGELOG_PATH || path.join(__dirname, '..', 'CHANGELOG.md');
/** Où l'on retient l'état des joueurs entre deux passages, pour survivre à un redémarrage. */
const FICHIER_ETAT = process.env.BOT_STATE || '/var/lib/yourteamhistory/.bot-etat.json';

if (!TOKEN) {
  console.error('DISCORD_TOKEN absent : le bot ne peut pas démarrer.');
  process.exit(1);
}

const VERT = 0x2eb257;
const OR = 0xd4af37;
const ORANGE = 0xf5a623;
const ROUGE = 0xe74c3c;

const INTERVALLE_VEILLE_MS = 3 * 60 * 1000;

// ---------------------------------------------------------------- outils

const millions = (v) => `${(v / 1000000).toFixed(1)}M`;

function duree(secondes) {
  if (secondes === null || secondes === undefined) return 'inconnue';
  const j = Math.floor(secondes / 86400);
  const h = Math.floor((secondes % 86400) / 3600);
  const m = Math.floor((secondes % 3600) / 60);
  if (j > 0) return `${j} j ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

/** Appel à l'API locale. Renvoie null plutôt que de laisser filer une exception. */
async function api(chemin) {
  try {
    const r = await fetch(`${API_LOCALE}${chemin}`, { signal: AbortSignal.timeout(10000) });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

function commandeShell(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', shell: '/bin/bash', timeout: 5000 }).trim();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- /version

async function dernierCommit() {
  try {
    const r = await fetch(`https://api.github.com/repos/${DEPOT}/commits/master`, {
      headers: { 'User-Agent': 'yourteamhistory-bot', Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return { ok: false, erreur: `HTTP ${r.status}` };
    const d = await r.json();
    return { ok: true, sha: d.sha.slice(0, 7), message: (d.commit.message || '').split('\n')[0] };
  } catch (e) {
    return { ok: false, erreur: e.message };
  }
}

async function ecart(depuis, jusqua) {
  try {
    const r = await fetch(`https://api.github.com/repos/${DEPOT}/compare/${depuis}...${jusqua}`, {
      headers: { 'User-Agent': 'yourteamhistory-bot' }, signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    return (await r.json()).ahead_by;
  } catch {
    return null;
  }
}

async function rapportVersion() {
  const [sante, github] = await Promise.all([api('/api/health'), dernierCommit()]);

  if (!sante) {
    return new EmbedBuilder().setColor(ROUGE).setTitle('🔴 Le serveur ne répond pas')
      .setDescription("Impossible de lire la version déployée.").setTimestamp();
  }
  if (!github.ok) {
    return new EmbedBuilder().setColor(ORANGE).setTitle('🟠 GitHub injoignable')
      .setDescription(`Le serveur tourne en \`${sante.version}\`, la référence n'a pas pu être lue.\n\`${github.erreur}\``)
      .setTimestamp();
  }

  const identiques = sante.version === github.sha;
  const retard = identiques ? null : await ecart(sante.version, github.sha);

  const embed = new EmbedBuilder()
    .setColor(identiques ? VERT : ORANGE)
    .setTitle(identiques ? '🟢 Serveur à jour' : '🟠 Le serveur est en retard')
    .addFields(
      { name: 'Serveur', value: `\`${sante.version}\``, inline: true },
      { name: 'GitHub', value: `\`${github.sha}\``, inline: true },
      { name: 'En ligne depuis', value: duree(sante.uptimeSeconds), inline: true },
    )
    .setTimestamp();

  embed.setDescription(identiques
    ? `Dernier commit déployé : ${github.message}`
    : `${retard === null ? "Le serveur n'a pas la dernière version." : `Le serveur a **${retard} commit${retard > 1 ? 's' : ''}** de retard.`}\n\nDernier commit : ${github.message}\n\nUn envoi sur \`master\` déclenche normalement le déploiement : s'il n'est pas passé, regarde l'onglet Actions.`);

  return embed;
}

// ---------------------------------------------------------------- /serveur

async function rapportServeur() {
  const sante = await api('/api/health');
  if (!sante) {
    return new EmbedBuilder().setColor(ROUGE).setTitle('🔴 API injoignable')
      .setDescription("Le serveur ne répond pas sur sa sonde de santé.").setTimestamp();
  }

  const embed = new EmbedBuilder().setColor(VERT).setTitle('État du serveur').setTimestamp();

  embed.addFields(
    { name: 'En ligne depuis', value: duree(sante.uptimeSeconds), inline: true },
    { name: 'Mémoire', value: sante.memory ? `${sante.memory.rssMB} Mo` : '—', inline: true },
    { name: 'Version', value: `\`${sante.version}\``, inline: true },
  );

  // Disque : c'est ce qui empêche la base et les sauvegardes de s'écrire.
  const disque = commandeShell("df -h / | tail -1 | awk '{print $5\" utilisés sur \"$2}'");
  const pourcent = parseInt((disque || '').replace('%', ''), 10);
  if (disque) {
    embed.addFields({ name: 'Disque', value: `${disque}${pourcent >= 85 ? ' ⚠️' : ''}`, inline: true });
    if (pourcent >= 85) embed.setColor(ORANGE);
  }

  const derniere = commandeShell(`ls -t ${DOSSIER_SAUVEGARDES}/footmanager_*.db.gz 2>/dev/null | head -1`);
  if (derniere) {
    const age = commandeShell(`echo $(( ($(date +%s) - $(stat -c %Y "${derniere}")) / 3600 ))`);
    const heures = Number(age);
    const nombre = commandeShell(`ls ${DOSSIER_SAUVEGARDES}/footmanager_*.db.gz 2>/dev/null | wc -l`);
    embed.addFields({
      name: 'Dernière sauvegarde',
      value: `il y a ${heures} h${heures > 26 ? ' ⚠️' : ''}\n${nombre} conservées`,
      inline: true,
    });
    if (heures > 26) embed.setColor(ORANGE);
  } else {
    embed.addFields({ name: 'Sauvegardes', value: 'aucune trouvée ⚠️', inline: true });
    embed.setColor(ORANGE);
  }

  const fin = commandeShell(`openssl x509 -in ${CERTIFICAT} -noout -enddate 2>/dev/null | cut -d= -f2`);
  if (fin) {
    const jours = commandeShell(`echo $(( ($(date -d "${fin}" +%s) - $(date +%s)) / 86400 ))`);
    const restants = Number(jours);
    embed.addFields({
      name: 'Certificat',
      value: `${restants} jours${restants <= 14 ? ' ⚠️' : ''}`,
      inline: true,
    });
    if (restants <= 14) embed.setColor(ORANGE);
  }

  return embed;
}

// ---------------------------------------------------------------- /stats

const LIBELLES_ETAPES = {
  inscription: 'Inscrits',
  club_cree: 'Club créé',
  effectif_pret: 'Effectif constitué',
  premier_match: 'Premier match joué',
  saison_finie: 'Saison terminée',
};

async function rapportEntonnoir() {
  const d = await api('/api/leaderboard/funnel');
  if (!d) {
    return new EmbedBuilder().setColor(ROUGE).setTitle('🔴 Statistiques indisponibles').setTimestamp();
  }

  const depart = d.steps[0] ? d.steps[0].count : 0;
  const lignes = d.steps.map((e) => {
    const pleines = Math.round((e.shareOfStart / 100) * 12);
    const barre = '█'.repeat(pleines) + '░'.repeat(12 - pleines);
    return `\`${barre}\` **${e.count}** · ${e.shareOfStart}%  ${LIBELLES_ETAPES[e.step] || e.step}`;
  });

  const embed = new EmbedBuilder()
    .setColor(depart > 0 ? VERT : ORANGE)
    .setTitle('Parcours des joueurs')
    .setDescription(lignes.join('\n'))
    .setTimestamp();

  if (d.biggestDrop && depart > 0) {
    embed.addFields({
      name: 'Plus grosse perte',
      value: `${LIBELLES_ETAPES[d.biggestDrop.step] || d.biggestDrop.step} — seuls ${d.biggestDrop.shareOfPrevious}% de l'étape précédente y arrivent.`,
    });
  }
  return embed;
}

// ---------------------------------------------------------------- /classement

async function rapportClassement() {
  const d = await api('/api/leaderboard/players');
  if (!d || !d.players) {
    return new EmbedBuilder().setColor(ROUGE).setTitle('🔴 Classement indisponible').setTimestamp();
  }
  if (d.players.length === 0) {
    return new EmbedBuilder().setColor(ORANGE).setTitle('Classement des managers')
      .setDescription('Aucun manager pour le moment.').setTimestamp();
  }

  // On réordonne par mérite : l'API remonte les connectés en tête pour son
  // affichage, ce qui n'a pas de sens dans un classement écrit.
  const parRang = [...d.players].sort((a, b) => a.rank - b.rank).slice(0, 10);

  const lignes = parRang.map((j) => {
    const medaille = j.rank === 1 ? '🥇' : j.rank === 2 ? '🥈' : j.rank === 3 ? '🥉' : `\`${String(j.rank).padStart(2)}\``;
    const palmares = [
      j.titles > 0 ? `🏆${j.titles}` : '',
      j.cups > 0 ? `🥇${j.cups}` : '',
    ].filter(Boolean).join(' ');
    return `${medaille} **${j.teamName}** · ${j.divisionName} · S${j.season} · ${j.points} pts ${palmares}${j.online ? ' 🟢' : ''}`;
  });

  return new EmbedBuilder()
    .setColor(OR)
    .setTitle('Classement des managers')
    .setDescription(lignes.join('\n'))
    .setFooter({ text: `${d.totalCount} manager(s) · ${d.onlineCount} en ligne` })
    .setTimestamp();
}

// ---------------------------------------------------------------- versions

/**
 * Dernière entrée du journal des versions.
 *
 * L'annonce se déclenche sur le numéro de version, pas sur le déploiement :
 * une correction technique part en production sans encombrer le salon, et
 * seules les nouveautés qui intéressent les joueurs sont annoncées.
 */
function derniereVersion() {
  let texte;
  try {
    texte = fs.readFileSync(JOURNAL, 'utf8');
  } catch {
    return null;
  }

  // On saute l'en-tête explicatif : la première entrée réelle est celle qui
  // suit le séparateur.
  const corps = texte.includes('\n---\n') ? texte.split('\n---\n').slice(1).join('\n---\n') : texte;
  const entrees = corps.split(/^## /m).filter((b) => b.trim());
  if (entrees.length === 0) return null;

  const premiere = entrees[0];
  const saut = premiere.indexOf('\n');
  const entete = (saut === -1 ? premiere : premiere.slice(0, saut)).trim();
  const contenu = saut === -1 ? '' : premiere.slice(saut + 1).trim();

  // « 1.3.0 — Le derby et l'infirmerie »
  const separateur = entete.match(/\s+[—-]\s+/);
  const version = separateur ? entete.slice(0, separateur.index).trim() : entete;
  const titre = separateur ? entete.slice(separateur.index + separateur[0].length).trim() : '';

  return { version, titre, contenu };
}

async function annoncerVersion(client, etat) {
  if (!SALON_MISES_A_JOUR) return etat;

  const v = derniereVersion();
  if (!v) return etat;
  if (etat.versionAnnoncee === v.version) return etat;

  // Premier démarrage : on retient la version sans l'annoncer, sinon la mise à
  // jour en cours serait publiée alors qu'elle est déjà connue.
  if (!etat.versionAnnoncee) {
    console.log(`Version ${v.version} retenue sans annonce (premier démarrage).`);
    return { ...etat, versionAnnoncee: v.version };
  }

  try {
    const salon = await client.channels.fetch(SALON_MISES_A_JOUR);
    const embed = new EmbedBuilder()
      .setColor(VERT)
      .setTitle(`🎉 ${v.titre || 'Mise à jour'}`)
      .setDescription(v.contenu.slice(0, 3800))
      .setFooter({ text: `Version ${v.version}` })
      .setTimestamp();

    await salon.send({ content: '**Le jeu vient d\'être mis à jour !**', embeds: [embed] });
    console.log(`Mise à jour ${v.version} annoncée.`);
    return { ...etat, versionAnnoncee: v.version };
  } catch (e) {
    console.error('Annonce de version impossible :', e.message);
    return etat; // on réessaiera au prochain passage
  }
}

// ---------------------------------------------------------------- annonces

/**
 * Faits marquants annoncés d'eux-mêmes.
 *
 * Le bot compare l'état des managers à celui du passage précédent. Rien à
 * ajouter côté serveur : promotions, titres et coupes se déduisent de ce que
 * le classement expose déjà.
 *
 * L'état est écrit sur disque : sans lui, un redémarrage rejouerait toutes les
 * annonces d'un coup.
 */
function lireEtat() {
  try {
    const brut = JSON.parse(fs.readFileSync(FICHIER_ETAT, 'utf8'));
    // Les premiers fichiers ne contenaient que les managers, sans enveloppe :
    // on les accepte tels quels pour ne pas rejouer les annonces.
    return brut.managers ? brut : { managers: brut, versionAnnoncee: null };
  } catch {
    return { managers: null, versionAnnoncee: null };
  }
}

function ecrireEtat(etat) {
  try {
    fs.mkdirSync(path.dirname(FICHIER_ETAT), { recursive: true });
    fs.writeFileSync(FICHIER_ETAT, JSON.stringify(etat));
  } catch (e) {
    console.error('État non enregistré :', e.message);
  }
}

function detecterFaits(avant, maintenant) {
  const faits = [];
  for (const j of maintenant) {
    const ancien = avant[j.teamId];

    // Premier passage d'un manager : on ne remonte pas son passé.
    if (!ancien) continue;

    if (j.division > ancien.division) {
      faits.push({ couleur: VERT, texte: `⬆️ **${j.teamName}** monte en **${j.divisionName}** !` });
    }
    if (j.titles > ancien.titles) {
      faits.push({ couleur: OR, texte: `🏆 **${j.teamName}** est champion de **${j.divisionName}** !` });
    }
    if (j.cups > ancien.cups) {
      faits.push({ couleur: OR, texte: `🥇 **${j.teamName}** remporte la coupe !` });
    }
    if (j.division < ancien.division) {
      faits.push({ couleur: ORANGE, texte: `⬇️ **${j.teamName}** descend en **${j.divisionName}**.` });
    }
  }
  return faits;
}

async function veille(client) {
  let etat = lireEtat();

  // La mise à jour s'annonce même si l'API est indisponible : les deux sujets
  // sont indépendants.
  etat = await annoncerVersion(client, etat);

  const d = await api('/api/leaderboard/players');
  if (!d || !d.players) {
    ecrireEtat(etat);
    return;
  }

  // Présence du bot : un signe de vie permanent, visible sans rien demander.
  try {
    await client.user.setPresence({
      activities: [{
        name: `${d.totalCount} manager${d.totalCount > 1 ? 's' : ''} · ${d.onlineCount} en ligne`,
        type: ActivityType.Watching,
      }],
      status: 'online',
    });
  } catch { /* la présence n'est pas essentielle */ }

  const managers = {};
  for (const j of d.players) {
    managers[j.teamId] = {
      division: j.division, titles: j.titles, cups: j.cups, teamName: j.teamName,
    };
  }

  if (etat.managers && SALON_ANNONCES) {
    const faits = detecterFaits(etat.managers, d.players);
    if (faits.length > 0) {
      try {
        const salon = await client.channels.fetch(SALON_ANNONCES);
        for (const f of faits.slice(0, 5)) { // on ne noie pas le salon
          await salon.send({ embeds: [new EmbedBuilder().setColor(f.couleur).setDescription(f.texte)] });
        }
        console.log(`${faits.length} fait(s) marquant(s) annoncé(s)`);
      } catch (e) {
        console.error('Annonce impossible :', e.message);
      }
    }
  }

  ecrireEtat({ ...etat, managers });
}

// ---------------------------------------------------------------- Discord

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const COMMANDES = [
  new SlashCommandBuilder().setName('version').setDescription('Compare la version déployée et celle de GitHub'),
  new SlashCommandBuilder().setName('serveur').setDescription('État du serveur : mémoire, disque, sauvegardes, certificat'),
  new SlashCommandBuilder().setName('stats').setDescription("Où les joueurs s'arrêtent, de l'inscription au premier match"),
  new SlashCommandBuilder().setName('classement').setDescription('Les dix meilleurs managers'),
];

const RAPPORTS = {
  version: rapportVersion,
  serveur: rapportServeur,
  stats: rapportEntonnoir,
  classement: rapportClassement,
};

client.once('clientReady', async () => {
  console.log(`Bot connecté : ${client.user.tag}`);

  // Enregistrement par serveur Discord : les commandes sont utilisables
  // immédiatement, là où l'enregistrement global demande jusqu'à une heure.
  for (const guilde of client.guilds.cache.values()) {
    try {
      await guilde.commands.set(COMMANDES.map((c) => c.toJSON()));
      console.log(`${COMMANDES.length} commandes disponibles sur « ${guilde.name} »`);
    } catch (e) {
      console.error(`Enregistrement impossible sur « ${guilde.name} » :`, e.message);
    }
  }

  console.log(SALON_ANNONCES
    ? `Faits marquants publiés dans le salon ${SALON_ANNONCES}`
    : 'ANNOUNCE_CHANNEL_ID absent : les faits marquants ne sont pas publiés.');
  console.log(SALON_MISES_A_JOUR
    ? `Mises à jour publiées dans le salon ${SALON_MISES_A_JOUR}`
    : 'UPDATE_CHANNEL_ID absent : les mises à jour ne sont pas annoncées.');

  veille(client);
  setInterval(() => veille(client), INTERVALLE_VEILLE_MS);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const rapport = RAPPORTS[interaction.commandName];
  if (!rapport) return;

  // Ces rapports interrogent des services distants : on accuse réception tout
  // de suite, sans quoi Discord considère la commande en échec au bout de 3 s.
  await interaction.deferReply();
  try {
    await interaction.editReply({ embeds: [await rapport()] });
  } catch (e) {
    console.error(`Commande /${interaction.commandName} en échec :`, e);
    await interaction.editReply(`Erreur pendant la vérification : ${e.message}`).catch(() => {});
  }
});

client.on('error', (e) => console.error('Erreur du client Discord :', e.message));
client.on('shardDisconnect', () => console.warn('Déconnecté de Discord, reconnexion en cours…'));
client.on('shardReconnecting', () => console.log('Reconnexion à Discord…'));

// Arrêt propre : sans cela systemd attend l'expiration du délai à chaque
// redéploiement, et le bot reste affiché en ligne un moment après sa mort.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`${signal} reçu, fermeture de la connexion Discord.`);
    client.destroy();
    process.exit(0);
  });
}

client.login(TOKEN);
