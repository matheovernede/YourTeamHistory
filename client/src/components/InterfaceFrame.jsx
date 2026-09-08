import { useLayoutEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { DISCORD_URL } from '../config';

const STORAGE_KEY = 'yth_interface';

function initialInterface() {
  try { return localStorage.getItem(STORAGE_KEY) === 'classic' ? 'classic' : 'studio'; }
  catch { return 'studio'; }
}

function NavIcon({ type }) {
  const paths = {
    career: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    community: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

export default function InterfaceFrame({ children, section, team, manager, onNavigate }) {
  const { t } = useI18n();
  const [skin, setSkin] = useState(initialInterface);
  const studio = skin === 'studio';
  const landing = section === 'welcome';

  useLayoutEffect(() => {
    document.documentElement.dataset.interface = skin;
    const color = document.querySelector('meta[name="theme-color"]');
    if (color) color.content = studio ? '#f4f2ed' : '#2eb257';
    try { localStorage.setItem(STORAGE_KEY, skin); } catch { /* Le choix reste actif pour cette session. */ }
  }, [skin, studio]);

  return (
    <div className={`interface-frame ${studio ? 'studio-frame' : 'classic-frame'} ${landing ? 'is-landing' : ''}`}>
      {studio && !landing && <aside className="studio-sidebar">
        <a className="studio-brand" href="#main-content" aria-label="YourTeamHistory"><span className="studio-monogram">YTH<span>↗</span></span><span>YOUR TEAM<br /><b>HISTORY.</b></span></a>
        <div className="studio-sidebar-caption">{t('interface.workspace')}</div>
        <nav className="studio-primary-nav" aria-label={t('interface.navigation')}>
          {['career', 'community'].map(item => <button type="button" key={item}
            className={section === item || (item === 'career' && section === 'market') ? 'selected' : ''}
            aria-current={section === item || (item === 'career' && section === 'market') ? 'page' : undefined}
            onClick={() => onNavigate(item)}>
            <NavIcon type={item} /><span>{t(`interface.${item}`)}</span>
          </button>)}
        </nav>
        {section === 'career' && <div className="studio-sidebar-caption studio-club-caption">{t('interface.clubTools')}</div>}
        <div className="studio-sidebar-bottom">
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">{t('interface.communityLink')} <span>↗</span></a>
          <div className="studio-manager"><span className="studio-avatar">{(manager?.username || 'Y').slice(0, 2).toUpperCase()}</span><div><strong>{manager?.username || t('interface.visitor')}</strong><small>{team?.name || 'YourTeamHistory'}</small></div></div>
        </div>
      </aside>}
      <div className="interface-content">
        {studio && <header className="studio-topline">
          {landing ? <a className="studio-wordmark" href="#main-content">YOURTEAM<span>HISTORY</span><i>FC</i></a> : <div className="studio-breadcrumb">YOURTEAMHISTORY <span>/</span> <strong>{t(`interface.${section}`)}</strong></div>}
          <span className="studio-edition">{t('interface.edition')}</span>
        </header>}
        <button className="interface-switch" type="button" onClick={() => setSkin(studio ? 'classic' : 'studio')}
          title={t('interface.switchHint')}><span aria-hidden="true">◐</span>{t(studio ? 'interface.classic' : 'interface.new')}</button>
        <main id="main-content" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
