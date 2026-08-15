import { useState, useEffect } from 'react';
import { api } from '../api/client';
import './Leaderboard.css';

export default function Leaderboard({ manager }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    try {
      const data = await api.getLeaderboard();
      setRankings(data);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="leaderboard-page">
      <h2>🏆 Classement Mondial</h2>

      {rankings.length === 0 ? (
        <div className="no-data card">
          <p>Aucun joueur classé pour le moment.</p>
          <p>Jouez des matchs pour apparaître ici !</p>
        </div>
      ) : (
        <div className="leaderboard-table">
          <div className="lb-header">
            <span className="lb-rank">#</span>
            <span className="lb-name">Manager</span>
            <span className="lb-team">Équipe</span>
            <span className="lb-pts">Pts</span>
            <span className="lb-wins">V</span>
            <span className="lb-goals">Buts</span>
          </div>
          {rankings.map((entry, index) => (
            <div
              key={entry.id}
              className={`lb-row ${entry.manager_id === manager.id ? 'lb-me' : ''}`}
            >
              <span className="lb-rank">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && (index + 1)}
              </span>
              <span className="lb-name">{entry.username}</span>
              <span className="lb-team">{entry.team_name}</span>
              <span className="lb-pts">{entry.points}</span>
              <span className="lb-wins">{entry.wins}</span>
              <span className="lb-goals">{entry.goals_for}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
