import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useI18n } from '../i18n';
import './Match.css';

export default function Match({ team, manager, onUpdate }) {
  const { t } = useI18n();
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
        <h2>{t('match.titre')}</h2>
        <div className="team-stats-bar">
          <span>{t('match.saison', { n: team.season })}</span>
          <span>{t('match.journee', { n: team.wins + team.draws + team.losses })}</span>
          <span className="stat-win">{t('match.victoires', { n: team.wins })}</span>
          <span className="stat-draw">{t('match.nuls', { n: team.draws })}</span>
          <span className="stat-loss">{t('match.defaites', { n: team.losses })}</span>
          <span className="stat-pts">{t('match.points', { n: team.points })}</span>
        </div>
      </div>

      <div className="match-actions">
        <button className="btn-primary play-btn" onClick={playMatch} disabled={loading}>
          {loading ? t('match.simulation') : t('match.jouer')}
        </button>
      </div>

      {matchResult && (
        <div className="match-result card">
          {matchResult.match.isHome !== undefined && (
            <div className="result-venue">
              {matchResult.match.isHome ? t('match.domicile') : t('match.exterieur')}
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
            {matchResult.match.pointsEarned === 3 && <span className="badge-win">{t('match.victoire')}</span>}
            {matchResult.match.pointsEarned === 1 && <span className="badge-draw">{t('match.nul')}</span>}
            {matchResult.match.pointsEarned === 0 && <span className="badge-loss">{t('match.defaite')}</span>}
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
          {t('match.historique')} {showHistory ? '▾' : '▸'}
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
            {history.length === 0 && <p className="no-data">{t('match.aucunMatch')}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
