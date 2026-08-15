import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import PlayerCard from '../components/PlayerCard';
import './Season.css';

function posClass(pos) {
  if (pos === 'GK') return 'pos-gk';
  if (['CB', 'LB', 'RB'].includes(pos)) return 'pos-def';
  if (['CM', 'CAM'].includes(pos)) return 'pos-mid';
  return 'pos-att';
}

export default function Season({ manager, team, onUpdate, onManagerUpdate, onSeasonEnd }) {
  const [status, setStatus] = useState(null);
  const [lastMatch, setLastMatch] = useState(null);
  const [sponsors, setSponsors] = useState(null);
  const [sponsorChosen, setSponsorChosen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [view, setView] = useState('season');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [managementActions, setManagementActions] = useState([]);
  const [pendingEvent, setPendingEvent] = useState(null);
  const [eventResult, setEventResult] = useState(null);
  const [liveMatch, setLiveMatch] = useState(null);
  const [liveMinute, setLiveMinute] = useState(0);
  const [liveEvents, setLiveEvents] = useState([]);
  const [liveScore, setLiveScore] = useState([0, 0]);
  const [matchSpeed, setMatchSpeed] = useState(1);
  const matchSpeedRef = useRef(1);
  const matchTimerRef = useRef(null);
  const [clState, setCLState] = useState(null);
  const [clLastResult, setCLLastResult] = useState(null);

  useEffect(() => {
    loadStatus();
    loadPlayers();
    if (team.division >= 7) loadCLStatus();
  }, [team.id]);

  async function loadStatus() {
    const data = await api.getSeasonStatus(team.id);
    setStatus(data);
  }

  async function loadPlayers() {
    const data = await api.getPlayers(team.id);
    setPlayers(data);
  }

  async function loadCLStatus() {
    try {
      const data = await api.getCLStatus(team.id);
      setCLState(data);
    } catch (e) {
      // CL not available or locked
      setCLState(null);
    }
  }

  async function handleInitCL() {
    setLoading(true);
    try {
      const data = await api.initCL(team.id);
      await loadCLStatus();
      setMessage('Champions League initialisee !');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  }

  async function handlePlayCLMatch() {
    setLoading(true);
    try {
      const data = await api.playCLMatch(team.id);
      setCLLastResult(data);
      await loadCLStatus();
      await loadPlayers();
      if (data.result) {
        setMessage(`CL: ${data.result.resultText} ${data.result.playerGoals}-${data.result.opponentGoals} vs ${data.result.opponent}`);
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      setMessage(err.message);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetStarter(playerId) {
    const starters = players.filter(p => p.is_starter);
    if (starters.length >= 11) {
      setMessage('Déjà 11 titulaires ! Retirez-en un d\'abord.');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    setPlayers(players.map(p => p.id === playerId ? { ...p, is_starter: 1 } : p));
  }

  function handleSetSub(playerId) {
    setPlayers(players.map(p => p.id === playerId ? { ...p, is_starter: 0 } : p));
  }

  async function handleSaveLineup() {
    const starterIds = players.filter(p => p.is_starter).map(p => p.id);
    if (starterIds.length !== 11) {
      setMessage(`Il faut exactement 11 titulaires (actuellement ${starterIds.length})`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setLoading(true);
    try {
      const updated = await api.setLineup(team.id, starterIds);
      setPlayers(updated);
      setMessage('Composition sauvegardée !');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetFormation(e) {
    const formation = e.target.value;
    await api.setFormation(team.id, formation);
    onUpdate({ ...team, formation });
  }

  function cycleSpeed() {
    const speeds = [1, 2, 5, 10];
    const idx = speeds.indexOf(matchSpeedRef.current);
    const next = speeds[(idx + 1) % speeds.length];
    matchSpeedRef.current = next;
    setMatchSpeed(next);
  }

  async function handlePlayMatch() {
    setLoading(true);
    matchSpeedRef.current = 1;
    setMatchSpeed(1);
    try {
      const result = await api.playMatchday(team.id);

      setLiveMatch(result);
      setLiveMinute(0);
      setLiveEvents([]);
      setLiveScore([0, 0]);
      setView('live');

      const events = result.match.events || [];
      const baseInterval = 10000 / 90;

      let minute = 0;
      function tick() {
        minute++;
        setLiveMinute(minute);

        const eventsNow = events.filter(e => e.minute === minute);
        if (eventsNow.length > 0) {
          setLiveEvents(prev => [...prev, ...eventsNow]);
          setLiveScore(prev => {
            let [h, a] = prev;
            eventsNow.forEach(e => {
              if (e.type === 'goal') {
                if (e.team === 'home') h++;
                else a++;
              }
            });
            return [h, a];
          });
        }

        if (minute >= 90) {
          setTimeout(() => {
            setLiveMatch(null);
            setView('season');
            setLastMatch(result.match);
            onUpdate(result.team);
            loadStatus();
            loadPlayers();

            if (result.event) {
              setPendingEvent(result.event);
              setEventResult(null);
            }
            if (result.seasonOver) {
              setMessage('Saison terminée ! Consultez le bilan.');
            }
          }, 800 / matchSpeedRef.current);
        } else {
          matchTimerRef.current = setTimeout(tick, baseInterval / matchSpeedRef.current);
        }
      }

      matchTimerRef.current = setTimeout(tick, baseInterval);

    } catch (err) {
      if (err.message.includes('Saison terminée')) {
        setMessage('Saison terminée ! Consultez le bilan.');
      } else {
        setMessage(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGetSponsors() {
    const data = await api.getSponsors(team.id);
    setSponsors(data);
    setView('sponsors');
  }

  async function handleChooseSponsor(sponsorId) {
    setLoading(true);
    try {
      const result = await api.chooseSponsor(team.id, sponsorId, manager.id);
      setMessage(`Sponsor ${result.sponsor.name} signé ! +${(result.sponsor.payment / 1000000).toFixed(0)}M€`);
      setSponsorChosen(true);
      setView('season');
      onUpdate({ ...team });
      if (onManagerUpdate) onManagerUpdate({ ...manager, budget: result.newBudget, reputation: result.newReputation });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadManagement() {
    const data = await api.getManagement(team.id);
    setManagementActions(data.actions);
  }

  async function handleBuyManagement(actionId) {
    setLoading(true);
    try {
      const result = await api.buyManagement(team.id, actionId, manager.id);
      setMessage(`${result.action.icon} ${result.action.name} appliqué ! (-${formatMoney(result.cost)})`);
      onUpdate(result.team);
      if (result.manager && onManagerUpdate) onManagerUpdate(result.manager);
      await loadManagement();
      await loadPlayers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenManagement() {
    loadManagement();
    setView('management');
  }

  async function handleResolveEvent(choiceId) {
    setLoading(true);
    try {
      const result = await api.resolveEvent(team.id, pendingEvent.id, choiceId, manager.id);
      if (result.manager && onManagerUpdate) onManagerUpdate(result.manager);
      if (result.team) onUpdate(result.team);
      await loadPlayers();
      setPendingEvent(null);
      setEventResult(null);
      setMessage(result.consequence);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage(err.message);
      setPendingEvent(null);
    } finally {
      setLoading(false);
    }
  }

  function dismissEvent() {
    setPendingEvent(null);
    setEventResult(null);
  }

  function formatMoney(amount) {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M€`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}k€`;
    return `${amount}€`;
  }

  async function handleEndSeason() {
    setLoading(true);
    try {
      const result = await api.endSeason(team.id, manager.id);
      onSeasonEnd(result);
    } finally {
      setLoading(false);
    }
  }

  if (!status) return <div className="page-loading">Chargement...</div>;

  const seasonOver = status.played >= status.totalMatches;

  return (
    <div className="season-page">
      <div className="season-header">
        <div className="season-info">
          <h1>{status.division} — Saison {status.season}</h1>
          <div className="season-meta">
            <span>Journée {status.played}/{status.totalMatches}</span>
            <span className="rank-badge">#{status.rank}</span>
            <span className="budget-badge">{(manager.budget / 1000000).toFixed(1)}M€</span>
            <span className="rep-badge">Rep: {manager.reputation}</span>
          </div>
        </div>
        <div className="season-nav">
          <button className={view === 'season' ? 'active' : ''} onClick={() => setView('season')}>Saison</button>
          <button className={view === 'standings' ? 'active' : ''} onClick={() => setView('standings')}>Classement</button>
          <button className={view === 'lineup' ? 'active' : ''} onClick={() => setView('lineup')}>Compo</button>
          <button className={view === 'squad' ? 'active' : ''} onClick={() => setView('squad')}>Effectif</button>
          <button className={view === 'management' ? 'active' : ''} onClick={handleOpenManagement}>Gestion</button>
          {team.division >= 7 && (
            <button className={`cl-tab ${view === 'cl' ? 'active' : ''}`} onClick={() => { setView('cl'); loadCLStatus(); }}>Champions League</button>
          )}
        </div>
      </div>

      {message && <div className="season-message">{message}<button onClick={() => setMessage('')}>×</button></div>}

      {pendingEvent && (
        <div className="event-overlay">
          <div className="event-modal card">
            <div className="event-header">
              <span className="event-type">{pendingEvent.type}</span>
              <h2>{pendingEvent.title}</h2>
            </div>
            <p className="event-desc">{pendingEvent.description}</p>

            <div className="event-choices">
              {pendingEvent.choices.map(choice => (
                <button
                  key={choice.id}
                  className="event-choice"
                  onClick={() => handleResolveEvent(choice.id)}
                  disabled={loading}
                >
                  <span className="choice-text">{choice.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'live' && liveMatch && (
        <div className="live-match">
          <div className="live-header">
            <span className="live-badge">EN DIRECT</span>
            <span className="live-matchday">Journée {liveMatch.match.matchday}</span>
            <button className="live-speed-btn" onClick={cycleSpeed}>x{matchSpeed}</button>
          </div>
          <div className="live-score-board">
            <div className="live-team home">
              <span className="live-team-name">{team.name}</span>
            </div>
            <div className="live-score-center">
              <span className="live-goals">{liveScore[0]} - {liveScore[1]}</span>
              <span className="live-minute">{liveMinute}'</span>
              <div className="live-progress">
                <div className="live-progress-bar" style={{width: `${(liveMinute / 90) * 100}%`}} />
              </div>
            </div>
            <div className="live-team away">
              <span className="live-team-name">{liveMatch.match.opponent}</span>
            </div>
          </div>
          <div className="live-events-feed">
            {liveEvents.map((e, i) => (
              <div key={i} className={`live-event ${e.type}`}>
                <span className="live-event-minute">{e.minute}'</span>
                <span className="live-event-icon">{e.type === 'goal' ? '⚽' : '🟨'}</span>
                <span className="live-event-text">{e.player}</span>
                <span className="live-event-team">{e.team === 'home' ? team.name : liveMatch.match.opponent}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'season' && (
        <div className="season-main">
          <div className="season-stats card">
            <div className="stats-row">
              <div className="stat-box"><span className="stat-val">{team.points}</span><span className="stat-label">Points</span></div>
              <div className="stat-box win"><span className="stat-val">{team.wins}</span><span className="stat-label">Victoires</span></div>
              <div className="stat-box draw"><span className="stat-val">{team.draws}</span><span className="stat-label">Nuls</span></div>
              <div className="stat-box loss"><span className="stat-val">{team.losses}</span><span className="stat-label">Défaites</span></div>
              <div className="stat-box"><span className="stat-val">{team.goals_for}-{team.goals_against}</span><span className="stat-label">Buts</span></div>
            </div>
          </div>

          {!seasonOver && (
            <div className="season-actions">
              <button className="btn-primary action-btn" onClick={handlePlayMatch} disabled={loading}>
                ⚽ Jouer la journée {status.played + 1}
              </button>
              {!sponsorChosen && status.played >= 5 && (
                <button className="btn-secondary action-btn" onClick={handleGetSponsors}>
                  🤝 Offres de sponsors
                </button>
              )}
            </div>
          )}

          {seasonOver && (
            <div className="season-end card">
              <h2>🏁 Fin de saison !</h2>
              <p>Vous terminez <strong>#{status.rank}</strong> du championnat avec <strong>{team.points} points</strong>.</p>
              <button className="btn-primary action-btn" onClick={handleEndSeason} disabled={loading}>
                Bilan & Mercato →
              </button>
            </div>
          )}

          {lastMatch && (
            <div className="last-match card">
              <h3>Dernier match (J{lastMatch.matchday})</h3>
              <div className="match-score">
                <span className="team-name">{team.name}</span>
                <span className="score">{lastMatch.homeGoals} - {lastMatch.awayGoals}</span>
                <span className="team-name">{lastMatch.opponent}</span>
              </div>
              <span className={`result-tag ${lastMatch.resultText.toLowerCase().replace(' ', '-')}`}>
                {lastMatch.resultText} {lastMatch.pointsEarned > 0 ? `+${lastMatch.pointsEarned} pts` : ''}
              </span>
              {lastMatch.events.length > 0 && (
                <div className="match-events-mini">
                  {lastMatch.events.filter(e => e.type === 'goal').map((e, i) => (
                    <div key={i} className="event-mini">
                      ⚽ {e.minute}' {e.player}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {view === 'standings' && (
        <div className="standings-view">
          <table className="standings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Équipe</th>
                <th>Pts</th>
                <th>V</th>
                <th>N</th>
                <th>D</th>
                <th>BP</th>
                <th>BC</th>
                <th>Diff</th>
              </tr>
            </thead>
            <tbody>
              {status.standings.map((t, i) => (
                <tr key={t.id} className={t.id === team.id ? 'my-team' : ''}>
                  <td className="rank">{i + 1}</td>
                  <td className="team-name-cell">{t.name}</td>
                  <td className="pts">{t.points}</td>
                  <td>{t.wins}</td>
                  <td>{t.draws}</td>
                  <td>{t.losses}</td>
                  <td>{t.goals_for}</td>
                  <td>{t.goals_against}</td>
                  <td className={t.goal_diff > 0 ? 'pos' : t.goal_diff < 0 ? 'neg' : ''}>{t.goal_diff > 0 ? '+' : ''}{t.goal_diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'lineup' && (
        <div className="lineup-view">
          <div className="lineup-header">
            <div className="lineup-formation">
              <label>Formation :</label>
              <select value={team.formation || '4-4-2'} onChange={handleSetFormation}>
                <option value="4-4-2">4-4-2</option>
                <option value="4-3-3">4-3-3</option>
                <option value="3-5-2">3-5-2</option>
                <option value="4-2-3-1">4-2-3-1</option>
                <option value="5-3-2">5-3-2</option>
                <option value="3-4-3">3-4-3</option>
              </select>
            </div>
            <button className="btn-primary" onClick={handleSaveLineup} disabled={loading}>
              💾 Sauvegarder ({players.filter(p => p.is_starter).length}/11)
            </button>
          </div>

          <div className="lineup-section">
            <h3>Titulaires ({players.filter(p => p.is_starter).length}/11)</h3>
            <div className="lineup-grid">
              {players.filter(p => p.is_starter).map(p => (
                <div key={p.id} className="lineup-player starter">
                  <div className="lp-info">
                    <span className={`lp-pos ${posClass(p.position)}`}>{p.position}</span>
                    <span className="lp-name">{p.first_name} {p.last_name}</span>
                    <span className="lp-ovr">{p.overall}</span>
                  </div>
                  <div className="lp-bars">
                    <div className="lp-bar"><span>STA</span><div className="bar-fill" style={{width: `${p.stamina}%`, background: p.stamina > 60 ? 'var(--success)' : 'var(--danger)'}} /></div>
                    <div className="lp-bar"><span>MOR</span><div className="bar-fill" style={{width: `${p.morale}%`, background: 'var(--warning)'}} /></div>
                  </div>
                  <button className="btn-small btn-danger" onClick={() => handleSetSub(p.id)}>↓</button>
                </div>
              ))}
            </div>
          </div>

          <div className="lineup-section">
            <h3>Remplaçants ({players.filter(p => !p.is_starter).length})</h3>
            <div className="lineup-grid">
              {players.filter(p => !p.is_starter).map(p => (
                <div key={p.id} className="lineup-player sub">
                  <div className="lp-info">
                    <span className={`lp-pos ${posClass(p.position)}`}>{p.position}</span>
                    <span className="lp-name">{p.first_name} {p.last_name}</span>
                    <span className="lp-ovr">{p.overall}</span>
                  </div>
                  <div className="lp-bars">
                    <div className="lp-bar"><span>STA</span><div className="bar-fill" style={{width: `${p.stamina}%`, background: p.stamina > 60 ? 'var(--success)' : 'var(--danger)'}} /></div>
                    <div className="lp-bar"><span>MOR</span><div className="bar-fill" style={{width: `${p.morale}%`, background: 'var(--warning)'}} /></div>
                  </div>
                  <button className="btn-small btn-primary" onClick={() => handleSetStarter(p.id)} disabled={players.filter(x => x.is_starter).length >= 11}>↑</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'squad' && (
        <div className="squad-view">
          <div className="players-grid">
            {players.map(p => <PlayerCard key={p.id} player={p} />)}
          </div>
        </div>
      )}

      {view === 'sponsors' && sponsors && (
        <div className="sponsors-view">
          <h2>🤝 Offres de Sponsors</h2>
          <p className="sponsors-hint">Choisissez un sponsor pour la saison. Attention aux conséquences !</p>
          <div className="sponsors-grid">
            {sponsors.map(sponsor => (
              <div key={sponsor.id} className={`sponsor-card card tier-${sponsor.tier}`}>
                <div className="sponsor-header">
                  <span className="sponsor-logo">{sponsor.logo}</span>
                  <div>
                    <h3>{sponsor.name}</h3>
                    <span className="sponsor-tier">{sponsor.tier}</span>
                  </div>
                  <span className="sponsor-pay">+{(sponsor.payment / 1000000).toFixed(0)}M€</span>
                </div>
                <p className="sponsor-desc">{sponsor.description}</p>
                <div className="sponsor-effects">
                  {sponsor.bonus.morale > 0 && <span className="effect-good">Moral +{sponsor.bonus.morale}</span>}
                  {sponsor.bonus.reputation > 0 && <span className="effect-good">Réputation +{sponsor.bonus.reputation}</span>}
                  {sponsor.bonus.stamina_boost > 0 && <span className="effect-good">Forme +{sponsor.bonus.stamina_boost}</span>}
                  {sponsor.malus.morale && <span className="effect-bad">Moral {sponsor.malus.morale}</span>}
                  {sponsor.malus.reputation && <span className="effect-bad">Réputation {sponsor.malus.reputation}</span>}
                </div>
                <button className="btn-primary" onClick={() => handleChooseSponsor(sponsor.id)} disabled={loading}>
                  Signer avec {sponsor.name}
                </button>
              </div>
            ))}
          </div>
          <button className="btn-back" onClick={() => setView('season')}>← Retour</button>
        </div>
      )}

      {view === 'management' && (
        <div className="management-view">
          <h2>Gestion du club</h2>
          <p className="management-hint">Investissez dans votre club pour améliorer vos performances. Les coûts dépendent de votre division.</p>
          <div className="management-grid">
            {managementActions.map(action => (
              <div key={action.id} className={`management-card card ${!action.available ? 'cooldown' : ''}`}>
                <div className="management-card-header">
                  <span className="management-icon">{action.icon}</span>
                  <div>
                    <h3>{action.name}</h3>
                    <span className="management-effect">{action.effect}</span>
                  </div>
                  <span className="management-cost">{formatMoney(action.cost)}</span>
                </div>
                <p className="management-desc">{action.description}</p>
                {!action.available && (
                  <span className="management-cooldown">Cooldown: {action.cooldownRemaining} journée(s)</span>
                )}
                <button
                  className="btn-primary"
                  onClick={() => handleBuyManagement(action.id)}
                  disabled={loading || !action.available || manager.budget < action.cost}
                >
                  {manager.budget < action.cost ? 'Budget insuffisant' : !action.available ? 'En cooldown' : `Acheter (${formatMoney(action.cost)})`}
                </button>
              </div>
            ))}
          </div>
          <button className="btn-back" onClick={() => setView('season')}>← Retour</button>
        </div>
      )}

      {view === 'cl' && (
        <div className="cl-view">
          <div className="cl-header-banner">
            <h2>Champions League</h2>
            <p className="cl-subtitle">La plus prestigieuse competition europeenne</p>
          </div>

          {!clState || !clState.active ? (
            <div className="cl-init card">
              <p>Votre equipe est qualifiee pour la Champions League !</p>
              <button className="btn-primary cl-btn" onClick={handleInitCL} disabled={loading}>
                Lancer le tirage au sort
              </button>
            </div>
          ) : (
            <>
              <div className="cl-status-bar">
                <span className="cl-phase-badge">
                  {clState.phase === 'group' && `Phase de groupes - Journee ${clState.currentMatchday}/6`}
                  {clState.phase === 'quarter_final' && 'Quarts de finale'}
                  {clState.phase === 'semi_final' && 'Demi-finales'}
                  {clState.phase === 'final' && 'Finale'}
                </span>
                <span className="cl-earnings">Gains CL: {formatMoney(clState.totalEarnings)}</span>
              </div>

              {clState.eliminated && (
                <div className="cl-eliminated card">
                  <h3>Elimine</h3>
                  <p>Votre parcours en Champions League est termine cette saison.</p>
                  <p>Gains totaux : <strong>{formatMoney(clState.totalEarnings)}</strong></p>
                </div>
              )}

              {clState.winner && (
                <div className="cl-winner card">
                  <h3>Vainqueur de la Champions League !</h3>
                  <p>Felicitations ! Vous remportez la plus grande competition europeenne !</p>
                  <p>Gains totaux : <strong>{formatMoney(clState.totalEarnings)}</strong></p>
                </div>
              )}

              {!clState.eliminated && !clState.winner && (
                <div className="cl-actions">
                  <button className="btn-primary cl-btn" onClick={handlePlayCLMatch} disabled={loading}>
                    Jouer le prochain match CL
                  </button>
                  {clState.nextMatch && (
                    <span className="cl-next-info">
                      Prochain: vs {clState.nextMatch.opponent || clState.nextMatch.away || clState.nextMatch.home}
                      {clState.nextMatch.leg && ` (${clState.nextMatch.leg === 1 ? 'Aller' : 'Retour'})`}
                    </span>
                  )}
                </div>
              )}

              {clLastResult && clLastResult.result && (
                <div className="cl-last-result card">
                  <h3>Dernier resultat CL</h3>
                  <div className="match-score">
                    <span className="team-name">{clLastResult.result.isHome ? team.name : clLastResult.result.opponent}</span>
                    <span className="score">
                      {clLastResult.result.isHome ? clLastResult.result.playerGoals : clLastResult.result.opponentGoals}
                      {' - '}
                      {clLastResult.result.isHome ? clLastResult.result.opponentGoals : clLastResult.result.playerGoals}
                    </span>
                    <span className="team-name">{clLastResult.result.isHome ? clLastResult.result.opponent : team.name}</span>
                  </div>
                  <span className={`result-tag ${clLastResult.result.resultText.toLowerCase().replace(' ', '-')}`}>
                    {clLastResult.result.resultText}
                  </span>
                  {clLastResult.result.aggregate && (
                    <p className="cl-aggregate">Score cumule: {clLastResult.result.aggregate.player} - {clLastResult.result.aggregate.opponent}</p>
                  )}
                  {clLastResult.result.penalties && (
                    <p className="cl-penalties">{clLastResult.result.penaltyWin ? 'Victoire aux tirs au but !' : 'Defaite aux tirs au but'}</p>
                  )}
                  {clLastResult.result.events && clLastResult.result.events.filter(e => e.type === 'goal').length > 0 && (
                    <div className="match-events-mini">
                      {clLastResult.result.events.filter(e => e.type === 'goal').map((e, i) => (
                        <div key={i} className="event-mini">
                          {e.minute}' {e.player} ({e.team === 'home' ? 'Dom' : 'Ext'})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {clState.phase === 'group' && clState.groups && (
                <div className="cl-groups">
                  {clState.groups.map(group => (
                    <div key={group.name} className="cl-group card">
                      <h3>Groupe {group.name}</h3>
                      <table className="cl-group-table">
                        <thead>
                          <tr>
                            <th>Equipe</th>
                            <th>J</th>
                            <th>V</th>
                            <th>N</th>
                            <th>D</th>
                            <th>BP</th>
                            <th>BC</th>
                            <th>Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...group.standings].sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)).map((t, i) => (
                            <tr key={t.name} className={`${t.isPlayer ? 'my-team' : ''} ${i < 2 ? 'qualified' : ''}`}>
                              <td className="team-name-cell">{t.name}</td>
                              <td>{t.played}</td>
                              <td>{t.wins}</td>
                              <td>{t.draws}</td>
                              <td>{t.losses}</td>
                              <td>{t.goalsFor}</td>
                              <td>{t.goalsAgainst}</td>
                              <td className="pts">{t.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {clState.knockout && (clState.phase === 'quarter_final' || clState.phase === 'semi_final' || clState.phase === 'final') && (
                <div className="cl-knockout card">
                  <h3>Tableau {clState.phase === 'quarter_final' ? 'Quarts de finale' : clState.phase === 'semi_final' ? 'Demi-finales' : 'Finale'}</h3>
                  {clState.knockout.nextMatch && (
                    <div className="cl-ko-matchup">
                      <span className="cl-ko-team">{team.name}</span>
                      <span className="cl-ko-vs">VS</span>
                      <span className="cl-ko-team">{clState.knockout.nextMatch.opponent}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <button className="btn-back" onClick={() => setView('season')}>&#8592; Retour</button>
        </div>
      )}
    </div>
  );
}
