import { useState } from 'react';
import { api } from '../api/client';
import './Login.css';

export default function Login({ onLogin, onLoadSave }) {
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
      const result = await api.createTeam(manager.id, teamName.trim());
      localStorage.setItem('footmanager_difficulty', difficulty);
      onLogin(manager, result.team);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="login-icon">⚽</span>
          <h1>Foot Manager</h1>
          <p>Recrutez votre équipe, disputez des matchs, grimpez au classement !</p>
        </div>

        {step === 'login' && (
          <>
            <form onSubmit={handleLogin}>
              <label>Votre pseudo</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Entrez votre pseudo..."
                autoFocus
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Connexion...' : 'Jouer'}
              </button>
            </form>
            <div className="login-separator"><span>ou</span></div>
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
                  setError('Fichier de sauvegarde invalide');
                }
              };
              input.click();
            }}>
              📂 Charger une sauvegarde
            </button>
          </>
        )}

        {step === 'team' && (
          <form onSubmit={handleCreateTeam}>
            <label>Bienvenue {manager.username} ! Nommez votre équipe :</label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="Ex: FC Tempête..."
              autoFocus
            />
            <div className="difficulty-select">
              <label>Difficulté :</label>
              <div className="difficulty-options">
                <button type="button" className={`diff-btn ${difficulty === 'easy' ? 'active easy' : ''}`} onClick={() => setDifficulty('easy')}>
                  <span className="diff-icon">🟢</span>
                  <span className="diff-name">Facile</span>
                  <span className="diff-desc">IA affaiblie, budget +50%</span>
                </button>
                <button type="button" className={`diff-btn ${difficulty === 'normal' ? 'active normal' : ''}`} onClick={() => setDifficulty('normal')}>
                  <span className="diff-icon">🟡</span>
                  <span className="diff-name">Normal</span>
                  <span className="diff-desc">Expérience équilibrée</span>
                </button>
                <button type="button" className={`diff-btn ${difficulty === 'hard' ? 'active hard' : ''}`} onClick={() => setDifficulty('hard')}>
                  <span className="diff-icon">🔴</span>
                  <span className="diff-name">Difficile</span>
                  <span className="diff-desc">IA boostée, budget -30%</span>
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading || !teamName.trim()}>
              {loading ? 'Création...' : 'Commencer le mercato'}
            </button>
          </form>
        )}

        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  );
}
