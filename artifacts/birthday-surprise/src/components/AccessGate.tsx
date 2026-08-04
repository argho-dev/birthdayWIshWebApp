import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Starfield from './Starfield';

interface AccessGateProps {
  onGranted: () => void;
}

export default function AccessGate({ onGranted }: AccessGateProps) {
  const [denied, setDenied]   = useState(false);
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Always show the gate on every page load — no storage involved
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible || !cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 30, scale: 0.92 },
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' }
    );
  }, [visible]);

  const handleYes = () => {
    if (!cardRef.current) { onGranted(); return; }
    gsap.to(cardRef.current, {
      opacity: 0, scale: 1.05, duration: 0.5, ease: 'power2.in',
      onComplete: onGranted,
    });
  };

  const handleNo = () => setDenied(true);

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#000' }}>
      <Starfield />
      {visible && (
        <div
          ref={cardRef}
          className="glass-card relative z-10 flex flex-col items-center gap-8 text-center px-10 py-12"
          style={{ maxWidth: 420, width: '90%', opacity: 0 }}
        >
          {!denied ? (
            <>
              <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 20px #ff79c6)' }}>💛</div>
              <h1
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
                  fontWeight: 700,
                  color: '#f8f8f2',
                  letterSpacing: '0.02em',
                  lineHeight: 1.3,
                }}
              >
                Are you Anwesha?
              </h1>
              <p style={{ color: '#bd93f9', fontSize: '1rem', opacity: 0.8 }}>
                This experience was made for someone very special.
              </p>
              <div className="flex gap-4 w-full justify-center">
                <button
                  className="glow-button"
                  style={{ padding: '14px 40px', fontSize: '1rem' }}
                  onClick={handleYes}
                >
                  Yes, it's me! 💖
                </button>
                <button
                  onClick={handleNo}
                  style={{
                    padding: '14px 32px',
                    fontSize: '1rem',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 50,
                    color: '#aaa',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  No
                </button>
              </div>
            </>
          ) : (
            <DeniedMessage />
          )}
        </div>
      )}
    </div>
  );
}

function DeniedMessage() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }
    );
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center gap-5" style={{ opacity: 0 }}>
      <div style={{ fontSize: '3rem' }}>💛</div>
      <p style={{ color: '#f8f8f2', fontSize: '1.3rem', fontWeight: 600, lineHeight: 1.5 }}>
        Sorry, this is only made for Anwesha 💛
      </p>
      <p style={{ color: '#bd93f9', fontSize: '0.95rem', opacity: 0.7 }}>
        This page is not for you 🌸
      </p>
    </div>
  );
}
