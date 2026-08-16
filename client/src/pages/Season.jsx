import { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../api/client';
import PlayerCard from '../components/PlayerCard';
import {
  FORMATION_POSITIONS,
  FORMATION_NAMES,
  DEFAULT_FORMATION,
  getPositionGroup,
  getFormationSlots,
  getFormationLayout,
  getPositionFit,
  getFitLabel,
} from '../data/formations';
import './Season.css';

/** Seuil réel du moteur : aucune perte de rendement au-dessus de 50. */
const STAMINA_FRESH = 65;
const STAMINA_TIRED = 50;

/**
 * Limites d'effectif — doivent rester alignées sur server/data/rules.js.
 * SQUAD_MAX      : recrutement refusé à partir de ce total
 * SQUAD_MIN_SELL : effectif minimum pour qu'une vente soit acceptée
 * SQUAD_WARN     : seuil à partir duquel on invite à dégraisser
 */
const SQUAD_MAX = 35;
const SQUAD_MIN_SELL = 15;
const SQUAD_WARN = 20;

function staminaTone(stamina) {
  if (stamina >= STAMINA_FRESH) return 'ok';
  if (stamina >= STAMINA_TIRED) return 'warn';
  return 'bad';
}

function posClass(pos) {
  const group = getPositionGroup(pos);
  if (group === 'gk') return 'pos-gk';
  if (group === 'def') return 'pos-def';
  if (group === 'mid') return 'pos-mid';
  return 'pos-att';
}

/**
 * Note d'équipe. Si les joueurs portent `slotPos`/`fit` (vue Composition), on
 * raisonne sur le poste occupé et on applique le malus d'adéquation, comme le
 * moteur de match. Sinon on retombe sur le poste déclaré.
 */
function computeTeamStats(starters) {
  if (!starters || starters.length === 0) return null;

  const roleOf = p => getPositionGroup(p.slotPos || p.position);
  const fitOf = p => (p.fit === undefined ? 1 : p.fit);

  const defenders = starters.filter(p => roleOf(p) === 'def');
  const midfielders = starters.filter(p => roleOf(p) === 'mid');
  const attackers = starters.filter(p => roleOf(p) === 'att');
  const goalkeeper = starters.find(p => roleOf(p) === 'gk');

  const avgOf = (arr, key) => arr.length > 0
    ? Math.round(arr.reduce((s, p) => s + (p[key] || 0) * fitOf(p), 0) / arr.length)
    : 0;
  const allAvg = (key) => Math.round(starters.reduce((s, p) => s + (p[key] || 0), 0) / starters.length);

  return [
    { label: 'GEN', val: allAvg('overall'), color: 'var(--secondary)' },
    { label: 'ATT', val: avgOf(attackers, 'shooting'), color: '#f87171' },
    { label: 'MIL', val: avgOf(midfielders, 'passing'), color: '#5ee27f' },
    { label: 'DEF', val: avgOf(defenders, 'defending'), color: '#48d1cc' },
    { label: 'GAR', val: goalkeeper ? Math.round(goalkeeper.overall * fitOf(goalkeeper)) : 0, color: '#f0a92c' },
    { label: 'VIT', val: allAvg('pace'), color: '#8fdcaa' },
    { label: 'PHY', val: allAvg('physical'), color: '#f0c040' },
    { label: 'FOR', val: allAvg('stamina'), color: 'var(--success)' },
  ];
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
  const [sponsorResult, setSponsorResult] = useState(null);
  const [benchSort, setBenchSort] = useState('overall');
  const [conversation, setConversation] = useState(null);
  const [convResponse, setConvResponse] = useState(null);
  const [hasConvNotification, setHasConvNotification] = useState(false);
  const [viewingTeam, setViewingTeam] = useState(null);
  const [viewingPlayers, setViewingPlayers] = useState([]);
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
  const [lineupDirty, setLineupDirty] = useState(false);
  const [draggedPlayerId, setDraggedPlayerId] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);

  const formation = FORMATION_POSITIONS[team.formation] ? team.formation : DEFAULT_FORMATION;
  const slots = getFormationSlots(formation);   // postes, ex. ['GAR', 'ARG', ...]
  const layout = getFormationLayout(formation); // coordonnées d'affichage

  // ---- slotAssignments est la source de vérité de la composition ----
  // `is_starter` en est systématiquement dérivé, ce qui évite toute désynchro.
  const starterIds = useMemo(
    () => Object.values(slotAssignments).filter(Boolean),
    [slotAssignments]
  );
  const starterIdSet = useMemo(() => new Set(starterIds), [starterIds]);

  const benchPlayers = useMemo(
    () => players.filter(p => !starterIdSet.has(p.id)),
    [players, starterIdSet]
  );

  /** Applique un nouveau placement et resynchronise `is_starter`. */
  function applyAssignments(next) {
    const ids = new Set(Object.values(next).filter(Boolean));
    setSlotAssignments(next);
    setPlayers(prev => prev.map(p => {
      const shouldStart = ids.has(p.id) ? 1 : 0;
      return p.is_starter === shouldStart ? p : { ...p, is_starter: shouldStart };
    }));
    setLineupDirty(true);
  }

  /** Place un joueur sur un emplacement. S'il occupait déjà un slot, les deux sont permutés. */
  function assignToSlot(slotIdx, playerId) {
    const next = { ...slotAssignments };
    const previousSlot = Object.keys(next).find(k => next[k] === playerId);

    if (previousSlot !== undefined) {
      // Permutation : l'occupant de la cible prend l'ancien emplacement.
      const displaced = next[slotIdx];
      if (displaced) next[previousSlot] = displaced;
      else delete next[previousSlot];
    }

    next[slotIdx] = playerId;
    applyAssignments(next);
  }

  function clearSlot(slotIdx) {
    const next = { ...slotAssignments };
    delete next[slotIdx];
    applyAssignments(next);
  }

  /**
   * Remplace le joueur sélectionné sur le terrain par un autre.
   * Titulaire  -> permutation des deux emplacements.
   * Remplaçant -> il prend l'emplacement, l'autre retourne sur le banc.
   */
  function handleSwapPlayers(otherPlayerId) {
    if (!selectedPitchPlayer) return;
    const slotIdx = Object.keys(slotAssignments).find(k => slotAssignments[k] === selectedPitchPlayer.id);
    if (slotIdx === undefined) return;

    assignToSlot(Number(slotIdx), otherPlayerId);
    setSelectedPitchPlayer(null);
  }

  /** Construit le meilleur onze possible pour la formation courante. */
  function buildBestEleven(squad, formationSlots) {
    const next = {};
    const used = new Set();

    // Score = niveau du joueur pondéré par son adéquation au poste et sa forme.
    const scoreFor = (player, slotPos) =>
      player.overall
      * getPositionFit(player.position, slotPos)
      * (0.85 + Math.min(player.stamina, 100) / 100 * 0.15);

    // Les postes les plus contraints d'abord (gardien, puis ailes, puis axe).
    const order = formationSlots
      .map((pos, idx) => ({ pos, idx }))
      .sort((a, b) => {
        const rank = p => (getPositionGroup(p) === 'gk' ? 0 : 1);
        return rank(a.pos) - rank(b.pos);
      });

    for (const { pos, idx } of order) {
      let best = null;
      let bestScore = -1;
      for (const player of squad) {
        if (used.has(player.id)) continue;
        const score = scoreFor(player, pos);
        if (score > bestScore) { bestScore = score; best = player; }
      }
      if (best) {
        next[idx] = best.id;
        used.add(best.id);
      }
    }
    return next;
  }

  function handleAutoLineup() {
    if (players.length === 0) return;
    applyAssignments(buildBestEleven(players, slots));
    setSelectedPitchPlayer(null);
    setSelectedBenchPlayer(null);
    setMessage('Composition automatique appliquée — pensez à sauvegarder.');
    setTimeout(() => setMessage(''), 2500);
  }

  function handleClearLineup() {
    applyAssignments({});
    setSelectedPitchPlayer(null);
    setSelectedBenchPlayer(null);
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
    setSlotAssignments(prev => reconcileAssignments(prev, data));
    setLineupDirty(false);
  }

  /**
   * Reconstruit le placement à chaque chargement, dans l'ordre de priorité :
   * 1. `slot_index` persisté en base (le choix réel du joueur) ;
   * 2. à défaut, le placement local en cours, purgé des joueurs disparus ;
   * 3. à défaut, un placement automatique à partir des titulaires connus.
   */
  function reconcileAssignments(current, squad) {
    const byId = new Map(squad.map(p => [p.id, p]));
    const positions = getFormationSlots(
      FORMATION_POSITIONS[team.formation] ? team.formation : DEFAULT_FORMATION
    );

    // 1. Placement persisté
    const persisted = {};
    for (const p of squad) {
      if (p.is_starter && p.slot_index !== null && p.slot_index !== undefined && p.slot_index < positions.length) {
        persisted[p.slot_index] = p.id;
      }
    }
    if (Object.keys(persisted).length > 0) return persisted;

    // 2. Placement local purgé (corrige le slot fantôme après une vente)
    const cleaned = {};
    for (const [idx, id] of Object.entries(current || {})) {
      if (byId.has(id) && Number(idx) < positions.length) cleaned[idx] = id;
    }
    if (Object.keys(cleaned).length > 0) return cleaned;

    // 3. Repli : place les titulaires connus au mieux
    const starters = squad.filter(p => p.is_starter);
    if (starters.length === 0) return {};
    return buildBestEleven(starters, positions);
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

  async function handleSaveLineup() {
    if (starterIds.length !== 11) {
      setMessage(`Il faut exactement 11 titulaires (actuellement ${starterIds.length})`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    // Tableau indexé par emplacement : c'est lui qui porte le placement.
    const slotArray = slots.map((_, idx) => slotAssignments[idx] || null);

    setLoading(true);
    try {
      const updated = await api.setLineup(team.id, starterIds, slotArray);
      setPlayers(updated);
      setSlotAssignments(reconcileAssignments({}, updated));
      setLineupDirty(false);
      setMessage('Composition sauvegardée !');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage(err.message);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Change la formation ET redistribue les titulaires sur le nouveau schéma :
   * conserver les index bruts ferait dériver les joueurs de poste en poste.
   */
  async function handleSetFormation(e) {
    const nextFormation = e.target.value;
    const previous = team.formation;
    const nextSlots = getFormationSlots(nextFormation);

    // Redistribution optimiste, immédiate à l'écran.
    const currentStarters = starterIds.map(id => players.find(p => p.id === id)).filter(Boolean);
    if (currentStarters.length > 0) {
      applyAssignments(buildBestEleven(currentStarters, nextSlots));
    }
    onUpdate({ ...team, formation: nextFormation });

    try {
      await api.setFormation(team.id, nextFormation);
    } catch (err) {
      onUpdate({ ...team, formation: previous });
      setMessage('Impossible de changer la formation : ' + (err.message || 'erreur réseau'));
      setTimeout(() => setMessage(''), 3000);
    }
  }

  async function handleSellPlayer(player) {
    if (players.length < SQUAD_MIN_SELL) {
      setMessage(`Effectif minimum de ${SQUAD_MIN_SELL} joueurs requis pour vendre (vous en avez ${players.length})`);
      setTimeout(() => setMessage(''), 3000);
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
      const difficulty = localStorage.getItem('footmanager_difficulty') || 'normal';
      const result = await api.playMatchday(team.id, difficulty);

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
            loadConversation();
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
      setSponsorResult(result.sponsor);
      setSponsorChosen(true);
      setView('sponsor-result');
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

  async function loadConversation() {
    try {
      const data = await api.getConversation(team.id);
      setConversation(data.conversation);
      setConvResponse(null);
      setHasConvNotification(!!data.conversation);
    } catch { setConversation(null); setHasConvNotification(false); }
  }

  async function handleConversationChoice(choiceId) {
    if (!conversation) return;
    setLoading(true);
    try {
      const result = await api.resolveConversation(team.id, conversation.id, choiceId, conversation.player.id, manager.id);
      setConvResponse(result);
      if (result.manager && onManagerUpdate) onManagerUpdate(result.manager);
      await loadPlayers();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  function dismissConversation() {
    setConversation(null);
    setConvResponse(null);
    setHasConvNotification(false);
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

  async function handleViewTeam(t) {
    if (t.id === team.id) return;
    setViewingTeam(t);
    const players = await api.getPlayers(t.id);
    setViewingPlayers(players);
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

  // Rappel de dégraissage : on alerte dès SQUAD_WARN pour laisser le temps de
  // réagir avant le plafond, et on passe en critique une fois celui-ci atteint.
  const squadAlert = (() => {
    const n = players.length;
    const restant = SQUAD_MAX - n;

    if (n >= SQUAD_MAX) {
      return {
        level: 'critical',
        short: `Effectif plein (${n}/${SQUAD_MAX}) — vous ne pouvez plus recruter`,
        title: 'Effectif au maximum',
        body: `Vous avez atteint la limite de ${SQUAD_MAX} joueurs. Tout recrutement, draft ou recrue issue d'un événement sera refusé tant que vous n'aurez pas vendu.`,
      };
    }
    if (n >= SQUAD_WARN) {
      const places = restant <= 5
        ? `Il ne vous reste que ${restant} place${restant > 1 ? 's' : ''}.`
        : `Il vous reste ${restant} places.`;
      return {
        level: restant <= 5 ? 'critical' : 'warn',
        short: `${n}/${SQUAD_MAX} joueurs — pensez à vendre`,
        title: 'Effectif pléthorique',
        body: `Vous avez ${n} joueurs sur un maximum de ${SQUAD_MAX}. ${places} Vendez vos joueurs inutilisés pour renflouer le budget et garder de la marge au mercato.`,
      };
    }
    return null;
  })();

  return (
    <div className="season-page">
      <div className="season-header">
        <div className="season-info">
          <h1>{status.division} — Saison {status.season}</h1>
          <div className="season-meta">
            <span>Journée {status.played}/{status.totalMatches}</span>
            <span className="rank-badge">#{status.rank}</span>
          </div>
        </div>
        <div className="season-nav">
          <button className={view === 'season' ? 'active' : ''} onClick={() => setView('season')}>Saison</button>
          <button className={view === 'standings' ? 'active' : ''} onClick={() => setView('standings')}>Classement</button>
          <button className={view === 'lineup' ? 'active' : ''} onClick={() => setView('lineup')}>Compo</button>
          <button
            className={`${view === 'squad' ? 'active' : ''} nav-btn-effectif`}
            onClick={() => setView('squad')}
            title={squadAlert ? squadAlert.short : undefined}
          >
            Effectif
            {squadAlert && <span className={`nav-count-badge ${squadAlert.level}`}>{players.length}</span>}
          </button>
          <button className={`${view === 'management' ? 'active' : ''} nav-btn-gestion`} onClick={handleOpenManagement}>
            Gestion
            {hasConvNotification && <span className="nav-notif-badge" />}
          </button>
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
                <tr
                  key={t.id}
                  className={[
                    t.id === team.id ? 'my-team' : '',
                    t.id !== team.id ? 'clickable-row' : '',
                    i < 2 ? 'zone-promo' : '',
                    i >= status.standings.length - 2 ? 'zone-releg' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleViewTeam(t)}
                >
                  <td className="rank">{i + 1}</td>
                  <td className="team-name-cell">{t.name} {t.id !== team.id && <span className="view-squad-hint">👁</span>}</td>
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

          <div className="standings-legend">
            <span><i className="lg-promo" />Promotion — 2 premiers</span>
            <span><i className="lg-releg" />Relégation — 2 derniers</span>
          </div>

          {viewingTeam && (
            <div className="viewing-team-panel card">
              <div className="vt-header">
                <h3>{viewingTeam.name}</h3>
                <button className="btn-small" onClick={() => setViewingTeam(null)}>Fermer</button>
              </div>

              {(() => {
                const starters = viewingPlayers.filter(p => p.is_starter);
                const stats = computeTeamStats(starters);
                if (!stats) return null;
                return (
                  <div className="vt-stats">
                    {stats.map(s => (
                      <div key={s.label} className="vt-stat-bar">
                        <div className="vt-bar-header">
                          <span className="vt-bar-label">{s.label}</span>
                          <span className="vt-bar-val">{s.val}</span>
                        </div>
                        <div className="vt-bar-track">
                          <div className="vt-bar-fill" style={{ width: `${s.val}%`, background: s.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="vt-players">
                <div className="vt-section">
                  <h4>Titulaires</h4>
                  {viewingPlayers.filter(p => p.is_starter).map(p => (
                    <div key={p.id} className="vt-player">
                      <span className={`lp-pos ${posClass(p.position)}`}>{p.position}</span>
                      <span className="vt-name">{p.first_name} {p.last_name}</span>
                      <span className="vt-ovr">{p.overall}</span>
                    </div>
                  ))}
                </div>
                <div className="vt-section">
                  <h4>Remplaçants</h4>
                  {viewingPlayers.filter(p => !p.is_starter).map(p => (
                    <div key={p.id} className="vt-player sub">
                      <span className={`lp-pos ${posClass(p.position)}`}>{p.position}</span>
                      <span className="vt-name">{p.first_name} {p.last_name}</span>
                      <span className="vt-ovr">{p.overall}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'lineup' && (
        <div className="lineup-view">
          <div className="lineup-header">
            <div className="lineup-formation">
              <label>Formation :</label>
              <select value={formation} onChange={handleSetFormation}>
                {FORMATION_NAMES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="lineup-actions">
              <button className="btn-ghost btn-small" onClick={handleAutoLineup}>Meilleur XI</button>
              <button className="btn-ghost btn-small" onClick={handleClearLineup} disabled={starterIds.length === 0}>Vider</button>
              <button className="btn-primary" onClick={handleSaveLineup} disabled={loading || starterIds.length !== 11}>
                {lineupDirty ? 'Sauvegarder •' : 'Sauvegarder'} ({starterIds.length}/11)
              </button>
            </div>
          </div>

          {lineupDirty && (
            <div className="lineup-dirty-banner">
              Modifications non sauvegardées — elles seront perdues si vous quittez l'onglet.
            </div>
          )}

          {(() => {
            const issues = [];
            const hasKeeper = slots.some((pos, idx) => {
              const id = slotAssignments[idx];
              const p = id ? players.find(x => x.id === id) : null;
              return pos === 'GAR' && p && p.position === 'GAR';
            });
            if (starterIds.length > 0 && !hasKeeper) issues.push('Aucun gardien de but dans les cages');

            const misfits = slots.reduce((acc, pos, idx) => {
              const id = slotAssignments[idx];
              const p = id ? players.find(x => x.id === id) : null;
              if (p && getPositionFit(p.position, pos) < 1) acc++;
              return acc;
            }, 0);
            if (misfits > 0) issues.push(`${misfits} joueur${misfits > 1 ? 's' : ''} hors de sa ligne`);

            const tired = starterIds
              .map(id => players.find(p => p.id === id))
              .filter(p => p && p.stamina < STAMINA_TIRED).length;
            if (tired > 0) issues.push(`${tired} titulaire${tired > 1 ? 's' : ''} sous les 50% de forme`);

            if (issues.length === 0) return null;
            return (
              <div className="lineup-warnings">
                {issues.map(i => <span key={i} className="lineup-warning">{i}</span>)}
              </div>
            );
          })()}

          {(() => {
            // Note d'équipe calculée sur le poste OCCUPÉ, adéquation comprise :
            // elle reflète donc ce que le moteur de match va réellement évaluer.
            const placed = slots
              .map((slotPos, idx) => {
                const id = slotAssignments[idx];
                const p = id ? players.find(x => x.id === id) : null;
                return p ? { ...p, slotPos, fit: getPositionFit(p.position, slotPos) } : null;
              })
              .filter(Boolean);
            const stats = computeTeamStats(placed);
            if (!stats) return null;
            return (
              <div className="team-stats-overview">
                {stats.map(s => (
                  <div key={s.label} className="tso-stat-bar">
                    <div className="tso-bar-header">
                      <span className="tso-label">{s.label}</span>
                      <span className="tso-val">{s.val}</span>
                    </div>
                    <div className="tso-bar-track">
                      <div className="tso-bar-fill" style={{ width: `${s.val}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

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

              {layout.map((slot, idx) => {
                const assignedId = slotAssignments[idx];
                const player = assignedId ? players.find(p => p.id === assignedId) : null;
                const isDropTarget = dragOverSlot === idx;

                // Prévisualisation d'adéquation pendant une sélection ou un glisser.
                const incoming = draggedPlayerId
                  ? players.find(p => p.id === draggedPlayerId)
                  : selectedBenchPlayer;
                const incomingFit = incoming ? getPositionFit(incoming.position, slot.pos) : null;
                const slotHint = incomingFit === null ? ''
                  : incomingFit >= 1 ? 'slot-highlight'
                  : incomingFit >= 0.75 ? 'slot-forced'
                  : 'slot-bad';

                const dropHandlers = {
                  onDragOver: (e) => { e.preventDefault(); setDragOverSlot(idx); },
                  onDragLeave: () => setDragOverSlot(prev => (prev === idx ? null : prev)),
                  onDrop: (e) => {
                    e.preventDefault();
                    setDragOverSlot(null);
                    if (draggedPlayerId) assignToSlot(idx, draggedPlayerId);
                    setDraggedPlayerId(null);
                    setSelectedBenchPlayer(null);
                  },
                };

                if (!player) return (
                  <div
                    key={`empty-${idx}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Emplacement ${slot.pos} vide`}
                    className={`pitch-player-node empty ${slotHint} ${isDropTarget ? 'drop-target' : ''}`}
                    style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                    {...dropHandlers}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && selectedBenchPlayer) {
                        e.preventDefault();
                        assignToSlot(idx, selectedBenchPlayer.id);
                        setSelectedBenchPlayer(null);
                      }
                    }}
                    onClick={() => {
                      if (selectedBenchPlayer) {
                        assignToSlot(idx, selectedBenchPlayer.id);
                        setSelectedBenchPlayer(null);
                      }
                    }}
                  >
                    <span className={`pitch-pos-badge ${posClass(slot.pos)}`}>{slot.pos}</span>
                    <span className="pitch-player-name">---</span>
                  </div>
                );

                const isSelected = selectedPitchPlayer && selectedPitchPlayer.id === player.id;
                const fit = getPositionFit(player.position, slot.pos);
                const fitInfo = getFitLabel(fit);
                const tone = staminaTone(player.stamina);

                return (
                  <div
                    key={`slot-${idx}`}
                    role="button"
                    tabIndex={0}
                    draggable
                    title={`${player.first_name} ${player.last_name} — ${player.position} au poste de ${slot.pos}\n${fitInfo.label} (${Math.round(fit * 100)}%)\nNote ${player.overall} · Forme ${player.stamina}% · Moral ${player.morale}%`}
                    className={`pitch-player-node ${isSelected ? 'selected' : ''} ${slotHint} ${isDropTarget ? 'drop-target' : ''} fit-${fitInfo.tone} ${draggedPlayerId === player.id ? 'dragging' : ''}`}
                    style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                    onDragStart={() => { setDraggedPlayerId(player.id); setSelectedPitchPlayer(null); setSelectedBenchPlayer(null); }}
                    onDragEnd={() => { setDraggedPlayerId(null); setDragOverSlot(null); }}
                    {...dropHandlers}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (selectedBenchPlayer) { assignToSlot(idx, selectedBenchPlayer.id); setSelectedBenchPlayer(null); }
                        else setSelectedPitchPlayer(isSelected ? null : player);
                      } else if (e.key === 'Delete' || e.key === 'Backspace') {
                        e.preventDefault();
                        clearSlot(idx);
                      }
                    }}
                    onClick={() => {
                      if (selectedBenchPlayer) {
                        assignToSlot(idx, selectedBenchPlayer.id);
                        setSelectedBenchPlayer(null);
                        setSelectedPitchPlayer(null);
                      } else {
                        setSelectedPitchPlayer(isSelected ? null : player);
                        setSelectedBenchPlayer(null);
                      }
                    }}
                  >
                    <span className={`pitch-pos-badge ${posClass(slot.pos)}`}>{slot.pos}</span>
                    <span className="pitch-player-ovr">{player.overall}</span>
                    <span className="pitch-player-name">{player.last_name.length > 8 ? player.last_name.slice(0, 7) + '.' : player.last_name}</span>
                    <span className={`pitch-stamina-bar tone-${tone}`}>
                      <i style={{ width: `${Math.max(0, Math.min(100, player.stamina))}%` }} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedPitchPlayer && (() => {
            const slotIdx = Number(Object.keys(slotAssignments).find(k => slotAssignments[k] === selectedPitchPlayer.id));
            const slotPos = slots[slotIdx];
            // Trie les candidats par adéquation au poste puis par niveau : les
            // joueurs hors poste restent proposés, mais en bas de liste.
            const candidates = players
              .filter(p => p.id !== selectedPitchPlayer.id)
              .map(p => ({ p, fit: getPositionFit(p.position, slotPos) }))
              .sort((a, b) => (b.fit - a.fit) || (b.p.overall - a.p.overall));

            return (
              <div className="pitch-swap-panel">
                <div className="swap-panel-header">
                  <span>
                    Emplacement <strong>{slotPos}</strong> — occupé par{' '}
                    <strong>{selectedPitchPlayer.first_name} {selectedPitchPlayer.last_name}</strong> ({selectedPitchPlayer.position}, {selectedPitchPlayer.overall})
                  </span>
                  <button className="btn-small btn-danger" onClick={() => { clearSlot(slotIdx); setSelectedPitchPlayer(null); }}>Retirer</button>
                  <button className="btn-small" onClick={() => setSelectedPitchPlayer(null)}>Fermer</button>
                </div>
                <div className="swap-panel-list">
                  {candidates.map(({ p, fit }) => {
                    const info = getFitLabel(fit);
                    const isStarter = starterIdSet.has(p.id);
                    return (
                      <div
                        key={p.id}
                        role="button"
                        tabIndex={0}
                        className={`swap-candidate fit-${info.tone} ${isStarter ? 'is-starter' : ''}`}
                        title={`${info.label} au poste de ${slotPos} (${Math.round(fit * 100)}%)`}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSwapPlayers(p.id); } }}
                        onClick={() => handleSwapPlayers(p.id)}
                      >
                        <span className={`lp-pos ${posClass(p.position)}`}>{p.position}</span>
                        <span className="swap-name">{p.first_name} {p.last_name}</span>
                        <span className="swap-fit">{Math.round(fit * 100)}%</span>
                        <span className="swap-ovr">{p.overall}</span>
                        <span className={`swap-stamina tone-${staminaTone(p.stamina)}`}>{p.stamina}%</span>
                        {isStarter && <span className="swap-starter-tag">TIT</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="pitch-bench-section">
            <div className="bench-header">
              <h3>
                Remplaçants ({benchPlayers.length})
                {selectedBenchPlayer && <span className="bench-hint"> — Cliquez sur un emplacement du terrain</span>}
              </h3>
              <div className="bench-sort-btns">
                <button className={`bench-sort-btn ${benchSort === 'overall' ? 'active' : ''}`} onClick={() => setBenchSort('overall')}>Note</button>
                <button className={`bench-sort-btn ${benchSort === 'position' ? 'active' : ''}`} onClick={() => setBenchSort('position')}>Poste</button>
                <button className={`bench-sort-btn ${benchSort === 'name' ? 'active' : ''}`} onClick={() => setBenchSort('name')}>Nom</button>
                <button className={`bench-sort-btn ${benchSort === 'stamina' ? 'active' : ''}`} onClick={() => setBenchSort('stamina')}>Forme</button>
              </div>
            </div>
            <div className="pitch-bench-row">
              {[...benchPlayers].sort((a, b) => {
                if (benchSort === 'overall') return b.overall - a.overall;
                if (benchSort === 'stamina') return b.stamina - a.stamina;
                if (benchSort === 'name') return a.last_name.localeCompare(b.last_name);
                if (benchSort === 'position') {
                  const order = { GAR: 0, DC: 1, ARG: 2, ARD: 3, PG: 4, PD: 5, MC: 6, MOC: 7, MDF: 8, MG: 9, MD: 10, AIG: 11, AID: 12, BU: 13 };
                  return (order[a.position] ?? 99) - (order[b.position] ?? 99);
                }
                return 0;
              }).map(p => {
                const isBenchSelected = selectedBenchPlayer && selectedBenchPlayer.id === p.id;
                const tone = staminaTone(p.stamina);
                return (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    draggable
                    title={`${p.first_name} ${p.last_name} — ${p.position}\nNote ${p.overall} · Forme ${p.stamina}% · Moral ${p.morale}%`}
                    className={`bench-player-card ${isBenchSelected ? 'bench-selected' : ''} ${draggedPlayerId === p.id ? 'dragging' : ''}`}
                    onDragStart={() => { setDraggedPlayerId(p.id); setSelectedPitchPlayer(null); setSelectedBenchPlayer(null); }}
                    onDragEnd={() => { setDraggedPlayerId(null); setDragOverSlot(null); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedBenchPlayer(isBenchSelected ? null : p);
                        setSelectedPitchPlayer(null);
                      }
                    }}
                    onClick={() => {
                      setSelectedBenchPlayer(isBenchSelected ? null : p);
                      setSelectedPitchPlayer(null);
                    }}
                  >
                    <span className={`pitch-pos-badge ${posClass(p.position)}`}>{p.position}</span>
                    <span className="bench-ovr">{p.overall}</span>
                    <span className="bench-name">{p.last_name.length > 9 ? p.last_name.slice(0, 8) + '.' : p.last_name}</span>
                    <span className={`pitch-stamina-bar tone-${tone}`}>
                      <i style={{ width: `${Math.max(0, Math.min(100, p.stamina))}%` }} />
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="lineup-legend">
              <span><i className="lg-fit-perfect" />Dans sa ligne — aucun malus</span>
              <span><i className="lg-fit-good" />Ligne voisine — 78%</span>
              <span><i className="lg-fit-warn" />Deux lignes d'écart — 64%</span>
              <span><i className="lg-fit-bad" />Poste inadapté — 40 à 50%</span>
              <span className="legend-sep">Forme : au-dessus de 50% aucun malus, en dessous le rendement chute</span>
            </div>
          </div>
        </div>
      )}

      {view === 'squad' && (
        <div className="squad-view">
          {squadAlert && (
            <div className={`squad-alert ${squadAlert.level}`}>
              <div className="squad-alert-head">
                <strong>{squadAlert.title}</strong>
                <span className="squad-alert-count">{players.length}/{SQUAD_MAX}</span>
              </div>
              <p>{squadAlert.body}</p>
              <div className="squad-alert-bar">
                <i style={{ width: `${Math.min(100, (players.length / SQUAD_MAX) * 100)}%` }} />
              </div>
            </div>
          )}

          <div className="squad-info">
            <span>{players.length} joueurs</span>
            <span>Valeur totale : {formatMoney(players.reduce((s, p) => s + (p.value || 0), 0))}</span>
          </div>
          <div className="players-grid">
            {players.map(p => {
              // Le serveur refuse toute vente en dessous de 15 joueurs :
              // on désactive au même seuil pour éviter un clic voué à l'échec.
              const canSell = players.length >= SQUAD_MIN_SELL;
              return (
                <PlayerCard
                  key={p.id}
                  player={p}
                  actions={
                    <button
                      className="btn-small btn-danger"
                      onClick={() => handleSellPlayer(p)}
                      disabled={!canSell}
                      title={canSell ? undefined : `Effectif minimum de ${SQUAD_MIN_SELL} joueurs requis pour vendre`}
                    >
                      Vendre ({formatMoney(Math.round((p.value || 0) * 0.8))})
                    </button>
                  }
                />
              );
            })}
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
                <button className="btn-primary" onClick={() => handleChooseSponsor(sponsor.id)} disabled={loading}>
                  Signer avec {sponsor.name}
                </button>
              </div>
            ))}
          </div>
          <button className="btn-back" onClick={() => setView('season')}>← Retour</button>
        </div>
      )}

      {view === 'sponsor-result' && sponsorResult && (
        <div className="sponsor-result-view">
          <div className="sponsor-result-card card">
            <div className="sr-header">
              <span className="sr-logo">{sponsorResult.logo}</span>
              <h2>Partenariat signé avec {sponsorResult.name}</h2>
              <span className="sr-payment">+{(sponsorResult.payment / 1000000).toFixed(0)}M€</span>
            </div>

            <p className="sr-desc">{sponsorResult.description}</p>

            {(sponsorResult.bonus.morale > 0 || sponsorResult.bonus.reputation > 0 || sponsorResult.bonus.stamina_boost > 0) && (
              <div className="sr-section sr-bonus">
                <h3>Bonus</h3>
                {sponsorResult.bonus.morale > 0 && (
                  <div className="sr-effect good">
                    <span className="sr-effect-val">Moral +{sponsorResult.bonus.morale}</span>
                    <span className="sr-effect-why">L'image du sponsor motive les joueurs</span>
                  </div>
                )}
                {sponsorResult.bonus.reputation > 0 && (
                  <div className="sr-effect good">
                    <span className="sr-effect-val">Réputation +{sponsorResult.bonus.reputation}</span>
                    <span className="sr-effect-why">Un partenaire prestigieux attire les regards</span>
                  </div>
                )}
                {sponsorResult.bonus.stamina_boost > 0 && (
                  <div className="sr-effect good">
                    <span className="sr-effect-val">Forme +{sponsorResult.bonus.stamina_boost}</span>
                    <span className="sr-effect-why">Accès à de meilleures installations</span>
                  </div>
                )}
              </div>
            )}

            {(sponsorResult.malus.morale || sponsorResult.malus.reputation) && (
              <div className="sr-section sr-malus">
                <h3>Contreparties</h3>
                {sponsorResult.malus.morale && (
                  <div className="sr-effect bad">
                    <span className="sr-effect-val">Moral {sponsorResult.malus.morale}</span>
                    <span className="sr-effect-why">Les joueurs n'apprécient pas cette association</span>
                  </div>
                )}
                {sponsorResult.malus.reputation && (
                  <div className="sr-effect bad">
                    <span className="sr-effect-val">Réputation {sponsorResult.malus.reputation}</span>
                    <span className="sr-effect-why">L'image du club en prend un coup auprès du public</span>
                  </div>
                )}
              </div>
            )}

            <button className="btn-primary sr-continue" onClick={() => { setSponsorResult(null); setView('season'); }}>
              Continuer la saison
            </button>
          </div>
        </div>
      )}

      {view === 'management' && (
        <div className="management-view">
          <h2>Gestion du club</h2>

          {conversation && (
            <div className="conversation-section" style={{marginBottom: '20px'}}>
              <div className="conv-card card">
                <div className="conv-header">
                  <span className="conv-player-badge">{conversation.player.position} {conversation.player.overall}</span>
                  <h3>{conversation.player.first_name} {conversation.player.last_name} veut vous parler</h3>
                </div>
                <p className="conv-title">{conversation.title}</p>
                <div className="conv-bubble">
                  <p>{conversation.message}</p>
                </div>

                {!convResponse && (
                  <div className="conv-choices">
                    {conversation.choices.map(choice => (
                      <button
                        key={choice.id}
                        className="conv-choice-btn"
                        onClick={() => handleConversationChoice(choice.id)}
                        disabled={loading}
                      >
                        {choice.text}
                      </button>
                    ))}
                  </div>
                )}

                {convResponse && (
                  <div className="conv-result">
                    <div className="conv-response-bubble">
                      <p>"{convResponse.response}"</p>
                    </div>
                    <div className="conv-effects-result">
                      {convResponse.effects.morale > 0 && <span className="effect-good">Moral +{convResponse.effects.morale}</span>}
                      {convResponse.effects.morale < 0 && <span className="effect-bad">Moral {convResponse.effects.morale}</span>}
                      {convResponse.effects.stamina > 0 && <span className="effect-good">Forme +{convResponse.effects.stamina}</span>}
                      {convResponse.effects.stamina < 0 && <span className="effect-bad">Forme {convResponse.effects.stamina}</span>}
                      {convResponse.effects.overall > 0 && <span className="effect-good">Overall +{convResponse.effects.overall}</span>}
                      {convResponse.effects.budget > 0 && <span className="effect-good">+{formatMoney(convResponse.effects.budget)}</span>}
                      {convResponse.effects.budget < 0 && <span className="effect-bad">{formatMoney(convResponse.effects.budget)}</span>}
                    </div>
                    <button className="btn-small" onClick={dismissConversation}>OK</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!conversation && (
            <p className="conv-no-problem">Aucun joueur n'a de problèmes pour l'instant.</p>
          )}

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
