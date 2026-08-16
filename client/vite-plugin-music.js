import fs from 'node:fs';
import path from 'node:path';

const MUSIC_DIR = 'public/music';
const AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a', '.webm', '.flac'];

const VIRTUAL_ID = 'virtual:music-tracks';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/** Nettoie un nom de fichier pour l'affichage : "01 - Titre_final.mp3" -> "Titre final" */
function prettifyTitle(filename) {
  return path
    .basename(filename, path.extname(filename))
    .replace(/^\d+\s*[-_.]\s*/, '')
    .replace(/_/g, ' ')
    .trim();
}

/**
 * Encode un nom de fichier pour une URL de fichier statique.
 *
 * On utilise encodeURI et NON encodeURIComponent : les serveurs statiques
 * (Vite/sirv, Express) résolvent le chemin avec decodeURI(), qui ne décode
 * délibérément pas les caractères réservés. encodeURIComponent transformerait
 * la virgule en %2C, que decodeURI laisse intact -> fichier introuvable.
 */
function toUrl(filename) {
  return '/music/' + encodeURI(filename);
}

/** Caractères qui ne peuvent pas transiter dans un chemin d'URL. */
const UNSAFE = /[?#]/;

function readTracks(root, warn) {
  const dir = path.resolve(root, MUSIC_DIR);
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir)
    .filter(f => AUDIO_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));

  const usable = [];
  for (const f of files) {
    if (UNSAFE.test(f)) {
      warn?.(`Piste ignorée : "${f}" contient « ? » ou « # », impossible à servir. Renommez le fichier.`);
      continue;
    }
    usable.push({ url: toUrl(f), title: prettifyTitle(f) });
  }
  return usable;
}

/**
 * Expose le contenu de public/music/ via le module virtuel `virtual:music-tracks`.
 * Déposer un fichier audio dans le dossier suffit : aucune modification de code.
 */
export default function musicTracksPlugin() {
  let root = process.cwd();

  return {
    name: 'music-tracks',

    configResolved(config) {
      root = config.root;
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },

    load(id) {
      if (id !== RESOLVED_ID) return;
      const tracks = readTracks(root, msg => this.warn(msg));
      if (tracks.length === 0) {
        this.warn(`Aucun fichier audio trouvé dans ${MUSIC_DIR}/ — le lecteur sera masqué.`);
      }
      return `export default ${JSON.stringify(tracks, null, 2)};`;
    },

    configureServer(server) {
      const dir = path.resolve(root, MUSIC_DIR);

      const refresh = (file) => {
        if (!file.startsWith(dir)) return;
        if (!AUDIO_EXTENSIONS.includes(path.extname(file).toLowerCase())) return;

        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);

        const send = server.hot?.send?.bind(server.hot) || server.ws?.send?.bind(server.ws);
        send?.({ type: 'full-reload' });
      };

      server.watcher.on('add', refresh);
      server.watcher.on('unlink', refresh);
    },
  };
}
