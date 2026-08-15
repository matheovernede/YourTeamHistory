import { useState, useEffect } from 'react';
import { api } from '../api/client';
import PlayerCard from '../components/PlayerCard';
import './Squad.css';

export default function Squad({ team, onUpdate }) {
  const [players, setPlayers] = useState([]);
  const [formation, setFormation] = useState(team.formation);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPlayers();
  }, [team.id]);

  async function loadPlayers() {
    try {
      const data = await api.getPlayers(team.id);
      setPlayers(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleFormation(e) {
    const newFormation = e.target.value;
    setFormation(newFormation);
    await api.setFormation(team.id, newFormation);
    setMessage(`Formation changée en ${newFormation}`);
    setTimeout(() => setMessage(''), 2000);
  }

  async function toggleStarter(playerId) {
    const starters = players.filter(p => p.is_starter);
    const player = players.find(p => p.id === playerId);

    if (player.is_starter) {
      const newStarters = starters.filter(p => p.id !== playerId).map(p => p.id);
      if (newStarters.length < 11) {
        setPlayers(players.map(p => p.id === playerId ? {...p, is_starter: 0} : p));
        return;
      }
    } else {
      if (starters.length >= 11) {
        setMessage('Maximum 11 titulaires !');
        setTimeout(() => setMessage(''), 2000);
        return;
      }
      const newStarters = [...starters.map(p => p.id), playerId];
      if (newStarters.length === 11) {
        const updated = await api.setLineup(team.id, newStarters);
        setPlayers(updated);
        setMessage('Composition mise à jour !');
        setTimeout(() => setMessage(''), 2000);
        return;
      }
    }

    setPlayers(players.map(p => p.id === playerId ? {...p, is_starter: p.is_starter ? 0 : 1} : p));
  }

  async function handleTrain() {
    setLoading(true);
    try {
      const result = await api.train(team.id);
      setPlayers(result.players);
      setMessage(result.message);
      setTimeout(() => setMessage(''), 2000);
    } finally {
      setLoading(false);
    }
  }

  const starters = players.filter(p => p.is_starter);
  const subs = players.filter(p => !p.is_starter);

  if (loading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="squad-page">
      <div className="squad-header">
        <h2>Mon Effectif</h2>
        <div className="squad-controls">
          <select value={formation} onChange={handleFormation}>
            <option value="4-4-2">4-4-2</option>
            <option value="4-3-3">4-3-3</option>
            <option value="3-5-2">3-5-2</option>
            <option value="4-2-3-1">4-2-3-1</option>
            <option value="5-3-2">5-3-2</option>
            <option value="3-4-3">3-4-3</option>
          </select>
          <button className="btn-primary" onClick={handleTrain}>
            🏋️ Entraîner
          </button>
        </div>
      </div>

      {message && <div className="squad-message">{message}</div>}

      <div className="squad-section">
        <h3>Titulaires ({starters.length}/11)</h3>
        <div className="players-grid">
          {starters.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              actions={
                <button className="btn-small btn-danger" onClick={() => toggleStarter(player.id)}>
                  Remplaçant
                </button>
              }
            />
          ))}
        </div>
      </div>

      <div className="squad-section">
        <h3>Remplaçants ({subs.length})</h3>
        <div className="players-grid">
          {subs.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              actions={
                <button className="btn-small btn-primary" onClick={() => toggleStarter(player.id)}>
                  Titulaire
                </button>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
