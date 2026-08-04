import { useEffect, useRef, useState, useCallback } from 'react';
import Starfield from './Starfield';

const TOTAL_FLAMES = 2;
const BLOW_COOLDOWN_MS = 900;
const BLOW_RMS_THRESHOLD = 0.016;
const BLOW_SUSTAINED_FRAMES = 4;

type Phase = 'teddy' | 'petals' | 'cake';

// ── Petal blast canvas (fast geometric shapes — no emoji) ────────────────────
function PetalBlast({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    // Petal colors — pinks, reds, purples, yellows, greens
    const colors = [
      '#ff79c6','#ff5599','#ff99cc','#ffaadd',
      '#bd93f9','#ff6eb4','#ffe066','#50fa7b',
      '#ff4488','#cc44ff','#ffdd00','#88ffbb',
    ];

    type Petal = {
      x: number; y: number;
      vx: number; vy: number;
      w: number; h: number;
      rotation: number; rotSpeed: number;
      life: number; decay: number;
      color: string; shape: 'ellipse' | 'rect' | 'circle';
    };

    const petals: Petal[] = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // 200 petals — all pure geometry, no emoji, very fast
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 18;
      const shape = (['ellipse', 'rect', 'circle'] as const)[Math.floor(Math.random() * 3)];
      petals.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        w: 8 + Math.random() * 18,
        h: 5 + Math.random() * 12,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.22,
        life: 1,
        decay: 0.012 + Math.random() * 0.01,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape,
      });
    }

    let raf: number;
    let flashLife = 1;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fast white flash
      if (flashLife > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flashLife * 0.55})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        flashLife -= 0.06;
      }

      let alive = 0;
      for (const p of petals) {
        if (p.life <= 0) continue;
        alive++;
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.28;
        p.vx *= 0.985;
        p.rotation += p.rotSpeed;
        p.life     -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle   = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === 'ellipse') {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'rect') {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.h / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (alive > 0 || flashLife > 0) {
        raf = requestAnimationFrame(loop);
      } else {
        onDone();
      }
    };
    loop();

    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        zIndex: 50, pointerEvents: 'none',
      }}
    />
  );
}

// ── Flame ────────────────────────────────────────────────────────────────────
interface FlameProps {
  lit: boolean;
  justBlown: boolean;
  onClick: () => void;
}

function Flame({ lit, justBlown, onClick }: FlameProps) {
  return (
    <div
      onClick={lit ? onClick : undefined}
      style={{
        position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', cursor: lit ? 'pointer' : 'default',
      }}
    >
      {/* Flame glow halo */}
      {lit && (
        <div style={{
          position: 'absolute', top: -6, width: 36, height: 52,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 60%, rgba(255,180,0,0.5) 0%, rgba(255,100,0,0.2) 50%, transparent 80%)',
          filter: 'blur(8px)',
          animation: 'candleFlicker 0.5s ease-in-out infinite alternate',
          pointerEvents: 'none',
        }} />
      )}
      {/* Outer flame */}
      {lit && (
        <div style={{
          width: 22, height: 44,
          background: 'radial-gradient(ellipse at 50% 80%, #fff700 0%, #ff9500 45%, #ff4800 80%, transparent 100%)',
          borderRadius: '50% 50% 35% 35% / 60% 60% 40% 40%',
          filter: 'drop-shadow(0 0 10px #ffaa00) drop-shadow(0 0 20px #ff6600)',
          animation: 'candleFlicker 0.45s ease-in-out infinite alternate',
          marginBottom: -2,
        }} />
      )}
      {/* Inner bright core */}
      {lit && (
        <div style={{
          position: 'absolute', top: 14, width: 10, height: 20,
          background: 'radial-gradient(ellipse at 50% 70%, #ffffff 0%, #fffde0 60%, transparent 100%)',
          borderRadius: '50% 50% 35% 35% / 60% 60% 40% 40%',
          animation: 'candleFlicker 0.38s ease-in-out infinite alternate',
          pointerEvents: 'none',
        }} />
      )}
      {/* Wick */}
      <div style={{
        width: 3, height: 12,
        background: lit ? 'linear-gradient(to bottom, #888, #333)' : '#555',
        borderRadius: '2px 2px 0 0',
        boxShadow: lit ? '0 0 6px rgba(255,200,0,0.6)' : 'none',
        transition: 'background 0.4s',
        zIndex: 1,
      }} />
      {/* Smoke when blown */}
      {justBlown && (
        <div style={{
          position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
          width: 4, height: 40,
          background: 'linear-gradient(to top, rgba(180,180,200,0.7), transparent)',
          borderRadius: 4, animation: 'smokeRise 1.4s ease-out forwards',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

// ── Candle with digit ─────────────────────────────────────────────────────────
interface DigitWithFlameProps {
  flameIndex: number;
  lit: boolean;
  justBlown: boolean;
  onBlow: (i: number) => void;
}

const CANDLE_COLORS = [
  { top: '#ff79c6', mid: '#e8569c', bot: '#c73d84', shine: 'rgba(255,255,255,0.35)' },
  { top: '#bd93f9', mid: '#9a6fe0', bot: '#7850c8', shine: 'rgba(255,255,255,0.3)' },
];

function DigitWithFlame({ flameIndex, lit, justBlown, onBlow }: DigitWithFlameProps) {
  const c = CANDLE_COLORS[flameIndex % CANDLE_COLORS.length];
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      {/* Flame assembly */}
      <Flame lit={lit} justBlown={justBlown} onClick={() => onBlow(flameIndex)} />

      {/* Candle body */}
      <div style={{
        width: 'clamp(38px, 7vw, 52px)',
        height: 'clamp(90px, 18vw, 130px)',
        borderRadius: '6px 6px 4px 4px',
        background: `linear-gradient(to bottom, ${c.top} 0%, ${c.mid} 50%, ${c.bot} 100%)`,
        boxShadow: lit
          ? `0 0 18px ${c.top}88, 0 0 36px ${c.top}44, inset 0 0 10px rgba(0,0,0,0.15)`
          : 'inset 0 0 10px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.5s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Shine streak */}
        <div style={{
          position: 'absolute', left: '18%', top: 0, bottom: 0, width: '14%',
          background: `linear-gradient(to bottom, ${c.shine}, transparent 60%)`,
          borderRadius: 4,
          pointerEvents: 'none',
        }} />
        {/* Number on candle */}
        <span style={{
          fontSize: 'clamp(28px, 5.5vw, 42px)', fontWeight: 900, lineHeight: 1,
          color: 'rgba(255,255,255,0.92)',
          textShadow: '0 1px 6px rgba(0,0,0,0.3)',
          userSelect: 'none',
          fontFamily: 'Georgia, serif',
          zIndex: 1,
        }}>2</span>
        {/* Drips */}
        {[25, 55, 75].map((left, i) => (
          <div key={i} style={{
            position: 'absolute', top: 0, left: `${left}%`,
            width: 6, height: `${14 + i * 6}%`,
            background: `linear-gradient(to bottom, ${c.top}, transparent)`,
            borderRadius: '0 0 50% 50%',
            opacity: 0.7,
          }} />
        ))}
      </div>

      {/* Candle base */}
      <div style={{
        width: 'clamp(46px, 8.5vw, 62px)', height: 10,
        background: `linear-gradient(to bottom, ${c.mid}, ${c.bot})`,
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      }} />

      {/* Sparkle burst when blown */}
      {justBlown && (
        <div style={{
          position: 'absolute', top: '10%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 'clamp(24px, 5vw, 36px)',
          animation: 'bubblePop 0.5s ease forwards',
          pointerEvents: 'none',
        }}>✨</div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
interface Props {
  onDone: () => void;
}

export default function BirthdayCake({ onDone }: Props) {
  const [phase, setPhase]             = useState<Phase>('teddy');
  const [teddyBounce, setTeddyBounce] = useState(false);

  const [litFlames, setLitFlames]           = useState<boolean[]>(Array(TOTAL_FLAMES).fill(true));
  const [justBlown, setJustBlown]           = useState<boolean[]>(Array(TOTAL_FLAMES).fill(false));
  const [micActive, setMicActive]           = useState(false);
  const [micError, setMicError]             = useState(false);
  const [micLevel, setMicLevel]             = useState(0);
  const [allOut, setAllOut]                 = useState(false);
  const [showFinal, setShowFinal]           = useState(false);
  const [showFireworks, setShowFireworks]   = useState(false);

  const streamRef   = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef      = useRef<AudioContext | null>(null);
  const rafRef      = useRef<number | null>(null);
  const lastBlowRef = useRef<number>(0);
  const litRef      = useRef<boolean[]>(litFlames);
  litRef.current    = litFlames;

  const litCount = litFlames.filter(Boolean).length;

  // Teddy click → petal blast → cake
  const handleTeddyClick = () => {
    setTeddyBounce(true);
    setTimeout(() => setPhase('petals'), 300);
  };

  const handlePetalsDone = useCallback(() => {
    setPhase('cake');
  }, []);

  const extinguishNext = useCallback(() => {
    const idx = litRef.current.findIndex(v => v);
    if (idx === -1) return;
    setLitFlames(prev => { const n = [...prev]; n[idx] = false; return n; });
    setJustBlown(prev => { const n = [...prev]; n[idx] = true; return n; });
    setTimeout(() => setJustBlown(prev => { const n = [...prev]; n[idx] = false; return n; }), 1200);
  }, []);

  const handleBlow = (i: number) => {
    if (!litFlames[i]) return;
    setLitFlames(prev => { const n = [...prev]; n[i] = false; return n; });
    setJustBlown(prev => { const n = [...prev]; n[i] = true; return n; });
    setTimeout(() => setJustBlown(prev => { const n = [...prev]; n[i] = false; return n; }), 1200);
  };

  useEffect(() => {
    if (litFlames.every(v => !v) && !allOut) {
      setAllOut(true);
      setShowFireworks(true);
      setTimeout(() => setShowFinal(true), 1000);
    }
  }, [litFlames, allOut]);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      // Resume immediately — browsers may auto-suspend AudioContext
      await ctx.resume();
      const source   = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.35;
      source.connect(analyser);
      analyserRef.current = analyser;
      setMicActive(true);
      const buf = new Float32Array(analyser.fftSize);
      let blowFrames = 0;
      const detect = () => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        // Scale to 0-100 for the visual bar
        const level = Math.min(100, Math.round((rms / 0.12) * 100));
        setMicLevel(level);
        const now = Date.now();
        if (rms > BLOW_RMS_THRESHOLD) {
          blowFrames++;
          // Require sustained blow (BLOW_SUSTAINED_FRAMES consecutive frames)
          if (blowFrames >= BLOW_SUSTAINED_FRAMES && now - lastBlowRef.current > BLOW_COOLDOWN_MS) {
            lastBlowRef.current = now;
            blowFrames = 0;
            extinguishNext();
          }
        } else {
          blowFrames = 0;
        }
        rafRef.current = requestAnimationFrame(detect);
      };
      detect();
    } catch {
      setMicError(true);
    }
  }, [extinguishNext]);

  useEffect(() => {
    return () => {
      if (rafRef.current)    cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (ctxRef.current)    ctxRef.current.close();
    };
  }, []);

  // Fireworks
  const fwCanvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!showFireworks) return;
    const canvas = fwCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    type P = { x: number; y: number; vx: number; vy: number; life: number; color: string };
    const particles: P[] = [];
    const colors = ['#ff79c6','#bd93f9','#8be9fd','#ffe066','#ff5555','#50fa7b'];
    const burst = (cx: number, cy: number) => {
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particles.push({ x: cx, y: cy, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed-2, life: 1, color: colors[Math.floor(Math.random()*colors.length)] });
      }
    };
    let frame = 0, raf: number;
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (frame % 28 === 0) burst(Math.random()*canvas.width, Math.random()*canvas.height*0.5);
      frame++;
      for (let i = particles.length-1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.018;
        if (p.life <= 0) { particles.splice(i,1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [showFireworks]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden" style={{ background: '#050510' }}>
      <Starfield />

      {/* ── Petal blast overlay ── */}
      {phase === 'petals' && <PetalBlast onDone={handlePetalsDone} />}

      {/* ── Teddy screen ── */}
      {phase === 'teddy' && (
        <div
          className="relative z-10 flex flex-col items-center"
          style={{ textAlign: 'center', userSelect: 'none' }}
        >
          {/* Same shimmer style as "Happy 22nd Birthday" header */}
          <div
            className="shimmer-text"
            style={{
              fontSize: 'clamp(1.4rem, 5vw, 2.2rem)',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '2.2rem',
            }}
          >
            Hey Anwesha, click me! 🎀
          </div>

          {/* Teddy */}
          <div
            onClick={handleTeddyClick}
            style={{
              fontSize: 'clamp(90px, 22vw, 160px)',
              cursor: 'pointer',
              display: 'inline-block',
              animation: teddyBounce
                ? 'bubblePop 0.3s ease forwards'
                : 'teddyFloat 3s ease-in-out infinite',
              filter: 'drop-shadow(0 0 30px rgba(255,121,198,0.5))',
              transition: 'transform 0.1s ease',
              lineHeight: 1,
            }}
          >
            🧸
          </div>

          <div style={{
            marginTop: '1.5rem',
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.8rem',
            letterSpacing: '0.06em',
          }}>
            tap the teddy ✨
          </div>
        </div>
      )}

      {/* ── Cake + candles ── */}
      {phase === 'cake' && !showFinal && (
        <div className="relative z-10 flex flex-col items-center" style={{ userSelect: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
            <div className="shimmer-text" style={{ fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', fontWeight: 800, lineHeight: 1.2 }}>
              Happy 22nd Birthday 🎉
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginTop: '0.4rem' }}>
              {micActive
                ? `Blow into your mic to put out the flames! (${litCount} left 🔥)`
                : micError
                  ? `Click each flame to blow it out! (${litCount} left 🔥)`
                  : `Blow out the flames to reveal your surprise 🔥`}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              display: 'flex', gap: 'clamp(12px, 5vw, 36px)',
              alignItems: 'flex-end', marginBottom: -4,
              position: 'relative', zIndex: 2,
            }}>
              {[0, 1].map(i => (
                <DigitWithFlame key={i} flameIndex={i} lit={litFlames[i]} justBlown={justBlown[i]} onBlow={handleBlow} />
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Top tier */}
              <div style={{
                width: 'clamp(150px, 34vw, 210px)', height: 60,
                background: 'linear-gradient(160deg, #ff9de3 0%, #ff79c6 45%, #e0529a 100%)',
                borderRadius: '14px 14px 0 0', position: 'relative', overflow: 'hidden',
                boxShadow: '0 0 28px rgba(255,121,198,0.55), inset 0 1px 0 rgba(255,255,255,0.35)',
              }}>
                {/* Frosting drips */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute', top: -2, left: `${6 + i * 16}%`,
                    width: '8%', height: 20,
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.4))',
                    borderRadius: '0 0 50% 50%',
                  }} />
                ))}
                {/* Shine stripe */}
                <div style={{ position: 'absolute', left: '8%', top: 0, bottom: 0, width: '12%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)', borderRadius: 4 }} />
                <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', fontSize: '1.05rem', letterSpacing: '0.06em' }}>🌸 🌸</div>
              </div>

              {/* Middle tier */}
              <div style={{
                width: 'clamp(220px, 50vw, 315px)', height: 72,
                background: 'linear-gradient(160deg, #d4aaff 0%, #bd93f9 45%, #9265e0 100%)',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 0 22px rgba(189,147,249,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute', top: -2, left: `${3 + i * 13}%`,
                    width: '6%', height: 18,
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.85), rgba(255,255,255,0.3))',
                    borderRadius: '0 0 50% 50%',
                  }} />
                ))}
                <div style={{ position: 'absolute', left: '6%', top: 0, bottom: 0, width: '10%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)', borderRadius: 4 }} />
                {/* Dots row */}
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute', width: 9, height: 9, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.55)',
                    top: 28, left: `${8 + i * 13}%`,
                    boxShadow: '0 0 4px rgba(255,255,255,0.5)',
                  }} />
                ))}
                <div style={{ position: 'absolute', bottom: 11, left: 0, right: 0, textAlign: 'center', fontSize: '0.82rem', color: 'rgba(255,255,255,0.92)', letterSpacing: '0.09em', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                  22 years of being amazing ✨
                </div>
              </div>

              {/* Bottom tier */}
              <div style={{
                width: 'clamp(300px, 68vw, 435px)', height: 88,
                background: 'linear-gradient(160deg, #aef3ff 0%, #8be9fd 45%, #52c8e8 100%)',
                borderRadius: '0 0 18px 18px', position: 'relative', overflow: 'hidden',
                boxShadow: '0 10px 32px rgba(139,233,253,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
              }}>
                {Array.from({ length: 11 }).map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute', top: -2, left: `${1 + i * 9.5}%`,
                    width: '5%', height: 16,
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.3))',
                    borderRadius: '0 0 50% 50%',
                  }} />
                ))}
                <div style={{ position: 'absolute', left: '5%', top: 0, bottom: 0, width: '8%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)', borderRadius: 4 }} />
                {/* Dots two rows */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute', width: 12, height: 12, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.5)',
                    top: 30 + (i % 2) * 26, left: `${5 + i * 9.5}%`,
                    boxShadow: '0 0 5px rgba(255,255,255,0.6)',
                  }} />
                ))}
              </div>

              {/* Cake board */}
              <div style={{
                width: 'clamp(320px, 74vw, 465px)', height: 16,
                background: 'linear-gradient(to bottom, #e8b830, #b88a10)',
                borderRadius: '0 0 6px 6px',
                boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
              }} />
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            {!micActive && !micError && (
              <button onClick={startMic} className="glow-button" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                🎤 Enable Microphone to Blow
              </button>
            )}
            {micActive && (
              <div className="glass" style={{ padding: '10px 18px', fontSize: '0.8rem', color: '#8be9fd', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ animation: 'heartbeat 0.8s ease-in-out infinite' }}>🎤</span>
                  Listening… take a deep breath and blow!
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${micLevel}%`,
                    borderRadius: 4,
                    background: micLevel > 60
                      ? 'linear-gradient(90deg, #50fa7b, #ffe066)'
                      : 'linear-gradient(90deg, #8be9fd, #bd93f9)',
                    transition: 'width 0.08s ease, background 0.2s',
                  }} />
                </div>
              </div>
            )}
            {micError && (
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                Mic unavailable — tap each flame to blow it out 🔥
              </div>
            )}
            {!micActive && (
              <button
                onClick={() => { handleBlow(0); setTimeout(() => handleBlow(1), 600); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', textDecoration: 'underline' }}
              >
                or blow all out at once
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fireworks canvas */}
      {showFireworks && (
        <canvas ref={fwCanvasRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 5 }} />
      )}

      {/* Final message */}
      {showFinal && (
        <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ zIndex: 20, textAlign: 'center', padding: '1.5rem' }}>
          <div style={{
            fontSize: 'clamp(2rem, 8vw, 4.5rem)', fontWeight: 900,
            background: 'linear-gradient(135deg, #ff79c6, #ffe066, #bd93f9)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent', lineHeight: 1.15,
            filter: 'drop-shadow(0 0 20px rgba(255,121,198,0.5))',
            animation: 'bubblePop 0.7s ease forwards',
          }}>
            Happy 22nd Birthday 🎉
          </div>
          <div style={{ fontSize: 'clamp(1rem, 4vw, 1.4rem)', color: '#bd93f9', marginTop: '1rem', opacity: 0.9 }}>
            You are very very precious and always stay happy. Happy Birthday 💛
          </div>
          <button onClick={onDone} className="glow-button" style={{ marginTop: '2rem' }}>
            See your birthday surprise →
          </button>
        </div>
      )}
    </div>
  );
}
