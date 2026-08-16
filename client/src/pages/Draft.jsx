import { useState, useEffect } from 'react';
import { api } from '../api/client';
import PlayerCard from '../components/PlayerCard';
import './Draft.css';

export default function Draft({ manager, team, onFinish, isInitialDraft }) {
  const [available, setAvailable] = useState([]);
  const [mySquad, setMySquad] = useState([]);
  const [budget, setBudget] = useState(manager.budget);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadDraft();
  }, []);

  async function loadDraft() {
    try {
      const difficulty = localStorage.getItem('footmanager_difficulty') || 'normal';
      const players = await api.getDraftPlayers(team.division || 1, manager.reputation || 50, team.id, difficulty);
      setAvailable(players);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy(player) {
    if (budget < player.value) {
      setMessage('Budget insuffisant !');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    try {
      const result = await api.draftBuy(manager.id, team.id, player);
      setBudget(result.newBudget);
      setMySquad(prev => [...prev, player]);
      setAvailable(prev => prev.filter(p => p.id !== player.id));
      setMessage(`${player.first_name} ${player.last_name} recruté !`);
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage(`Erreur: ${err.message}`);
      setTimeout(() => setMessage(''), 3000);
    }
  }

  async function handleFinish() {
    if (isInitialDraft && mySquad.length < 11) {
      setMessage(`Il vous faut au minimum 11 joueurs ! (${mySquad.length}/11)`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const result = await api.draftFinish(manager.id, team.id);
      onFinish({ ...manager, budget }, result.team);
    } catch (err) {
      setMessage(`Erreur: ${err.message}`);
      setTimeout(() => setMessage(''), 3000);
    }
  }

  function refreshMarket() {
    setLoading(true);
    loadDraft();
  }

  const filtered = filter === 'all' ? available : available.filter(p => {
    if (filter === 'att') return ['BU', 'AIG', 'AID'].includes(p.position);
    if (filter === 'mid') return ['MC', 'MOC', 'MDF', 'MG', 'MD'].includes(p.position);
    if (filter === 'def') return ['DC', 'ARG', 'ARD', 'PG', 'PD'].includes(p.position);
    if (filter === 'gk') return p.position === 'GAR';
    return true;
  });

  const posCount = {
    GAR: mySquad.filter(p => p.position === 'GAR').length,
    DEF: mySquad.filter(p => ['DC', 'ARG', 'ARD', 'PG', 'PD'].includes(p.position)).length,
    MIL: mySquad.filter(p => ['MC', 'MOC', 'MDF', 'MG', 'MD'].includes(p.position)).length,
    ATT: mySquad.filter(p => ['BU', 'AIG', 'AID'].includes(p.position)).length,
  };

  if (loading) return <div className="page-loading">Chargement du mercato...</div>;

  return (
    <div className="draft-page">
      <div className="draft-header">
        <div className="draft-title">
          <h1>{isInitialDraft ? 'Mercato Initial' : 'Mercato'}</h1>
          <p>{isInitialDraft ? 'Recrutez au minimum 11 joueurs pour former votre équipe' : 'Renforcez votre effectif pour la prochaine saison'}</p>
        </div>
        <div className="draft-status">
          <div className="draft-budget">{(budget / 1000000).toFixed(1)}M€</div>
          {isInitialDraft && (
            <div className="draft-count">
              <span className={mySquad.length >= 11 ? 'count-ok' : 'count-need'}>{mySquad.length}/11</span>
              joueurs
            </div>
          )}
          {!isInitialDraft && (
            <div className="draft-count">
              <span className="count-ok">{mySquad.length}</span>
              recrue{mySquad.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {message && <div className="draft-message">{message}</div>}

      <div className="draft-squad-summary">
        <span className="pos-badge">GAR: {posCount.GAR}</span>
        <span className="pos-badge">DEF: {posCount.DEF}</span>
        <span className="pos-badge">MIL: {posCount.MIL}</span>
        <span className="pos-badge">ATT: {posCount.ATT}</span>
        <button className="btn-refresh" onClick={refreshMarket}>🔄 Rafraîchir le marché</button>
        {(isInitialDraft ? mySquad.length >= 11 : true) && (
          <button className="btn-primary btn-finish" onClick={handleFinish}>
            {isInitialDraft ? '✅ Valider mon effectif' : '✅ Terminer le mercato'}
          </button>
        )}
      </div>

      <div className="draft-filters">
        {[
          { id: 'all', label: 'Tous' },
          { id: 'gk', label: 'Gardiens' },
          { id: 'def', label: 'Défenseurs' },
          { id: 'mid', label: 'Milieux' },
          { id: 'att', label: 'Attaquants' },
        ].map(f => (
          <button
            key={f.id}
            className={`filter-btn ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="draft-grid">
        {filtered.map(player => (
          <div key={player.id} className={player.tier === 'legend' ? 'legend-wrapper' : ''}>
          <PlayerCard
            player={player}
            actions={
              <>
                <span className={`draft-price ${player.tier === 'legend' ? 'legend-price' : ''}`}>{(player.value / 1000000).toFixed(1)}M€</span>
                <span className={`draft-tier ${player.tier === 'legend' ? 'tier-legend' : ''}`}>{player.tier === 'legend' ? '⭐ Légende' : player.tier}</span>
                <button
                  className={`btn-small ${player.tier === 'legend' ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => handleBuy(player)}
                  disabled={budget < player.value}
                >
                  Recruter
                </button>
              </>
            }
          />
          </div>
        ))}
        {filtered.length === 0 && <p className="no-data">Aucun joueur disponible dans cette catégorie</p>}
      </div>
    </div>
  );
}
