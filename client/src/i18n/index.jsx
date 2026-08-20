import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import fr from './fr';
import en from './en';

/**
 * Traduction de l'interface.
 *
 * Écrit à la main plutôt qu'avec une bibliothèque : le besoin se limite à
 * chercher une clé dans un objet, et une dépendance de plus alourdirait le
 * téléchargement pour un service qui tient en trente lignes.
 *
 * Le français sert de langue de référence. Une clé absente d'une traduction
 * retombe dessus, ce qui permet de traduire progressivement sans jamais
 * afficher d'identifiant brut à l'écran.
 */

export const LANGUES = [
  { code: 'fr', nom: 'Français', drapeau: '🇫🇷' },
  { code: 'en', nom: 'English', drapeau: '🇬🇧' },
];

const DICTIONNAIRES = { fr, en };
const CLE_STOCKAGE = 'yth_langue';

const I18nContext = createContext(null);

/** Descend dans l'objet en suivant une clé « a.b.c ». */
function chercher(dictionnaire, chemin) {
  return chemin.split('.').reduce(
    (noeud, morceau) => (noeud && typeof noeud === 'object' ? noeud[morceau] : undefined),
    dictionnaire
  );
}

function langueInitiale() {
  const enregistree = localStorage.getItem(CLE_STOCKAGE);
  if (enregistree && DICTIONNAIRES[enregistree]) return enregistree;

  // Première visite : on suit la langue du navigateur si on la parle.
  const navigateur = (navigator.language || 'fr').slice(0, 2).toLowerCase();
  return DICTIONNAIRES[navigateur] ? navigateur : 'fr';
}

export function I18nProvider({ children }) {
  const [langue, setLangueEtat] = useState(langueInitiale);

  const setLangue = useCallback((code) => {
    if (!DICTIONNAIRES[code]) return;
    localStorage.setItem(CLE_STOCKAGE, code);
    setLangueEtat(code);
  }, []);

  const t = useCallback(
    (chemin, remplacements) => {
      const valeur = chercher(DICTIONNAIRES[langue], chemin) ?? chercher(fr, chemin);

      // Clé inconnue : on renvoie le chemin, visible en développement sans
      // pour autant faire planter l'affichage.
      if (typeof valeur !== 'string') return chemin;
      if (!remplacements) return valeur;

      return Object.entries(remplacements).reduce(
        (texte, [nom, contenu]) => texte.replaceAll(`{${nom}}`, contenu),
        valeur
      );
    },
    [langue]
  );

  /**
   * Abréviation de poste dans la langue courante.
   *
   * Fonction dédiée plutôt qu'un appel direct à `t` : un code inconnu doit
   * s'afficher tel quel, et non sous la forme « postes.XX ». Un poste ajouté
   * au jeu apparaîtra donc brut au lieu de casser l'affichage.
   */
  const tPoste = useCallback(
    (code) => {
      if (!code) return '';
      const table = DICTIONNAIRES[langue] && DICTIONNAIRES[langue].postes;
      return (table && table[code]) || code;
    },
    [langue]
  );

  const valeur = useMemo(() => ({ langue, setLangue, t, tPoste }), [langue, setLangue, t, tPoste]);

  return <I18nContext.Provider value={valeur}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const contexte = useContext(I18nContext);
  if (!contexte) throw new Error('useI18n doit être utilisé dans un I18nProvider');
  return contexte;
}
