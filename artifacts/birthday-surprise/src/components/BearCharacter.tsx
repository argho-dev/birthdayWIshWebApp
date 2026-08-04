import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { spawnConfetti, spawnFloatingHearts } from './ConfettiEffect';

type BearMood = 'happy' | 'love' | 'wave' | 'dance';

interface BearProps {
  size?: number;
  mood?: BearMood;
  name?: string;
  color?: string;
}

const BearSVG = ({ color = '#d4856a', size = 120 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Body */}
    <ellipse cx="60" cy="78" rx="32" ry="35" fill={color} />
    {/* Head */}
    <circle cx="60" cy="45" r="28" fill={color} />
    {/* Ears */}
    <circle cx="36" cy="22" r="12" fill={color} />
    <circle cx="84" cy="22" r="12" fill={color} />
    {/* Inner ears */}
    <circle cx="36" cy="22" r="7" fill="#f4a7b9" />
    <circle cx="84" cy="22" r="7" fill="#f4a7b9" />
    {/* Eyes */}
    <circle cx="50" cy="43" r="5" fill="#1a1a2e" />
    <circle cx="70" cy="43" r="5" fill="#1a1a2e" />
    {/* Eye shine */}
    <circle cx="52" cy="41" r="2" fill="white" />
    <circle cx="72" cy="41" r="2" fill="white" />
    {/* Nose */}
    <ellipse cx="60" cy="53" rx="5" ry="3.5" fill="#c26c5a" />
    {/* Mouth */}
    <path d="M55 57 Q60 62 65 57" stroke="#c26c5a" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Belly */}
    <ellipse cx="60" cy="82" rx="18" ry="20" fill="#f4c5a7" />
    {/* Arms */}
    <ellipse cx="28" cy="78" rx="12" ry="8" fill={color} transform="rotate(-30 28 78)" />
    <ellipse cx="92" cy="78" rx="12" ry="8" fill={color} transform="rotate(30 92 78)" />
    {/* Legs */}
    <ellipse cx="46" cy="108" rx="11" ry="8" fill={color} />
    <ellipse cx="74" cy="108" rx="11" ry="8" fill={color} />
    {/* Heart on chest */}
    <path d="M60 72 C58 70 54 70 54 74 C54 78 60 82 60 82 C60 82 66 78 66 74 C66 70 62 70 60 72 Z" fill="#ff79c6" opacity="0.8" />
  </svg>
);

const CoupleBearSVG = ({ size = 200 }: { size?: number }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Bear 1 (left - brown) */}
    <ellipse cx="55" cy="100" rx="28" ry="32" fill="#d4856a" />
    <circle cx="55" cy="68" r="24" fill="#d4856a" />
    <circle cx="34" cy="50" r="10" fill="#d4856a" />
    <circle cx="76" cy="50" r="10" fill="#d4856a" />
    <circle cx="34" cy="50" r="6" fill="#f4a7b9" />
    <circle cx="76" cy="50" r="6" fill="#f4a7b9" />
    <circle cx="47" cy="65" r="4" fill="#1a1a2e" />
    <circle cx="63" cy="65" r="4" fill="#1a1a2e" />
    <circle cx="48.5" cy="63.5" r="1.5" fill="white" />
    <circle cx="64.5" cy="63.5" r="1.5" fill="white" />
    <ellipse cx="55" cy="73" rx="4" ry="3" fill="#c26c5a" />
    <path d="M51 77 Q55 81 59 77" stroke="#c26c5a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <ellipse cx="55" cy="105" rx="16" ry="17" fill="#f4c5a7" />
    {/* Bear 2 (right - pink) */}
    <ellipse cx="145" cy="100" rx="28" ry="32" fill="#e8a0c0" />
    <circle cx="145" cy="68" r="24" fill="#e8a0c0" />
    <circle cx="124" cy="50" r="10" fill="#e8a0c0" />
    <circle cx="166" cy="50" r="10" fill="#e8a0c0" />
    <circle cx="124" cy="50" r="6" fill="#f9d0e0" />
    <circle cx="166" cy="50" r="6" fill="#f9d0e0" />
    <circle cx="137" cy="65" r="4" fill="#1a1a2e" />
    <circle cx="153" cy="65" r="4" fill="#1a1a2e" />
    <circle cx="138.5" cy="63.5" r="1.5" fill="white" />
    <circle cx="154.5" cy="63.5" r="1.5" fill="white" />
    <ellipse cx="145" cy="73" rx="4" ry="3" fill="#c06080" />
    <path d="M141 77 Q145 81 149 77" stroke="#c06080" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <ellipse cx="145" cy="105" rx="16" ry="17" fill="#f9d0e0" />
    {/* Hugging arms */}
    <ellipse cx="87" cy="92" rx="20" ry="9" fill="#d4856a" transform="rotate(-20 87 92)" />
    <ellipse cx="113" cy="92" rx="20" ry="9" fill="#e8a0c0" transform="rotate(20 113 92)" />
    {/* Heart between them */}
    <path d="M100 72 C98 69 93 69 93 74 C93 79 100 85 100 85 C100 85 107 79 107 74 C107 69 102 69 100 72 Z" fill="#ff2d78" />
    {/* Blush */}
    <ellipse cx="41" cy="72" rx="8" ry="5" fill="#ffb8c8" opacity="0.5" />
    <ellipse cx="159" cy="72" rx="8" ry="5" fill="#ffb8c8" opacity="0.5" />
  </svg>
);

export default function BearCharacter({ size = 120, mood = 'happy', name, color = '#d4856a' }: BearProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    if (mood === 'dance') {
      tl.to(ref.current, { rotation: 10, duration: 0.4, ease: 'sine.inOut' })
        .to(ref.current, { rotation: -10, duration: 0.4, ease: 'sine.inOut' });
    } else {
      tl.to(ref.current, { y: -10, duration: 1.2, ease: 'sine.inOut' });
    }
  }, [mood]);

  const handleClick = (e: React.MouseEvent) => {
    setClicked(true);
    spawnFloatingHearts(e.clientX, e.clientY);
    spawnConfetti();
    gsap.to(ref.current, { scale: 1.3, duration: 0.2, yoyo: true, repeat: 1 });
    setTimeout(() => setClicked(false), 1000);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={ref}
        className="bear cursor-pointer select-none"
        onClick={handleClick}
        title="Click me!"
      >
        <BearSVG color={color} size={size} />
      </div>
      {name && (
        <span className="text-sm font-medium" style={{ color: '#ff79c6' }}>{name}</span>
      )}
      {clicked && (
        <div className="absolute" style={{ fontSize: '2rem', animation: 'floatUp 1s ease forwards' }}>
          💕
        </div>
      )}
    </div>
  );
}

export { CoupleBearSVG, BearSVG };
