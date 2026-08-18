import { useI18n } from '../i18n';
import './PlayerCard.css';

function getPositionClass(pos) {
  if (pos === 'GAR') return 'badge-gk';
  if (['DC', 'ARG', 'ARD', 'PG', 'PD'].includes(pos)) return 'badge-def';
  if (['MC', 'MOC', 'MDF', 'MG', 'MD'].includes(pos)) return 'badge-mid';
  return 'badge-att';
}

export default function PlayerCard({ player, actions }) {
  const { t } = useI18n();

  return (
    <div className={`player-card ${player.is_starter ? 'starter' : ''}`}>
      <div className="player-header">
        <span className={`badge ${getPositionClass(player.position)}`}>{player.position}</span>
        <span className="player-overall">{player.overall}</span>
      </div>
      <div className="player-name">{player.first_name} {player.last_name}</div>
      <div className="player-meta">
        <span>{t('joueur.age', { n: player.age })}</span>
        <span>{(player.value / 1000000).toFixed(1)}M€</span>
      </div>
      <div className="player-stats">
        <div className="stat"><span>{t('joueur.stats.pac')}</span><div className="stat-bar"><div style={{width: `${player.pace}%`}} /></div></div>
        <div className="stat"><span>{t('joueur.stats.tir')}</span><div className="stat-bar"><div style={{width: `${player.shooting}%`}} /></div></div>
        <div className="stat"><span>{t('joueur.stats.pas')}</span><div className="stat-bar"><div style={{width: `${player.passing}%`}} /></div></div>
        <div className="stat"><span>{t('joueur.stats.dri')}</span><div className="stat-bar"><div style={{width: `${player.dribbling}%`}} /></div></div>
        <div className="stat"><span>{t('joueur.stats.def')}</span><div className="stat-bar"><div style={{width: `${player.defending}%`}} /></div></div>
        <div className="stat"><span>{t('joueur.stats.phy')}</span><div className="stat-bar"><div style={{width: `${player.physical}%`}} /></div></div>
      </div>
      <div className="player-condition">
        <div className="condition-item">
          <span>{t('joueur.forme')}</span>
          <div className="stat-bar stamina"><div style={{width: `${player.stamina}%`}} /></div>
        </div>
        <div className="condition-item">
          <span>{t('joueur.moral')}</span>
          <div className="stat-bar morale"><div style={{width: `${player.morale}%`}} /></div>
        </div>
      </div>
      {actions && <div className="player-actions">{actions}</div>}
    </div>
  );
}
