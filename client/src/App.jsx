import { useState, useEffect } from 'react';
import './App.css';
import { api } from './api/client';
import MusicPlayer from './components/MusicPlayer';
import Login from './pages/Login';
import { KOFI_URL, DISCORD_URL } from './config';

import Draft from './pages/Draft';
import Season from './pages/Season';
import DreamTeam from './pages/DreamTeam';
import Players from './pages/Players';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useI18n } from './i18n';

function App() {
  const [manager, setManager] = useState(null);
  const [team, setTeam] = useState(null);
  const [phase, setPhase] = useState('login');
  const [seasonSummary, setSeasonSummary] = useState(null);
  const [showDreamTeam, setShowDreamTeam] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const saved = localStorage.getItem('footmanager_session');
    if (saved) {
      const { manager: m, team: t, phase: p } = JSON.parse(saved);
      setManager(m);
      setTeam(t);
      setPhase(p || 'play');
    }
  }, []);

  function save(m, t, p) {
    localStorage.setItem('footmanager_session', JSON.stringify({ manager: m, team: t, phase: p }));
  }

  function handleTeamCreated(m, t) {
    setManager(m);
    setTeam(t);
    setPhase('draft');
    save(m, t, 'draft');
  }

  function handleDraftFinish(updatedManager, updatedTeam) {
    setManager(updatedManager);
    setTeam(updatedTeam);
    setPhase('play');
    save(updatedManager, updatedTeam, 'play');
  }

  function handleTeamUpdate(updatedTeam) {
    setTeam(updatedTeam);
    save(manager, updatedTeam, phase);
  }

  function handleManagerUpdate(updatedManager) {
    setManager(updatedManager);
    save(updatedManager, team, phase);
  }

  function handleSeasonEnd(result) {
    setSeasonSummary({
      ...result.seasonSummary,
      promotion: result.promotion,
      relegation: result.relegation,
      newDivision: result.newDivision,
    });
    setManager(result.manager);
    setTeam(result.team);
    setPhase('mercato');
    save(result.manager, result.team, 'mercato');
  }

  /**
   * Ouverture du mercato d'hiver, signalée par le serveur à la mi-saison.
   * La saison reprend là où elle s'est arrêtée : rien n'est remis à zéro.
   */
  function handleWinterWindow(updatedManager, updatedTeam) {
    if (updatedManager) setManager(updatedManager);
    if (updatedTeam) setTeam(updatedTeam);
    setPhase('winter');
    save(updatedManager || manager, updatedTeam || team, 'winter');
  }

  function handleMercatoFinish(updatedManager, updatedTeam) {
    setManager(updatedManager);
    setTeam(updatedTeam);
    setPhase('play');
    setSeasonSummary(null);
    save(updatedManager, updatedTeam, 'play');
  }

  async function handleDreamTeamCareer(players) {
    const username = prompt(t('dialogues.pseudoCarriere'));
    if (!username || username.trim().length < 2) return;
    const teamName = prompt(t('dialogues.nomEquipe'));
    if (!teamName || teamName.trim().length < 2) return;
    try {
      const result = await api.dreamTeamStartCareer(username.trim(), teamName.trim(), players);
      setManager(result.manager);
      setTeam(result.team);
      setPhase('play');
      setShowDreamTeam(false);
      save(result.manager, result.team, 'play');
    } catch (e) {
      alert(t('dialogues.erreur') + (e.message || t('dialogues.erreurCarriere')));
    }
  }

  async function handleNewCareer() {
    if (!confirm(t('dialogues.confirmerNouvelleCarriere'))) return;
    if (manager) {
      try { await api.resetManager(manager.id); } catch {}
    }
    localStorage.removeItem('footmanager_session');
    setManager(null);
    setTeam(null);
    setPhase('login');
    setSeasonSummary(null);
  }

  async function handleLoadSave(saveData) {
    try {
      const regResult = await api.register(saveData.manager.username);
      const result = await api.importSave(regResult.id, saveData);
      setManager(result.manager);
      setTeam(result.team);
      setPhase('play');
      save(result.manager, result.team, 'play');
    } catch {
      alert(t('dialogues.erreurChargement'));
    }
  }

  async function handleExportSave() {
    if (!manager) return;
    try {
      const saveData = await api.exportSave(manager.id);
      const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `YTH_${team?.name || 'save'}_S${team?.season || 1}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }

  function handleImportSave() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const saveData = JSON.parse(text);
        if (!manager) return;
        const result = await api.importSave(manager.id, saveData);
        setManager(result.manager);
        setTeam(result.team);
        setPhase('play');
        save(result.manager, result.team, 'play');
        window.location.reload();
      } catch {
        alert(t('dialogues.sauvegardeInvalide'));
      }
    };
    input.click();
  }

  let content;

  if (showPlayers) {
    content = <Players onBack={() => setShowPlayers(false)} currentTeamId={team?.id} />;
  } else if (showDreamTeam) {
    content = <DreamTeam onBack={() => setShowDreamTeam(false)} onStartCareer={handleDreamTeamCareer} />;
  } else if (phase === 'login' || !manager) {
    content = (
      <Login
        onLogin={handleTeamCreated}
        onLoadSave={handleLoadSave}
        onDreamTeam={() => setShowDreamTeam(true)}
        onPlayers={() => setShowPlayers(true)}
      />
    );
  } else if (phase === 'draft' || phase === 'mercato' || phase === 'winter') {
    content = (
      <div className="app">
        <header className="top-bar">
          <div className="brand">
            <img className="brand-crest" src="/logo-192.png" alt="" width="40" height="40" />
            <div className="brand-text">
              <span className="brand-name">{team.name}</span>
              <span className="brand-sub">{phase === 'draft' ? t('bilan.draftInitial') : t('bilan.mercato')}</span>
            </div>
          </div>
          <div className="top-metrics">
            <div className="metric metric-gold">
              <span className="metric-label">{t('barre.budget')}</span>
              <span className="metric-value">{(manager.budget / 1000000).toFixed(1)}M€</span>
            </div>
          </div>
          <div className="top-actions">
            <a
              className="btn-discord-top"
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              title={t('barre.discordTitre')}
            >
              {t('barre.discord')}
            </a>
            <a
              className="btn-kofi-top"
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              title={t('barre.kofiTitre')}
            >
              {t('barre.soutenir')}
            </a>
            <button className="btn-new-career-top" onClick={handleNewCareer}>{t('barre.nouvelleCarriere')}</button>
          </div>
        </header>
        {seasonSummary && (
          <div className={`season-summary-banner ${seasonSummary.promotion ? 'promo' : ''} ${seasonSummary.relegation ? 'releg' : ''}`}>
            <h2>{t('bilan.titre', { saison: seasonSummary.season, division: seasonSummary.divisionName })}</h2>
            {seasonSummary.promotion && (
              <div className="promo-tag">{t('bilan.promotion', { division: seasonSummary.newDivision })}</div>
            )}
            {seasonSummary.relegation && (
              <div className="releg-tag">{t('bilan.relegation', { division: seasonSummary.newDivision })}</div>
            )}
            <div className="summary-stats">
              <span>#{seasonSummary.rank}</span>
              <span>{t('bilan.points', { n: seasonSummary.points })}</span>
              <span>{seasonSummary.wins}{t('commun.v')} {seasonSummary.draws}{t('commun.n')} {seasonSummary.losses}{t('commun.d')}</span>
              <span className="prize">
                {t('bilan.prime', { montant: (seasonSummary.prizePool / 1000000).toFixed(0) })}
              </span>
            </div>
          </div>
        )}
        <Draft
          manager={manager}
          team={team}
          onFinish={handleMercatoFinish}
          isInitialDraft={phase === 'draft'}
          isWinterWindow={phase === 'winter'}
        />
      </div>
    );
  } else {
    content = (
      <div className="app">
        <header className="top-bar">
          <div className="brand">
            <img className="brand-crest" src="/logo-192.png" alt="" width="40" height="40" />
            <div className="brand-text">
              <span className="brand-name">{team.name}</span>
              <span className="brand-sub">{t('barre.saison')} {team.season}</span>
            </div>
          </div>
          <div className="top-metrics">
            <div className="metric metric-gold">
              <span className="metric-label">{t('barre.budget')}</span>
              <span className="metric-value">{(manager.budget / 1000000).toFixed(1)}M€</span>
            </div>
            <div className="metric">
              <span className="metric-label">{t('barre.reputation')}</span>
              <span className="metric-value">{manager.reputation}</span>
            </div>
          </div>
          <div className="top-actions">
            <button className="icon-btn" title={t('barre.exporter')} onClick={handleExportSave}>💾</button>
            <button className="icon-btn" title={t('barre.importer')} onClick={handleImportSave}>📂</button>
            <button className="btn-players-top" onClick={() => setShowPlayers(true)}>{t('barre.managers')}</button>
            <button className="btn-dreamteam-top" onClick={() => setShowDreamTeam(true)}>{t('barre.dreamteam')}</button>
            <a
              className="btn-discord-top"
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              title={t('barre.discordTitre')}
            >
              {t('barre.discord')}
            </a>
            <a
              className="btn-kofi-top"
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              title={t('barre.kofiTitre')}
            >
              {t('barre.soutenir')}
            </a>
            <button className="btn-new-career-top" onClick={handleNewCareer}>{t('barre.nouvelleCarriere')}</button>
          </div>
        </header>
        <Season
          manager={manager}
          team={team}
          onUpdate={handleTeamUpdate}
          onManagerUpdate={handleManagerUpdate}
          onSeasonEnd={handleSeasonEnd}
          onWinterWindow={handleWinterWindow}
        />
      </div>
    );
  }

  return (
    <>
      {content}
      {/* Placé au niveau le plus haut : la mention suit tous les écrans,
          accueil comme partie en cours. */}
      <footer className="app-credits">
        {t('credits.musique')}{' '}
        <a href="https://arcod.xyz" target="_blank" rel="noopener noreferrer">
          Arcod.xyz
        </a>
      </footer>
      <LanguageSwitcher />
      <MusicPlayer />
    </>
  );
}

export default App;
