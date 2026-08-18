import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { useI18n } from '../i18n';
import './DreamTeam.css';

const POSITIONS = ['GAR', 'DC', 'ARG', 'ARD', 'MC', 'MOC', 'MDF', 'AIG', 'AID', 'BU'];
const LEAGUES = ['Ligue 1', 'Ligue 2', 'Premier League', 'La Liga', 'Bundesliga'];

const FORMATIONS = {
  '4-3-3': { slots: ['GAR', 'ARG', 'DC', 'DC', 'ARD', 'MC', 'MC', 'MC', 'AIG', 'BU', 'AID'] },
  '4-4-2': { slots: ['GAR', 'ARG', 'DC', 'DC', 'ARD', 'AIG', 'MC', 'MC', 'AID', 'BU', 'BU'] },
  '4-2-3-1': { slots: ['GAR', 'ARG', 'DC', 'DC', 'ARD', 'MDF', 'MDF', 'AIG', 'MOC', 'AID', 'BU'] },
  '3-5-2': { slots: ['GAR', 'DC', 'DC', 'DC', 'ARG', 'MC', 'MC', 'ARD', 'MOC', 'BU', 'BU'] },
  '4-1-4-1': { slots: ['GAR', 'ARG', 'DC', 'DC', 'ARD', 'MDF', 'AIG', 'MC', 'MC', 'AID', 'BU'] },
};

// Le nom complet du poste est traduit (dreamteam.postes.*) ; le code du poste
// (GAR, DC, MC…) reste tel quel, c'est un identifiant partagé avec le serveur.

export default function DreamTeam({ onBack, onStartCareer }) {
  const { t } = useI18n();
  const [allPlayers, setAllPlayers] = useState([]);
  const [filterLeague, setFilterLeague] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [search, setSearch] = useState('');
  const [formation, setFormation] = useState('4-3-3');
  const [team, setTeam] = useState(() => {
    const saved = localStorage.getItem('dreamteam_team');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });
  const [bench, setBench] = useState(() => {
    const saved = localStorage.getItem('dreamteam_bench');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  // Gameplay state
  const [playMode, setPlayMode] = useState(null); // null | 'friendly' | 'cl'
  const [friendlyDifficulty, setFriendlyDifficulty] = useState(null);
  const [friendlyResult, setFriendlyResult] = useState(null);
  const [friendlyLoading, setFriendlyLoading] = useState(false);
  const [clBracket, setClBracket] = useState(null);
  const [clRound, setClRound] = useState(null); // 'quarter' | 'semi' | 'final'
  const [clMatches, setClMatches] = useState([]); // array of match results per round
  const [clCurrentMatch, setClCurrentMatch] = useState(null);
  const [clLoading, setClLoading] = useState(false);
  const [clFinished, setClFinished] = useState(false);

  useEffect(() => {
    api.getDreamTeamPlayers().then(setAllPlayers).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('dreamteam_team', JSON.stringify(team));
    localStorage.setItem('dreamteam_bench', JSON.stringify(bench));
  }, [team, bench]);

  const filteredPlayers = useMemo(() => {
    let list = allPlayers;
    if (filterLeague) list = list.filter(p => p.league === filterLeague);
    if (filterPosition) list = list.filter(p => p.position === filterPosition);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p =>
        p.last_name.toLowerCase().includes(s) ||
        p.first_name.toLowerCase().includes(s) ||
        p.club.toLowerCase().includes(s)
      );
    }
    return list.sort((a, b) => b.overall - a.overall);
  }, [allPlayers, filterLeague, filterPosition, search]);

  const teamIds = useMemo(() => new Set([...team.map(p => p.id), ...bench.map(p => p.id)]), [team, bench]);

  const formationSlots = FORMATIONS[formation].slots;

  function addToTeam(player) {
    if (teamIds.has(player.id)) return;
    if (team.length < 11) {
      setTeam([...team, player]);
    } else if (bench.length < 7) {
      setBench([...bench, player]);
    }
  }

  function removeFromTeam(playerId) {
    setTeam(team.filter(p => p.id !== playerId));
    setBench(bench.filter(p => p.id !== playerId));
  }

  function resetTeam() {
    if (!confirm(t('dreamteam.confirmerReset'))) return;
    setTeam([]);
    setBench([]);
  }

  const teamOverall = team.length > 0
    ? Math.round(team.reduce((sum, p) => sum + p.overall, 0) / team.length)
    : 0;

  const canPlay = team.length >= 11;

  // ======================== Friendly Match ========================
  async function playFriendly(difficulty) {
    setFriendlyDifficulty(difficulty);
    setFriendlyLoading(true);
    setFriendlyResult(null);
    try {
      const result = await api.dreamTeamFriendly(team, difficulty);
      setFriendlyResult(result);
    } catch (e) {
      setFriendlyResult({ error: e.message });
    }
    setFriendlyLoading(false);
  }

  function resetFriendly() {
    setPlayMode(null);
    setFriendlyDifficulty(null);
    setFriendlyResult(null);
  }

  // ======================== Champions League ========================
  async function startCL() {
    setClLoading(true);
    setClFinished(false);
    setClMatches([]);
    setClCurrentMatch(null);
    try {
      const draw = await api.dreamTeamCLDraw();
      // Build bracket: 8 teams (user + 7 AI), QF pairings
      const userTeam = { name: 'DreamTeam', overall: teamOverall, players: team };
      const allTeams = [userTeam, ...draw.teams];
      // Shuffle for bracket fairness
      const shuffled = allTeams.sort(() => Math.random() - 0.5);
      const qfPairings = [
        { home: shuffled[0], away: shuffled[1] },
        { home: shuffled[2], away: shuffled[3] },
        { home: shuffled[4], away: shuffled[5] },
        { home: shuffled[6], away: shuffled[7] },
      ];
      setClBracket({ quarter: qfPairings, semi: [], final: [], results: [] });
      setClRound('quarter');
    } catch (e) {
      alert(t('commun.erreur', { message: e.message }));
    }
    setClLoading(false);
  }

  async function playCLMatch(pairing) {
    setClLoading(true);
    setClCurrentMatch(null);

    const isUserHome = pairing.home.name === 'DreamTeam';
    const isUserAway = pairing.away.name === 'DreamTeam';

    let result;
    if (isUserHome || isUserAway) {
      // User plays this match
      const userPlayers = team;
      const opponentPlayers = isUserHome ? pairing.away.players : pairing.home.players;
      try {
        const res = await api.dreamTeamCLMatch(userPlayers, opponentPlayers);
        result = {
          ...pairing,
          homeGoals: res.homeGoals,
          awayGoals: res.awayGoals,
          events: res.events,
          played: true,
        };
      } catch (e) {
        setClLoading(false);
        alert(t('commun.erreur', { message: e.message }));
        return null;
      }
    } else {
      // AI vs AI: simulate using cl-match with both AI player arrays
      try {
        const res = await api.dreamTeamCLMatch(pairing.home.players, pairing.away.players);
        result = {
          ...pairing,
          homeGoals: res.homeGoals,
          awayGoals: res.awayGoals,
          events: res.events,
          played: true,
        };
      } catch (e) {
        setClLoading(false);
        alert(t('commun.erreur', { message: e.message }));
        return null;
      }
    }

    setClCurrentMatch(result);
    setClLoading(false);
    return result;
  }

  async function playCurrentRound() {
    if (!clBracket || !clRound) return;

    const pairings = clRound === 'quarter' ? clBracket.quarter :
                     clRound === 'semi' ? clBracket.semi : clBracket.final;

    const roundResults = [];
    for (const pairing of pairings) {
      const result = await playCLMatch(pairing);
      if (!result) return;
      roundResults.push(result);
      // Small delay for UX
      await new Promise(r => setTimeout(r, 500));
    }

    setClMatches(prev => [...prev, { round: clRound, results: roundResults }]);

    // Determine winners and advance
    const winners = roundResults.map(r => {
      if (r.homeGoals > r.awayGoals) return r.home;
      if (r.awayGoals > r.homeGoals) return r.away;
      // Draw: random penalty winner
      return Math.random() < 0.5 ? r.home : r.away;
    });

    if (clRound === 'quarter') {
      // Advance to semis
      const semiPairings = [
        { home: winners[0], away: winners[1] },
        { home: winners[2], away: winners[3] },
      ];
      setClBracket(prev => ({ ...prev, semi: semiPairings, results: [...prev.results, ...roundResults] }));
      setClRound('semi');
    } else if (clRound === 'semi') {
      // Advance to final
      const finalPairing = [{ home: winners[0], away: winners[1] }];
      setClBracket(prev => ({ ...prev, final: finalPairing, results: [...prev.results, ...roundResults] }));
      setClRound('final');
    } else {
      // Final done
      setClBracket(prev => ({ ...prev, winner: winners[0], results: [...prev.results, ...roundResults] }));
      setClFinished(true);
      setClRound(null);
    }
    setClCurrentMatch(null);
  }

  function resetCL() {
    setPlayMode(null);
    setClBracket(null);
    setClRound(null);
    setClMatches([]);
    setClCurrentMatch(null);
    setClFinished(false);
  }

  // ======================== Render ========================
  return (
    <div className="dreamteam-page">
      <div className="dreamteam-header">
        <button className="dt-back-btn" onClick={onBack}>{t('dreamteam.retour')}</button>
        <h1>DreamTeam</h1>
        <div className="dt-overall-badge">
          {team.length > 0 && <span>OVR: <strong>{teamOverall}</strong></span>}
          <span className="dt-count">{team.length}/11 + {bench.length}/7</span>
        </div>
        <button className="dt-reset-btn" onClick={resetTeam}>Reset</button>
      </div>

      <div className="dreamteam-content">
        {/* LEFT PANEL - player list */}
        <div className="dt-left-panel">
          <div className="dt-filters">
            <input
              type="text"
              placeholder={t('dreamteam.rechercher')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="dt-search"
            />
            <select value={filterLeague} onChange={e => setFilterLeague(e.target.value)}>
              <option value="">{t('dreamteam.toutesLigues')}</option>
              {LEAGUES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)}>
              <option value="">{t('dreamteam.tousPostes')}</option>
              {POSITIONS.map(p => <option key={p} value={p}>{p} - {t(`dreamteam.postes.${p}`)}</option>)}
            </select>
          </div>

          <div className="dt-player-list">
            {filteredPlayers.map(player => (
              <div
                key={player.id}
                className={`dt-player-card ${teamIds.has(player.id) ? 'selected' : ''}`}
                onClick={() => addToTeam(player)}
              >
                <div className="dt-player-ovr">{player.overall}</div>
                <div className="dt-player-info">
                  <span className="dt-player-name">{player.first_name} {player.last_name}</span>
                  <span className="dt-player-details">{player.position} | {player.club}</span>
                </div>
                <div className="dt-player-stats">
                  <span>{t('dreamteam.stats.vit')} {player.pace}</span>
                  <span>{t('dreamteam.stats.tir')} {player.shooting}</span>
                  <span>{t('dreamteam.stats.pas')} {player.passing}</span>
                  <span>{t('dreamteam.stats.dri')} {player.dribbling}</span>
                  <span>{t('dreamteam.stats.def')} {player.defending}</span>
                  <span>{t('dreamteam.stats.phy')} {player.physical}</span>
                </div>
              </div>
            ))}
            {filteredPlayers.length === 0 && (
              <div className="dt-no-results">{t('dreamteam.aucunJoueur')}</div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - team */}
        <div className="dt-right-panel">
          <div className="dt-formation-select">
            <label>{t('dreamteam.formation')}</label>
            <select value={formation} onChange={e => setFormation(e.target.value)}>
              {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="dt-team-grid">
            <h3>{t('dreamteam.titulaires')}</h3>
            <div className="dt-slots">
              {formationSlots.map((slot, idx) => {
                const player = team[idx];
                return (
                  <div key={idx} className={`dt-slot ${player ? 'filled' : ''}`}>
                    <span className="dt-slot-pos">{slot}</span>
                    {player ? (
                      <div className="dt-slot-player" onClick={() => removeFromTeam(player.id)}>
                        <span className="dt-slot-ovr">{player.overall}</span>
                        <span className="dt-slot-name">{player.last_name}</span>
                      </div>
                    ) : (
                      <span className="dt-slot-empty">---</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dt-bench-grid">
            <h3>{t('dreamteam.remplacants', { n: bench.length })}</h3>
            <div className="dt-bench-slots">
              {bench.map(player => (
                <div key={player.id} className="dt-bench-player" onClick={() => removeFromTeam(player.id)}>
                  <span className="dt-bench-ovr">{player.overall}</span>
                  <span className="dt-bench-name">{player.last_name}</span>
                  <span className="dt-bench-pos">{player.position}</span>
                </div>
              ))}
              {bench.length < 7 && (
                <div className="dt-bench-empty">{t('dreamteam.ajouter')}</div>
              )}
            </div>
          </div>

          {team.length > 0 && (
            <div className="dt-team-stats">
              <h3>{t('dreamteam.statsMoyennes')}</h3>
              <div className="dt-stats-row">
                <span>{t('dreamteam.stats.vit')}: {Math.round(team.reduce((s, p) => s + p.pace, 0) / team.length)}</span>
                <span>{t('dreamteam.stats.tir')}: {Math.round(team.reduce((s, p) => s + p.shooting, 0) / team.length)}</span>
                <span>{t('dreamteam.stats.pas')}: {Math.round(team.reduce((s, p) => s + p.passing, 0) / team.length)}</span>
                <span>{t('dreamteam.stats.dri')}: {Math.round(team.reduce((s, p) => s + p.dribbling, 0) / team.length)}</span>
                <span>{t('dreamteam.stats.def')}: {Math.round(team.reduce((s, p) => s + p.defending, 0) / team.length)}</span>
                <span>{t('dreamteam.stats.phy')}: {Math.round(team.reduce((s, p) => s + p.physical, 0) / team.length)}</span>
              </div>
            </div>
          )}

          {/* ==================== PLAY SECTION ==================== */}
          {canPlay && !playMode && (
            <div className="dt-play-section">
              <h3>{t('dreamteam.jouer')}</h3>
              <div className="dt-play-buttons">
                <button className="dt-play-btn dt-play-career" onClick={() => onStartCareer && onStartCareer([...team, ...bench])}>
                  {t('dreamteam.carriere')}
                </button>
                <button className="dt-play-btn dt-play-friendly" onClick={() => setPlayMode('friendly')}>
                  {t('dreamteam.amical')}
                </button>
                <button className="dt-play-btn dt-play-cl" onClick={() => setPlayMode('cl')}>
                  {t('dreamteam.championsLeague')}
                </button>
              </div>
            </div>
          )}

          {/* ==================== FRIENDLY MATCH ==================== */}
          {playMode === 'friendly' && (
            <div className="dt-play-section">
              <h3>{t('dreamteam.amical')}</h3>
              {!friendlyResult && !friendlyLoading && (
                <div className="dt-friendly-picker">
                  <p>{t('dreamteam.choisirDifficulte')}</p>
                  <div className="dt-difficulty-buttons">
                    <button className="dt-diff-btn dt-diff-weak" onClick={() => playFriendly('weak')}>{t('dreamteam.diffFaible')}</button>
                    <button className="dt-diff-btn dt-diff-medium" onClick={() => playFriendly('medium')}>{t('dreamteam.diffMoyen')}</button>
                    <button className="dt-diff-btn dt-diff-strong" onClick={() => playFriendly('strong')}>{t('dreamteam.diffFort')}</button>
                    <button className="dt-diff-btn dt-diff-legend" onClick={() => playFriendly('legend')}>{t('dreamteam.diffLegende')}</button>
                  </div>
                  <button className="dt-back-link" onClick={() => setPlayMode(null)}>{t('dreamteam.retour')}</button>
                </div>
              )}
              {friendlyLoading && (
                <div className="dt-loading">{t('dreamteam.simulation')}</div>
              )}
              {friendlyResult && !friendlyResult.error && (
                <div className="dt-match-result">
                  <div className="dt-result-score">
                    <span className="dt-result-team">DreamTeam</span>
                    <span className="dt-result-goals">{friendlyResult.homeGoals} - {friendlyResult.awayGoals}</span>
                    <span className="dt-result-team">{friendlyResult.opponentName}</span>
                  </div>
                  <div className="dt-result-verdict">
                    {friendlyResult.homeGoals > friendlyResult.awayGoals ? t('dreamteam.victoire') :
                     friendlyResult.homeGoals < friendlyResult.awayGoals ? t('dreamteam.defaite') : t('dreamteam.nul')}
                  </div>
                  {friendlyResult.events && friendlyResult.events.length > 0 && (
                    <div className="dt-match-events">
                      {friendlyResult.events.filter(e => e.type === 'goal').map((e, i) => (
                        <div key={i} className="dt-event">
                          <span className="dt-event-minute">{e.minute}'</span>
                          <span className="dt-event-icon">&#9917;</span>
                          <span className="dt-event-player">{e.player}</span>
                          <span className="dt-event-team">({e.team === 'home' ? 'DreamTeam' : friendlyResult.opponentName})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="dt-play-btn" onClick={resetFriendly}>{t('dreamteam.retour')}</button>
                </div>
              )}
              {friendlyResult && friendlyResult.error && (
                <div className="dt-error">
                  <p>{t('commun.erreur', { message: friendlyResult.error })}</p>
                  <button className="dt-play-btn" onClick={resetFriendly}>{t('dreamteam.retour')}</button>
                </div>
              )}
            </div>
          )}

          {/* ==================== CHAMPIONS LEAGUE ==================== */}
          {playMode === 'cl' && (
            <div className="dt-play-section dt-cl-section">
              <h3>{t('dreamteam.championsLeague')}</h3>

              {!clBracket && !clLoading && (
                <div className="dt-cl-start">
                  <p>{t('dreamteam.clPresentation')}</p>
                  <button className="dt-play-btn dt-play-cl" onClick={startCL}>{t('dreamteam.clTirage')}</button>
                  <button className="dt-back-link" onClick={() => setPlayMode(null)}>{t('dreamteam.retour')}</button>
                </div>
              )}

              {clLoading && (
                <div className="dt-loading">{t('dreamteam.simulation')}</div>
              )}

              {clBracket && !clFinished && (
                <div className="dt-cl-bracket">
                  {/* Show bracket overview */}
                  <div className="dt-cl-rounds">
                    {/* Quarter-finals */}
                    <div className="dt-cl-round-col">
                      <h4>{t('dreamteam.clQuarts')}</h4>
                      {clBracket.quarter.map((p, i) => {
                        const played = clBracket.results.find(r => r.home.name === p.home.name && r.away.name === p.away.name);
                        return (
                          <div key={i} className={`dt-cl-pairing ${played ? 'played' : ''}`}>
                            <span className={`dt-cl-team-name ${played && played.homeGoals > played.awayGoals ? 'winner' : ''}`}>
                              {p.home.name} {played ? played.homeGoals : ''}
                            </span>
                            <span className="dt-cl-vs">vs</span>
                            <span className={`dt-cl-team-name ${played && played.awayGoals > played.homeGoals ? 'winner' : ''}`}>
                              {p.away.name} {played ? played.awayGoals : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Semi-finals */}
                    {clBracket.semi.length > 0 && (
                      <div className="dt-cl-round-col">
                        <h4>{t('dreamteam.clDemis')}</h4>
                        {clBracket.semi.map((p, i) => {
                          const played = clBracket.results.find(r => r.home.name === p.home.name && r.away.name === p.away.name);
                          return (
                            <div key={i} className={`dt-cl-pairing ${played ? 'played' : ''}`}>
                              <span className={`dt-cl-team-name ${played && played.homeGoals > played.awayGoals ? 'winner' : ''}`}>
                                {p.home.name} {played ? played.homeGoals : ''}
                              </span>
                              <span className="dt-cl-vs">vs</span>
                              <span className={`dt-cl-team-name ${played && played.awayGoals > played.homeGoals ? 'winner' : ''}`}>
                                {p.away.name} {played ? played.awayGoals : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Final */}
                    {clBracket.final.length > 0 && (
                      <div className="dt-cl-round-col">
                        <h4>{t('dreamteam.clFinale')}</h4>
                        {clBracket.final.map((p, i) => {
                          const played = clBracket.results.find(r => r.home.name === p.home.name && r.away.name === p.away.name);
                          return (
                            <div key={i} className={`dt-cl-pairing ${played ? 'played' : ''}`}>
                              <span className={`dt-cl-team-name ${played && played.homeGoals > played.awayGoals ? 'winner' : ''}`}>
                                {p.home.name} {played ? played.homeGoals : ''}
                              </span>
                              <span className="dt-cl-vs">vs</span>
                              <span className={`dt-cl-team-name ${played && played.awayGoals > played.homeGoals ? 'winner' : ''}`}>
                                {p.away.name} {played ? played.awayGoals : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Current match result */}
                  {clCurrentMatch && (
                    <div className="dt-match-result dt-cl-match-result">
                      <div className="dt-result-score">
                        <span className="dt-result-team">{clCurrentMatch.home.name}</span>
                        <span className="dt-result-goals">{clCurrentMatch.homeGoals} - {clCurrentMatch.awayGoals}</span>
                        <span className="dt-result-team">{clCurrentMatch.away.name}</span>
                      </div>
                    </div>
                  )}

                  {/* Play round button */}
                  {clRound && !clLoading && (
                    <button className="dt-play-btn dt-play-cl" onClick={playCurrentRound}>
                      {clRound === 'quarter' ? t('dreamteam.clJouerQuarts')
                        : clRound === 'semi' ? t('dreamteam.clJouerDemis')
                        : t('dreamteam.clJouerFinale')}
                    </button>
                  )}
                </div>
              )}

              {clFinished && clBracket && (
                <div className="dt-cl-finished">
                  <div className="dt-cl-winner-banner">
                    {/* Le nom « DreamTeam » est l'identifiant de l'équipe du
                        joueur dans le tableau : il n'est pas traduit. */}
                    {clBracket.winner.name === 'DreamTeam'
                      ? t('dreamteam.clVictoireJoueur')
                      : t('dreamteam.clVictoireAutre', { equipe: clBracket.winner.name })}
                  </div>

                  {/* Show all results */}
                  <div className="dt-cl-all-results">
                    {clMatches.map((roundData, ri) => (
                      <div key={ri} className="dt-cl-round-results">
                        <h4>{roundData.round === 'quarter' ? t('dreamteam.clQuarts') : roundData.round === 'semi' ? t('dreamteam.clDemis') : t('dreamteam.clFinale')}</h4>
                        {roundData.results.map((r, mi) => (
                          <div key={mi} className="dt-cl-result-line">
                            <span className={r.homeGoals > r.awayGoals ? 'winner' : ''}>{r.home.name}</span>
                            <span className="dt-cl-result-score">{r.homeGoals} - {r.awayGoals}</span>
                            <span className={r.awayGoals > r.homeGoals ? 'winner' : ''}>{r.away.name}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <button className="dt-play-btn" onClick={resetCL}>{t('dreamteam.retour')}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
