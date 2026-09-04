import { useState } from 'react';
import { api } from '../api/client';
import { KOFI_URL, DISCORD_URL } from '../config';
import { useI18n } from '../i18n';
import './Login.css';

export default function Login({ onLogin, onLoadSave, onDreamTeam, onPlayers }) {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [teamName, setTeamName] = useState('');
  const [difficulty, setDifficulty] = useState('normal');
  const [step, setStep] = useState('login');
  const [manager, setManager] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError('');

    try {
      const result = await api.register(username.trim());
      setManager(result);

      if (result.existing) {
        try {
          const team = await api.getManagerTeam(result.id);
          onLogin(result, team);
        } catch {
          const resetManager = await api.resetManager(result.id);
          setManager(resetManager);
          setStep('team');
        }
      } else {
        setStep('team');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setLoading(true);
    setError('');

    try {
      const result = await api.createTeam(manager.id, teamName.trim(), difficulty);
      localStorage.setItem('footmanager_difficulty', difficulty);
      onLogin({ ...manager, budget: result.manager?.budget || manager.budget }, result.team);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <aside className="login-brand">
          <img className="login-badge" src="/logo-512.png" alt="" width="72" height="72" />
          <h1 className="login-title">YourTeamHistory</h1>
          <p className="login-tagline">{t('accueil.slogan')}</p>
          {/* Un simple repère typographique remplace les pictogrammes : ils
              décoraient sans rien dire de plus que le texte à côté. */}
          <ul className="login-features">
            {['divisions', 'mercato', 'evenements', 'dreamteam'].map((cle) => (
              <li key={cle}>
                {/* Les atouts contiennent une mise en gras : le texte traduit
                    décide où elle tombe, la place du terme changeant d'une
                    langue à l'autre. */}
                <span dangerouslySetInnerHTML={{ __html: t(`accueil.atouts.${cle}`) }} />
              </li>
            ))}
          </ul>
        </aside>

      <div className="login-card">
        <div className="login-header">
          <h2>{step === 'team' ? t('accueil.titreEquipe') : t('accueil.titreConnexion')}</h2>
          <p>{step === 'team' ? t('accueil.sousTitreEquipe') : t('accueil.sousTitreConnexion')}</p>
        </div>

        {step === 'login' && (
          <>
            <form onSubmit={handleLogin}>
              <label>{t('accueil.pseudo')}</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={t('accueil.pseudoExemple')}
                autoFocus
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? t('accueil.connexion') : t('accueil.jouer')}
              </button>
            </form>
            <div className="login-separator"><span>{t('accueil.ou')}</span></div>
            <button className="btn-load-save" onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const saveData = JSON.parse(text);
                  if (onLoadSave) onLoadSave(saveData);
                } catch {
                  setError(t('accueil.sauvegardeInvalide'));
                }
              };
              input.click();
            }}>
              {t('accueil.chargerSauvegarde')}
            </button>
            <div className="login-separator"><span>{t('accueil.ou')}</span></div>
            <button className="btn-dreamteam" onClick={onDreamTeam}>
              {t('accueil.dreamteam')}
            </button>
            <button className="btn-players" onClick={onPlayers}>
              {t('accueil.classementManagers')}
            </button>

            <a
              className="login-discord"
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('accueil.discord')}
            </a>

            <a
              className="login-kofi"
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('accueil.kofi')}
            </a>
          </>
        )}

        {step === 'team' && (
          <form onSubmit={handleCreateTeam}>
            <label>{t('accueil.bienvenue', { nom: manager.username })}</label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder={t('accueil.nomEquipeExemple')}
              autoFocus
            />
            <div className="difficulty-select">
              <label>{t('accueil.difficulte')}</label>
              <div className="difficulty-options">
                {/* La valeur ('easy'/'normal'/'hard') est un identifiant envoyé
                    au serveur : seul le libellé est traduit. */}
                {[
                  { valeur: 'easy', niveau: 1, nom: 'facile' },
                  { valeur: 'normal', niveau: 2, nom: 'normal' },
                  { valeur: 'hard', niveau: 3, nom: 'difficile' },
                ].map((d) => (
                  <button
                    key={d.valeur}
                    type="button"
                    className={`diff-btn ${d.valeur} ${difficulty === d.valeur ? 'active' : ''}`}
                    onClick={() => setDifficulty(d.valeur)}
                    aria-pressed={difficulty === d.valeur}
                  >
                    {/* Trois barres remplies indiquent le niveau. Les pastilles
                        de couleur qu'elles remplacent ne disaient rien à qui
                        distingue mal le vert du rouge. */}
                    <span className="diff-level" aria-hidden="true">
                      {[1, 2, 3].map((n) => (
                        <i key={n} className={n <= d.niveau ? 'on' : ''} />
                      ))}
                    </span>
                    <span className="diff-name">{t(`accueil.${d.nom}`)}</span>
                    <span className="diff-desc">{t(`accueil.${d.nom}Desc`)}</span>
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading || !teamName.trim()}>
              {loading ? t('accueil.creation') : t('accueil.commencerMercato')}
            </button>
          </form>
        )}

        {error && <div className="login-error">{error}</div>}
      </div>
      </div>
    </div>
  );
}
