import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useI18n } from '../i18n';
import './Players.css';

/** Rafraîchissement : assez court pour voir les arrivées, assez long pour ne pas marteler l'API. */
const RAFRAICHISSEMENT_MS = 30000;

function formatArgent(v) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M€`;
  if (v >= 1000) return `${Math.round(v / 1000)}k€`;
  return `${v}€`;
}

function derniereActivite(joueur, t) {
  if (joueur.online) return t('managers.enLigne');
  const min = joueur.minutesSinceSeen;
  if (min === null || min === undefined) return t('managers.jamaisVu');
  if (min < 60) return t('managers.ilYAMinutes', { n: min });
  const heures = Math.floor(min / 60);
  if (heures < 24) return t('managers.ilYAHeures', { n: heures });
  const jours = Math.floor(heures / 24);
  return t('managers.ilYAJours', { n: jours });
}

export default function Players({ onBack, currentTeamId }) {
  const { t, tPoste } = useI18n();
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
        if (actif) setErreur(t('managers.indisponible'));
      }
    }

    charger();
    const timer = setInterval(charger, RAFRAICHISSEMENT_MS);
    return () => { actif = false; clearInterval(timer); };
  }, [t]);

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
        <button className="players-back" onClick={onBack}>{t('managers.retour')}</button>
        <div className="players-title">
          <h1>{t('managers.titre')}</h1>
          {data && (
            <p className="players-sub">
              <span className="players-dot-online" /> {t('managers.compteEnLigne', { n: data.onlineCount })}
              <span className="players-sep">·</span>
              {t(data.totalCount > 1 ? 'managers.totalPlusieurs' : 'managers.totalUn', { n: data.totalCount })}
            </p>
          )}
        </div>
      </header>

      {erreur && <div className="players-empty">{erreur}</div>}
      {!data && !erreur && <div className="players-empty">{t('commun.chargementPoints')}</div>}

      {data && data.players.length === 0 && (
        <div className="players-empty">{t('managers.aucun')}</div>
      )}

      {data && data.players.length > 0 && (
        <div className="players-table-wrap">
          <table className="players-table">
            <thead>
              <tr>
                <th className="col-rank">#</th>
                <th className="col-team">{t('managers.colManager')}</th>
                <th>{t('managers.colDivision')}</th>
                <th className="num">{t('managers.colSaison')}</th>
                <th className="num">{t('managers.colPlace')}</th>
                <th className="num">{t('managers.colJoues')}</th>
                <th className="num">{t('managers.colPoints')}</th>
                <th className="num">{t('managers.colBilan')}</th>
                <th className="num">{t('managers.colButs')}</th>
                <th className="num">{t('managers.colTitres')}</th>
                <th className="col-seen">{t('managers.colActivite')}</th>
              </tr>
            </thead>
            <tbody>
              {data.players.map((j, i) => {
                // Les connectés sont remontés en tête : sans trait de
                // séparation, l'ordre de la suite semblerait arbitraire.
                const debutHorsLigne = !j.online && i > 0 && data.players[i - 1].online;
                return (
                <tr
                  key={j.teamId}
                  className={[
                    j.teamId === currentTeamId ? 'is-me' : '',
                    selection === j.teamId ? 'is-open' : '',
                    j.online ? 'is-online' : '',
                    debutHorsLigne ? 'debut-hors-ligne' : '',
                  ].filter(Boolean).join(' ')}
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
                    {j.titles > 0 && <span title={t('managers.titreChampionnats')}>🏆{j.titles}</span>}
                    {j.cups > 0 && <span title={t('managers.titreCoupes')}>🥇{j.cups}</span>}
                    {j.titles === 0 && j.cups === 0 && '—'}
                  </td>
                  <td className="col-seen">
                    <span className={j.online ? 'seen-online' : 'seen-off'}>
                      {j.online && <span className="players-dot-online" />}
                      {derniereActivite(j, t)}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selection && (
        <div className="players-detail card">
          {!profil && <p className="players-empty">{t('managers.chargementFiche')}</p>}
          {profil && (
            <>
              <h2>{profil.team.name} <span className="players-user">{profil.team.username}</span></h2>
              <div className="players-detail-stats">
                <div><span>{t('managers.reputation')}</span><strong>{profil.team.reputation}</strong></div>
                <div><span>{t('managers.budget')}</span><strong>{formatArgent(profil.team.budget || 0)}</strong></div>
                <div><span>{t('managers.saisons')}</span><strong>{profil.history.length}</strong></div>
                <div><span>{t('managers.championnats')}</span><strong>{profil.team.titles || 0}</strong></div>
                <div><span>{t('managers.coupes')}</span><strong>{profil.team.cups || 0}</strong></div>
              </div>

              {profil.history.length > 0 && (
                <>
                  <h3>{t('managers.carriere')}</h3>
                  <table className="players-history">
                    <thead>
                      <tr>
                        <th>{t('managers.colSaison')}</th><th>{t('managers.colDivision')}</th><th className="num">{t('managers.colPlace')}</th>
                        <th className="num">{t('managers.colPoints')}</th><th>{t('managers.colCoupe')}</th><th>{t('managers.colResultat')}</th>
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
                            {h.promoted ? <span className="tag-promo">{t('managers.promu')}</span> : null}
                            {h.relegated ? <span className="tag-releg">{t('managers.relegue')}</span> : null}
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
                  <h3>{t('managers.cadres')}</h3>
                  <ul className="players-squad">
                    {profil.topPlayers.map((p, i) => (
                      <li key={i}>
                        <span className="squad-pos">{tPoste(p.position)}</span>
                        <span className="squad-name">{p.first_name} {p.last_name}</span>
                        <span className="squad-ovr">{p.overall}</span>
                        <span className="squad-stats">
                          {t('managers.butsEnMatchs', {
                            buts: p.career_goals || 0,
                            matchs: p.career_appearances || 0,
                          })}
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
