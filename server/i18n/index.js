/**
 * Traduction des textes servis par l'API.
 *
 * Les fichiers de jeu (events.js, conversations.js…) restent en français et
 * ne sont pas touchés : ils portent la logique, et y mêler des traductions
 * aurait multiplié le risque d'y casser quelque chose. Les traductions vivent
 * à côté, indexées par le même identifiant.
 *
 * Toute clé absente retombe sur le français. Une traduction incomplète laisse
 * donc passer le texte d'origine plutôt qu'un identifiant brut.
 */

const messages = {
  fr: require('./fr/messages'),
  en: require('./en/messages'),
};

const evenements = {
  en: require('./en/events'),
};

const dialogues = {
  en: require('./en/conversations'),
};

const donnees = {
  en: require('./en/data'),
};

const LANGUES = ['fr', 'en'];
const DEFAUT = 'fr';

/** Normalise ce qui arrive du client : `?lang=EN`, `en-GB`, valeur absente… */
function normaliser(langue) {
  if (!langue) return DEFAUT;
  const code = String(langue).slice(0, 2).toLowerCase();
  return LANGUES.includes(code) ? code : DEFAUT;
}

/** Langue demandée pour une requête Express. */
function langueDe(req) {
  return normaliser(
    (req.query && req.query.lang) ||
    (req.body && req.body.lang) ||
    (req.headers && req.headers['accept-language'])
  );
}

/**
 * Message d'interface renvoyé par l'API.
 * @param {string} cle    identifiant, ex. 'erreur.equipeIntrouvable'
 * @param {string} langue code de langue
 * @param {object} [vars] valeurs à insérer, ex. { nom: 'Dupont' }
 */
function t(cle, langue, vars) {
  const code = normaliser(langue);
  const chercher = (dict) =>
    cle.split('.').reduce((n, m) => (n && typeof n === 'object' ? n[m] : undefined), dict);

  const valeur = chercher(messages[code]) ?? chercher(messages[DEFAUT]);
  if (typeof valeur !== 'string') return cle;
  if (!vars) return valeur;

  return Object.entries(vars).reduce(
    (texte, [nom, contenu]) => texte.split(`{${nom}}`).join(contenu),
    valeur
  );
}

/** Applique une traduction à un événement, sans modifier l'original. */
function localiserEvenement(evenement, langue) {
  const code = normaliser(langue);
  if (!evenement || code === DEFAUT) return evenement;

  const trad = evenements[code] && evenements[code][evenement.id];
  if (!trad) return evenement;

  return {
    ...evenement,
    title: trad.title || evenement.title,
    description: trad.description || evenement.description,
    choices: (evenement.choices || []).map((choix) => {
      const tc = trad.choices && trad.choices[choix.id];
      return tc ? { ...choix, text: tc.text || choix.text, consequence: tc.consequence || choix.consequence } : choix;
    }),
  };
}

/** Applique une traduction à un dialogue de joueur. */
function localiserDialogue(dialogue, langue) {
  const code = normaliser(langue);
  if (!dialogue || code === DEFAUT) return dialogue;

  const trad = dialogues[code] && dialogues[code][dialogue.id];
  if (!trad) return dialogue;

  return {
    ...dialogue,
    title: trad.title || dialogue.title,
    message: trad.message || dialogue.message,
    choices: (dialogue.choices || []).map((choix) => {
      const tc = trad.choices && trad.choices[choix.id];
      return tc ? { ...choix, text: tc.text || choix.text, response: tc.response || choix.response } : choix;
    }),
  };
}

/**
 * Traduit une valeur de données de jeu (nom de division, de sponsor…).
 * Renvoie l'original si aucune traduction n'existe.
 */
function localiserDonnee(categorie, valeur, langue) {
  const code = normaliser(langue);
  if (code === DEFAUT || !valeur) return valeur;

  const table = donnees[code] && donnees[code][categorie];
  return (table && table[valeur]) || valeur;
}

/** Conséquence d'un choix d'événement, retrouvée par identifiants. */
function localiserConsequence(eventId, choiceId, texte, langue) {
  const code = normaliser(langue);
  if (code === DEFAUT) return texte;

  const trad = evenements[code] && evenements[code][eventId];
  const tc = trad && trad.choices && trad.choices[choiceId];
  return (tc && tc.consequence) || texte;
}

/** Réplique d'un joueur après un choix de dialogue. */
function localiserReponse(conversationId, choiceId, texte, langue) {
  const code = normaliser(langue);
  if (code === DEFAUT) return texte;

  const trad = dialogues[code] && dialogues[code][conversationId];
  const tc = trad && trad.choices && trad.choices[choiceId];
  return (tc && tc.response) || texte;
}

module.exports = {
  LANGUES,
  langueDe,
  normaliser,
  t,
  localiserEvenement,
  localiserDialogue,
  localiserDonnee,
  localiserConsequence,
  localiserReponse,
};
