import { useEffect, useRef, useState, lazy, Suspense, useCallback } from 'react';
import { gsap } from 'gsap';
import Starfield from '../components/Starfield';
import DailyBackground from '../components/DailyBackground';
import MusicReactLayer from '../components/MusicReactLayer';
import NightSkyHeart from './NightSkyHeart';
import TheatreVideo from '../components/TheatreVideo';
import CakePrompt from '../components/CakePrompt';
import {
  getCountdownParts,
  getTodayMessages,
} from '../lib/surprises';
import { spawnFloatingHearts } from '../components/ConfettiEffect';

const modules = {
  fireflies:         lazy(() => import('../components/surprises/FirefliesScene')),
  heartGame:         lazy(() => import('../components/surprises/HeartGame')),
  loveLetter:        lazy(() => import('../components/surprises/LoveLetter')),
  floatingBears:     lazy(() => import('../components/surprises/FloatingBears')),
  emojiRain:         lazy(() => import('../components/surprises/EmojiRain')),
  messageWall:       lazy(() => import('../components/surprises/MessageWall')),
  starConstellation: lazy(() => import('../components/surprises/StarConstellation')),
  bubbleMessages:    lazy(() => import('../components/surprises/BubbleMessages')),
  walkingBears:      lazy(() => import('../components/surprises/WalkingBears')),
  heartCanvas:       lazy(() => import('../components/surprises/HeartCanvas')),
  glowingOrbs:       lazy(() => import('../components/surprises/GlowingOrbs')),
  petals:            lazy(() => import('../components/surprises/PetalsFall')),
  neonMessage:       lazy(() => import('../components/surprises/NeonMessage')),
  musicBox:          lazy(() => import('../components/surprises/MusicBox')),
  mirrorMirror:      lazy(() => import('../components/surprises/MirrorMirror')),
};

const MODULE_NAMES: Record<string, string> = {
  fireflies:         '🌟 Magical Fireflies',
  heartGame:         '🎮 Catch the Hearts',
  loveLetter:        '💌 A Letter',
  floatingBears:     '🐻 Floating Bears',
  emojiRain:         '🌸 Emoji Rain',
  messageWall:       '💝 Hidden Messages',
  starConstellation: '⭐ Star Constellation',
  bubbleMessages:    '💬 Bubble Messages',
  walkingBears:      '🐾 Walking Bears',
  heartCanvas:       '💕 Heart Particles',
  glowingOrbs:       '✨ Glowing Orbs',
  petals:            '🌸 Petal Shower',
  neonMessage:       '💫 Neon Messages',
  musicBox:          '🎵 Music Box',
  mirrorMirror:      '🪞 Mirror Mirror',
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function LiveCountdown() {
  const [parts, setParts] = useState(getCountdownParts());
  useEffect(() => {
    const id = setInterval(() => setParts(getCountdownParts()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span className="text-xl">🎂</span>
      <span className="font-bold" style={{ color: '#ff79c6', fontSize: '0.95rem' }}>
        {parts.days}d {pad(parts.hours)}h {pad(parts.minutes)}m {pad(parts.seconds)}s
      </span>
      <span className="text-xs opacity-60">until birthday</span>
    </div>
  );
}

function MessagePopup({ messages, onClose }: { messages: string[]; onClose: () => void }) {
  const overlayRef  = useRef<HTMLDivElement>(null);
  const cardRef     = useRef<HTMLDivElement>(null);
  const textRef     = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const sliding     = useRef(false);

  useEffect(() => {
    if (!overlayRef.current || !cardRef.current) return;
    gsap.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.35, ease: 'power2.out' }
    );
    gsap.fromTo(cardRef.current,
      { opacity: 0, scale: 0.6, y: 40 },
      { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: 'back.out(1.8)', delay: 0.05 }
    );
  }, []);

  const close = useCallback(() => {
    if (!overlayRef.current || !cardRef.current) { onClose(); return; }
    gsap.to(cardRef.current, { opacity: 0, scale: 0.75, y: 20, duration: 0.28, ease: 'power2.in' });
    gsap.to(overlayRef.current, {
      opacity: 0, duration: 0.3, delay: 0.1,
      onComplete: onClose,
    });
  }, [onClose]);

  const go = useCallback((next: number) => {
    if (sliding.current || !textRef.current) return;
    sliding.current = true;
    const dir = next > idx ? -1 : 1;
    gsap.to(textRef.current, {
      opacity: 0, x: dir * 30, duration: 0.2, ease: 'power2.in',
      onComplete: () => {
        setIdx(next);
        gsap.fromTo(textRef.current,
          { opacity: 0, x: -dir * 30 },
          { opacity: 1, x: 0, duration: 0.25, ease: 'power2.out',
            onComplete: () => { sliding.current = false; } }
        );
      },
    });
  }, [idx]);

  const prev = () => go((idx - 1 + messages.length) % messages.length);
  const next = () => go((idx + 1) % messages.length);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) close(); }}
      style={{
        position: 'fixed', inset: 0,
        zIndex: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        padding: '1rem',
      }}
    >
      <div
        ref={cardRef}
        style={{
          position: 'relative',
          width: 'min(420px, 92vw)',
          background: 'linear-gradient(135deg, rgba(15,8,40,0.97) 0%, rgba(25,12,55,0.97) 100%)',
          border: '1px solid rgba(255,121,198,0.35)',
          borderRadius: 24,
          padding: '2rem 1.75rem 1.75rem',
          boxShadow: '0 0 0 1px rgba(189,147,249,0.08), 0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(255,121,198,0.12)',
          overflow: 'hidden',
        }}
      >
        {/* Glow ring top */}
        <div style={{
          position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
          width: 200, height: 120,
          background: 'radial-gradient(ellipse, rgba(255,121,198,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Close button */}
        <button
          onClick={close}
          style={{
            position: 'absolute', top: 14, right: 16,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%', width: 28, height: 28,
            cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
            fontSize: '0.8rem', lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        >✕</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>💌</div>
          <div style={{
            fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'rgba(189,147,249,0.7)', fontWeight: 600,
          }}>
            A message for you today
          </div>
        </div>

        {/* Message text */}
        <div style={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            ref={textRef}
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.65,
              color: '#f8f8f2',
              textAlign: 'center',
              fontWeight: 300,
              letterSpacing: '0.01em',
              padding: '0 0.25rem',
            }}
          >
            {messages[idx]}
          </div>
        </div>

        {/* Nav row */}
        {messages.length > 1 && (
          <div style={{ marginTop: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <button
              onClick={prev}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,121,198,0.1)', border: '1px solid rgba(255,121,198,0.25)',
                cursor: 'pointer', color: '#ff79c6', fontSize: '1.1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,121,198,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,121,198,0.1)')}
              onMouseDown={e  => (e.currentTarget.style.transform = 'scale(0.9)')}
              onMouseUp={e    => (e.currentTarget.style.transform = 'scale(1)')}
            >‹</button>

            <div style={{ display: 'flex', gap: 6 }}>
              {messages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  style={{
                    width: i === idx ? 20 : 7, height: 7,
                    borderRadius: 4,
                    border: 'none', cursor: 'pointer', padding: 0,
                    background: i === idx
                      ? 'linear-gradient(90deg, #ff79c6, #bd93f9)'
                      : 'rgba(255,121,198,0.25)',
                    transition: 'width 0.25s ease, background 0.2s',
                  }}
                />
              ))}
            </div>

            <button
              onClick={next}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,121,198,0.1)', border: '1px solid rgba(255,121,198,0.25)',
                cursor: 'pointer', color: '#ff79c6', fontSize: '1.1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,121,198,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,121,198,0.1)')}
              onMouseDown={e  => (e.currentTarget.style.transform = 'scale(0.9)')}
              onMouseUp={e    => (e.currentTarget.style.transform = 'scale(1)')}
            >›</button>
          </div>
        )}

        {/* Bottom hint */}
        <div style={{
          marginTop: '1.1rem', textAlign: 'center',
          fontSize: '0.62rem', color: 'rgba(255,255,255,0.22)',
          letterSpacing: '0.04em',
        }}>
          There's something special for you ✦
        </div>
      </div>
    </div>
  );
}

export default function DailySurprise({ onGoToCake }: { onGoToCake?: () => void }) {
  // Love letter envelope is always shown
  const moduleName  = 'loveLetter';
  const SurpriseCmp = modules['loveLetter'];
  // Pick fresh messages once per mount (new on every reload, no repeat)
  const [todayMsgs] = useState<string[]>(() => getTodayMessages());

  const headerRef  = useRef<HTMLDivElement>(null);
  const footerRef  = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [contentVisible, setContentVisible] = useState(false);
  const [showPopup, setShowPopup]           = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [showNightSky, setShowNightSky]     = useState(false);
  const [showTheatre, setShowTheatre]         = useState(false);
  const [showCakePrompt, setShowCakePrompt]   = useState(false);
  const [showCakeTheatre, setShowCakeTheatre] = useState(false);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
      );
    }
    if (footerRef.current) {
      gsap.fromTo(footerRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.3 }
      );
    }
    const t1 = setTimeout(() => {
      setContentVisible(true);
      if (contentRef.current) {
        gsap.fromTo(contentRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }
        );
      }
    }, 400);
    const t2 = setTimeout(() => setShowPopup(true), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleHeaderClick = (e: React.MouseEvent) => spawnFloatingHearts(e.clientX, e.clientY);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: '#050510' }}>
      <DailyBackground />
      <Starfield />
      <MusicReactLayer />

      {/* Header */}
      <div
        ref={headerRef}
        className="relative z-20 flex justify-between items-center px-4 md:px-8 py-4"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)',
          backdropFilter: 'blur(10px)',
          opacity: 0,
        }}
        onClick={handleHeaderClick}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">💝</span>
          <div>
            <div className="neon-pink font-bold text-sm md:text-base">{MODULE_NAMES[moduleName]}</div>
            <div className="text-xs opacity-50">Today's Surprise</div>
          </div>
        </div>
        <div className="glass px-3 py-1.5 text-center">
          <div className="text-xs opacity-60">March</div>
          <div className="text-lg font-bold" style={{ color: '#8be9fd' }}>
            {new Date().getDate()}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        ref={contentRef}
        className="relative z-10 flex-1 overflow-hidden"
        style={{ minHeight: 0, opacity: 0 }}
      >
        {contentVisible && SurpriseCmp && (
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-4xl animate-pulse heartbeat">💖</div>
            </div>
          }>
            <SurpriseCmp
              message={todayMsgs[0]}
              onReveal={() => { setShowPopup(true); setPopupDismissed(false); }}
              onScratchDone={() => {}}
            />
          </Suspense>
        )}
      </div>

      {/* Footer — countdown only */}
      <div
        ref={footerRef}
        className="relative z-20 px-4 md:px-8 py-3"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
          backdropFilter: 'blur(10px)',
          opacity: 0,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="glass px-4 py-2">
            <LiveCountdown />
          </div>

          <div className="flex items-center gap-2">
            {/* Night Sky button */}
            <button
              onClick={() => setShowNightSky(true)}
              title="Night Sky Experience"
              style={{
                background: 'rgba(10,6,40,0.5)',
                border: '1px solid rgba(139,233,253,0.3)',
                borderRadius: 20, padding: '0.4rem 0.9rem',
                cursor: 'pointer', color: '#8be9fd',
                fontSize: '0.75rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                transition: 'background 0.15s, box-shadow 0.2s',
                boxShadow: '0 0 12px rgba(139,233,253,0.1)',
                letterSpacing: '0.03em',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(10,6,60,0.65)';
                e.currentTarget.style.boxShadow = '0 0 18px rgba(139,233,253,0.25)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(10,6,40,0.5)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(139,233,253,0.1)';
              }}
            >
              🌙 Night Sky
            </button>

          {/* Reopen popup button (shows after dismissed) */}
          {popupDismissed && (
              <button
                onClick={() => { setPopupDismissed(false); setShowPopup(true); }}
                style={{
                  background: 'rgba(255,121,198,0.1)',
                  border: '1px solid rgba(255,121,198,0.25)',
                  borderRadius: 20, padding: '0.4rem 0.9rem',
                  cursor: 'pointer', color: '#ff79c6',
                  fontSize: '0.75rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,121,198,0.18)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,121,198,0.1)')}
              >
                💌 Today's Message
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Centered message popup */}
      {showPopup && (
        <MessagePopup
          messages={todayMsgs}
          onClose={() => { setShowPopup(false); setPopupDismissed(true); }}
        />
      )}

      {/* Night Sky scene overlay */}
      {showNightSky && (
        <NightSkyHeart onDismiss={() => { setShowNightSky(false); onGoToCake?.(); }} />
      )}

      {/* Theatre Video overlay — birthday_video.mp4 */}
      {showTheatre && (
        <TheatreVideo
          onClose={() => setShowTheatre(false)}
          onVideoEnded={() => { setShowTheatre(false); setShowCakePrompt(true); }}
        />
      )}

      {/* Cake prompt */}
      {showCakePrompt && (
        <CakePrompt onYes={() => { setShowCakePrompt(false); setShowCakeTheatre(true); }} />
      )}

      {/* Theatre Video — cake.mp4 */}
      {showCakeTheatre && (
        <TheatreVideo
          src="https://res.cloudinary.com/qqjhs4wt/video/upload/v1785875669/cake_twxhw6.mp4"
          onClose={() => setShowCakeTheatre(false)}
        />
      )}

    </div>
  );
}
