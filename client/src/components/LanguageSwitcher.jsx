import { useState, useRef, useEffect } from 'react';
import { useI18n, LANGUES } from '../i18n';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const { langue, setLangue, t } = useI18n();
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef(null);

  // Fermeture au clic extérieur et à la touche Échap : sans cela le menu
  // resterait ouvert par-dessus le jeu.
  useEffect(() => {
    if (!ouvert) return;

    const auClic = (e) => {
      if (conteneur.current && !conteneur.current.contains(e.target)) setOuvert(false);
    };
    const auClavier = (e) => {
      if (e.key === 'Escape') setOuvert(false);
    };

    document.addEventListener('mousedown', auClic);
    document.addEventListener('keydown', auClavier);
    return () => {
      document.removeEventListener('mousedown', auClic);
      document.removeEventListener('keydown', auClavier);
    };
  }, [ouvert]);

  const active = LANGUES.find((l) => l.code === langue) || LANGUES[0];

  return (
    <div className="lang-switch" ref={conteneur}>
      <button
        className="lang-button"
        onClick={() => setOuvert((o) => !o)}
        title={t('langue.changer')}
        aria-label={t('langue.changer')}
        aria-expanded={ouvert}
        aria-haspopup="listbox"
      >
        <span className="lang-flag">{active.drapeau}</span>
        <span className="lang-code">{active.code.toUpperCase()}</span>
      </button>

      {ouvert && (
        <ul className="lang-menu" role="listbox">
          {LANGUES.map((l) => (
            <li key={l.code}>
              <button
                className={l.code === langue ? 'is-active' : ''}
                role="option"
                aria-selected={l.code === langue}
                onClick={() => {
                  setLangue(l.code);
                  setOuvert(false);
                }}
              >
                <span className="lang-flag">{l.drapeau}</span>
                <span>{l.nom}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
