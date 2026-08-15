import './Navbar.css';

export default function Navbar({ currentPage, onNavigate, manager, team, onNewCareer }) {
  const pages = [
    { id: 'squad', label: 'Effectif', icon: '👥' },
    { id: 'match', label: 'Match', icon: '⚽' },
    { id: 'transfers', label: 'Transferts', icon: '💰' },
    { id: 'leaderboard', label: 'Classement', icon: '🏆' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">⚽</span>
        <span className="navbar-title">Foot Manager</span>
      </div>

      <div className="navbar-links">
        {pages.map(page => (
          <button
            key={page.id}
            className={`nav-link ${currentPage === page.id ? 'active' : ''}`}
            onClick={() => onNavigate(page.id)}
          >
            <span className="nav-icon">{page.icon}</span>
            {page.label}
          </button>
        ))}
      </div>

      {manager && (
        <div className="navbar-info">
          <span className="nav-budget">{(manager.budget / 1000000).toFixed(1)}M€</span>
          {team && <span className="nav-team">{team.name}</span>}
          <button className="btn-new-career" onClick={onNewCareer}>🔄 Nouvelle carrière</button>
        </div>
      )}
    </nav>
  );
}
