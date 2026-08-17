import { useEffect, useState } from 'react';
import { api } from '../api/client';
import './Players.css';

/** Rafraîchissement : assez court pour voir les arrivées, assez long pour ne pas marteler l'API. */
const RAFRAICHISSEMENT_MS = 30000;

function formatArgent(v) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M€`;
  if (v >= 1000) return `${Math.round(v / 1000)}k€`;
  return `${v}€`;
}

function derniereActivite(joueur) {
  if (joueur.online) return 'en ligne';
  const min = joueur.minutesSinceSeen;
  if (min === null || min === undefined) return 'jamais vu';
  if (min < 60) return `il y a ${min} min`;
  const heures = Math.floor(min / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  return `il y a ${jours} j`;
}

export default function Players({ onBack, currentTeamId }) {
  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [selection, setSelection] = useState(null);
  const [profil, setProfil] = useState(null);

  useEffect(() => {
    let actif = true;

    async function charger() {
      try {
        const r = await api.getPlayersRanking();
        if (actif) { setData(r); setErreur(null); }
      } catch {
        if (actif) setErreur('Classement indisponible');
      }
    }

    charger();
    const timer = setInterval(charger, RAFRAICHISSEMENT_MS);
    return () => { actif = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!selection) { setProfil(null); return; }
    let actif = true;
    api.getPlayerProfile(selection)
      .then((p) => { if (actif) setProfil(p); })
      .catch(() => { if (actif) setProfil(null); });
    return () => { actif = false; };
  }, [selection]);

  return (
    <div className="players-page">
      <header className="players-header">
        <button className="players-back" onClick={onBack}>← Retour</button>
        <div className="players-title">
          <h1>Classement des managers</h1>
          {data && (
            <p className="players-sub">
              <span className="players-dot-online" /> {data.onlineCount} en ligne
              <span className="players-sep">·</span>
              {data.totalCount} manager{data.totalCount > 1 ? 's' : ''} au total
            </p>
          )}
        </div>
      </header>

      {erreur && <div className="players-empty">{erreur}</div>}
      {!data && !erreur && <div className="players-empty">Chargement…</div>}

      {data && data.players.length === 0 && (
        <div className="players-empty">Aucun manager pour le moment.</div>
      )}

      {data && data.players.length > 0 && (
        <div className="players-table-wrap">
          <table className="players-table">
            <thead>
              <tr>
                <th className="col-rank">#</th>
                <th className="col-team">Manager</th>
                <th>Division</th>
                <th className="num">Saison</th>
                <th className="num">Place</th>
                <th className="num">J</th>
                <th className="num">Pts</th>
                <th className="num">V-N-D</th>
                <th className="num">Buts</th>
                <th className="num">Titres</th>
                <th className="col-seen">Activité</th>
              </tr>
            </thead>
            <tbody>
              {data.players.map((j) => (
                <tr
                  key={j.teamId}
                  className={`${j.teamId === currentTeamId ? 'is-me' : ''} ${selection === j.teamId ? 'is-open' : ''}`}
                  onClick={() => setSelection(selection === j.teamId ? null : j.teamId)}
                >
                  <td className="col-rank">{j.rank}</td>
                  <td className="col-team">
                    <span className="players-team-name">{j.teamName}</span>
                    <span className="players-user">{j.username}</span>
                  </td>
                  <td><span className={`players-div div-${j.division}`}>{j.divisionName}</span></td>
                  <td className="num">{j.season}</td>
                  <td className="num">
                    {j.rankInDivision ? `${j.rankInDivision}/${j.teamsInDivision}` : '—'}
                  </td>
                  <td className="num">{j.played}</td>
                  <td className="num strong">{j.points}</td>
                  <td className="num">{j.wins}-{j.draws}-{j.losses}</td>
                  <td className="num">{j.goalsFor}:{j.goalsAgainst}</td>
                  <td className="num">
                    {j.titles > 0 && <span title="Championnats">🏆{j.titles}</span>}
                    {j.cups > 0 && <span title="Coupes">🥇{j.cups}</span>}
                    {j.titles === 0 && j.cups === 0 && '—'}
                  </td>
                  <td className="col-seen">
                    <span className={j.online ? 'seen-online' : 'seen-off'}>
                      {j.online && <span className="players-dot-online" />}
                      {derniereActivite(j)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selection && (
        <div className="players-detail card">
          {!profil && <p className="players-empty">Chargement de la fiche…</p>}
          {profil && (
            <>
              <h2>{profil.team.name} <span className="players-user">{profil.team.username}</span></h2>
              <div className="players-detail-stats">
                <div><span>Réputation</span><strong>{profil.team.reputation}</strong></div>
                <div><span>Budget</span><strong>{formatArgent(profil.team.budget || 0)}</strong></div>
                <div><span>Saisons</span><strong>{profil.history.length}</strong></div>
                <div><span>Championnats</span><strong>{profil.team.titles || 0}</strong></div>
                <div><span>Coupes</span><strong>{profil.team.cups || 0}</strong></div>
              </div>

              {profil.history.length > 0 && (
                <>
                  <h3>Carrière</h3>
                  <table className="players-history">
                    <thead>
                      <tr>
                        <th>Saison</th><th>Division</th><th className="num">Place</th>
                        <th className="num">Pts</th><th>Coupe</th><th>Bilan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profil.history.map((h) => (
                        <tr key={h.season}>
                          <td>{h.season}</td>
                          <td>{h.division_name || `D${h.division}`}</td>
                          <td className="num">{h.rank || '—'}</td>
                          <td className="num">{h.points}</td>
                          <td>{h.cup_result || '—'}</td>
                          <td>
                            {h.promoted ? <span className="tag-promo">Promu</span> : null}
                            {h.relegated ? <span className="tag-releg">Relégué</span> : null}
                            {!h.promoted && !h.relegated ? '—' : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {profil.topPlayers.length > 0 && (
                <>
                  <h3>Cadres de l'effectif</h3>
                  <ul className="players-squad">
                    {profil.topPlayers.map((p, i) => (
                      <li key={i}>
                        <span className="squad-pos">{p.position}</span>
                        <span className="squad-name">{p.first_name} {p.last_name}</span>
                        <span className="squad-ovr">{p.overall}</span>
                        <span className="squad-stats">
                          {p.career_goals || 0} buts en {p.career_appearances || 0} matchs
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
