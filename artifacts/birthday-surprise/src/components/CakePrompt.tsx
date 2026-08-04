import { useEffect, useState } from 'react';

interface Props {
  onYes: () => void;
}

const FULL_TEXT = 'Ready for cake cutting? 🎂';

export default function CakePrompt({ onYes }: Props) {
  const [displayed, setDisplayed] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (displayed.length >= FULL_TEXT.length) {
      const t = setTimeout(() => setShowButton(true), 400);
      return () => clearTimeout(t);
    }
    const delay = displayed.length === 0 ? 600 : 55;
    const t = setTimeout(() => {
      setDisplayed(FULL_TEXT.slice(0, displayed.length + 1));
    }, delay);
    return () => clearTimeout(t);
  }, [displayed]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease',
      gap: '2.5rem',
      padding: '2rem',
      boxSizing: 'border-box',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,100,50,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Text */}
      <div style={{
        fontSize: 'clamp(1.6rem, 5vw, 3rem)',
        fontWeight: 700,
        color: '#fff',
        textAlign: 'center',
        letterSpacing: '0.02em',
        lineHeight: 1.3,
        minHeight: '1.4em',
        textShadow: '0 0 40px rgba(255,180,80,0.4)',
      }}>
        {displayed}
        {/* blinking cursor while typing */}
        {displayed.length < FULL_TEXT.length && (
          <span style={{ animation: 'blink 0.8s step-end infinite', color: '#ff79c6' }}>|</span>
        )}
      </div>

      {/* Yes button */}
      <button
        onClick={onYes}
        style={{
          opacity: showButton ? 1 : 0,
          transform: showButton ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.95)',
          transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.3,0.64,1)',
          padding: '0.85rem 3rem',
          fontSize: '1.15rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: '#fff',
          background: 'linear-gradient(135deg, #8b001a, #c8001a, #8b001a)',
          border: '1px solid rgba(255,180,100,0.35)',
          borderRadius: 50,
          cursor: 'pointer',
          boxShadow: `
            0 0 20px rgba(200,0,26,0.5),
            0 0 60px rgba(200,0,26,0.2),
            inset 0 1px 0 rgba(255,255,255,0.1)
          `,
          pointerEvents: showButton ? 'auto' : 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 0 30px rgba(200,0,26,0.8), 0 0 80px rgba(200,0,26,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 0 20px rgba(200,0,26,0.5), 0 0 60px rgba(200,0,26,0.2), inset 0 1px 0 rgba(255,255,255,0.1)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        Yes! 🎉
      </button>

      <style>{`
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
