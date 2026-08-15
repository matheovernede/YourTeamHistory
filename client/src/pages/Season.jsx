import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import PlayerCard from '../components/PlayerCard';
import './Season.css';

function posClass(pos) {
  if (pos === 'GAR') return 'pos-gk';
  if (['DC', 'ARG', 'ARD', 'PG', 'PD'].includes(pos)) return 'pos-def';
  if (['MC', 'MOC', 'MDF', 'MG', 'MD'].includes(pos)) return 'pos-mid';
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
  const [selectedPitchPlayer, setSelectedPitchPlayer] = useState(null);
  const [selectedBenchPlayer, setSelectedBenchPlayer] = useState(null);
  const [slotAssignments, setSlotAssignments] = useState({});

  const FORMATION_POSITIONS = {
    '4-4-2': [
      { pos: 'GAR', x: 50, y: 90 }, { pos: 'ARG', x: 20, y: 72 }, { pos: 'DC', x: 38, y: 72 },
      { pos: 'DC', x: 62, y: 72 }, { pos: 'ARD', x: 80, y: 72 }, { pos: 'MG', x: 20, y: 45 },
      { pos: 'MC', x: 38, y: 45 }, { pos: 'MC', x: 62, y: 45 }, { pos: 'MD', x: 80, y: 45 },
      { pos: 'BU', x: 38, y: 18 }, { pos: 'BU', x: 62, y: 18 }
    ],
    '4-3-3': [
      { pos: 'GAR', x: 50, y: 90 }, { pos: 'ARG', x: 20, y: 72 }, { pos: 'DC', x: 38, y: 72 },
      { pos: 'DC', x: 62, y: 72 }, { pos: 'ARD', x: 80, y: 72 }, { pos: 'MC', x: 30, y: 48 },
      { pos: 'MC', x: 50, y: 45 }, { pos: 'MC', x: 70, y: 48 }, { pos: 'AIG', x: 22, y: 18 },
      { pos: 'BU', x: 50, y: 15 }, { pos: 'AID', x: 78, y: 18 }
    ],
    '3-5-2': [
      { pos: 'GAR', x: 50, y: 90 }, { pos: 'DC', x: 30, y: 72 }, { pos: 'DC', x: 50, y: 72 },
      { pos: 'DC', x: 70, y: 72 }, { pos: 'MG', x: 15, y: 48 }, { pos: 'MC', x: 35, y: 48 },
      { pos: 'MC', x: 50, y: 45 }, { pos: 'MC', x: 65, y: 48 }, { pos: 'MD', x: 85, y: 48 },
      { pos: 'BU', x: 38, y: 18 }, { pos: 'BU', x: 62, y: 18 }
    ],
    '4-2-3-1': [
      { pos: 'GAR', x: 50, y: 90 }, { pos: 'ARG', x: 20, y: 72 }, { pos: 'DC', x: 38, y: 72 },
      { pos: 'DC', x: 62, y: 72 }, { pos: 'ARD', x: 80, y: 72 }, { pos: 'MDF', x: 38, y: 52 },
      { pos: 'MDF', x: 62, y: 52 }, { pos: 'AIG', x: 22, y: 32 }, { pos: 'MOC', x: 50, y: 32 },
      { pos: 'AID', x: 78, y: 32 }, { pos: 'BU', x: 50, y: 15 }
    ],
    '5-3-2': [
      { pos: 'GAR', x: 50, y: 90 }, { pos: 'PG', x: 15, y: 68 }, { pos: 'DC', x: 32, y: 74 },
      { pos: 'DC', x: 50, y: 74 }, { pos: 'DC', x: 68, y: 74 }, { pos: 'PD', x: 85, y: 68 },
      { pos: 'MC', x: 30, y: 45 }, { pos: 'MC', x: 50, y: 42 }, { pos: 'MC', x: 70, y: 45 },
      { pos: 'BU', x: 38, y: 18 }, { pos: 'BU', x: 62, y: 18 }
    ],
    '3-4-3': [
      { pos: 'GAR', x: 50, y: 90 }, { pos: 'DC', x: 30, y: 72 }, { pos: 'DC', x: 50, y: 72 },
      { pos: 'DC', x: 70, y: 72 }, { pos: 'MG', x: 18, y: 48 }, { pos: 'MC', x: 40, y: 48 },
      { pos: 'MC', x: 60, y: 48 }, { pos: 'MD', x: 82, y: 48 }, { pos: 'AIG', x: 22, y: 18 },
      { pos: 'BU', x: 50, y: 15 }, { pos: 'AID', x: 78, y: 18 }
    ]
  };

  function getPositionGroup(pos) {
    if (pos === 'GAR') return 'gk';
    if (['DC', 'ARG', 'ARD', 'PG', 'PD'].includes(pos)) return 'def';
    if (['MC', 'MOC', 'MDF', 'MG', 'MD'].includes(pos)) return 'mid';
    return 'att';
  }

  function handleSwapPlayers(otherPlayerId) {
    if (!selectedPitchPlayer) return;
    const otherPlayer = players.find(p => p.id === otherPlayerId);
    if (!otherPlayer) return;

    const starterGroup = getPositionGroup(selectedPitchPlayer.position);
    const otherGroup = getPositionGroup(otherPlayer.position);

    if (starterGroup !== otherGroup) {
      setMessage(`${otherPlayer.last_name} (${otherPlayer.position}) ne peut pas jouer en position ${selectedPitchPlayer.position}`);
      setTimeout(() => setMessage(''), 2500);
      return;
    }

    if (otherPlayer.is_starter) {
      // Swap two starters: just exchange their positions visually (both stay starters)
      // No state change needed for is_starter, they just swap slots
      setSelectedPitchPlayer(null);
    } else {
      // Swap starter with bench player
      setPlayers(players.map(p => {
        if (p.id === selectedPitchPlayer.id) return { ...p, is_starter: 0 };
        if (p.id === otherPlayerId) return { ...p, is_starter: 1 };
        return p;
      }));
      setSelectedPitchPlayer(null);
    }
  }

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

  async function handleSellPlayer(player) {
    if (players.length <= 11) {
      setMessage('Effectif minimum (11 joueurs) atteint !');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    if (!confirm(`Vendre ${player.first_name} ${player.last_name} pour ${formatMoney(Math.round((player.value || 0) * 0.8))} ?`)) return;
    try {
      const result = await api.sellPlayer(player.id, manager.id);
      if (onManagerUpdate) onManagerUpdate({ ...manager, budget: result.newBudget });
      setMessage(`${player.first_name} ${player.last_name} vendu pour ${formatMoney(result.sellPrice)}`);
      await loadPlayers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
      setTimeout(() => setMessage(''), 3000);
    }
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
            if (result.match.matchBonus && onManagerUpdate) {
              onManagerUpdate({ ...manager, budget: manager.budget + result.match.matchBonus });
            }
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
              Sauvegarder ({players.filter(p => p.is_starter).length}/11)
            </button>
          </div>

          <div className="pitch-container">
            <div className="pitch">
              <div className="pitch-markings">
                <div className="pitch-halfway" />
                <div className="pitch-center-circle" />
                <div className="pitch-center-dot" />
                <div className="pitch-penalty-area-top" />
                <div className="pitch-goal-area-top" />
                <div className="pitch-penalty-area-bottom" />
                <div className="pitch-goal-area-bottom" />
                <div className="pitch-corner-tl" />
                <div className="pitch-corner-tr" />
                <div className="pitch-corner-bl" />
                <div className="pitch-corner-br" />
              </div>

              {(() => {
                const formation = team.formation || '4-4-2';
                const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-4-2'];

                return positions.map((slot, idx) => {
                  const assignedId = slotAssignments[idx];
                  const player = assignedId ? players.find(p => p.id === assignedId) : null;
                  const slotGroup = getPositionGroup(slot.pos);
                  const benchCompatible = selectedBenchPlayer && getPositionGroup(selectedBenchPlayer.position) === slotGroup;
                  const benchForced = selectedBenchPlayer && !benchCompatible;

                  if (!player) return (
                    <div
                      key={`empty-${idx}`}
                      className={`pitch-player-node empty ${benchCompatible ? 'slot-highlight' : ''} ${benchForced ? 'slot-forced' : ''}`}
                      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                      onClick={() => {
                        if (selectedBenchPlayer) {
                          setSlotAssignments(prev => ({ ...prev, [idx]: selectedBenchPlayer.id }));
                          setPlayers(players.map(p => p.id === selectedBenchPlayer.id ? { ...p, is_starter: 1 } : p));
                          setSelectedBenchPlayer(null);
                        }
                      }}
                    >
                      <span className={`pitch-pos-badge ${posClass(slot.pos)}`}>{slot.pos}</span>
                      <span className="pitch-player-name">---</span>
                    </div>
                  );

                  const isSelected = selectedPitchPlayer && selectedPitchPlayer.id === player.id;
                  const staminaColor = player.stamina > 70 ? '#3fb950' : player.stamina > 40 ? '#d29922' : '#f85149';
                  const isOutOfPosition = getPositionGroup(player.position) !== slotGroup;
                  return (
                    <div
                      key={`slot-${idx}`}
                      className={`pitch-player-node ${isSelected ? 'selected' : ''} ${benchCompatible ? 'slot-highlight' : ''} ${benchForced ? 'slot-forced' : ''} ${isOutOfPosition ? 'out-of-position' : ''}`}
                      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                      onClick={() => {
                        if (selectedBenchPlayer) {
                          setSlotAssignments(prev => ({ ...prev, [idx]: selectedBenchPlayer.id }));
                          setPlayers(players.map(p => {
                            if (p.id === player.id) return { ...p, is_starter: 0 };
                            if (p.id === selectedBenchPlayer.id) return { ...p, is_starter: 1 };
                            return p;
                          }));
                          setSelectedBenchPlayer(null);
                          setSelectedPitchPlayer(null);
                        } else {
                          setSelectedPitchPlayer(isSelected ? null : player);
                          setSelectedBenchPlayer(null);
                        }
                      }}
                    >
                      <span className={`pitch-pos-badge ${posClass(player.position)}`}>{player.position}</span>
                      <span className="pitch-player-ovr">{player.overall}</span>
                      <span className="pitch-player-name">{player.last_name.length > 8 ? player.last_name.slice(0, 7) + '.' : player.last_name}</span>
                      <span className="pitch-stamina-dot" style={{ background: staminaColor }} />
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {selectedPitchPlayer && (
            <div className="pitch-swap-panel">
              <div className="swap-panel-header">
                <span>Remplacer <strong>{selectedPitchPlayer.first_name} {selectedPitchPlayer.last_name}</strong> ({selectedPitchPlayer.position}, {selectedPitchPlayer.overall})</span>
                <button className="btn-small btn-danger" onClick={() => {
                  const slotIdx = Object.entries(slotAssignments).find(([, id]) => id === selectedPitchPlayer.id);
                  if (slotIdx) setSlotAssignments(prev => { const n = { ...prev }; delete n[slotIdx[0]]; return n; });
                  setPlayers(players.map(p => p.id === selectedPitchPlayer.id ? { ...p, is_starter: 0 } : p));
                  setSelectedPitchPlayer(null);
                }}>Retirer</button>
                <button className="btn-small" onClick={() => setSelectedPitchPlayer(null)}>Fermer</button>
              </div>
              <div className="swap-panel-list">
                {players.filter(p => p.id !== selectedPitchPlayer.id).map(p => {
                  const compatible = getPositionGroup(p.position) === getPositionGroup(selectedPitchPlayer.position);
                  return (
                    <div
                      key={p.id}
                      className={`swap-candidate ${compatible ? 'compatible' : 'incompatible'} ${p.is_starter ? 'is-starter' : ''}`}
                      onClick={() => compatible && handleSwapPlayers(p.id)}
                    >
                      <span className={`lp-pos ${posClass(p.position)}`}>{p.position}</span>
                      <span className="swap-name">{p.first_name} {p.last_name}</span>
                      <span className="swap-ovr">{p.overall}</span>
                      <span className="swap-stamina" style={{ color: p.stamina > 70 ? 'var(--success)' : p.stamina > 40 ? 'var(--warning)' : 'var(--danger)' }}>{p.stamina}%</span>
                      {p.is_starter && <span className="swap-starter-tag">TIT</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pitch-bench-section">
            <h3>
              Remplaçants ({players.filter(p => !p.is_starter).length})
              {selectedBenchPlayer && <span className="bench-hint"> — Cliquez sur un emplacement du terrain</span>}
            </h3>
            <div className="pitch-bench-row">
              {players.filter(p => !p.is_starter).map(p => {
                const staminaColor = p.stamina > 70 ? '#3fb950' : p.stamina > 40 ? '#d29922' : '#f85149';
                const isBenchSelected = selectedBenchPlayer && selectedBenchPlayer.id === p.id;
                return (
                  <div
                    key={p.id}
                    className={`bench-player-card ${isBenchSelected ? 'bench-selected' : ''}`}
                    onClick={() => {
                      setSelectedBenchPlayer(isBenchSelected ? null : p);
                      setSelectedPitchPlayer(null);
                    }}
                  >
                    <span className={`pitch-pos-badge ${posClass(p.position)}`}>{p.position}</span>
                    <span className="bench-ovr">{p.overall}</span>
                    <span className="bench-name">{p.last_name.length > 9 ? p.last_name.slice(0, 8) + '.' : p.last_name}</span>
                    <span className="pitch-stamina-dot" style={{ background: staminaColor }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {view === 'squad' && (
        <div className="squad-view">
          <div className="squad-info">
            <span>{players.length} joueurs</span>
            <span>Valeur totale : {formatMoney(players.reduce((s, p) => s + (p.value || 0), 0))}</span>
          </div>
          <div className="players-grid">
            {players.map(p => (
              <PlayerCard
                key={p.id}
                player={p}
                actions={
                  <button
                    className="btn-small btn-danger"
                    onClick={() => handleSellPlayer(p)}
                    disabled={players.length <= 11}
                  >
                    Vendre ({formatMoney(Math.round((p.value || 0) * 0.8))})
                  </button>
                }
              />
            ))}
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
