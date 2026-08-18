import { useI18n } from '../i18n';
import './GuideDebutant.css';

/**
 * Guide des premiers pas.
 *
 * L'écran de saison compte huit onglets. Rien n'indique à un nouveau venu qu'il
 * doit composer son équipe avant de pouvoir jouer, et c'est le mur qui suit
 * celui du recrutement.
 *
 * Le guide lit l'état de la partie plutôt que de dérouler une séquence : le
 * joueur peut se promener dans les onglets, fermer l'onglet et revenir, l'étape
 * affichée reste juste. Une visite guidée scriptée se serait désynchronisée au
 * premier écart, et aurait été à reprendre à chaque modification d'écran.
 */

const CLE_MASQUE = 'yth_guide_masque';

/** Le guide s'efface de lui-même une fois la saison lancée. */
const JOURNEES_AVANT_RETRAIT = 4;

export function guideMasque() {
  try {
    return localStorage.getItem(CLE_MASQUE) === '1';
  } catch {
    return false;
  }
}

/**
 * Étape en cours, déduite de l'état.
 * @returns {{cle: string, action?: string}|null} null quand il n'y a rien à dire
 */
export function etapeCourante({ players, status }) {
  if (!status) return null;

  const journees = status.played || 0;
  if (journees >= JOURNEES_AVANT_RETRAIT) return null;

  const disponibles = players.filter(
    (p) => !p.suspended_matches && !p.injured_matches
  );
  const titulaires = players.filter((p) => p.is_starter).length;

  if (players.length < 11) return { cle: 'recruter' };
  if (titulaires < 11 && disponibles.length >= 11) return { cle: 'composer', action: 'lineup' };
  if (journees === 0) return { cle: 'jouer' };
  if (journees === 1) return { cle: 'apresMatch', action: 'squad' };
  return { cle: 'gestion', action: 'management' };
}

export default function GuideDebutant({ players, status, onAller, onMasquer }) {
  const { t } = useI18n();
  const etape = etapeCourante({ players, status });
  if (!etape) return null;

  return (
    <div className="guide-debutant">
      <div className="guide-tete">
        <span className="guide-pastille">{t('guide.titre')}</span>
        <button
          className="guide-fermer"
          onClick={onMasquer}
          title={t('guide.masquer')}
          aria-label={t('guide.masquer')}
        >
          ×
        </button>
      </div>

      <p className="guide-texte">{t(`guide.${etape.cle}.texte`)}</p>

      {etape.action && (
        <button className="guide-action" onClick={() => onAller(etape.action)}>
          {t(`guide.${etape.cle}.bouton`)}
        </button>
      )}
    </div>
  );
}

export { CLE_MASQUE };
