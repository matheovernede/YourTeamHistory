import { useState, useEffect } from 'react';
import './App.css';
import { api } from './api/client';
import Login from './pages/Login';
import Draft from './pages/Draft';
import Season from './pages/Season';

function App() {
  const [manager, setManager] = useState(null);
  const [team, setTeam] = useState(null);
  const [phase, setPhase] = useState('login');
  const [seasonSummary, setSeasonSummary] = useState(null);

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

  function handleMercatoFinish(updatedManager, updatedTeam) {
    setManager(updatedManager);
    setTeam(updatedTeam);
    setPhase('play');
    setSeasonSummary(null);
    save(updatedManager, updatedTeam, 'play');
  }

  async function handleNewCareer() {
    if (!confirm('Commencer une nouvelle carrière ? Votre progression sera perdue.')) return;
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
      alert('Erreur lors du chargement de la sauvegarde');
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
        alert('Fichier de sauvegarde invalide');
      }
    };
    input.click();
  }

  if (phase === 'login' || !manager) {
    return <Login onLogin={handleTeamCreated} onLoadSave={handleLoadSave} />;
  }

  if (phase === 'draft' || phase === 'mercato') {
    return (
      <div className="app">
        <div className="top-bar">
          <span className="top-title">⚽ {team.name}</span>
          <span className="top-budget">{(manager.budget / 1000000).toFixed(1)}M€</span>
          <button className="btn-new-career-top" onClick={handleNewCareer}>Nouvelle carrière</button>
        </div>
        {seasonSummary && (
          <div className={`season-summary-banner ${seasonSummary.promotion ? 'promo' : ''} ${seasonSummary.relegation ? 'releg' : ''}`}>
            <h2>Bilan Saison {seasonSummary.season} — {seasonSummary.divisionName}</h2>
            {seasonSummary.promotion && <div className="promo-tag">🎉 PROMOTION → {seasonSummary.newDivision}</div>}
            {seasonSummary.relegation && <div className="releg-tag">📉 Relégation → {seasonSummary.newDivision}</div>}
            <div className="summary-stats">
              <span>#{seasonSummary.rank}</span>
              <span>{seasonSummary.points} pts</span>
              <span>{seasonSummary.wins}V {seasonSummary.draws}N {seasonSummary.losses}D</span>
              <span className="prize">Prime: +{(seasonSummary.prizePool / 1000000).toFixed(0)}M€</span>
            </div>
          </div>
        )}
        <Draft manager={manager} team={team} onFinish={handleMercatoFinish} isInitialDraft={phase === 'draft'} />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="top-bar">
        <span className="top-title">⚽ {team.name}</span>
        <span className="top-season">Saison {team.season}</span>
        <span className="top-budget">{(manager.budget / 1000000).toFixed(1)}M€</span>
        <span className="top-rep">Rep: {manager.reputation}</span>
        <button className="btn-save-top" onClick={handleExportSave}>💾</button>
        <button className="btn-save-top" onClick={handleImportSave}>📂</button>
        <button className="btn-new-career-top" onClick={handleNewCareer}>Nouvelle carrière</button>
      </div>
      <Season
        manager={manager}
        team={team}
        onUpdate={handleTeamUpdate}
        onManagerUpdate={handleManagerUpdate}
        onSeasonEnd={handleSeasonEnd}
      />
    </div>
  );
}

export default App;
