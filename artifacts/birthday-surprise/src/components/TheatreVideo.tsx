import { useEffect, useRef, useState } from 'react';

interface Props {
  onClose: () => void;
  onVideoEnded?: () => void;
  src?: string;
}

export default function TheatreVideo({ onClose, onVideoEnded, src = '/birthday_video.mp4' }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const overlayRef  = useRef<HTMLDivElement>(null);
  const [visible, setVisible]         = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [showVideo, setShowVideo]     = useState(false);

  useEffect(() => {
    // 1. Fade overlay in
    const rafId = requestAnimationFrame(() => setVisible(true));
    window.dispatchEvent(new CustomEvent('theatre:open'));

    // 2. Start opening curtains after overlay appears
    const curtainTimer = setTimeout(() => setCurtainOpen(true), 350);

    // 3. Reveal video once curtains are mostly open
    const videoTimer = setTimeout(() => setShowVideo(true), 1400);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(curtainTimer);
      clearTimeout(videoTimer);
      window.dispatchEvent(new CustomEvent('theatre:close'));
    };
  }, []);

  function smoothVolume(target: number, duration = 600) {
    const audio = document.querySelector<HTMLAudioElement>('audio');
    if (!audio) return;
    const start = audio.volume;
    const diff  = target - start;
    const t0    = performance.now();
    const step  = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      audio.volume = Math.max(0, Math.min(1, start + diff * t));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const handlePlay = () => smoothVolume(0.4);

  const handlePauseOrEnd = () => smoothVolume(1.0);

  const handleEnded = () => {
    smoothVolume(1.0);
    onVideoEnded?.();
  };

  const handleClose = () => {
    const video = videoRef.current;
    if (video && !video.paused) video.pause();
    smoothVolume(1.0);
    setVisible(false);
    setTimeout(onClose, 350);
  };

  /* Curtain fold gradient — deep velvet red with highlight folds */
  const curtainGradient = (side: 'left' | 'right') => {
    if (side === 'left') {
      return `
        repeating-linear-gradient(
          to right,
          rgba(0,0,0,0.35) 0px,
          rgba(0,0,0,0)   18px,
          rgba(255,255,255,0.06) 22px,
          rgba(0,0,0,0)   36px,
          rgba(0,0,0,0.25) 54px
        ),
        linear-gradient(to right, #5a0010, #8b001a, #6b0015, #3d000c)
      `;
    }
    return `
      repeating-linear-gradient(
        to left,
        rgba(0,0,0,0.35) 0px,
        rgba(0,0,0,0)   18px,
        rgba(255,255,255,0.06) 22px,
        rgba(0,0,0,0)   36px,
        rgba(0,0,0,0.25) 54px
      ),
      linear-gradient(to left, #5a0010, #8b001a, #6b0015, #3d000c)
    `;
  };

  const curtainBase: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '51%',          // slight overlap at centre seam
    zIndex: 20,
    pointerEvents: 'none',
    transition: 'transform 1.1s cubic-bezier(0.77,0,0.18,1)',
    willChange: 'transform',
  };

  /* Golden fringe strip on the inner edge */
  const fringeBase: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 18,
    background: `
      repeating-linear-gradient(
        to bottom,
        #c8971a 0px, #f5d87a 4px, #c8971a 8px, #a06010 12px
      )
    `,
    boxShadow: '0 0 12px rgba(200,150,20,0.6)',
    zIndex: 21,
    pointerEvents: 'none',
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease',
        padding: '1.5rem',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── LEFT CURTAIN ── */}
      <div style={{
        ...curtainBase,
        left: 0,
        background: curtainGradient('left'),
        transform: curtainOpen ? 'translateX(-100%)' : 'translateX(0)',
        transformOrigin: 'left center',
      }}>
        {/* golden fringe on right (inner) edge */}
        <div style={{ ...fringeBase, right: 0 }} />
      </div>

      {/* ── RIGHT CURTAIN ── */}
      <div style={{
        ...curtainBase,
        right: 0,
        background: curtainGradient('right'),
        transform: curtainOpen ? 'translateX(100%)' : 'translateX(0)',
        transformOrigin: 'right center',
      }}>
        {/* golden fringe on left (inner) edge */}
        <div style={{ ...fringeBase, left: 0 }} />
      </div>

      {/* ── TOP valance (decorative header) ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '10vh',
        background: `
          linear-gradient(to bottom, #4a000e 0%, #6b0015 60%, transparent 100%)
        `,
        zIndex: 22,
        pointerEvents: 'none',
      }}>
        {/* gold trim along bottom of valance */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 6,
          background: 'linear-gradient(to right, #a06010, #f5d87a, #c8971a, #f5d87a, #a06010)',
          boxShadow: '0 0 10px rgba(200,150,20,0.5)',
        }} />
      </div>

      {/* ── BOTTOM border ── */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '8vh',
        background: 'linear-gradient(to top, rgba(60,0,15,0.9), transparent)',
        pointerEvents: 'none',
        zIndex: 10,
      }} />

      {/* ── Close button ── */}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '1.2rem',
          right: '1.2rem',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '50%',
          width: 36,
          height: 36,
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s',
          zIndex: 30,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
      >
        ✕
      </button>

      {/* ── Now Showing label ── */}
      <div style={{
        position: 'absolute',
        top: '1.4rem',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '0.68rem',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'rgba(255,200,160,0.75)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 30,
        textShadow: '0 0 12px rgba(255,180,80,0.5)',
      }}>
        🎬 &nbsp; Now Showing
      </div>

      {/* ── Video container ── */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 860,
        aspectRatio: '16/9',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: `
          0 0 0 1px rgba(255,180,100,0.15),
          0 0 60px rgba(255,100,50,0.18),
          0 0 120px rgba(200,60,20,0.12),
          0 30px 80px rgba(0,0,0,0.8)
        `,
        background: '#000',
        opacity: showVideo ? 1 : 0,
        transform: showVideo ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(16px)',
        transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.2,0.64,1)',
        zIndex: 15,
      }}>
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          controlsList="nofullscreen nodownload noremoteplayback"
          onPlay={handlePlay}
          onPause={handlePauseOrEnd}
          onEnded={handleEnded}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            background: '#000',
          }}
        />
      </div>
    </div>
  );
}
