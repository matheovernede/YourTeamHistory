import { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../api/client';
import PlayerCard from '../components/PlayerCard';
import GuideDebutant, { guideMasque, CLE_MASQUE } from '../components/GuideDebutant';
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
import { SQUAD_MAX, SQUAD_MIN_SELL, SQUAD_WARN } from '../data/rules';
import { useI18n } from '../i18n';
import './Season.css';

/** Seuil réel du moteur : aucune perte de rendement au-dessus de 50. */
const STAMINA_FRESH = 65;
const STAMINA_TIRED = 50;

/**
 * Le serveur renvoie le résultat d'un match en français ('Victoire',
 * 'Match nul', 'Défaite' — et 'Defaite' sans accent côté Champions League).
 * Cette chaîne est un IDENTIFIANT TECHNIQUE : elle sert à construire la classe
 * CSS `result-tag`. On la conserve telle quelle et on ne traduit QUE le libellé
 * affiché, via cette table.
 */
const RESULT_KEYS = {
  'Victoire': 'victoire',
  'Match nul': 'matchNul',
  'Défaite': 'defaite',
  'Defaite': 'defaite',
};

/** Libellé traduit d'un resultText serveur, sans toucher à sa valeur brute. */
function resultLabel(t, resultText) {
  const cle = RESULT_KEYS[resultText];
  return cle ? t(`saison.resultat.${cle}`) : resultText;
}

function staminaTone(stamina) {
  if (stamina >= STAMINA_FRESH) return 'ok';
  if (stamina >= STAMINA_TIRED) return 'warn';
  return 'bad';
}

/**
 * Un joueur suspendu ou blessé ne peut pas être aligné.
 * Doit rester aligné sur isAvailable() de server/engine/discipline.js : le
 * serveur rejette toute composition qui en contient.
 */
function isSelectable(player) {
  return (player.suspended_matches || 0) === 0 && (player.injured_matches || 0) === 0;
}

/** Motif d'indisponibilité, pour l'expliquer à l'écran. */
function unavailableLabel(player, t) {
  const suspendu = player.suspended_matches || 0;
  if (suspendu > 0) {
    return t(suspendu > 1 ? 'saison.indispo.suspenduPlusieurs' : 'saison.indispo.suspenduUn', { n: suspendu });
  }
  const blesse = player.injured_matches || 0;
  if (blesse > 0) {
    return t(blesse > 1 ? 'saison.indispo.blessePlusieurs' : 'saison.indispo.blesseUn', { n: blesse });
  }
  return null;
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
function computeTeamStats(starters, t) {
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

  // `cle` est l'identifiant technique (clé React) ; `label` est l'affichage.
  return [
    { cle: 'gen', label: t('saison.notes.gen'), val: allAvg('overall'), color: 'var(--secondary)' },
    { cle: 'att', label: t('saison.notes.att'), val: avgOf(attackers, 'shooting'), color: '#f87171' },
    { cle: 'mil', label: t('saison.notes.mil'), val: avgOf(midfielders, 'passing'), color: '#5ee27f' },
    { cle: 'def', label: t('saison.notes.def'), val: avgOf(defenders, 'defending'), color: '#48d1cc' },
    { cle: 'gar', label: t('saison.notes.gar'), val: goalkeeper ? Math.round(goalkeeper.overall * fitOf(goalkeeper)) : 0, color: '#f0a92c' },
    { cle: 'vit', label: t('saison.notes.vit'), val: allAvg('pace'), color: '#8fdcaa' },
    { cle: 'phy', label: t('saison.notes.phy'), val: allAvg('physical'), color: '#f0c040' },
    { cle: 'forme', label: t('saison.notes.forme'), val: allAvg('stamina'), color: 'var(--success)' },
  ];
}

export default function Season({ manager, team, onUpdate, onManagerUpdate, onSeasonEnd, onWinterWindow }) {
  const { t } = useI18n();
  const [status, setStatus] = useState(null);
  const [guideFerme, setGuideFerme] = useState(guideMasque);
  const [lastMatch, setLastMatch] = useState(null);
  const [sponsors, setSponsors] = useState(null);
  const [sponsorChosen, setSponsorChosen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [view, setView] = useState('season');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [managementActions, setManagementActions] = useState([]);
  const [blesses, setBlesses] = useState([]);
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
  const panneauEquipeRef = useRef(null);
  const [clState, setCLState] = useState(null);
  const [cupState, setCupState] = useState(null);
  const [cupResult, setCupResult] = useState(null);
  const [history, setHistory] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [mood, setMood] = useState(null);
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
    // Garde unique pour tous les chemins de placement : clic, glisser-déposer
    // et panneau d'échange. Le serveur refuserait la sauvegarde de toute façon.
    const cible = players.find(p => p.id === playerId);
    if (cible && !isSelectable(cible)) {
      setMessage(t('saison.messages.nonAlignable', {
        joueur: `${cible.first_name} ${cible.last_name}`,
        motif: unavailableLabel(cible, t),
      }));
      setTimeout(() => setMessage(''), 4000);
      return;
    }

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

    // Les joueurs suspendus ou blessés sont écartés d'office : le serveur
    // refuse de toute façon une composition qui en contient, la sauvegarde
    // échouerait sans que l'origine soit compréhensible.
    const selectionnables = squad.filter(isSelectable);

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
      for (const player of selectionnables) {
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

    const dispo = players.filter(isSelectable);
    const ecartes = players.length - dispo.length;

    if (dispo.length < slots.length) {
      setMessage(t(
        dispo.length > 1 ? 'saison.messages.composeImpossiblePlusieurs' : 'saison.messages.composeImpossibleUn',
        { n: dispo.length, requis: slots.length, ecartes }
      ));
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    applyAssignments(buildBestEleven(players, slots));
    setSelectedPitchPlayer(null);
    setSelectedBenchPlayer(null);
    setMessage(
      ecartes > 0
        ? t(ecartes > 1 ? 'saison.messages.autoCompoEcartesPlusieurs' : 'saison.messages.autoCompoEcartesUn', { n: ecartes })
        : t('saison.messages.autoCompo')
    );
    setTimeout(() => setMessage(''), 4000);
  }

  function handleClearLineup() {
    applyAssignments({});
    setSelectedPitchPlayer(null);
    setSelectedBenchPlayer(null);
  }

  useEffect(() => {
    loadStatus();
    loadPlayers();
    loadCupStatus();
    loadHistory();
    loadMood();
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

  async function loadCupStatus() {
    try { setCupState(await api.getCupStatus(team.id)); }
    catch { setCupState(null); }
  }

  async function loadHistory() {
    try { setHistory(await api.getSeasonHistory(team.id)); }
    catch { setHistory(null); }
  }

  async function loadPlayerStats() {
    try { setPlayerStats((await api.getPlayerStats(team.id)).players || []); }
    catch { setPlayerStats([]); }
  }

  async function loadMood() {
    try { setMood(await api.getSquadMood(team.id)); }
    catch { setMood(null); }
  }

  async function handlePlayCup() {
    setLoading(true);
    try {
      const difficulty = localStorage.getItem('footmanager_difficulty') || 'normal';
      const result = await api.playCupMatch(team.id, difficulty);
      setCupResult(result);
      if (result.manager && onManagerUpdate) onManagerUpdate(result.manager);
      if (result.team) onUpdate(result.team);
      await Promise.all([loadCupStatus(), loadPlayers()]);
    } catch (err) {
      setMessage(err.message);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  }

  async function handleInitCL() {
    setLoading(true);
    try {
      const data = await api.initCL(team.id);
      await loadCLStatus();
      setMessage(t('saison.messages.clInitialisee'));
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
        setMessage(t('saison.messages.clResultat', {
          resultat: resultLabel(t, data.result.resultText),
          buts: data.result.playerGoals,
          butsAdverse: data.result.opponentGoals,
          adversaire: data.result.opponent,
        }));
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
      setMessage(t('saison.messages.onzeExact', { n: starterIds.length }));
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
      setMessage(t('saison.messages.compoSauvegardee'));
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
      setMessage(t('saison.messages.formationImpossible', {
        message: err.message || t('saison.messages.erreurReseau'),
      }));
      setTimeout(() => setMessage(''), 3000);
    }
  }

  async function handleSellPlayer(player) {
    if (players.length < SQUAD_MIN_SELL) {
      setMessage(t('saison.messages.minimumVente', { min: SQUAD_MIN_SELL, n: players.length }));
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    const nom = `${player.first_name} ${player.last_name}`;
    if (!confirm(t('saison.messages.confirmerVente', {
      joueur: nom,
      prix: formatMoney(Math.round((player.value || 0) * 0.8)),
    }))) return;
    try {
      const result = await api.sellPlayer(player.id, manager.id);
      if (onManagerUpdate) onManagerUpdate({ ...manager, budget: result.newBudget });
      setMessage(t('saison.messages.vendu', { joueur: nom, prix: formatMoney(result.sellPrice) }));
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
      // Camp occupé par votre équipe dans ce match : les événements du moteur
      // raisonnent en domicile/extérieur, l'affichage en « vous / eux ».
      const monCamp = result.match.isHome === false ? 'away' : 'home';
      const baseInterval = 10000 / 90;

      let minute = 0;
      function tick() {
        minute++;
        setLiveMinute(minute);

        const eventsNow = events.filter(e => e.minute === minute);
        if (eventsNow.length > 0) {
          setLiveEvents(prev => [...prev, ...eventsNow]);
          setLiveScore(prev => {
            // Le tableau affiche votre club à gauche, mais les événements
            // désignent les camps par le TERRAIN. À l'extérieur, compter le
            // camp « home » pour vous inversait le score, qui ne correspondait
            // alors plus au résultat final.
            let [miens, siens] = prev;
            eventsNow.forEach(e => {
              if (e.type !== 'goal') return;
              if (e.team === monCamp) miens++;
              else siens++;
            });
            return [miens, siens];
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
            loadMood();
            loadCupStatus();

            if (result.event) {
              setPendingEvent(result.event);
              setEventResult(null);
            }
            if (result.seasonOver) {
              setMessage(t('saison.messages.saisonTerminee'));
            } else if (result.winterWindow && onWinterWindow) {
              // On laisse le résultat du match s'afficher avant de basculer :
              // sinon la journée qui ouvre la fenêtre passerait inaperçue.
              setMessage(t('saison.messages.mercatoHiverOuvert'));
              setTimeout(() => onWinterWindow(null, result.team), 2200);
            }
          }, 800 / matchSpeedRef.current);
        } else {
          matchTimerRef.current = setTimeout(tick, baseInterval / matchSpeedRef.current);
        }
      }

      matchTimerRef.current = setTimeout(tick, baseInterval);

    } catch (err) {
      // Le serveur répond toujours en français : la comparaison porte sur son
      // message brut, seul l'affichage est traduit.
      if (err.message.includes('Saison terminée')) {
        setMessage(t('saison.messages.saisonTerminee'));
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
    setBlesses(data.injured || []);
  }

  async function handleHeal(joueur) {
    setLoading(true);
    try {
      const r = await api.healPlayer(team.id, joueur.id, manager.id);
      setMessage(t('saison.soins.confirme', { joueur: r.healed, n: r.matchesSaved }));
      onManagerUpdate({ ...manager, budget: r.newBudget });
      await loadManagement();
      await loadPlayers();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage(t('commun.erreur', { message: err.message }));
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyManagement(actionId) {
    setLoading(true);
    try {
      const result = await api.buyManagement(team.id, actionId, manager.id);
      setMessage(t('saison.messages.gestionAppliquee', {
        icone: result.action.icon,
        nom: result.action.name,
        cout: formatMoney(result.cost),
      }));
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

        // Le panneau s'affiche en bas de l'écran : ouvert depuis la fiche
        // d'avant-match, il resterait hors de vue sans ce défilement.
        setTimeout(() => {
          panneauEquipeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
  }

  function formatMoney(amount) {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M€`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}k€`;
    return `${amount}€`;
  }

  async function handleEndSeason() {
    setLoading(true);
    try {
      const difficulty = localStorage.getItem('footmanager_difficulty') || 'normal';
      const result = await api.endSeason(team.id, manager.id, difficulty);
      onSeasonEnd(result);
    } catch (err) {
      // Sans ce catch, un échec serveur ne produisait aucun retour : le bouton
      // semblait mort et le mercato ne s'ouvrait jamais.
      setMessage(t('saison.messages.clotureImpossible', { message: err.message }));
      setTimeout(() => setMessage(''), 6000);
    } finally {
      setLoading(false);
    }
  }

  if (!status) return <div className="page-loading">{t('commun.chargement')}</div>;

  const seasonOver = status.played >= status.totalMatches;
  const difficulty = localStorage.getItem('footmanager_difficulty') || 'normal';

  // Rappel de dégraissage : on alerte dès SQUAD_WARN pour laisser le temps de
  // réagir avant le plafond, et on passe en critique une fois celui-ci atteint.
  const squadAlert = (() => {
    const n = players.length;
    const restant = SQUAD_MAX - n;

    if (n >= SQUAD_MAX) {
      return {
        level: 'critical',
        short: t('saison.effectif.alertePleinCourt', { n, max: SQUAD_MAX }),
        title: t('saison.effectif.alertePleinTitre'),
        body: t('saison.effectif.alertePleinCorps', { max: SQUAD_MAX }),
      };
    }
    if (n >= SQUAD_WARN) {
      const cleplaces = restant > 5
        ? 'saison.effectif.placesRestantes'
        : restant > 1 ? 'saison.effectif.placesRestantesPeu' : 'saison.effectif.placeRestanteUne';
      const places = t(cleplaces, { n: restant });
      return {
        level: restant <= 5 ? 'critical' : 'warn',
        short: t('saison.effectif.alerteLargeCourt', { n, max: SQUAD_MAX }),
        title: t('saison.effectif.alerteLargeTitre'),
        body: t('saison.effectif.alerteLargeCorps', { n, max: SQUAD_MAX, places }),
      };
    }
    return null;
  })();

  return (
    <div className="season-page">
      <div className="season-header">
        <div className="season-info">
          <h1>{t('saison.entete.titre', { division: status.division, saison: status.season })}</h1>
          <div className="season-meta">
            <span>{t('saison.entete.journee', { n: status.played, total: status.totalMatches })}</span>
            <span className="rank-badge">#{status.rank}</span>
          </div>
        </div>
        {!guideFerme && (
          <GuideDebutant
            players={players}
            status={status}
            onAller={(vue) => setView(vue)}
            onMasquer={() => {
              try { localStorage.setItem(CLE_MASQUE, '1'); } catch {}
              setGuideFerme(true);
            }}
          />
        )}
        <div className="season-nav">
          <button className={view === 'season' ? 'active' : ''} onClick={() => setView('season')}>{t('saison.nav.saison')}</button>
          <button className={view === 'standings' ? 'active' : ''} onClick={() => setView('standings')}>{t('saison.nav.classement')}</button>
          <button className={view === 'lineup' ? 'active' : ''} onClick={() => setView('lineup')}>{t('saison.nav.compo')}</button>
          <button
            className={`${view === 'squad' ? 'active' : ''} nav-btn-effectif`}
            onClick={() => setView('squad')}
            title={squadAlert ? squadAlert.short : undefined}
          >
            {t('saison.nav.effectif')}
            {squadAlert && <span className={`nav-count-badge ${squadAlert.level}`}>{players.length}</span>}
          </button>
          <button className={`${view === 'management' ? 'active' : ''} nav-btn-gestion`} onClick={handleOpenManagement}>
            {t('saison.nav.gestion')}
            {hasConvNotification && <span className="nav-notif-badge" />}
          </button>
          <button
            className={`${view === 'cup' ? 'active' : ''} nav-btn-effectif`}
            onClick={() => { setView('cup'); loadCupStatus(); }}
          >
            {t('saison.nav.coupe')}
            {cupState && cupState.available && <span className="nav-notif-badge" />}
          </button>
          <button className={view === 'history' ? 'active' : ''} onClick={() => { setView('history'); loadHistory(); loadPlayerStats(); }}>
            {t('saison.nav.palmares')}
          </button>
          {team.division >= 7 && (
            <button className={`cl-tab ${view === 'cl' ? 'active' : ''}`} onClick={() => { setView('cl'); loadCLStatus(); }}>{t('saison.nav.championsLeague')}</button>
          )}
        </div>
      </div>

      {message && <div className="season-message">{message}<button onClick={() => setMessage('')}>×</button></div>}

      {mood && mood.unhappy.length > 0 && (
        <div className={`mood-alert ${mood.unhappy.some(p => p.transferRequest) ? 'critical' : ''}`}>
          <div className="mood-alert-head">
            <strong>
              {mood.unhappy.some(p => p.transferRequest)
                ? t('saison.moral.titreDeparts')
                : t('saison.moral.titreTensions')}
            </strong>
            <span className="mood-count">{mood.unhappy.length}</span>
          </div>
          <ul className="mood-list">
            {mood.unhappy.slice(0, 5).map(p => (
              <li key={p.id} className={`mood-row ${p.level}`}>
                <span className={`lp-pos ${posClass(p.position)}`}>{p.position}</span>
                <span className="mood-name">{p.name}</span>
                <span className="mood-reasons">{p.reasons.join(', ')}</span>
                <span className="mood-state">
                  {p.transferRequest
                    ? t(p.matchesBeforeLeaving > 1 ? 'saison.moral.partPlusieurs' : 'saison.moral.partUn', { n: p.matchesBeforeLeaving })
                    : p.label}
                </span>
              </li>
            ))}
          </ul>
          <p className="mood-hint">
            {t('saison.moral.conseil')}
            {difficulty === 'easy'
              ? t('saison.moral.conseilFacile')
              : t('saison.moral.conseilNormal')}
          </p>
        </div>
      )}

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
            <span className="live-badge">{t('saison.direct.badge')}</span>
            <span className="live-matchday">{t('saison.direct.journee', { n: liveMatch.match.matchday })}</span>
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
            {liveEvents.map((e, i) => {
              // Le camp de l'événement désigne le TERRAIN, pas votre équipe :
              // à l'extérieur, « home » est l'adversaire.
              const monCamp = liveMatch.match.isHome === false ? 'away' : 'home';
              const aMoi = e.team === monCamp;
              return (
                <div key={i} className={`live-event ${e.type} ${aMoi ? 'evt-nous' : 'evt-eux'}`}>
                  <span className="live-event-minute">{e.minute}'</span>
                  <span className="live-event-icon">{e.type === 'goal' ? '⚽' : '🟨'}</span>
                  <span className="live-event-text">{e.player}</span>
                  <span className="live-event-team">
                    {aMoi ? team.name : liveMatch.match.opponent}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'season' && (
        <div className="season-main">
          <div className="season-stats card">
            <div className="stats-row">
              <div className="stat-box"><span className="stat-val">{team.points}</span><span className="stat-label">{t('saison.stats.points')}</span></div>
              <div className="stat-box win"><span className="stat-val">{team.wins}</span><span className="stat-label">{t('saison.stats.victoires')}</span></div>
              <div className="stat-box draw"><span className="stat-val">{team.draws}</span><span className="stat-label">{t('saison.stats.nuls')}</span></div>
              <div className="stat-box loss"><span className="stat-val">{team.losses}</span><span className="stat-label">{t('saison.stats.defaites')}</span></div>
              <div className="stat-box"><span className="stat-val">{team.goals_for}-{team.goals_against}</span><span className="stat-label">{t('saison.stats.buts')}</span></div>
            </div>
          </div>

          {!seasonOver && (
            <div className="season-actions">
              {/* Fiche d'avant-match. Le calendrier connaît l'adversaire à
                  l'avance : autant permettre de le jauger plutôt que de
                  découvrir son nom au coup d'envoi. */}
              {status.nextOpponent && (
                <div className={`scouting ${status.nextOpponent.isDerby ? 'is-derby' : ''}`}>
                  <div className="scouting-tete">
                    <div>
                      <span className="scouting-label">
                        {status.nextOpponent.isHome
                          ? t('saison.scouting.recoit')
                          : t('saison.scouting.deplacement')}
                      </span>
                      <h4>
                        {status.nextOpponent.name}
                        {status.nextOpponent.isDerby && (
                          <span className="derby-tag">{t('saison.derby.etiquette')}</span>
                        )}
                      </h4>
                    </div>
                    {status.nextOpponent.rank && (
                      <span className="scouting-rang">
                        {t('saison.scouting.rang', { rang: status.nextOpponent.rank })}
                      </span>
                    )}
                  </div>

                  <div className="scouting-chiffres">
                    <div>
                      <span>{t('saison.scouting.points')}</span>
                      <strong>{status.nextOpponent.points ?? '—'}</strong>
                    </div>
                    <div>
                      <span>{t('saison.scouting.buts')}</span>
                      <strong>{status.nextOpponent.goalsFor}:{status.nextOpponent.goalsAgainst}</strong>
                    </div>
                    <div>
                      <span>{t('saison.scouting.niveau')}</span>
                      <strong>{status.nextOpponent.squadAverage ?? '—'}</strong>
                    </div>
                    <div>
                      <span>{t('saison.scouting.effectif')}</span>
                      <strong>{status.nextOpponent.squadSize}</strong>
                    </div>
                  </div>

                  {status.nextOpponent.form && status.nextOpponent.form.length > 0 && (
                    <div className="scouting-forme">
                      <span>{t('saison.scouting.forme')}</span>
                      {status.nextOpponent.form.map((r, i) => (
                        <i key={i} className={`forme-pastille forme-${r}`}>{r}</i>
                      ))}
                    </div>
                  )}

                  {status.nextOpponent.topPlayers && status.nextOpponent.topPlayers.length > 0 && (
                    <div className="scouting-cadres">
                      <span className="scouting-cadres-titre">{t('saison.scouting.dangers')}</span>
                      {status.nextOpponent.topPlayers.map((p, i) => (
                        <span key={i} className="scouting-joueur">
                          <i className="sc-pos">{p.position}</i>
                          {p.first_name} {p.last_name}
                          <i className="sc-ovr">{p.overall}</i>
                          {p.goals > 0 && <i className="sc-buts">{t('saison.scouting.butsJoueur', { n: p.goals })}</i>}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    className="scouting-voir"
                    onClick={() => handleViewTeam({ id: status.nextOpponent.id, name: status.nextOpponent.name })}
                  >
                    {t('saison.scouting.voirEffectif')}
                  </button>
                </div>
              )}
              <button className="btn-primary action-btn" onClick={handlePlayMatch} disabled={loading}>
                {t('saison.actions.jouerJournee', { n: status.played + 1 })}
              </button>
              {!sponsorChosen && status.played >= 5 && (
                <button className="btn-secondary action-btn" onClick={handleGetSponsors}>
                  {t('saison.actions.sponsors')}
                </button>
              )}
            </div>
          )}

          {seasonOver && (
            <div className="season-end card">
              <h2>{t('saison.actions.finSaison')}</h2>
              {/* La phrase porte deux mises en gras dont la place varie d'une
                  langue à l'autre : c'est le texte traduit qui les positionne. */}
              <p dangerouslySetInnerHTML={{
                __html: t('saison.actions.finClassement', { rang: status.rank, points: team.points }),
              }} />
              <button className="btn-primary action-btn" onClick={handleEndSeason} disabled={loading}>
                {t('saison.actions.bilanMercato')}
              </button>
            </div>
          )}

          {lastMatch && (
            <div className="last-match card">
              <h3>
                {t('saison.dernierMatch.titre', { n: lastMatch.matchday })}
                {lastMatch.isHome !== undefined && (
                  <span className="match-venue">
                    {lastMatch.isHome ? t('saison.dernierMatch.domicile') : t('saison.dernierMatch.exterieur')}
                  </span>
                )}
                {lastMatch.isDerby && <span className="derby-tag">{t('saison.derby.etiquette')}</span>}
              </h3>
              <div className="match-score">
                <span className="team-name">{team.name}</span>
                <span className="score">
                  {lastMatch.goalsFor ?? lastMatch.homeGoals} - {lastMatch.goalsAgainst ?? lastMatch.awayGoals}
                </span>
                <span className="team-name">{lastMatch.opponent}</span>
              </div>
              {/* La classe CSS dérive du resultText BRUT du serveur : on ne
                  traduit que le libellé affiché. */}
              <span className={`result-tag ${lastMatch.resultText.toLowerCase().replace(' ', '-')}`}>
                {resultLabel(t, lastMatch.resultText)}{' '}
                {lastMatch.pointsEarned > 0 ? t('saison.dernierMatch.points', { n: lastMatch.pointsEarned }) : ''}
              </span>
              {lastMatch.events.length > 0 && (
                <div className="match-events-mini">
                  {lastMatch.events.filter(e => e.type === 'goal').map((e, i) => {
                    // Sans distinction de camp, on ne savait pas si un but
                    // était marqué par son équipe ou encaissé.
                    const aMoi = e.team === (lastMatch.isHome === false ? 'away' : 'home');
                    return (
                      <div key={i} className={`event-mini ${aMoi ? 'evt-nous' : 'evt-eux'}`}>
                        ⚽ {e.minute}' {e.player}
                      </div>
                    );
                  })}
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
                <th>{t('saison.classement.colEquipe')}</th>
                <th>{t('saison.classement.colPoints')}</th>
                <th>{t('saison.classement.colVictoires')}</th>
                <th>{t('saison.classement.colNuls')}</th>
                <th>{t('saison.classement.colDefaites')}</th>
                <th>{t('saison.classement.colButsPour')}</th>
                <th>{t('saison.classement.colButsContre')}</th>
                <th>{t('saison.classement.colDiff')}</th>
              </tr>
            </thead>
            <tbody>
              {/* La ligne s'appelle `equipe` et non `t` : `t` est la fonction de
                  traduction, que le paramètre masquerait dans toute la boucle. */}
              {status.standings.map((equipe, i) => (
                <tr
                  key={equipe.id}
                  className={[
                    equipe.id === team.id ? 'my-team' : '',
                    equipe.id !== team.id ? 'clickable-row' : '',
                    status.rival && equipe.id === status.rival.id ? 'rival-row' : '',
                    i < 2 ? 'zone-promo' : '',
                    i >= status.standings.length - 2 ? 'zone-releg' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleViewTeam(equipe)}
                >
                  <td className="rank">{i + 1}</td>
                  <td className="team-name-cell">
                    {equipe.name}
                    {status.rival && equipe.id === status.rival.id && (
                      <span className="rival-badge" title={t('saison.classement.rival')}>🔥</span>
                    )}
                    {equipe.id !== team.id && <span className="view-squad-hint">👁</span>}
                  </td>
                  <td className="pts">{equipe.points}</td>
                  <td>{equipe.wins}</td>
                  <td>{equipe.draws}</td>
                  <td>{equipe.losses}</td>
                  <td>{equipe.goals_for}</td>
                  <td>{equipe.goals_against}</td>
                  <td className={equipe.goal_diff > 0 ? 'pos' : equipe.goal_diff < 0 ? 'neg' : ''}>
                    {equipe.goal_diff > 0 ? '+' : ''}{equipe.goal_diff}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="standings-legend">
            <span><i className="lg-promo" />{t('saison.classement.legendePromo')}</span>
            <span><i className="lg-releg" />{t('saison.classement.legendeReleg')}</span>
          </div>

        </div>
      )}

      {view === 'lineup' && (
        <div className="lineup-view">
          <div className="lineup-header">
            <div className="lineup-formation">
              <label>{t('saison.compo.formation')}</label>
              <select value={formation} onChange={handleSetFormation}>
                {FORMATION_NAMES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="lineup-actions">
              <button className="btn-ghost btn-small" onClick={handleAutoLineup}>{t('saison.compo.meilleurOnze')}</button>
              <button className="btn-ghost btn-small" onClick={handleClearLineup} disabled={starterIds.length === 0}>{t('saison.compo.vider')}</button>
              <button className="btn-primary" onClick={handleSaveLineup} disabled={loading || starterIds.length !== 11}>
                {lineupDirty ? t('saison.compo.sauvegarderModifie') : t('saison.compo.sauvegarder')} ({starterIds.length}/11)
              </button>
            </div>
          </div>

          {lineupDirty && (
            <div className="lineup-dirty-banner">
              {t('saison.compo.nonSauvegarde')}
            </div>
          )}

          {(() => {
            const issues = [];
            const hasKeeper = slots.some((pos, idx) => {
              const id = slotAssignments[idx];
              const p = id ? players.find(x => x.id === id) : null;
              return pos === 'GAR' && p && p.position === 'GAR';
            });
            if (starterIds.length > 0 && !hasKeeper) issues.push(t('saison.compo.alerteGardien'));

            const misfits = slots.reduce((acc, pos, idx) => {
              const id = slotAssignments[idx];
              const p = id ? players.find(x => x.id === id) : null;
              if (p && getPositionFit(p.position, pos) < 1) acc++;
              return acc;
            }, 0);
            if (misfits > 0) {
              issues.push(t(misfits > 1 ? 'saison.compo.alerteHorsLignePlusieurs' : 'saison.compo.alerteHorsLigneUn', { n: misfits }));
            }

            const tired = starterIds
              .map(id => players.find(p => p.id === id))
              .filter(p => p && p.stamina < STAMINA_TIRED).length;
            if (tired > 0) {
              issues.push(t(tired > 1 ? 'saison.compo.alerteFatiguePlusieurs' : 'saison.compo.alerteFatigueUn', { n: tired }));
            }

            // Un joueur indisponible bloque la validation côté serveur : il faut
            // le signaler ici, sinon la sauvegarde échoue sans raison apparente.
            const bloques = starterIds
              .map(id => players.find(p => p.id === id))
              .filter(p => p && ((p.suspended_matches || 0) > 0 || (p.injured_matches || 0) > 0))
              .map(p => `${p.last_name} (${p.suspended_matches > 0 ? t('saison.compo.suspendu') : t('saison.compo.blesse')})`);
            if (bloques.length) {
              issues.push(t(
                bloques.length > 1 ? 'saison.compo.alerteIndispoPlusieurs' : 'saison.compo.alerteIndispoUn',
                { liste: bloques.join(', ') }
              ));
            }

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
            const stats = computeTeamStats(placed, t);
            if (!stats) return null;
            return (
              <div className="team-stats-overview">
                {stats.map(s => (
                  <div key={s.cle} className="tso-stat-bar">
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
                    aria-label={t('saison.compo.emplacementVide', { poste: slot.pos })}
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
                    title={t('saison.compo.titreJoueur', {
                      joueur: `${player.first_name} ${player.last_name}`,
                      poste: player.position,
                      emplacement: slot.pos,
                      adequation: t(`saison.adequation.${fitInfo.tone}`),
                      pct: Math.round(fit * 100),
                      note: player.overall,
                      forme: player.stamina,
                      moral: player.morale,
                    })}
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
                  {/* Deux mises en gras dont la place change selon la langue :
                      le texte traduit les positionne lui-même. */}
                  <span dangerouslySetInnerHTML={{
                    __html: t('saison.compo.emplacementOccupe', {
                      emplacement: slotPos,
                      joueur: `${selectedPitchPlayer.first_name} ${selectedPitchPlayer.last_name}`,
                      poste: selectedPitchPlayer.position,
                      note: selectedPitchPlayer.overall,
                    }),
                  }} />
                  <button className="btn-small btn-danger" onClick={() => { clearSlot(slotIdx); setSelectedPitchPlayer(null); }}>{t('saison.compo.retirer')}</button>
                  <button className="btn-small" onClick={() => setSelectedPitchPlayer(null)}>{t('commun.fermer')}</button>
                </div>
                <div className="swap-panel-list">
                  {candidates.map(({ p, fit }) => {
                    const info = getFitLabel(fit);
                    const isStarter = starterIdSet.has(p.id);
                    const indispo = !isSelectable(p);
                    return (
                      <div
                        key={p.id}
                        role="button"
                        tabIndex={indispo ? -1 : 0}
                        aria-disabled={indispo}
                        className={`swap-candidate fit-${info.tone} ${isStarter ? 'is-starter' : ''} ${indispo ? 'swap-unavailable' : ''}`}
                        title={indispo
                          ? t('saison.compo.candidatIndispo', { motif: unavailableLabel(p, t) })
                          : t('saison.compo.candidatFit', {
                              adequation: t(`saison.adequation.${info.tone}`),
                              emplacement: slotPos,
                              pct: Math.round(fit * 100),
                            })}
                        onKeyDown={(e) => { if (!indispo && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleSwapPlayers(p.id); } }}
                        onClick={() => { if (!indispo) handleSwapPlayers(p.id); }}
                      >
                        <span className={`lp-pos ${posClass(p.position)}`}>{p.position}</span>
                        <span className="swap-name">{p.first_name} {p.last_name}</span>
                        {indispo ? (
                          <span className="swap-indispo">{unavailableLabel(p, t)}</span>
                        ) : (
                          <span className="swap-fit">{Math.round(fit * 100)}%</span>
                        )}
                        <span className="swap-ovr">{p.overall}</span>
                        <span className={`swap-stamina tone-${staminaTone(p.stamina)}`}>{p.stamina}%</span>
                        {isStarter && <span className="swap-starter-tag">{t('saison.compo.tagTitulaire')}</span>}
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
                {t('saison.compo.remplacants', { n: benchPlayers.length })}
                {selectedBenchPlayer && <span className="bench-hint">{t('saison.compo.indiceEmplacement')}</span>}
              </h3>
              <div className="bench-sort-btns">
                <button className={`bench-sort-btn ${benchSort === 'overall' ? 'active' : ''}`} onClick={() => setBenchSort('overall')}>{t('saison.compo.triNote')}</button>
                <button className={`bench-sort-btn ${benchSort === 'position' ? 'active' : ''}`} onClick={() => setBenchSort('position')}>{t('saison.compo.triPoste')}</button>
                <button className={`bench-sort-btn ${benchSort === 'name' ? 'active' : ''}`} onClick={() => setBenchSort('name')}>{t('saison.compo.triNom')}</button>
                <button className={`bench-sort-btn ${benchSort === 'stamina' ? 'active' : ''}`} onClick={() => setBenchSort('stamina')}>{t('saison.compo.triForme')}</button>
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
                const suspendu = (p.suspended_matches || 0) > 0;
                const blesse = (p.injured_matches || 0) > 0;
                const indispo = suspendu || blesse;
                const veutPartir = !!p.transfer_request;
                return (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    draggable={!indispo}
                    title={t('saison.compo.titreBanc', {
                        joueur: `${p.first_name} ${p.last_name}`,
                        poste: p.position,
                        note: p.overall,
                        forme: p.stamina,
                        moral: p.morale,
                      })
                      + (suspendu ? `\n${t('saison.compo.titreSuspendu', { n: p.suspended_matches })}` : '')
                      + (blesse ? `\n${t('saison.compo.titreBlesse', { n: p.injured_matches })}` : '')
                      + (veutPartir ? `\n${t('saison.compo.titreVeutPartir')}` : '')}
                    className={`bench-player-card ${isBenchSelected ? 'bench-selected' : ''} ${draggedPlayerId === p.id ? 'dragging' : ''} ${indispo ? 'unavailable' : ''} ${veutPartir ? 'wants-out' : ''}`}
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
                    {indispo && (
                      <span className="bench-unavailable">
                        {suspendu ? `🟥 ${p.suspended_matches}` : `🚑 ${p.injured_matches}`}
                      </span>
                    )}
                    {!indispo && veutPartir && <span className="bench-wants-out">✈</span>}
                  </div>
                );
              })}
            </div>

            <div className="lineup-legend">
              <span><i className="lg-fit-perfect" />{t('saison.compo.legendeParfait')}</span>
              <span><i className="lg-fit-good" />{t('saison.compo.legendeBon')}</span>
              <span><i className="lg-fit-warn" />{t('saison.compo.legendeMoyen')}</span>
              <span><i className="lg-fit-bad" />{t('saison.compo.legendeMauvais')}</span>
              <span className="legend-sep">{t('saison.compo.legendeForme')}</span>
            </div>
          </div>
        </div>
      )}

      {view === 'cup' && (
        <div className="cup-view">
          <div className="cup-banner">
            <h2>{t('saison.coupe.titre')}</h2>
            <p className="cup-subtitle">
              {t('saison.coupe.sousTitre')}
            </p>
          </div>

          {!cupState ? (
            <p className="no-data">{t('commun.chargementPoints')}</p>
          ) : cupState.state.won ? (
            <div className="cup-status-card cup-won">
              <strong>{t('saison.coupe.gagnee')}</strong>
              <p>{t('saison.coupe.gagneeDetail')}</p>
            </div>
          ) : cupState.state.eliminated ? (
            <div className="cup-status-card cup-out">
              <strong>{cupState.resultLabel}</strong>
              <p>{t('saison.coupe.elimineDetail')}</p>
            </div>
          ) : (
            <div className="cup-status-card">
              <div className="cup-next">
                <span className="cup-round-name">{cupState.round ? cupState.round.name : '—'}</span>
                {cupState.state.nextOpponent && (
                  <span className="cup-opponent">
                    {t('saison.coupe.contre')} <strong>{cupState.state.nextOpponent.name}</strong>
                    <em> {t('saison.coupe.niveau', { n: cupState.state.nextOpponent.overall })}</em>
                  </span>
                )}
              </div>
              {cupState.available ? (
                <button className="btn-primary action-btn" onClick={handlePlayCup} disabled={loading}>
                  {t('saison.coupe.disputer')}
                </button>
              ) : (
                <p className="cup-locked">
                  {t('saison.coupe.verrouille', {
                    tour: cupState.round ? cupState.round.minMatchday : '?',
                    actuelle: cupState.matchday,
                  })}
                </p>
              )}
            </div>
          )}

          {cupResult && (
            <div className={`cup-result ${cupResult.won ? 'win' : 'loss'}`}>
              <div className="cup-result-head">
                <strong>{cupResult.round}</strong> {t('saison.coupe.contre')} {cupResult.opponent}
                <span className="cup-score">{cupResult.score}</span>
              </div>
              <p>
                {cupResult.cupWon ? t('saison.coupe.trophee')
                  : cupResult.won ? t('saison.coupe.qualifie')
                  : t('saison.coupe.elimine')}
                {cupResult.prize > 0 && t('saison.coupe.dotation', { montant: formatMoney(cupResult.prize) })}
              </p>
              {cupResult.injuries && cupResult.injuries.length > 0 && (
                <p className="cup-warn">
                  {t('saison.coupe.blessure', {
                    liste: cupResult.injuries
                      .map(i => t('saison.coupe.blessureJoueur', { joueur: i.player, n: i.matches }))
                      .join(', '),
                  })}
                </p>
              )}
              {cupResult.suspensions && cupResult.suspensions.length > 0 && (
                <p className="cup-warn">
                  {t('saison.coupe.suspension', {
                    liste: cupResult.suspensions
                      .map(s => t('saison.coupe.suspensionJoueur', { joueur: s.player, motif: s.reason }))
                      .join(', '),
                  })}
                </p>
              )}
              <button className="btn-small" onClick={() => setCupResult(null)}>{t('commun.fermer')}</button>
            </div>
          )}

          {cupState && cupState.state.history.length > 0 && (
            <div className="cup-path">
              <h3>{t('saison.coupe.parcours')}</h3>
              {cupState.state.history.map((h, i) => (
                <div key={i} className={`cup-path-row ${h.won ? 'win' : 'loss'}`}>
                  <span className="cup-path-round">{h.roundName}</span>
                  <span className="cup-path-opp">{h.opponent}</span>
                  <span className="cup-path-score">{h.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'history' && (
        <div className="history-view">
          <div className="palmares-row">
            <div className="palmares-card">
              <span className="palmares-val">{history ? history.titles : 0}</span>
              <span className="palmares-label">{t('saison.palmares.titres')}</span>
            </div>
            <div className="palmares-card">
              <span className="palmares-val">{history ? history.cups : 0}</span>
              <span className="palmares-label">{t('saison.palmares.coupes')}</span>
            </div>
            <div className="palmares-card">
              <span className="palmares-val">{history ? history.history.length : 0}</span>
              <span className="palmares-label">{t('saison.palmares.saisons')}</span>
            </div>
          </div>

          <h3 className="history-title">{t('saison.palmares.buteurs')}</h3>
          {playerStats.filter(p => p.goals > 0).length === 0 ? (
            <p className="no-data">{t('saison.palmares.aucunBut')}</p>
          ) : (
            <table className="standings-table">
              <thead>
                <tr>
                  <th>{t('saison.palmares.colJoueur')}</th>
                  <th>{t('saison.palmares.colPoste')}</th>
                  <th>{t('saison.palmares.colMatchs')}</th>
                  <th>{t('saison.palmares.colButs')}</th>
                  <th>{t('saison.palmares.colCartons')}</th>
                  <th>{t('saison.palmares.colCarriere')}</th>
                </tr>
              </thead>
              <tbody>
                {playerStats.filter(p => p.goals > 0).slice(0, 12).map(p => (
                  <tr key={p.id}>
                    <td className="team-name-cell">{p.first_name} {p.last_name}</td>
                    <td><span className={`lp-pos ${posClass(p.position)}`}>{p.position}</span></td>
                    <td>{p.appearances}</td>
                    <td className="pts">{p.goals}</td>
                    <td>{p.yellow_cards > 0 && `${p.yellow_cards}🟨 `}{p.red_cards > 0 && `${p.red_cards}🟥`}</td>
                    <td>{t('saison.palmares.carriereJoueur', { buts: p.career_goals, matchs: p.career_appearances })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3 className="history-title">{t('saison.palmares.historique')}</h3>
          {!history || history.history.length === 0 ? (
            <p className="no-data">{t('saison.palmares.aucuneSaison')}</p>
          ) : (
            <table className="standings-table">
              <thead>
                <tr>
                  <th>{t('saison.palmares.colSaison')}</th>
                  <th>{t('saison.palmares.colDivision')}</th>
                  <th>{t('saison.palmares.colRang')}</th>
                  <th>{t('saison.palmares.colPoints')}</th>
                  <th>{t('saison.palmares.colBilan')}</th>
                  <th>{t('saison.palmares.colCoupe')}</th>
                  <th>{t('saison.palmares.colButeur')}</th>
                </tr>
              </thead>
              <tbody>
                {history.history.map(h => (
                  <tr key={h.id} className={h.promoted ? 'zone-promo' : h.relegated ? 'zone-releg' : ''}>
                    <td className="rank">{h.season}</td>
                    <td className="team-name-cell">{h.division_name}</td>
                    <td>{h.rank}{h.promoted ? ' ↑' : h.relegated ? ' ↓' : ''}</td>
                    <td className="pts">{h.points}</td>
                    <td>{t('saison.palmares.bilan', { victoires: h.wins, nuls: h.draws, defaites: h.losses })}</td>
                    <td>{h.cup_result || '—'}</td>
                    <td>{h.top_scorer ? `${h.top_scorer} (${h.top_scorer_goals})` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
            <span>{t('saison.effectif.nombre', { n: players.length })}</span>
            <span>{t('saison.effectif.valeurTotale', {
              valeur: formatMoney(players.reduce((s, p) => s + (p.value || 0), 0)),
            })}</span>
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
                      title={canSell ? undefined : t('saison.effectif.minimumVente', { min: SQUAD_MIN_SELL })}
                    >
                      {t('saison.effectif.vendre', { prix: formatMoney(Math.round((p.value || 0) * 0.8)) })}
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
          <h2>{t('saison.sponsors.titre')}</h2>
          <p className="sponsors-hint">{t('saison.sponsors.indice')}</p>
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
                  {t('saison.sponsors.signer', { nom: sponsor.name })}
                </button>
              </div>
            ))}
          </div>
          <button className="btn-back" onClick={() => setView('season')}>{t('commun.retour')}</button>
        </div>
      )}

      {view === 'sponsor-result' && sponsorResult && (
        <div className="sponsor-result-view">
          <div className="sponsor-result-card card">
            <div className="sr-header">
              <span className="sr-logo">{sponsorResult.logo}</span>
              <h2>{t('saison.sponsors.partenariat', { nom: sponsorResult.name })}</h2>
              <span className="sr-payment">+{(sponsorResult.payment / 1000000).toFixed(0)}M€</span>
            </div>

            <p className="sr-desc">{sponsorResult.description}</p>

            {(sponsorResult.bonus.morale > 0 || sponsorResult.bonus.reputation > 0 || sponsorResult.bonus.stamina_boost > 0) && (
              <div className="sr-section sr-bonus">
                <h3>{t('saison.sponsors.bonus')}</h3>
                {sponsorResult.bonus.morale > 0 && (
                  <div className="sr-effect good">
                    <span className="sr-effect-val">{t('saison.sponsors.moralPlus', { n: sponsorResult.bonus.morale })}</span>
                    <span className="sr-effect-why">{t('saison.sponsors.moralPourquoi')}</span>
                  </div>
                )}
                {sponsorResult.bonus.reputation > 0 && (
                  <div className="sr-effect good">
                    <span className="sr-effect-val">{t('saison.sponsors.reputationPlus', { n: sponsorResult.bonus.reputation })}</span>
                    <span className="sr-effect-why">{t('saison.sponsors.reputationPourquoi')}</span>
                  </div>
                )}
                {sponsorResult.bonus.stamina_boost > 0 && (
                  <div className="sr-effect good">
                    <span className="sr-effect-val">{t('saison.sponsors.formePlus', { n: sponsorResult.bonus.stamina_boost })}</span>
                    <span className="sr-effect-why">{t('saison.sponsors.formePourquoi')}</span>
                  </div>
                )}
              </div>
            )}

            {(sponsorResult.malus.morale || sponsorResult.malus.reputation) && (
              <div className="sr-section sr-malus">
                <h3>{t('saison.sponsors.contreparties')}</h3>
                {sponsorResult.malus.morale && (
                  <div className="sr-effect bad">
                    <span className="sr-effect-val">{t('saison.sponsors.moralMoins', { n: sponsorResult.malus.morale })}</span>
                    <span className="sr-effect-why">{t('saison.sponsors.moralMoinsPourquoi')}</span>
                  </div>
                )}
                {sponsorResult.malus.reputation && (
                  <div className="sr-effect bad">
                    <span className="sr-effect-val">{t('saison.sponsors.reputationMoins', { n: sponsorResult.malus.reputation })}</span>
                    <span className="sr-effect-why">{t('saison.sponsors.reputationMoinsPourquoi')}</span>
                  </div>
                )}
              </div>
            )}

            <button className="btn-primary sr-continue" onClick={() => { setSponsorResult(null); setView('season'); }}>
              {t('saison.sponsors.continuer')}
            </button>
          </div>
        </div>
      )}

      {view === 'management' && (
        <div className="management-view">
          <h2>{t('saison.gestion.titre')}</h2>

          {conversation && (
            <div className="conversation-section" style={{marginBottom: '20px'}}>
              <div className="conv-card card">
                <div className="conv-header">
                  <span className="conv-player-badge">{conversation.player.position} {conversation.player.overall}</span>
                  <h3>{t('saison.gestion.veutParler', {
                    joueur: `${conversation.player.first_name} ${conversation.player.last_name}`,
                  })}</h3>
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
                      {convResponse.effects.morale > 0 && <span className="effect-good">{t('saison.gestion.moralPlus', { n: convResponse.effects.morale })}</span>}
                      {convResponse.effects.morale < 0 && <span className="effect-bad">{t('saison.gestion.moralMoins', { n: convResponse.effects.morale })}</span>}
                      {convResponse.effects.stamina > 0 && <span className="effect-good">{t('saison.gestion.formePlus', { n: convResponse.effects.stamina })}</span>}
                      {convResponse.effects.stamina < 0 && <span className="effect-bad">{t('saison.gestion.formeMoins', { n: convResponse.effects.stamina })}</span>}
                      {convResponse.effects.overall > 0 && <span className="effect-good">{t('saison.gestion.overallPlus', { n: convResponse.effects.overall })}</span>}
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
            <p className="conv-no-problem">{t('saison.gestion.aucunProbleme')}</p>
          )}

          {/* Infirmerie : écourter une blessure contre paiement. Placée avant
              les actions générales, c'est la dépense la plus urgente quand un
              cadre manque. */}
          {blesses.length > 0 && (
            <div className="infirmerie card">
              <h3>{t('saison.soins.titre')}</h3>
              <p className="infirmerie-note">{t('saison.soins.note')}</p>
              {blesses.map((j) => (
                <div key={j.id} className="infirmerie-ligne">
                  <span className="inf-poste">{j.position}</span>
                  <span className="inf-nom">{j.first_name} {j.last_name}</span>
                  <span className="inf-ovr">{j.overall}</span>
                  <span className="inf-duree">
                    {j.injured_matches > 1
                      ? t('saison.soins.matchs', { n: j.injured_matches })
                      : t('saison.soins.match', { n: j.injured_matches })}
                  </span>
                  <button
                    className="inf-soigner"
                    onClick={() => handleHeal(j)}
                    disabled={loading || manager.budget < j.healCost}
                    title={manager.budget < j.healCost ? t('saison.soins.tropCher') : undefined}
                  >
                    {t('saison.soins.bouton', { montant: formatMoney(j.healCost) })}
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="management-hint">{t('saison.gestion.indice')}</p>
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
                  <span className="management-cooldown">{t('saison.gestion.cooldown', { n: action.cooldownRemaining })}</span>
                )}
                <button
                  className="btn-primary"
                  onClick={() => handleBuyManagement(action.id)}
                  disabled={loading || !action.available || manager.budget < action.cost}
                >
                  {manager.budget < action.cost
                    ? t('saison.gestion.budgetInsuffisant')
                    : !action.available
                      ? t('saison.gestion.enCooldown')
                      : t('saison.gestion.acheter', { cout: formatMoney(action.cost) })}
                </button>
              </div>
            ))}
          </div>
          <button className="btn-back" onClick={() => setView('season')}>{t('commun.retour')}</button>
        </div>
      )}

      {view === 'cl' && (
        <div className="cl-view">
          <div className="cl-header-banner">
            <h2>{t('saison.cl.titre')}</h2>
            <p className="cl-subtitle">{t('saison.cl.sousTitre')}</p>
          </div>

          {!clState || !clState.active ? (
            <div className="cl-init card">
              <p>{t('saison.cl.qualifie')}</p>
              <button className="btn-primary cl-btn" onClick={handleInitCL} disabled={loading}>
                {t('saison.cl.tirage')}
              </button>
            </div>
          ) : (
            <>
              <div className="cl-status-bar">
                <span className="cl-phase-badge">
                  {clState.phase === 'group' && t('saison.cl.phaseGroupes', { n: clState.currentMatchday })}
                  {clState.phase === 'quarter_final' && t('saison.cl.phaseQuarts')}
                  {clState.phase === 'semi_final' && t('saison.cl.phaseDemis')}
                  {clState.phase === 'final' && t('saison.cl.phaseFinale')}
                </span>
                <span className="cl-earnings">{t('saison.cl.gains', { montant: formatMoney(clState.totalEarnings) })}</span>
              </div>

              {clState.eliminated && (
                <div className="cl-eliminated card">
                  <h3>{t('saison.cl.elimineTitre')}</h3>
                  <p>{t('saison.cl.elimineCorps')}</p>
                  <p>{t('saison.cl.gainsTotaux')} <strong>{formatMoney(clState.totalEarnings)}</strong></p>
                </div>
              )}

              {clState.winner && (
                <div className="cl-winner card">
                  <h3>{t('saison.cl.vainqueurTitre')}</h3>
                  <p>{t('saison.cl.vainqueurCorps')}</p>
                  <p>{t('saison.cl.gainsTotaux')} <strong>{formatMoney(clState.totalEarnings)}</strong></p>
                </div>
              )}

              {!clState.eliminated && !clState.winner && (
                <div className="cl-actions">
                  <button className="btn-primary cl-btn" onClick={handlePlayCLMatch} disabled={loading}>
                    {t('saison.cl.jouerMatch')}
                  </button>
                  {clState.nextMatch && (
                    <span className="cl-next-info">
                      {t('saison.cl.prochain', {
                        adversaire: clState.nextMatch.opponent || clState.nextMatch.away || clState.nextMatch.home,
                      })}
                      {clState.nextMatch.leg && ` (${clState.nextMatch.leg === 1 ? t('saison.cl.aller') : t('saison.cl.retourManche')})`}
                    </span>
                  )}
                </div>
              )}

              {clLastResult && clLastResult.result && (
                <div className="cl-last-result card">
                  <h3>{t('saison.cl.dernierResultat')}</h3>
                  <div className="match-score">
                    <span className="team-name">{clLastResult.result.isHome ? team.name : clLastResult.result.opponent}</span>
                    <span className="score">
                      {clLastResult.result.isHome ? clLastResult.result.playerGoals : clLastResult.result.opponentGoals}
                      {' - '}
                      {clLastResult.result.isHome ? clLastResult.result.opponentGoals : clLastResult.result.playerGoals}
                    </span>
                    <span className="team-name">{clLastResult.result.isHome ? clLastResult.result.opponent : team.name}</span>
                  </div>
                  {/* Comme en championnat, la classe CSS vient du resultText
                      BRUT : seule la lecture est traduite. */}
                  <span className={`result-tag ${clLastResult.result.resultText.toLowerCase().replace(' ', '-')}`}>
                    {resultLabel(t, clLastResult.result.resultText)}
                  </span>
                  {clLastResult.result.aggregate && (
                    <p className="cl-aggregate">{t('saison.cl.cumule', {
                      joueur: clLastResult.result.aggregate.player,
                      adversaire: clLastResult.result.aggregate.opponent,
                    })}</p>
                  )}
                  {clLastResult.result.penalties && (
                    <p className="cl-penalties">{clLastResult.result.penaltyWin ? t('saison.cl.tabVictoire') : t('saison.cl.tabDefaite')}</p>
                  )}
                  {clLastResult.result.events && clLastResult.result.events.filter(e => e.type === 'goal').length > 0 && (
                    <div className="match-events-mini">
                      {clLastResult.result.events.filter(e => e.type === 'goal').map((e, i) => {
                        // Indiquer « domicile » ou « extérieur » était exact mais
                        // sans intérêt : ce qu'on veut savoir, c'est si le but
                        // est pour nous.
                        const aMoi = e.team === (clLastResult.result.isHome === false ? 'away' : 'home');
                        return (
                          <div key={i} className={`event-mini ${aMoi ? 'evt-nous' : 'evt-eux'}`}>
                            ⚽ {e.minute}' {e.player}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {clState.phase === 'group' && clState.groups && (
                <div className="cl-groups">
                  {clState.groups.map(group => (
                    <div key={group.name} className="cl-group card">
                      <h3>{t('saison.cl.groupe', { nom: group.name })}</h3>
                      <table className="cl-group-table">
                        <thead>
                          <tr>
                            <th>{t('saison.cl.colEquipe')}</th>
                            <th>{t('saison.cl.colJoues')}</th>
                            <th>{t('saison.cl.colVictoires')}</th>
                            <th>{t('saison.cl.colNuls')}</th>
                            <th>{t('saison.cl.colDefaites')}</th>
                            <th>{t('saison.cl.colButsPour')}</th>
                            <th>{t('saison.cl.colButsContre')}</th>
                            <th>{t('saison.cl.colPoints')}</th>
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
                  <h3>{t('saison.cl.tableau', {
                    phase: clState.phase === 'quarter_final' ? t('saison.cl.phaseQuarts')
                      : clState.phase === 'semi_final' ? t('saison.cl.phaseDemis')
                      : t('saison.cl.phaseFinale'),
                  })}</h3>
                  {clState.knockout.nextMatch && (
                    <div className="cl-ko-matchup">
                      <span className="cl-ko-team">{team.name}</span>
                      <span className="cl-ko-vs">{t('saison.cl.versus')}</span>
                      <span className="cl-ko-team">{clState.knockout.nextMatch.opponent}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <button className="btn-back" onClick={() => setView('season')}>{t('commun.retour')}</button>
        </div>
      )}

      {/* Effectif d'une autre équipe. Rendu au niveau de l'écran et non dans un
          onglet : il s'ouvre depuis le classement comme depuis la fiche
          d'avant-match, et restait invisible tant qu'il vivait sous l'onglet
          Classement. */}
      {viewingTeam && (
        <div className="viewing-team-panel card" ref={panneauEquipeRef}>
          <div className="vt-header">
            <h3>{viewingTeam.name}</h3>
            <button className="btn-small" onClick={() => setViewingTeam(null)}>{t('commun.fermer')}</button>
          </div>

          {(() => {
            const starters = viewingPlayers.filter(p => p.is_starter);
            const stats = computeTeamStats(starters, t);
            if (!stats) return null;
            return (
              <div className="vt-stats">
                {stats.map(s => (
                  <div key={s.cle} className="vt-stat-bar">
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
              <h4>{t('saison.classement.titulaires')}</h4>
              {viewingPlayers.filter(p => p.is_starter).map(p => (
                <div key={p.id} className="vt-player">
                  <span className={`lp-pos ${posClass(p.position)}`}>{p.position}</span>
                  <span className="vt-name">{p.first_name} {p.last_name}</span>
                  <span className="vt-ovr">{p.overall}</span>
                </div>
              ))}
            </div>
            <div className="vt-section">
              <h4>{t('saison.classement.remplacants')}</h4>
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
  );
}
