import { useState, useEffect } from 'react';
import { api } from '../api/client';
import PlayerCard from '../components/PlayerCard';
import { useI18n } from '../i18n';
import './Transfers.css';

export default function Transfers({ team, manager, onBudgetUpdate }) {
  const { t } = useI18n();
  const [market, setMarket] = useState([]);
  const [myPlayers, setMyPlayers] = useState([]);
  const [tab, setTab] = useState('buy');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [marketData, playersData] = await Promise.all([
        api.getMarket(),
        api.getPlayers(team.id)
      ]);
      setMarket(marketData);
      setMyPlayers(playersData);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy(playerId) {
    try {
      const result = await api.buyPlayer(playerId, team.id, manager.id);
      setMessage(t('transferts.recrute', {
        joueur: `${result.player.first_name} ${result.player.last_name}`,
        budget: `${(result.newBudget / 1000000).toFixed(1)}M€`,
      }));
      onBudgetUpdate(result.newBudget);
      await loadData();
    } catch (err) {
      setMessage(t('commun.erreur', { message: err.message }));
    }
    setTimeout(() => setMessage(''), 3000);
  }

  async function handleSell(playerId) {
    try {
      const result = await api.sellPlayer(playerId, manager.id);
      setMessage(t('transferts.vendu', {
        prix: `${(result.sellPrice / 1000000).toFixed(1)}M€`,
        budget: `${(result.newBudget / 1000000).toFixed(1)}M€`,
      }));
      onBudgetUpdate(result.newBudget);
      await loadData();
    } catch (err) {
      setMessage(t('commun.erreur', { message: err.message }));
    }
    setTimeout(() => setMessage(''), 3000);
  }

  if (loading) return <div className="page-loading">{t('commun.chargement')}</div>;

  return (
    <div className="transfers-page">
      <div className="transfers-header">
        <h2>{t('transferts.titre')}</h2>
        <span className="budget-display">
          {t('transferts.budget', { budget: `${(manager.budget / 1000000).toFixed(1)}M€` })}
        </span>
      </div>

      {message && <div className="transfer-message">{message}</div>}

      <div className="transfer-tabs">
        <button className={`tab ${tab === 'buy' ? 'active' : ''}`} onClick={() => setTab('buy')}>
          {t('transferts.ongletMarche', { n: market.length })}
        </button>
        <button className={`tab ${tab === 'sell' ? 'active' : ''}`} onClick={() => setTab('sell')}>
          {t('transferts.ongletVendre', { n: myPlayers.length })}
        </button>
      </div>

      {tab === 'buy' && (
        <div className="players-grid">
          {market.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              actions={
                <button
                  className="btn-small btn-primary"
                  onClick={() => handleBuy(player.id)}
                  disabled={manager.budget < player.value}
                >
                  {t('transferts.acheter', { prix: `${(player.value / 1000000).toFixed(1)}M€` })}
                </button>
              }
            />
          ))}
        </div>
      )}

      {tab === 'sell' && (
        <div className="players-grid">
          {myPlayers.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              actions={
                <button className="btn-small btn-danger" onClick={() => handleSell(player.id)}>
                  {t('transferts.vendre', { prix: `${(player.value * 0.8 / 1000000).toFixed(1)}M€` })}
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
