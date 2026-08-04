import { useEffect, useRef, useState, useMemo } from 'react';
import { spawnConfetti } from './ConfettiEffect';
import img1  from '@assets/anwesha1.jpg';
import img2  from '@assets/anwesha2.jpg';
import img3  from '@assets/anwesha3.jpg';
import img4  from '@assets/anwesha4.jpg';
import img5  from '@assets/anwesha5.jpg';
import img6  from '@assets/anwesha6.jpg';
import img7  from '@assets/anwesha7.jpg';
import img8  from '@assets/anwesha8.jpg';
import img9  from '@assets/anwesha9.jpg';
import img10 from '@assets/anwesha10.jpg';

const ALL_PHOTOS = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10];

const CAPTIONS = [
  'So glad you exist in this world 🌸',
  'Your smile lights up every room 🌸',
  '22 and absolutely glowing 💫',
  'Wishing you endless happiness 🎂',
  'You deserve the whole world and more 🌺',
  'Happy Birthday — stay magical always 💖',
];

const ROTATIONS = ['-3deg', '2deg', '-1.5deg', '2.5deg', '-2deg', '1.5deg'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function BirthdayFinale() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const animRef    = useRef<number>(0);
  const fwInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [phase, setPhase]         = useState<'black' | 'heartbeat' | 'gallery'>('black');
  const [visibleCards, setVisible] = useState<boolean[]>(Array(6).fill(false));

  // Random 6 photos from 10 on every page load
  const POLAROIDS = useMemo(() => {
    const picked = shuffle(ALL_PHOTOS).slice(0, 6);
    return picked.map((img, i) => ({
      img,
      msg: CAPTIONS[i],
      rotate: ROTATIONS[i],
    }));
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('heartbeat'), 800);
    const t2 = setTimeout(() => {
      setPhase('gallery');
      setTimeout(() => spawnConfetti(), 300);
    }, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase !== 'gallery') return;
    POLAROIDS.forEach((_, i) => {
      setTimeout(() => {
        setVisible(prev => { const n = [...prev]; n[i] = true; return n; });
      }, i * 150);
    });
  }, [phase]);

  useEffect(() => {
    if (phase !== 'gallery') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    type P = { x: number; y: number; vx: number; vy: number; color: string; life: number; maxLife: number; r: number };
    type FW = { x: number; y: number; particles: P[] };
    const fws: FW[] = [];
    const COLORS = ['#ff79c6','#bd93f9','#8be9fd','#50fa7b','#ffb86c','#f1fa8c','#ff5555','#ff92d0'];

    const launch = () => {
      const ox = Math.random() * canvas.width;
      const oy = Math.random() * canvas.height * 0.5;
      fws.push({
        x: ox, y: oy,
        particles: Array.from({ length: 80 }, () => {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 7 + 2;
          return { x: ox, y: oy, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, color: COLORS[Math.floor(Math.random()*COLORS.length)], life: 0, maxLife: 60+Math.floor(Math.random()*40), r: Math.random()*2.5+1 };
        }),
      });
    };
    fwInterval.current = setInterval(launch, 900);
    launch(); launch();

    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      fws.forEach(fw => {
        fw.particles.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.vx *= 0.98; p.vy *= 0.98; p.life++;
          const alpha = 1 - p.life / p.maxLife;
          if (alpha <= 0) return;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI*2);
          ctx.fillStyle = p.color + Math.round(alpha*255).toString(16).padStart(2,'0');
          ctx.fill();
        });
      });
      fws.splice(0, fws.length, ...fws.filter(fw => fw.particles.some(p => p.life < p.maxLife)));
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      if (fwInterval.current) clearInterval(fwInterval.current);
      cancelAnimationFrame(animRef.current);
    };
  }, [phase]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#050510',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {phase === 'gallery' && (
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />
      )}

      {phase === 'heartbeat' && (
        <div
          className="heartbeat"
          style={{
            fontSize: 'clamp(80px, 20vw, 140px)',
            filter: 'drop-shadow(0 0 40px #ff2d78) drop-shadow(0 0 80px #ff0050)',
            lineHeight: 1,
            zIndex: 10,
          }}
        >
          ❤️
        </div>
      )}


      {phase === 'gallery' && (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            height: '100vh',
            padding: 'clamp(6px, 1.5vh, 16px) clamp(8px, 2vw, 24px)',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            className="shimmer-text"
            style={{
              fontSize: 'clamp(1rem, 3vw, 1.6rem)',
              fontWeight: 800,
              marginBottom: 'clamp(4px, 1vh, 12px)',
              textAlign: 'center',
              lineHeight: 1.2,
              flexShrink: 0,
            }}
          >
            Happy 22nd Birthday, Anwesha 🎀
          </div>

          {/* 3×2 polaroid grid — fills remaining height */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: 'clamp(6px, 1.5vw, 16px)',
              flex: 1,
              width: '100%',
              maxWidth: 900,
              minHeight: 0,
            }}
          >
            {POLAROIDS.map((p, i) => (
              <div
                key={i}
                style={{
                  opacity:   visibleCards[i] ? 1 : 0,
                  transform: visibleCards[i]
                    ? `rotate(${p.rotate}) scale(1)`
                    : `rotate(${p.rotate}) scale(0.6) translateY(20px)`,
                  transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                  minHeight: 0,
                  display: 'flex',
                }}
              >
                {/* Polaroid frame */}
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 4,
                    padding: 'clamp(4px, 0.6vw, 8px) clamp(4px, 0.6vw, 8px) clamp(18px, 3.5vh, 36px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    minHeight: 0,
                    overflow: 'hidden',
                  }}
                >
                  {/* Photo — fills available space, no crop */}
                  <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img
                      src={p.img}
                      alt=""
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        display: 'block',
                        borderRadius: 2,
                        objectFit: 'contain',
                      }}
                    />
                  </div>

                  {/* Caption */}
                  <div style={{
                    flexShrink: 0,
                    marginTop: 4,
                    textAlign: 'center',
                    fontFamily: "'Caveat', cursive",
                    fontWeight: 700,
                    fontSize: 'clamp(0.7rem, 1.6vw, 1rem)',
                    color: '#c2185b',
                    letterSpacing: '0.03em',
                  }}>
                    {p.msg}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Celebrate button */}
          <button
            className="glow-button"
            style={{ marginTop: 'clamp(4px, 1vh, 12px)', flexShrink: 0 }}
            onClick={() => spawnConfetti()}
          >
            Celebrate! 🎊
          </button>
        </div>
      )}
    </div>
  );
}
