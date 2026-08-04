import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Starfield from '../components/Starfield';
import Clock from '../components/Clock';

interface EntryProps {
  onContinue: () => void;
}

export default function Entry({ onContinue }: EntryProps) {
  const [showClock, setShowClock] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(true); // show immediately for preview
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Entry screen loaded — starfield starting ✨');
    const t1 = setTimeout(() => setShowClock(true), 800);
    const t2 = setTimeout(() => {
      setShowText(true);
      setTimeout(() => {
        if (line1Ref.current) {
          gsap.fromTo(line1Ref.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' }
          );
        }
        if (line2Ref.current) {
          gsap.fromTo(line2Ref.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', delay: 0.8 }
          );
        }
      }, 50);
    }, 2000);
    const t3 = setTimeout(() => {
      setShowButton(true);
      setTimeout(() => {
        if (buttonRef.current) {
          gsap.fromTo(buttonRef.current,
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' }
          );
        }
      }, 50);
    }, 4500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center page-fade-in" style={{ background: 'transparent' }}>
      <Starfield />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-4">
        {/* Clock */}
        {showClock && (
          <div style={{ animation: 'bubblePop 0.8s ease forwards' }}>
            <Clock />
          </div>
        )}

        {/* Text lines */}
        <div className="flex flex-col gap-3">
          <div ref={line1Ref} className="opacity-0 text-2xl md:text-3xl font-light" style={{ color: '#f8f8f2' }}>
            Hey... wait a second 💫
          </div>
          <div ref={line2Ref} className="opacity-0 text-xl md:text-2xl font-light opacity-75" style={{ color: '#bd93f9' }}>
            Something special is coming...
          </div>
        </div>

        {/* Button */}
        {showButton && (
          <div ref={buttonRef} className="opacity-0 mt-4">
            <button
              className="glow-button"
              onClick={onContinue}
            >
              Continue to Today's Surprise →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
