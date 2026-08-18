import { useI18n } from '../i18n';
import './Navbar.css';

export default function Navbar({ currentPage, onNavigate, manager, team, onNewCareer }) {
  const { t } = useI18n();

  const pages = [
    { id: 'squad', label: t('navigation.effectif'), icon: '👥' },
    { id: 'match', label: t('navigation.match'), icon: '⚽' },
    { id: 'transfers', label: t('navigation.transferts'), icon: '💰' },
    { id: 'leaderboard', label: t('navigation.classement'), icon: '🏆' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">⚽</span>
        <span className="navbar-title">YourTeamHistory</span>
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
          <button className="btn-new-career" onClick={onNewCareer}>{t('navigation.nouvelleCarriere')}</button>
        </div>
      )}
    </nav>
  );
}
