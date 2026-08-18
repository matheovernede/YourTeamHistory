import { useState, useRef, useEffect } from 'react';
import TRACKS from 'virtual:music-tracks';
import { useI18n } from '../i18n';
import './MusicPlayer.css';

// TRACKS est généré automatiquement depuis client/public/music/ par
// vite-plugin-music.js : déposer un fichier audio suffit, aucun code à modifier.

let globalAudio = null;

function getAudio() {
  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.volume = parseFloat(localStorage.getItem('fm_music_volume') || '0.3');
  }
  return globalAudio;
}

function readSavedIndex() {
  if (TRACKS.length === 0) return 0;
  const saved = parseInt(localStorage.getItem('fm_music_track') || '0', 10);
  // La liste peut avoir changé depuis la dernière session (ajout/suppression).
  return Number.isFinite(saved) && saved >= 0 ? saved % TRACKS.length : 0;
}

export default function MusicPlayer() {
  const { t } = useI18n();
  const [playing, setPlaying] = useState(() => localStorage.getItem('fm_music_playing') !== 'false');
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('fm_music_volume') || '0.3'));
  const [currentTrack, setCurrentTrack] = useState(readSavedIndex);
  const [expanded, setExpanded] = useState(false);
  const initialized = useRef(false);

  const audio = getAudio();
  const track = TRACKS[currentTrack];

  useEffect(() => {
    if (initialized.current || TRACKS.length === 0) return;
    initialized.current = true;

    audio.volume = volume;
    audio.src = TRACKS[currentTrack].url;

    const savedTime = parseFloat(localStorage.getItem('fm_music_time') || '0');
    if (savedTime > 0) audio.currentTime = savedTime;

    audio.onended = () => {
      setCurrentTrack(prev => {
        const next = (prev + 1) % TRACKS.length;
        localStorage.setItem('fm_music_track', next.toString());
        localStorage.setItem('fm_music_time', '0');
        audio.src = TRACKS[next].url;
        audio.play().catch(() => {});
        return next;
      });
    };

    // Une piste illisible ne doit pas bloquer toute la playlist.
    audio.onerror = () => {
      if (TRACKS.length < 2) return;
      setCurrentTrack(prev => {
        const next = (prev + 1) % TRACKS.length;
        localStorage.setItem('fm_music_track', next.toString());
        audio.src = TRACKS[next].url;
        audio.play().catch(() => {});
        return next;
      });
    };

    if (playing) {
      const tryPlay = () => {
        audio.play().catch(() => {});
        document.removeEventListener('click', tryPlay);
      };
      audio.play().catch(() => {
        document.addEventListener('click', tryPlay);
      });
    }

    const interval = setInterval(() => {
      if (!audio.paused) {
        localStorage.setItem('fm_music_time', audio.currentTime.toString());
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  function togglePlay() {
    if (playing) audio.pause();
    else audio.play().catch(() => {});
    setPlaying(!playing);
    localStorage.setItem('fm_music_playing', (!playing).toString());
  }

  function changeVolume(v) {
    setVolume(v);
    audio.volume = v;
    localStorage.setItem('fm_music_volume', v.toString());
  }

  function goToTrack(idx) {
    const next = ((idx % TRACKS.length) + TRACKS.length) % TRACKS.length;
    setCurrentTrack(next);
    localStorage.setItem('fm_music_track', next.toString());
    localStorage.setItem('fm_music_time', '0');
    audio.src = TRACKS[next].url;
    if (playing) audio.play().catch(() => {});
  }

  // Aucun fichier dans public/music/ : on n'affiche rien plutôt qu'un lecteur mort.
  if (TRACKS.length === 0) return null;

  return (
    <div className={`music-player ${expanded ? 'expanded' : ''}`}>
      <button className="mp-btn" onClick={togglePlay} title={playing ? t('musique.pause') : t('musique.lecture')}>
        {playing ? '⏸' : '▶'}
      </button>
      <button className="mp-btn" onClick={() => goToTrack(currentTrack - 1)} title={t('musique.precedente')}>
        ⏮
      </button>
      <button className="mp-btn" onClick={() => goToTrack(currentTrack + 1)} title={t('musique.suivante')}>
        ⏭
      </button>

      <button
        className="mp-title"
        onClick={() => setExpanded(v => !v)}
        title={`${track.title}\n${t('musique.piste', { n: currentTrack + 1, total: TRACKS.length })}`}
      >
        <span className="mp-title-text">{track.title}</span>
        <span className="mp-count">{currentTrack + 1}/{TRACKS.length}</span>
      </button>

      <input
        type="range"
        className="mp-volume"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={e => changeVolume(parseFloat(e.target.value))}
        title={t('musique.volume', { n: Math.round(volume * 100) })}
      />

      {expanded && (
        <ul className="mp-playlist">
          {TRACKS.map((piste, i) => (
            <li key={piste.url}>
              <button
                className={i === currentTrack ? 'active' : ''}
                onClick={() => { goToTrack(i); setExpanded(false); }}
              >
                <span className="mp-pl-num">{i + 1}</span>
                <span className="mp-pl-title">{piste.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
