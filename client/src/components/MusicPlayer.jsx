import { useState, useRef, useEffect } from 'react';
import './MusicPlayer.css';

const TRACKS = [
  '/music/Count The Days - StreamBeats Original, Tuonto.mp3',
  '/music/Do this on my own - StreamBeats Originals, Fuslie, Ryan King.mp3',
  "/music/It's Easy To Forget - StreamBeats Originals, Ryan King.mp3",
];

export default function MusicPlayer() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const [currentTrack, setCurrentTrack] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const tryPlay = () => {
      if (audioRef.current && playing) {
        audioRef.current.play().catch(() => {});
      }
      document.removeEventListener('click', tryPlay);
    };
    if (audioRef.current && playing) {
      audioRef.current.play().catch(() => {
        document.addEventListener('click', tryPlay);
      });
    }
  }, []);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  }

  function handleEnded() {
    const next = (currentTrack + 1) % TRACKS.length;
    setCurrentTrack(next);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play();
      }
    }, 500);
  }

  return (
    <div className="music-player">
      <audio
        ref={audioRef}
        src={TRACKS[currentTrack]}
        onEnded={handleEnded}
      />
      <button className="mp-btn" onClick={togglePlay}>
        {playing ? '⏸' : '▶'}
      </button>
      <button className="mp-btn" onClick={() => handleEnded()}>
        ⏭
      </button>
      <input
        type="range"
        className="mp-volume"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={e => setVolume(parseFloat(e.target.value))}
      />
    </div>
  );
}
