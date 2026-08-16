import { useState, useEffect } from 'react';
import { api } from '../api/client';
import PlayerCard from '../components/PlayerCard';
import { SQUAD_MAX, SQUAD_MIN_SELL, countByLine, RECOMMENDED } from '../data/rules';
import './Draft.css';

const formatMoney = (v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M€` : `${Math.round(v / 1000)}k€`;

export default function Draft({ manager, team, onFinish, isInitialDraft }) {
  const [available, setAvailable] = useState([]);
  // Effectif RÉEL en base : en mercato il contient déjà les joueurs de la
  // saison précédente, pas seulement les recrues de la session.
  const [squad, setSquad] = useState([]);
  const [recruits, setRecruits] = useState(0);
  const [budget, setBudget] = useState(manager.budget);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('market');
  const [squadSort, setSquadSort] = useState('position');

  useEffect(() => {
    loadDraft();
    loadSquad();
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

  async function loadSquad() {
    try {
      setSquad(await api.getPlayers(team.id));
    } catch {
      setSquad([]);
    }
  }

  async function handleBuy(player) {
    if (budget < player.value) {
      setMessage('Budget insuffisant !');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    if (squad.length >= SQUAD_MAX) {
      setMessage(`Effectif maximum atteint (${SQUAD_MAX} joueurs). Vendez avant de recruter.`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const result = await api.draftBuy(manager.id, team.id, player);
      setBudget(result.newBudget);
      setRecruits(n => n + 1);
      setAvailable(prev => prev.filter(p => p.id !== player.id));
      // On recharge depuis le serveur : les identifiants du marché ne sont pas
      // ceux créés en base, et il en faut de valides pour pouvoir revendre.
      await loadSquad();
      setMessage(`${player.first_name} ${player.last_name} recruté !`);
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage(`Erreur: ${err.message}`);
      setTimeout(() => setMessage(''), 3000);
    }
  }

  async function handleSell(player) {
    if (squad.length < SQUAD_MIN_SELL) {
      setMessage(`Effectif minimum de ${SQUAD_MIN_SELL} joueurs requis pour vendre (vous en avez ${squad.length})`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    const prix = Math.round((player.value || 0) * 0.8);
    if (!confirm(`Vendre ${player.first_name} ${player.last_name} pour ${formatMoney(prix)} ?`)) return;

    try {
      const result = await api.sellPlayer(player.id, manager.id);
      setBudget(result.newBudget);
      await loadSquad();
      setMessage(`${player.first_name} ${player.last_name} vendu pour ${formatMoney(result.sellPrice)}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`Erreur: ${err.message}`);
      setTimeout(() => setMessage(''), 3000);
    }
  }

  async function handleFinish() {
    if (isInitialDraft && squad.length < 11) {
      setMessage(`Il vous faut au minimum 11 joueurs ! (${squad.length}/11)`);
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

  // Compteurs basés sur l'effectif RÉEL, pour savoir ce qui manque vraiment.
  const posCount = countByLine(squad);

  const sortedSquad = [...squad].sort((a, b) => {
    if (squadSort === 'overall') return b.overall - a.overall;
    if (squadSort === 'value') return (b.value || 0) - (a.value || 0);
    if (squadSort === 'age') return a.age - b.age;
    if (squadSort === 'name') return a.last_name.localeCompare(b.last_name);
    const order = { GAR: 0, DC: 1, ARG: 2, ARD: 3, PG: 4, PD: 5, MDF: 6, MC: 7, MOC: 8, MG: 9, MD: 10, AIG: 11, AID: 12, BU: 13 };
    return (order[a.position] ?? 99) - (order[b.position] ?? 99) || b.overall - a.overall;
  });

  const squadValue = squad.reduce((s, p) => s + (p.value || 0), 0);
  const squadFull = squad.length >= SQUAD_MAX;

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
          <div className="draft-count">
            <span className={squad.length >= 11 ? 'count-ok' : 'count-need'}>
              {squad.length}{isInitialDraft ? '/11' : `/${SQUAD_MAX}`}
            </span>
            joueurs
          </div>
          {!isInitialDraft && recruits > 0 && (
            <div className="draft-count">
              <span className="count-ok">+{recruits}</span>
              recrue{recruits > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {message && <div className="draft-message">{message}</div>}

      {squadFull && (
        <div className="draft-alert">
          Effectif au maximum ({squad.length}/{SQUAD_MAX}) — vendez un joueur avant de pouvoir recruter.
        </div>
      )}

      <div className="draft-squad-summary">
        {['GAR', 'DEF', 'MIL', 'ATT'].map(line => {
          const manque = posCount[line] < RECOMMENDED[line];
          return (
            <span
              key={line}
              className={`pos-badge ${manque ? 'pos-badge-low' : 'pos-badge-ok'}`}
              title={manque
                ? `${posCount[line]} ${line} — il en est conseillé ${RECOMMENDED[line]} pour tenir une saison`
                : `${posCount[line]} ${line} — effectif suffisant`}
            >
              {line}: {posCount[line]}
              <i className="pos-badge-goal">/{RECOMMENDED[line]}</i>
            </span>
          );
        })}
        <button className="btn-refresh" onClick={refreshMarket}>🔄 Rafraîchir le marché</button>
        {(isInitialDraft ? squad.length >= 11 : true) && (
          <button className="btn-primary btn-finish" onClick={handleFinish}>
            {isInitialDraft ? '✅ Valider mon effectif' : '✅ Terminer le mercato'}
          </button>
        )}
      </div>

      <div className="draft-tabs">
        <button className={`draft-tab ${tab === 'market' ? 'active' : ''}`} onClick={() => setTab('market')}>
          Marché <span className="draft-tab-count">{available.length}</span>
        </button>
        <button className={`draft-tab ${tab === 'squad' ? 'active' : ''}`} onClick={() => setTab('squad')}>
          Mon effectif <span className="draft-tab-count">{squad.length}</span>
        </button>
      </div>

      {tab === 'market' && (
        <>
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
                        disabled={budget < player.value || squadFull}
                        title={squadFull ? `Effectif plein (${SQUAD_MAX} joueurs)` : undefined}
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
        </>
      )}

      {tab === 'squad' && (
        <>
          <div className="squad-toolbar">
            <span className="squad-toolbar-info">
              {squad.length} joueur{squad.length > 1 ? 's' : ''} · valeur totale {formatMoney(squadValue)}
            </span>
            <div className="squad-sort">
              {[
                { id: 'position', label: 'Poste' },
                { id: 'overall', label: 'Note' },
                { id: 'value', label: 'Valeur' },
                { id: 'age', label: 'Âge' },
                { id: 'name', label: 'Nom' },
              ].map(s => (
                <button
                  key={s.id}
                  className={`filter-btn ${squadSort === s.id ? 'active' : ''}`}
                  onClick={() => setSquadSort(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="draft-grid">
            {sortedSquad.map(player => {
              const canSell = squad.length >= SQUAD_MIN_SELL;
              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  actions={
                    <>
                      <span className="draft-price">{formatMoney(player.value || 0)}</span>
                      <button
                        className="btn-small btn-danger"
                        onClick={() => handleSell(player)}
                        disabled={!canSell}
                        title={canSell ? undefined : `Effectif minimum de ${SQUAD_MIN_SELL} joueurs requis pour vendre`}
                      >
                        Vendre ({formatMoney(Math.round((player.value || 0) * 0.8))})
                      </button>
                    </>
                  }
                />
              );
            })}
            {squad.length === 0 && <p className="no-data">Votre effectif est vide — recrutez dans l'onglet Marché.</p>}
          </div>
        </>
      )}
    </div>
  );
}
