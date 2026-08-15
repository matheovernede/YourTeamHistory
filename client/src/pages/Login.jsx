import { useState } from 'react';
import { api } from '../api/client';
import './Login.css';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [teamName, setTeamName] = useState('');
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
            <p className="login-hint">Vous disposerez de 50M€ pour recruter vos joueurs au mercato</p>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Création...' : 'Commencer le mercato'}
            </button>
          </form>
        )}

        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  );
}
