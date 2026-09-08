import { useState, useEffect } from 'react';
import { api } from '../api/client';
import PlayerCard from '../components/PlayerCard';
import DealPanel from '../components/DealPanel';
import { SQUAD_MAX, SQUAD_MIN_SELL, countByLine, RECOMMENDED } from '../data/rules';
import { useI18n } from '../i18n';
import './Draft.css';

const formatMoney = (v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M€` : `${Math.round(v / 1000)}k€`;

export default function Draft({ manager, team, onFinish, onManagerUpdate, isInitialDraft, isWinterWindow }) {
  const { t } = useI18n();
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
  const [busy, setBusy] = useState(false);
  const [deal, setDeal] = useState(null);

  useEffect(() => {
    loadDraft();
    loadSquad();
  }, []);

  function updateBudget(value) {
    setBudget(value);
    onManagerUpdate?.({ ...manager, budget: value });
  }

  async function loadDraft() {
    try {
      const difficulty = localStorage.getItem('footmanager_difficulty') || 'normal';
      const [players, freshManager] = await Promise.all([api.getDraftPlayers(
        team.division || 1,
        manager.reputation || 50,
        team.id,
        difficulty,
        isWinterWindow ? 'winter' : undefined
      ), api.getManager(manager.id)]);
      setAvailable(players);
      updateBudget(freshManager.budget);
    } catch (err) {
      // Un marché indisponible doit être signalé, pas afficher une page vide.
      setAvailable([]);
      setMessage(t('mercato.marcheIndisponible', { message: err.message }));
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

  async function handleBuy(player, mode = 'buy') {
    if (busy) return;
    const price = mode === 'loan' ? player.loanFee : (player.agreedPrice ?? player.counterPrice ?? player.value);
    if (budget < price) {
      setMessage(t('mercato.budgetInsuffisant'));
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    if (squad.length >= SQUAD_MAX) {
      setMessage(t('mercato.effectifMaxAtteint', { max: SQUAD_MAX }));
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setBusy(true);
    try {
      const result = await api.draftBuy(manager.id, team.id, player, mode);
      updateBudget(result.newBudget);
      setRecruits(n => n + 1);
      setAvailable(prev => prev.filter(p => p.id !== player.id));
      setDeal(null);
      // On recharge depuis le serveur : les identifiants du marché ne sont pas
      // ceux créés en base, et il en faut de valides pour pouvoir revendre.
      await loadSquad();
      setMessage(mode === 'loan'
        ? t('deals.loanArrived', { player: `${player.first_name} ${player.last_name}`, season: player.loanEndSeason })
        : t('mercato.recrute', { joueur: `${player.first_name} ${player.last_name}` }));
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage(t('commun.erreur', { message: err.message }));
      setTimeout(() => setMessage(''), 3000);
    } finally { setBusy(false); }
  }

  async function handleOffer(player, amount) {
    if (busy) return;
    setBusy(true);
    try {
      const result = await api.draftNegotiate(manager.id, team.id, player.id, amount);
      setAvailable(prev => prev.map(p => p.id === player.id ? result : p));
      setMessage('');
    } catch (err) {
      setMessage(err.message);
    } finally { setBusy(false); }
  }

  function openDeal(player, mode) {
    if (!busy) setDeal({ id: player.id, mode });
  }

  async function handleSell(player) {
    if (busy) return;
    if (player.loan_end_season != null) {
      setMessage(t('deals.cannotSell'));
      return;
    }
    if (squad.length < SQUAD_MIN_SELL) {
      setMessage(t('mercato.minimumVente', { min: SQUAD_MIN_SELL, n: squad.length }));
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    const prix = Math.round((player.value || 0) * 0.8);
    const nom = `${player.first_name} ${player.last_name}`;
    if (!confirm(t('mercato.confirmerVente', { joueur: nom, prix: formatMoney(prix) }))) return;

    setBusy(true);
    try {
      const result = await api.sellPlayer(player.id, manager.id);
      updateBudget(result.newBudget);
      await loadSquad();
      setMessage(t('mercato.vendu', { joueur: nom, prix: formatMoney(result.sellPrice) }));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(t('commun.erreur', { message: err.message }));
      setTimeout(() => setMessage(''), 3000);
    } finally { setBusy(false); }
  }

  async function handleFinish() {
    if (busy) return;
    if (isInitialDraft && squad.length < 11) {
      setMessage(t('mercato.minimumOnze', { n: squad.length }));
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setBusy(true);
    try {
      const result = await api.draftFinish(manager.id, team.id, isWinterWindow ? 'winter' : undefined);
      onFinish(result.manager, result.team);
    } catch (err) {
      setMessage(t('commun.erreur', { message: err.message }));
      setTimeout(() => setMessage(''), 3000);
    } finally { setBusy(false); }
  }

  async function handleAutoSquad() {
    if (busy) return;
    setDeal(null);
    setLoading(true);
    try {
      const difficulty = localStorage.getItem('footmanager_difficulty') || 'normal';
      const result = await api.draftAuto(manager.id, team.id, difficulty);

      updateBudget(result.newBudget);
      setRecruits(r => r + result.recruited);
      await loadSquad();
      // Le marché doit être retiré des joueurs qu'on vient de signer.
      await loadDraft();

      setMessage(
        result.recruited > 0
          ? t('mercato.autoResultat', { n: result.recruited, montant: formatMoney(result.spent || 0) })
          : t('mercato.autoRien')
      );
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage(t('commun.erreur', { message: err.message }));
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  }

  function refreshMarket() {
    if (busy) return;
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

  const squadValue = squad.reduce((s, p) => s + (p.loan_end_season != null ? 0 : (p.value || 0)), 0);
  const loanCount = squad.filter(p => p.loan_end_season != null).length;
  const squadFull = squad.length >= SQUAD_MAX;

  if (loading) return <div className="page-loading">{t('mercato.chargement')}</div>;

  return (
    <div className="draft-page">
      <div className="draft-header">
        <div className="draft-title">
          <h1>
            {isWinterWindow
              ? t('mercato.titreHiver')
              : isInitialDraft ? t('mercato.titreInitial') : t('mercato.titre')}
          </h1>
          <p>
            {isWinterWindow
              ? t('mercato.sousTitreHiver')
              : isInitialDraft ? t('mercato.sousTitreInitial') : t('mercato.sousTitre')}
          </p>
        </div>
        <div className="draft-status">
          <div className="draft-budget">{(budget / 1000000).toFixed(1)}M€</div>
          <div className="draft-count">
            <span className={squad.length >= 11 ? 'count-ok' : 'count-need'}>
              {squad.length}{isInitialDraft ? '/11' : `/${SQUAD_MAX}`}
            </span>
            {t('mercato.joueurs')}
          </div>
          {!isInitialDraft && recruits > 0 && (
            <div className="draft-count">
              <span className="count-ok">+{recruits}</span>
              {recruits > 1 ? t('mercato.recrues') : t('mercato.recrue')}
            </div>
          )}
        </div>
      </div>

      {message && <div className="draft-message" role="status">{message}</div>}
      <div className="market-explainer">
        <p>{t('deals.overview', { n: loanCount })}</p>
        <small>{t('deals.stableMarket')}</small>
      </div>

      {squadFull && (
        <div className="draft-alert">
          {t('mercato.alerteEffectifPlein', { n: squad.length, max: SQUAD_MAX })}
        </div>
      )}

      <div className="draft-squad-summary">
        {['GAR', 'DEF', 'MIL', 'ATT'].map(line => {
          const manque = posCount[line] < RECOMMENDED[line];
          // `line` reste la clé technique ; le libellé affiché est traduit.
          const libelle = t(`lignes.${line}`);
          return (
            <span
              key={line}
              className={`pos-badge ${manque ? 'pos-badge-low' : 'pos-badge-ok'}`}
              title={manque
                ? t('mercato.ligneManque', { n: posCount[line], ligne: libelle, conseille: RECOMMENDED[line] })
                : t('mercato.ligneOk', { n: posCount[line], ligne: libelle })}
            >
              {libelle}: {posCount[line]}
              <i className="pos-badge-goal">/{RECOMMENDED[line]}</i>
            </span>
          );
        })}
        {/* Composer une équipe en un clic : c'est devant l'écran de recrutement
            que la plupart des nouveaux venus abandonnaient. */}
        <button className="btn-auto-squad" onClick={handleAutoSquad} disabled={loading || busy}>
          {t('mercato.autoComposer')}
        </button>
        <button className="btn-refresh" onClick={refreshMarket} disabled={busy}>{t('mercato.rafraichir')}</button>
        {(isInitialDraft ? squad.length >= 11 : true) && (
          <button className="btn-primary btn-finish" onClick={handleFinish} disabled={busy}>
            {isWinterWindow
              ? t('mercato.reprendreSaison')
              : isInitialDraft ? t('mercato.validerEffectif') : t('mercato.terminerMercato')}
          </button>
        )}
      </div>

      <div className="draft-tabs">
        <button className={`draft-tab ${tab === 'market' ? 'active' : ''}`} onClick={() => setTab('market')}>
          {t('mercato.ongletMarche')} <span className="draft-tab-count">{available.length}</span>
        </button>
        <button className={`draft-tab ${tab === 'squad' ? 'active' : ''}`} onClick={() => setTab('squad')}>
          {t('mercato.ongletEffectif')} <span className="draft-tab-count">{squad.length}</span>
        </button>
      </div>

      {tab === 'market' && (
        <>
          <div className="draft-filters">
            {[
              { id: 'all', label: t('mercato.filtreTous') },
              { id: 'gk', label: t('mercato.filtreGardiens') },
              { id: 'def', label: t('mercato.filtreDefenseurs') },
              { id: 'mid', label: t('mercato.filtreMilieux') },
              { id: 'att', label: t('mercato.filtreAttaquants') },
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
              <div key={player.id} className={`market-player ${player.tier === 'legend' ? 'legend-wrapper' : ''}`}>
                <PlayerCard
                  player={player}
                  actions={
                    <div className="market-actions">
                      <span className={`draft-price ${player.tier === 'legend' ? 'legend-price' : ''}`}>{formatMoney(player.agreedPrice ?? player.counterPrice ?? player.value)}</span>
                      <span className={`draft-tier ${player.tier === 'legend' ? 'tier-legend' : ''}`}>{player.tier === 'legend' ? t('mercato.legende') : player.tier}</span>
                      <button
                        className={`btn-small ${player.tier === 'legend' ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => handleBuy(player)}
                        disabled={busy || budget < (player.agreedPrice ?? player.counterPrice ?? player.value) || squadFull}
                        title={squadFull ? t('mercato.effectifPlein', { max: SQUAD_MAX }) : undefined}
                      >
                        {t('mercato.recruter')}
                      </button>
                      <button className="btn-small btn-ghost" disabled={busy || squadFull} onClick={() => openDeal(player, 'buy')}
                        aria-expanded={deal?.id === player.id && deal.mode === 'buy'}>{t('deals.negotiate')}</button>
                      {player.loanFee != null && <button className="btn-small btn-secondary"
                        disabled={busy || squadFull || loanCount >= 3 || budget < player.loanFee}
                        onClick={() => openDeal(player, 'loan')} aria-expanded={deal?.id === player.id && deal.mode === 'loan'}>
                        {t('deals.loanButton', { price: formatMoney(player.loanFee) })}
                      </button>}
                      {deal?.id === player.id && <DealPanel key={`${player.id}-${deal.mode}`} player={player} mode={deal.mode} budget={budget}
                        busy={busy} onOffer={handleOffer} onSign={handleBuy} onClose={() => setDeal(null)} />}
                    </div>
                  }
                />
              </div>
            ))}
            {filtered.length === 0 && <p className="no-data">{t('mercato.aucunJoueur')}</p>}
          </div>
        </>
      )}

      {tab === 'squad' && (
        <>
          <div className="squad-toolbar">
            <span className="squad-toolbar-info">
              {t(squad.length > 1 ? 'mercato.resumePlusieurs' : 'mercato.resumeUn', {
                n: squad.length,
                valeur: formatMoney(squadValue),
              })}
            </span>
            <div className="squad-sort">
              {[
                { id: 'position', label: t('mercato.triPoste') },
                { id: 'overall', label: t('mercato.triNote') },
                { id: 'value', label: t('mercato.triValeur') },
                { id: 'age', label: t('mercato.triAge') },
                { id: 'name', label: t('mercato.triNom') },
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
              const canSell = squad.length >= SQUAD_MIN_SELL && player.loan_end_season == null;
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
                        disabled={busy || !canSell}
                        title={player.loan_end_season != null ? t('deals.cannotSell') : canSell ? undefined : t('mercato.minimumVenteCourt', { min: SQUAD_MIN_SELL })}
                      >
                        {t('mercato.vendre', { prix: formatMoney(Math.round((player.value || 0) * 0.8)) })}
                      </button>
                    </>
                  }
                />
              );
            })}
            {squad.length === 0 && <p className="no-data">{t('mercato.effectifVide')}</p>}
          </div>
        </>
      )}
    </div>
  );
}
