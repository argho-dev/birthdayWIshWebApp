import { useEffect, useRef, useState, useCallback } from 'react';
import { getDailySong, type Song } from '../lib/songs';
import LyricsPopup from './LyricsPopup';
import { connectAudio, getAudioEnergy } from '../lib/audioReact';

function formatTime(sec: number): string {
  if (!isFinite(sec) || isNaN(sec) || sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ScrollingText({ text, style }: { text: string; style?: React.CSSProperties }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef      = useRef<HTMLSpanElement>(null);
  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    const c = containerRef.current;
    const t = textRef.current;
    if (c && t) setScroll(t.scrollWidth > c.clientWidth + 2);
  }, [text]);

  return (
    <div ref={containerRef} style={{ overflow: 'hidden', whiteSpace: 'nowrap', ...style }}>
      <span
        ref={textRef}
        style={{
          display: 'inline-block',
          animation: scroll ? 'marqueeScroll 8s linear infinite' : 'none',
          paddingRight: scroll ? '3rem' : 0,
        }}
      >{text}</span>
    </div>
  );
}

export default function MusicPlayer() {
  const [song] = useState<Song>(() => getDailySong());
  const audioRef     = useRef<HTMLAudioElement>(null);

  const [playing,          setPlaying]          = useState(false);
  const [progress,         setProgress]         = useState(0);
  const [currentTime,      setCurrentTime]      = useState(0);
  const [duration,         setDuration]         = useState(0);
  const [volume,           setVolume]           = useState(0.65);
  const [loadError,        setLoadError]        = useState(false);
  const [minimised,        setMinimised]        = useState(true);
  const [waitingForGesture, setWaitingForGesture] = useState(false);
  const [isVideoPlaying,   setIsVideoPlaying]   = useState(false);
  const userVolumeRef = useRef(0.65);

  const gestureListenerRef = useRef<(() => void) | null>(null);
  const eqBarRefs          = useRef<(HTMLDivElement | null)[]>([]);
  const eqRafRef           = useRef<number>(0);
  const volumeRafRef       = useRef<number>(0);

  const tryAutoplay = useCallback(async (audio: HTMLAudioElement) => {
    try {
      await audio.play();
      setWaitingForGesture(false);
    } catch {
      setWaitingForGesture(true);
      const onGesture = async () => {
        try {
          await audio.play();
          setWaitingForGesture(false);
        } catch {
          // still blocked — user can press play manually
        }
        document.removeEventListener('click',     onGesture);
        document.removeEventListener('touchstart', onGesture);
        gestureListenerRef.current = null;
      };
      gestureListenerRef.current = onGesture;
      document.addEventListener('click',     onGesture, { once: true });
      document.addEventListener('touchstart', onGesture, { once: true });
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setLoadError(false);
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setWaitingForGesture(false);

    if (gestureListenerRef.current) {
      document.removeEventListener('click',     gestureListenerRef.current);
      document.removeEventListener('touchstart', gestureListenerRef.current);
      gestureListenerRef.current = null;
    }

    audio.volume = volume;

    const onLoadedMeta = () => {
      setDuration(audio.duration);
      setLoadError(false);
      tryAutoplay(audio);
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };
    const onError = () => {
      setLoadError(true);
      setPlaying(false);
    };
    const onPlay  = () => {
      setPlaying(true);
      setWaitingForGesture(false);
      if (audioRef.current) connectAudio(audioRef.current);
    };
    const onPause = () => setPlaying(false);

    audio.addEventListener('loadedmetadata', onLoadedMeta);
    audio.addEventListener('timeupdate',     onTimeUpdate);
    audio.addEventListener('ended',          onEnded);
    audio.addEventListener('error',          onError);
    audio.addEventListener('play',           onPlay);
    audio.addEventListener('pause',          onPause);

    if (audio.readyState >= 1 && audio.duration > 0) {
      setDuration(audio.duration);
      tryAutoplay(audio);
    }

    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMeta);
      audio.removeEventListener('timeupdate',     onTimeUpdate);
      audio.removeEventListener('ended',          onEnded);
      audio.removeEventListener('error',          onError);
      audio.removeEventListener('play',           onPlay);
      audio.removeEventListener('pause',          onPause);
    };
  }, [song.filename, tryAutoplay]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
    } else {
      try {
        await audio.play();
      } catch (err) {
        console.warn('Playback error:', err);
      }
    }
  }, [playing]);

  /* ── Equalizer bar RAF loop ─────────────────────────────────── */
  useEffect(() => {
    const BAR_COUNT = 5;
    const BASE_H    = 4;   // px — resting height
    const MAX_H     = 22;  // px — max height at full energy
    /* Each bar has its own phase offset so they animate distinctly */
    const phases = [0, 0.4, 0.8, 1.2, 1.6];
    let t = 0;

    const tick = () => {
      eqRafRef.current = requestAnimationFrame(tick);
      t += 0.06;
      const energy = getAudioEnergy();
      for (let i = 0; i < BAR_COUNT; i++) {
        const bar = eqBarRefs.current[i];
        if (!bar) continue;
        /* If playing & energy > 0, animate reactively; else idle bounce */
        const wave = 0.5 + 0.5 * Math.sin(t * 3 + phases[i]);
        const h = playing
          ? BASE_H + (MAX_H - BASE_H) * (energy * 0.7 + wave * 0.3 * energy)
          : BASE_H + 3 * wave * 0.4;
        bar.style.height = `${Math.max(BASE_H, h)}px`;
        bar.style.opacity = playing ? String(0.55 + energy * 0.45) : '0.25';
      }
    };
    eqRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(eqRafRef.current);
  }, [playing]);

  const MAX_EQ_H = 22; /* px — must match RAF loop MAX_H */

  /* ── Theatre video: duck / restore volume ───────────────────── */
  useEffect(() => {
    const audio = audioRef.current;

    function smoothTo(target: number) {
      cancelAnimationFrame(volumeRafRef.current);
      if (!audio) return;
      const start = audio.volume;
      const diff  = target - start;
      const startTime = performance.now();
      const DURATION  = 600;
      const step = (now: number) => {
        if (!audio) return;
        const t = Math.min(1, (now - startTime) / DURATION);
        audio.volume = Math.max(0, Math.min(1, start + diff * t));
        if (t < 1) volumeRafRef.current = requestAnimationFrame(step);
      };
      volumeRafRef.current = requestAnimationFrame(step);
    }

    const onOpen = () => {
      setIsVideoPlaying(true);
    };
    const onClose = () => {
      setIsVideoPlaying(false);
      smoothTo(userVolumeRef.current);
    };

    const onUniverseOpen = () => { smoothTo(0.20); };
    const onUniverseClose = () => { smoothTo(userVolumeRef.current); };

    window.addEventListener('theatre:open',   onOpen           as EventListener);
    window.addEventListener('theatre:close',  onClose          as EventListener);
    window.addEventListener('universe:open',  onUniverseOpen   as EventListener);
    window.addEventListener('universe:close', onUniverseClose  as EventListener);
    return () => {
      window.removeEventListener('theatre:open',   onOpen           as EventListener);
      window.removeEventListener('theatre:close',  onClose          as EventListener);
      window.removeEventListener('universe:open',  onUniverseOpen   as EventListener);
      window.removeEventListener('universe:close', onUniverseClose  as EventListener);
      cancelAnimationFrame(volumeRafRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    userVolumeRef.current = v;
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  };

  return (
    <>
      <LyricsPopup playing={playing} song={song} currentTime={currentTime} isVideoPlaying={isVideoPlaying} />
      <audio
        key={song.filename}
        ref={audioRef}
        src={song.filename}
        preload="auto"
      />

      {/* Minimised bubble — always present in DOM so audio keeps playing */}
      {minimised && (
        <button
          onClick={() => setMinimised(false)}
          title="Open music player"
          style={{
            position: 'fixed', bottom: '5rem', right: '1.25rem', zIndex: 50,
            width: 52, height: 64, borderRadius: 16,
            background: 'rgba(255,121,198,0.15)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,121,198,0.40)',
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 5,
            fontSize: '1.3rem', color: '#ff79c6',
            boxShadow: playing ? '0 0 22px rgba(255,121,198,0.65)' : 'none',
            animation: playing ? 'glowPulse 1.8s ease-in-out infinite' : 'none',
            padding: 0,
          }}
        >
          🎵
          {/* Equalizer bars */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 2,
            height: MAX_EQ_H, padding: '0 2px',
          }}>
            {[0,1,2,3,4].map(i => (
              <div
                key={i}
                ref={el => { eqBarRefs.current[i] = el; }}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  background: '#ff79c6',
                  transition: 'height 0.05s linear',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </button>
      )}

      {/* Full player panel */}
      {!minimised && (
      <div style={{
        position: 'fixed', bottom: '5rem', right: '1.25rem', zIndex: 50,
        width: 'min(300px, 90vw)',
        background: 'rgba(10,6,30,0.82)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,121,198,0.22)',
        borderRadius: '20px',
        padding: '1rem 1.1rem 0.9rem',
        boxShadow: '0 12px 40px rgba(189,147,249,0.1), 0 4px 16px rgba(0,0,0,0.5)',
      }}>

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.7rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ScrollingText
              text={loadError ? 'Could not load audio' : song.title}
              style={{ fontSize: '0.84rem', fontWeight: 700, color: loadError ? '#ff5555' : '#ff79c6', marginBottom: '0.15rem' }}
            />
            <div style={{ fontSize: '0.7rem', color: 'rgba(189,147,249,0.8)', letterSpacing: '0.03em' }}>
              {loadError ? 'Check file path' : (song.artist || 'Unknown Artist')}
            </div>
          </div>
          <button
            onClick={() => setMinimised(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)', fontSize: '1rem', lineHeight: 1,
              padding: '2px 0', flexShrink: 0,
            }}
            title="Minimise"
          >ﹳ</button>
        </div>

        {/* Progress bar */}
        <div
          onClick={handleProgressClick}
          style={{
            height: 4, borderRadius: 100,
            background: 'rgba(255,255,255,0.1)',
            cursor: 'pointer', marginBottom: '0.3rem',
          }}
        >
          <div style={{
            height: '100%', borderRadius: 100,
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #ff2d78, #bd93f9)',
            transition: 'width 0.35s linear',
            boxShadow: '0 0 8px rgba(255,45,120,0.6)',
            minWidth: progress > 0 ? 4 : 0,
          }} />
        </div>

        {/* Time */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)',
          marginBottom: '0.75rem',
        }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Play / Pause — always enabled */}
          <button
            onClick={togglePlay}
            title={playing ? 'Pause' : 'Play'}
            style={{
              flexShrink: 0,
              width: 42, height: 42, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff2d78 0%, #8B5CF6 100%)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', color: 'white',
              boxShadow: playing ? '0 0 18px rgba(255,45,120,0.6)' : 'none',
              transition: 'transform 0.12s ease, box-shadow 0.2s ease',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.9)'; }}
            onMouseUp={e   => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {playing ? '⏸' : '▶'}
          </button>

          {/* Volume — always enabled */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', opacity: 0.45, flexShrink: 0 }}>🔈</span>
            <input
              type="range" min="0" max="1" step="0.02"
              value={volume}
              onChange={handleVolumeChange}
              style={{ flex: 1, height: 3, accentColor: '#ff79c6', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.75rem', opacity: 0.45, flexShrink: 0 }}>🔊</span>
          </div>
        </div>

        {/* Status */}
        <div style={{
          marginTop: '0.55rem', fontSize: '0.62rem',
          color: 'rgba(255,255,255,0.28)', textAlign: 'center',
        }}>
          {loadError
            ? '⚠ Audio file not found'
            : playing
              ? '♪ Now playing — come back tomorrow for a new song ♪'
              : waitingForGesture
                ? '♪ Tap anywhere to start the music ♪'
                : 'Press ▶ to play today\'s song'
          }
        </div>
      </div>
      )}
    </>
  );
}
