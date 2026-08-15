import './PlayerCard.css';

function getPositionClass(pos) {
  if (pos === 'GAR') return 'badge-gk';
  if (['DC', 'ARG', 'ARD', 'PG', 'PD'].includes(pos)) return 'badge-def';
  if (['MC', 'MOC', 'MDF', 'MG', 'MD'].includes(pos)) return 'badge-mid';
  return 'badge-att';
}

export default function PlayerCard({ player, actions }) {
  return (
    <div className={`player-card ${player.is_starter ? 'starter' : ''}`}>
      <div className="player-header">
        <span className={`badge ${getPositionClass(player.position)}`}>{player.position}</span>
        <span className="player-overall">{player.overall}</span>
      </div>
      <div className="player-name">{player.first_name} {player.last_name}</div>
      <div className="player-meta">
        <span>{player.age} ans</span>
        <span>{(player.value / 1000000).toFixed(1)}M€</span>
      </div>
      <div className="player-stats">
        <div className="stat"><span>PAC</span><div className="stat-bar"><div style={{width: `${player.pace}%`}} /></div></div>
        <div className="stat"><span>TIR</span><div className="stat-bar"><div style={{width: `${player.shooting}%`}} /></div></div>
        <div className="stat"><span>PAS</span><div className="stat-bar"><div style={{width: `${player.passing}%`}} /></div></div>
        <div className="stat"><span>DRI</span><div className="stat-bar"><div style={{width: `${player.dribbling}%`}} /></div></div>
        <div className="stat"><span>DEF</span><div className="stat-bar"><div style={{width: `${player.defending}%`}} /></div></div>
        <div className="stat"><span>PHY</span><div className="stat-bar"><div style={{width: `${player.physical}%`}} /></div></div>
      </div>
      <div className="player-condition">
        <div className="condition-item">
          <span>Forme</span>
          <div className="stat-bar stamina"><div style={{width: `${player.stamina}%`}} /></div>
        </div>
        <div className="condition-item">
          <span>Moral</span>
          <div className="stat-bar morale"><div style={{width: `${player.morale}%`}} /></div>
        </div>
      </div>
      {actions && <div className="player-actions">{actions}</div>}
    </div>
  );
}
