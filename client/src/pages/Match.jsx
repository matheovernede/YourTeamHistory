import { useState, useEffect } from 'react';
import { api } from '../api/client';
import './Match.css';

export default function Match({ team, manager, onUpdate }) {
  const [matchResult, setMatchResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [team.id]);

  async function loadHistory() {
    const data = await api.getMatchHistory(team.id);
    setHistory(data);
  }

  async function playMatch() {
    setLoading(true);
    setMatchResult(null);
    try {
      const result = await api.playMatch(team.id);
      setMatchResult(result);
      onUpdate(result.team);
      await loadHistory();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="match-page">
      <div className="match-header">
        <h2>Jouer un Match</h2>
        <div className="team-stats-bar">
          <span>Saison {team.season}</span>
          <span>J{team.wins + team.draws + team.losses}</span>
          <span className="stat-win">{team.wins}V</span>
          <span className="stat-draw">{team.draws}N</span>
          <span className="stat-loss">{team.losses}D</span>
          <span className="stat-pts">{team.points} pts</span>
        </div>
      </div>

      <div className="match-actions">
        <button className="btn-primary play-btn" onClick={playMatch} disabled={loading}>
          {loading ? '⏳ Simulation...' : '⚽ Jouer le prochain match'}
        </button>
      </div>

      {matchResult && (
        <div className="match-result card">
          {matchResult.match.isHome !== undefined && (
            <div className="result-venue">
              {matchResult.match.isHome ? 'À domicile' : 'À l\'extérieur'}
            </div>
          )}
          <div className="result-score">
            <div className="result-team">
              <span className="result-name">{team.name}</span>
              <span className="result-goals">
                {matchResult.match.goalsFor ?? matchResult.match.homeGoals}
              </span>
            </div>
            <span className="result-vs">-</span>
            <div className="result-team">
              <span className="result-goals">
                {matchResult.match.goalsAgainst ?? matchResult.match.awayGoals}
              </span>
              <span className="result-name">{matchResult.match.opponent}</span>
            </div>
          </div>

          <div className="result-points">
            {matchResult.match.pointsEarned === 3 && <span className="badge-win">Victoire ! +3 pts</span>}
            {matchResult.match.pointsEarned === 1 && <span className="badge-draw">Match nul +1 pt</span>}
            {matchResult.match.pointsEarned === 0 && <span className="badge-loss">Défaite</span>}
          </div>

          {matchResult.match.events.length > 0 && (
            <div className="match-events">
              {matchResult.match.events.map((event, i) => (
                <div key={i} className={`event event-${event.type}`}>
                  <span className="event-minute">{event.minute}'</span>
                  <span className="event-icon">
                    {event.type === 'goal' ? '⚽' : '🟨'}
                  </span>
                  <span className="event-player">{event.player}</span>
                  <span className="event-team">({event.team === 'home' ? team.name : matchResult.match.opponent})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="match-history">
        <h3 onClick={() => setShowHistory(!showHistory)} style={{cursor: 'pointer'}}>
          📋 Historique {showHistory ? '▾' : '▸'}
        </h3>
        {showHistory && (
          <div className="history-list">
            {history.map(match => (
              <div key={match.id} className="history-item">
                <span className="history-teams">
                  {match.home_name} {match.home_goals} - {match.away_goals} {match.away_name}
                </span>
                <span className="history-date">{match.played_at?.split('T')[0]}</span>
              </div>
            ))}
            {history.length === 0 && <p className="no-data">Aucun match joué</p>}
          </div>
        )}
      </div>
    </div>
  );
}
