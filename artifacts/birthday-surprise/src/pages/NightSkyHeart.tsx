import { useEffect, useRef, useState } from 'react';

/* ── Helpers ─────────────────────────────────────────────── */
function heartPt(t: number, scale: number, cx: number, cy: number) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  return { x: cx + x * scale, y: cy + y * scale };
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const HEART_STEPS     = 320;
const DRAW_DURATION   = 4200; // ms — shooting star traces heart
const PARTICLE_DUR    = 2400; // ms — particles fly into position

interface Star { x: number; y: number; r: number; phase: number; speed: number }
function makeStars(W: number, H: number, n: number): Star[] {
  return Array.from({ length: n }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: Math.random() * 1.6 + 0.4,
    phase: Math.random() * Math.PI * 2,
    speed: 0.6 + Math.random() * 1.2,
  }));
}

interface Particle { tx: number; ty: number; sx: number; sy: number; r: number; g: number; b: number }

interface Props { onDismiss: () => void }

export default function NightSkyHeart({ onDismiss }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  const [textAlpha, setTextAlpha] = useState(0);
  const [btnAlpha,  setBtnAlpha]  = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W   = window.innerWidth;
    const H   = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width        = W * dpr;
    canvas.height       = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d')!;

    const cx    = W / 2;
    const cy    = H / 2 - 40;
    const scale = Math.min(W, H) * 0.019;

    /* Pre-compute heart path in CSS-pixel space */
    const heartPath: { x: number; y: number }[] = [];
    for (let i = 0; i <= HEART_STEPS; i++) {
      heartPath.push(heartPt((i / HEART_STEPS) * Math.PI * 2, scale, cx, cy));
    }

    /* Heart bounding box */
    const hLeft   = cx - 16.5 * scale;
    const hRight  = cx + 16.5 * scale;
    const hTop    = cy - 13.2 * scale;
    const hBottom = cy + 13.2 * scale;
    const hW      = hRight - hLeft;
    const hH      = hBottom - hTop;

    const stars     = makeStars(W, H, 160);
    const trail: { x: number; y: number }[] = [];
    const TRAIL_LEN = 38;

    /* Shared mutable state in the closure */
    let particles: Particle[]  = [];
    let photoReady             = false;
    let particleStartTime      = -1;
    let heartDone              = false;
    let fullGlowAlpha          = 0;
    let glowT                  = 0;
    /* Prevent setState spam once values hit 1 */
    let textAlphaVal           = 0;
    let btnAlphaVal            = 0;

    /* ── Load photo & build particle array ─────────────────── */
    const img = new Image();
    const photoIndex = Math.floor(Math.random() * 10) + 1;
    img.src = `/photos/anwesha${photoIndex}.jpg`;

    img.onload = () => {
      /* Offscreen canvas for pixel sampling */
      const offC       = document.createElement('canvas');
      offC.width       = Math.ceil(W);
      offC.height      = Math.ceil(H);
      const oCtx       = offC.getContext('2d')!;

      /* Clip to heart shape */
      oCtx.beginPath();
      heartPath.forEach((pt, i) => (i === 0 ? oCtx.moveTo(pt.x, pt.y) : oCtx.lineTo(pt.x, pt.y)));
      oCtx.closePath();
      oCtx.clip();

      /* Cover: fill heart bounding box, anchor to top so face is visible */
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const boxAspect = hW / hH;
      let dW: number, dH: number;
      if (imgAspect > boxAspect) { dH = hH * 1.15; dW = dH * imgAspect; }
      else                       { dW = hW * 1.15; dH = dW / imgAspect; }
      const dX = cx - dW / 2;
      // Anchor near top of heart so faces aren't cut off
      const dY = hTop - dH * 0.05;
      oCtx.drawImage(img, dX, dY, dW, dH);

      /* Sample pixels — adaptive step so particle count stays reasonable */
      const STEP      = Math.max(4, Math.round(Math.min(W, H) * 0.009));
      const imgData   = oCtx.getImageData(0, 0, offC.width, offC.height);
      const iW        = imgData.width;
      const built: Particle[] = [];

      for (let py = Math.floor(hTop); py < Math.ceil(hBottom); py += STEP) {
        for (let px = Math.floor(hLeft); px < Math.ceil(hRight); px += STEP) {
          if (px < 0 || py < 0 || px >= iW || py >= imgData.height) continue;
          const idx = (py * iW + px) * 4;
          if (imgData.data[idx + 3] < 30) continue; // skip transparent
          /* Scatter: random direction from centre, 30–90% of screen radius */
          const angle = Math.random() * Math.PI * 2;
          const dist  = Math.min(W, H) * (0.30 + Math.random() * 0.55);
          built.push({
            tx: px, ty: py,
            sx: cx + Math.cos(angle) * dist,
            sy: cy + Math.sin(angle) * dist,
            r: imgData.data[idx],
            g: imgData.data[idx + 1],
            b: imgData.data[idx + 2],
          });
        }
      }
      particles  = built;
      photoReady = true;
    };

    /* ── RAF loop ───────────────────────────────────────────── */
    const loop = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      glowT += 0.03;

      /* Starfield */
      for (const s of stars) {
        s.phase += 0.012 * s.speed;
        const blink = (Math.sin(s.phase) + 1) / 2;
        ctx.save();
        ctx.globalAlpha = 0.25 + blink * 0.65;
        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3.5);
        sg.addColorStop(0, 'rgba(220,230,255,1)');
        sg.addColorStop(1, 'rgba(140,160,255,0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      /* ── Phase 1: Trace heart with shooting star ── */
      const elapsed  = now - t0;
      const progress = Math.min(1, elapsed / DRAW_DURATION);
      const stepIdx  = Math.floor(progress * HEART_STEPS);

      if (!heartDone) {
        const curPt = heartPath[Math.min(stepIdx, heartPath.length - 1)];
        if (!curPt) { rafRef.current = requestAnimationFrame(loop); return; }

        trail.push({ x: curPt.x, y: curPt.y });
        if (trail.length > TRAIL_LEN) trail.shift();

        trail.forEach((tp, i) => {
          const frac = (i + 1) / trail.length;
          ctx.save();
          ctx.globalAlpha = frac * 0.85;
          const rr  = 1.5 + frac * 4;
          const tGr = ctx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, rr * 3);
          tGr.addColorStop(0, 'rgba(255,160,220,1)');
          tGr.addColorStop(1, 'rgba(200,80,180,0)');
          ctx.fillStyle = tGr;
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, rr * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        /* Bright star head */
        ctx.save();
        const pS = (Math.sin(glowT * 8) + 1) / 2;
        ctx.shadowBlur  = 18 + pS * 14;
        ctx.shadowColor = 'rgba(255,180,230,1)';
        ctx.globalAlpha = 0.95;
        const g2 = ctx.createRadialGradient(curPt.x, curPt.y, 0, curPt.x, curPt.y, 9);
        g2.addColorStop(0,   'rgba(255,255,255,1)');
        g2.addColorStop(0.5, 'rgba(255,150,210,0.8)');
        g2.addColorStop(1,   'rgba(200,80,180,0)');
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.arc(curPt.x, curPt.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (progress >= 1) heartDone = true;
      }

      /* ── Phase 2: Heart completes — glow builds ── */
      if (heartDone) {
        fullGlowAlpha = Math.min(1, fullGlowAlpha + 0.012);
        const pulse   = (Math.sin(glowT) + 1) / 2;

        /* ── Phase 3: Particle photo assembly ── */
        if (photoReady && particles.length > 0 && fullGlowAlpha >= 0.35) {
          if (particleStartTime < 0) particleStartTime = now;
          const pEl  = now - particleStartTime;
          const pPrg = Math.min(1, pEl / PARTICLE_DUR);
          const pE   = easeInOutCubic(pPrg);

          if (pPrg < 0.97) {
            /* Flying particles */
            for (const p of particles) {
              const px = p.sx + (p.tx - p.sx) * pE;
              const py = p.sy + (p.ty - p.sy) * pE;
              const sz = Math.max(0.5, 2.8 * (1 - pE * 0.65));
              ctx.globalAlpha = 0.65 + pE * 0.35;
              ctx.fillStyle   = `rgb(${p.r},${p.g},${p.b})`;
              ctx.beginPath();
              ctx.arc(px, py, sz, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            /* Fully assembled — draw crisp photo clipped to heart */
            ctx.save();
            ctx.beginPath();
            heartPath.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
            ctx.closePath();
            ctx.clip();
            const imgAspect = img.naturalWidth / img.naturalHeight;
            const boxAspect = hW / hH;
            let dW: number, dH: number;
            if (imgAspect > boxAspect) { dH = hH * 1.15; dW = dH * imgAspect; }
            else                       { dW = hW * 1.15; dH = dW / imgAspect; }
            ctx.globalAlpha = 1;
            // Anchor near top of heart so faces aren't cut off
            ctx.drawImage(img, cx - dW / 2, hTop - dH * 0.05, dW, dH);
            ctx.restore();
          }
        }

        /* Glowing heart outline — always on top of photo */
        ctx.save();
        ctx.beginPath();
        heartPath.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
        ctx.closePath();

        ctx.globalAlpha  = fullGlowAlpha;
        ctx.shadowColor  = 'rgba(255, 80, 160, 0.9)';
        ctx.shadowBlur   = 18 + pulse * 16;
        ctx.strokeStyle  = `rgba(255, 100, 180, ${0.55 + pulse * 0.3})`;
        ctx.lineWidth    = 2.5;
        ctx.stroke();

        ctx.lineWidth    = 7;
        ctx.strokeStyle  = `rgba(255, 150, 200, ${0.18 + pulse * 0.12})`;
        ctx.shadowBlur   = 40;
        ctx.stroke();
        ctx.restore();

        /* Fade in text */
        if (fullGlowAlpha > 0.3 && textAlphaVal < 1) {
          textAlphaVal = Math.min(1, textAlphaVal + 0.025);
          setTextAlpha(textAlphaVal);
        }
        if (fullGlowAlpha > 0.7 && btnAlphaVal < 1) {
          btnAlphaVal = Math.min(1, btnAlphaVal + 0.02);
          setBtnAlpha(btnAlphaVal);
        }
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(loop);
    };

    const t0 = performance.now();
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── JSX ────────────────────────────────────────────────── */
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 95,
      background: 'linear-gradient(180deg, #020411 0%, #060820 40%, #0a0420 100%)',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, display: 'block' }} />

      {/* Text message */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end',
        paddingBottom: '11vh',
        pointerEvents: 'none',
        opacity: textAlpha,
      }}>
        <div style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
          fontWeight: 700,
          color: '#fff',
          textAlign: 'center',
          lineHeight: 1.4,
          textShadow: '0 0 20px rgba(255,120,200,0.9), 0 0 50px rgba(255,80,160,0.6)',
          letterSpacing: '0.03em',
          marginBottom: '1.5rem',
        }}>
          Every star tonight is for you,<br />
          <span style={{ color: '#ff79c6' }}>Anwesha ✨</span>
        </div>
      </div>

      {/* Continue button */}
      {btnAlpha > 0.05 && (
        <button
          onClick={onDismiss}
          style={{
            position: 'absolute', bottom: '5vh', left: '50%',
            transform: 'translateX(-50%)',
            opacity: btnAlpha,
            background: 'rgba(255,80,160,0.12)',
            border: '1px solid rgba(255,120,190,0.4)',
            borderRadius: 24,
            padding: '0.6rem 2rem',
            color: '#ff79c6',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(255,80,160,0.2)',
            letterSpacing: '0.04em',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,80,160,0.22)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow  = '0 0 30px rgba(255,80,160,0.4)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,80,160,0.12)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow  = '0 0 20px rgba(255,80,160,0.2)';
          }}
        >
          Continue ✦
        </button>
      )}
    </div>
  );
}
