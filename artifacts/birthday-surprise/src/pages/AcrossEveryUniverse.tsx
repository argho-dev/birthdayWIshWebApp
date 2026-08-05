import { useEffect, useRef, useState, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Universe data ────────────────────────────────────────── */
const ALTERNATE_TIMELINES = [
  "We met... but never spoke.",
  "We lived in different cities.",
  "You graduated before I arrived.",
  "We became strangers.",
  "We crossed paths... without knowing.",
  "We laughed together... but forgot each other.",
  "I saw you once, across a crowded room.",
  "We were neighbors who never said hello.",
  "You took a different path that morning.",
  "We shared a class, but not a word.",
  "I almost introduced myself. Almost.",
  "We were friends of friends, never more.",
  "A delayed train kept us apart forever.",
  "We were in the same city, different worlds.",
  "You moved away the summer before.",
  "I chose a different college.",
  "We were childhood strangers.",
  "A missed call changed everything.",
  "We met too early to understand each other.",
  "You were always meant for somewhere else.",
  "Our timelines never overlapped.",
  "We met at the wrong moment in life.",
  "I never found the courage to say hello.",
  "We were parallel lines, never meeting.",
  "A small detour kept us apart.",
  "We spoke once, and I forgot your name.",
  "You were always just out of reach.",
  "We existed in the same story, different chapters.",
  "I think about the version of us that never was.",
  "We were almost something beautiful.",
  "You disappeared before I could find you.",
  "We met in passing, like ships in the night.",
  "I waited, but you never came.",
  "We were written in pencil, not ink.",
  "A simple yes would have changed everything.",
  "We were a story that never got to begin.",
  "You left before I arrived.",
  "I was always five minutes behind you.",
  "We were lost in translation.",
  "A different city. A different life.",
  "We never found the right words.",
  "You were the road not taken.",
  "We orbited each other, never touching.",
  "A single decision separated us forever.",
  "We met... but the timing was wrong.",
  "I loved you in a universe you never entered.",
  "We were echoes of each other.",
  "You were always just around the corner.",
  "We shared a heartbeat, worlds apart.",
  "I searched for you in every face.",
  "We were a dream that faded by morning.",
  "You were the answer to a question I forgot.",
  "We existed between the lines of each other's story.",
  "I carried your name without knowing it.",
  "We were the same song in different keys.",
  "A different ending to the same beginning.",
  "You were the light I kept missing.",
  "We were almost brave enough.",
  "I remember the moment I didn't meet you.",
  "We were two people who could have been one story.",
  "You walked the path I didn't take.",
  "We were written for each other in a different book.",
  "I glimpsed you, once, through a train window.",
  "We were kindred souls in different lifetimes.",
  "You were always the universe away.",
  "We were the silence between the notes.",
  "I spent years looking for someone like you.",
  "We were starlight arriving too late.",
  "You were the chapter I never reached.",
  "We were a love letter sent to the wrong address.",
  "I heard your laugh once, and forgot it slowly.",
  "We were sunrise and sunset, never meeting.",
  "You were the word on the tip of my tongue.",
  "We were the almost-touch, the almost-look.",
  "I dreamed of a version of us that never woke.",
  "We were two stars that never shared the same sky.",
  "You were the gentle ache of something unnamed.",
  "We were the map without a destination.",
  "I watched you leave a room I'd just entered.",
  "We were beautiful, in the universe where we tried.",
];

/* Deterministic universe data from index */
function makeUniverse(idx: number) {
  const hue = (idx * 137.508) % 360;
  const sat = 55 + (idx % 3) * 15;
  const lit = 50 + (idx % 4) * 8;
  const color = new THREE.Color(`hsl(${hue}, ${sat}%, ${lit}%)`);
  const size = 0.18 + (idx % 7) * 0.06;
  // Distribute in a sphere shell — 3D galaxy spread
  const phi   = Math.acos(-1 + (2 * idx) / TOTAL);
  const theta = Math.sqrt(TOTAL * Math.PI) * phi;
  const r     = 6 + (idx % 5) * 2.5;
  const x = r * Math.sin(phi) * Math.cos(theta) + (Math.sin(idx * 0.7) * 2);
  const y = r * Math.sin(phi) * Math.sin(theta) + (Math.cos(idx * 0.9) * 1.5);
  const z = r * Math.cos(phi) + (Math.sin(idx * 1.1) * 1.5);
  const text = ALTERNATE_TIMELINES[idx % ALTERNATE_TIMELINES.length];
  return { id: idx, number: idx + 1, color, size, position: [x, y, z] as [number, number, number], text };
}

const TOTAL = 80;

/* ─── Sound synthesis (Web Audio API) ─────────────────────── */
let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playChime(freq = 880, duration = 0.4, volume = 0.12) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}

function playCosmicPulse() {
  try {
    const ctx = getAudioCtx();
    [220, 440, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.05 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.5);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 0.5);
    });
  } catch (_) {}
}

function playOrchestraSwell() {
  try {
    const ctx = getAudioCtx();
    const freqs = [261.63, 329.63, 392, 523.25, 659.25];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 1.2);
      gain.gain.setValueAtTime(0.07, ctx.currentTime + 2.5);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 5);
      osc.start();
      osc.stop(ctx.currentTime + 5);
    });
  } catch (_) {}
}

/* ─── Universe Sphere ──────────────────────────────────────── */
interface SphereData { id: number; number: number; color: THREE.Color; size: number; position: [number,number,number]; text: string }

function UniverseSphere({
  data, onClick, isHovered, setHovered, isRevealed, isCorrect, isSelected,
}: {
  data: SphereData;
  onClick: (d: SphereData) => void;
  isHovered: boolean;
  setHovered: (id: number | null) => void;
  isRevealed: boolean;
  isCorrect: boolean;
  isSelected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    t.current += delta;
    if (!meshRef.current) return;
    // Gentle float
    meshRef.current.position.y = data.position[1] + Math.sin(t.current * 0.4 + data.id) * 0.15;
    meshRef.current.rotation.y += delta * 0.15;
    // Scale on hover
    const targetScale = isSelected ? 2.2 : isHovered ? 1.35 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    // Glow pulse
    if (glowRef.current) {
      const pulse = 1 + Math.sin(t.current * 2) * 0.15;
      const gs = isHovered || isSelected ? 1.8 * pulse : 1.3 * pulse;
      glowRef.current.scale.set(gs, gs, gs);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        isSelected ? 0.35 : isHovered ? 0.22 : 0.1;
    }
  });

  const opacity = isRevealed ? (isCorrect ? 1 : 0.05) : 1;

  return (
    <group position={data.position}>
      {/* Outer glow shell */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[data.size * 1.6, 16, 16]} />
        <meshBasicMaterial color={data.color} transparent opacity={0.1} depthWrite={false} />
      </mesh>

      {/* Main glass sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(data); playCosmicPulse(); }}
        onPointerEnter={() => { setHovered(data.id); playChime(440 + data.id * 7, 0.3, 0.1); }}
        onPointerLeave={() => setHovered(null)}
      >
        <sphereGeometry args={[data.size, 32, 32]} />
        <meshStandardMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={isSelected ? 3 : isHovered ? 1.8 : 0.9}
          transparent
          opacity={opacity * 0.82}
          roughness={0.05}
          metalness={0.15}
        />
      </mesh>

      {/* Inner bright core */}
      <mesh>
        <sphereGeometry args={[data.size * 0.35, 16, 16]} />
        <meshBasicMaterial color="white" transparent opacity={opacity * (isSelected ? 0.95 : 0.4)} />
      </mesh>

      {/* Point light inside */}
      <pointLight color={data.color} intensity={isSelected ? 6 : isHovered ? 2 : 0.8} distance={3} />
    </group>
  );
}

/* ─── Camera fly-to ────────────────────────────────────────── */
function CameraRig({ target, flying, onArrived }: { target: THREE.Vector3 | null; flying: boolean; onArrived: () => void }) {
  const { camera } = useThree();
  const arrivedRef = useRef(false);

  useFrame(() => {
    if (!flying || !target) return;
    const dest = target.clone().add(new THREE.Vector3(0, 0, 0.6));
    const dist = camera.position.distanceTo(dest);
    camera.position.lerp(dest, 0.04);
    camera.lookAt(target);
    if (dist < 0.5 && !arrivedRef.current) {
      arrivedRef.current = true;
      onArrived();
    }
  });

  useEffect(() => { arrivedRef.current = false; }, [target]);
  return null;
}

/* ─── Shooting Star ────────────────────────────────────────── */
function ShootingStar() {
  const ref = useRef<THREE.Mesh>(null!);
  const state = useRef({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0 });

  useEffect(() => {
    const reset = () => {
      state.current = {
        x: (Math.random() - 0.5) * 30,
        y: 8 + Math.random() * 6,
        z: (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.15 - Math.random() * 0.15,
        vz: (Math.random() - 0.5) * 0.1,
        life: 0,
        maxLife: 80 + Math.random() * 60,
      };
    };
    reset();
  }, []);

  useFrame(() => {
    const s = state.current;
    s.life++;
    s.x += s.vx; s.y += s.vy; s.z += s.vz;
    if (ref.current) {
      ref.current.position.set(s.x, s.y, s.z);
      const fade = 1 - s.life / s.maxLife;
      (ref.current.material as THREE.MeshBasicMaterial).opacity = fade * 0.9;
    }
    if (s.life >= s.maxLife) {
      s.life = 0;
      s.x = (Math.random() - 0.5) * 30;
      s.y = 10 + Math.random() * 5;
      s.z = (Math.random() - 0.5) * 20;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.04, 6, 6]} />
      <meshBasicMaterial color="white" transparent opacity={0.8} />
    </mesh>
  );
}

/* ─── Scene ────────────────────────────────────────────────── */
function Scene({
  universes, correctId, onSelect, flyTarget, onArrived, isRevealed,
}: {
  universes: SphereData[];
  correctId: number;
  onSelect: (d: SphereData) => void;
  flyTarget: THREE.Vector3 | null;
  onArrived: () => void;
  isRevealed: boolean;
}) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const controlsRef = useRef<any>(null);

  const handleSelect = useCallback((d: SphereData) => {
    setSelectedId(d.id);
    onSelect(d);
  }, [onSelect]);

  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={1} color="#8888ff" />

      {/* Deep space starfield */}
      <Stars radius={80} depth={60} count={6000} factor={4} saturation={0.5} fade speed={0.3} />

      {/* Cosmic particles */}
      <Sparkles count={120} scale={25} size={1.2} speed={0.2} color="#bd93f9" opacity={0.4} />
      <Sparkles count={80} scale={18} size={0.8} speed={0.15} color="#ff79c6" opacity={0.3} />

      {/* Shooting stars */}
      {Array.from({ length: 5 }).map((_, i) => <ShootingStar key={i} />)}

      {/* Universes */}
      {universes.map((u) => (
        <UniverseSphere
          key={u.id}
          data={u}
          onClick={handleSelect}
          isHovered={hoveredId === u.id}
          setHovered={setHoveredId}
          isRevealed={isRevealed}
          isCorrect={u.id === correctId}
          isSelected={selectedId === u.id}
        />
      ))}

      {/* Camera control */}
      <CameraRig target={flyTarget} flying={!!flyTarget} onArrived={onArrived} />

      <OrbitControls
        ref={controlsRef}
        enabled={!flyTarget}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.4}
        zoomSpeed={0.6}
        minDistance={3}
        maxDistance={28}
        makeDefault
      />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.15} luminanceSmoothing={0.9} intensity={1.8} />
      </EffectComposer>
    </>
  );
}

/* ─── Narration typewriter ─────────────────────────────────── */
const NARRATION_LINES = [
  "They say...",
  "every choice creates another universe.",
  "",
  "Some universes never meet.",
  "",
  "Some meet for only a moment.",
  "",
  "But somewhere...",
  "",
  "one universe was always waiting for you.",
];

function NarrationOverlay({ onDone }: { onDone: () => void }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Try Web Speech API narration
    try {
      const utter = new SpeechSynthesisUtterance(
        "They say... every choice creates another universe. Some universes never meet. Some meet for only a moment. But somewhere... one universe was always waiting for you."
      );
      utter.rate = 0.78;
      utter.pitch = 0.85;
      utter.volume = 0.7;
      const voices = window.speechSynthesis.getVoices();
      const male = voices.find(v => v.name.toLowerCase().includes('male') || v.name.includes('Daniel') || v.name.includes('David') || v.name.includes('Alex'));
      if (male) utter.voice = male;
      window.speechSynthesis.speak(utter);
    } catch (_) {}

    return () => { try { window.speechSynthesis.cancel(); } catch (_) {} };
  }, []);

  useEffect(() => {
    const line = NARRATION_LINES[lineIdx] ?? '';
    if (charIdx < line.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), 45);
      return () => clearTimeout(t);
    }
    if (lineIdx < NARRATION_LINES.length - 1) {
      const delay = line === '' ? 300 : 900;
      const t = setTimeout(() => { setLineIdx(i => i + 1); setCharIdx(0); }, delay);
      return () => clearTimeout(t);
    }
    // All lines done
    const t = setTimeout(() => { setDone(true); setTimeout(onDone, 800); }, 1200);
    return () => clearTimeout(t);
  }, [lineIdx, charIdx, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: done ? 0 : 1 }}
      transition={{ duration: 0.8 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 480, padding: '2rem' }}>
        {NARRATION_LINES.slice(0, lineIdx + 1).map((line, i) => (
          <div key={i} style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
            fontWeight: 300,
            color: i === lineIdx ? '#f8f8f2' : 'rgba(248,248,242,0.55)',
            lineHeight: 1.9,
            letterSpacing: '0.04em',
            fontStyle: 'italic',
            textShadow: '0 0 30px rgba(189,147,249,0.5)',
            minHeight: '1.9em',
            transition: 'color 0.5s',
          }}>
            {i === lineIdx ? line.slice(0, charIdx) : line}
            {i === lineIdx && charIdx < line.length && (
              <span style={{ opacity: Math.sin(Date.now() / 300) > 0 ? 1 : 0, color: '#bd93f9' }}>│</span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Universe modal ───────────────────────────────────────── */
function UniverseModal({
  data, isCorrect, onClose, onReveal,
}: {
  data: SphereData;
  isCorrect: boolean;
  onClose: () => void;
  onReveal: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const colorHex = '#' + data.color.getHexString();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(12px)',
        padding: '1.5rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        style={{
          width: 'min(420px, 92vw)',
          background: 'linear-gradient(135deg, rgba(10,6,35,0.97) 0%, rgba(18,10,50,0.97) 100%)',
          border: `1px solid ${colorHex}44`,
          borderRadius: 28,
          padding: '2.5rem 2rem 2rem',
          boxShadow: `0 0 0 1px ${colorHex}22, 0 40px 100px rgba(0,0,0,0.8), 0 0 80px ${colorHex}33`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top glow */}
        <div style={{
          position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
          width: 300, height: 160,
          background: `radial-gradient(ellipse, ${colorHex}30 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Universe art — abstract orb illustration */}
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, white 0%, ${colorHex} 40%, ${colorHex}44 80%, transparent 100%)`,
          margin: '0 auto 1.5rem',
          boxShadow: `0 0 40px ${colorHex}88, 0 0 80px ${colorHex}44`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `conic-gradient(from 0deg, transparent 0%, ${colorHex}44 25%, transparent 50%, ${colorHex}22 75%, transparent 100%)`,
            borderRadius: '50%',
            animation: 'spin 8s linear infinite',
          }} />
        </div>

        {/* Universe number */}
        <div style={{
          textAlign: 'center',
          fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase',
          color: colorHex, fontWeight: 700, marginBottom: '0.6rem', opacity: 0.8,
        }}>
          Universe {data.number}
        </div>

        {/* Timeline text */}
        <div style={{
          textAlign: 'center',
          fontSize: 'clamp(1rem, 3vw, 1.25rem)',
          fontWeight: 300,
          color: '#f8f8f2',
          lineHeight: 1.7,
          fontStyle: 'italic',
          letterSpacing: '0.02em',
          marginBottom: '2rem',
          padding: '0 0.5rem',
        }}>
          "{data.text}"
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 16,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%', width: 30, height: 30,
            cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>

        {/* But wait — this could be the one */}
        {!revealed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{
              fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.1em', marginBottom: '0.8rem',
            }}>
              Is this our universe?
            </div>
            <button
              onClick={() => {
                setRevealed(true);
                if (isCorrect) {
                  setTimeout(() => { onReveal(); }, 600);
                }
              }}
              style={{
                background: `linear-gradient(135deg, ${colorHex}22, ${colorHex}44)`,
                border: `1px solid ${colorHex}66`,
                borderRadius: 20, padding: '0.55rem 1.8rem',
                cursor: 'pointer', color: '#f8f8f2',
                fontSize: '0.85rem', fontWeight: 600,
                letterSpacing: '0.04em',
                boxShadow: `0 0 20px ${colorHex}22`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 30px ${colorHex}55`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${colorHex}22`; }}
            >
              ✦ Enter this universe
            </button>
            {revealed && !isCorrect && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  marginTop: '1rem', fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.4)', fontStyle: 'italic',
                }}
              >
                Not quite... keep searching.
              </motion.div>
            )}
          </motion.div>
        )}

        {revealed && !isCorrect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', marginTop: '1rem' }}
          >
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
              Not quite... keep searching.
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── Found overlay ────────────────────────────────────────── */
function FoundOverlay({ onContinue }: { onContinue: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    playOrchestraSwell();
    const t1 = setTimeout(() => setPhase(1), 1200);
    const t2 = setTimeout(() => setPhase(2), 4000);
    const t3 = setTimeout(() => setPhase(3), 7500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, rgba(20,5,60,0.95) 0%, rgba(0,0,0,0.98) 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Particle burst effect */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: '50vw', y: '50vh', opacity: 1, scale: 1 }}
            animate={{
              x: `${50 + (Math.cos((i / 40) * Math.PI * 2) * 60)}vw`,
              y: `${50 + (Math.sin((i / 40) * Math.PI * 2) * 60)}vh`,
              opacity: 0, scale: 0.3,
            }}
            transition={{ duration: 2.5, delay: 0.3, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 6, height: 6,
              borderRadius: '50%',
              background: `hsl(${(i / 40) * 360}, 100%, 70%)`,
              boxShadow: `0 0 12px hsl(${(i / 40) * 360}, 100%, 70%)`,
              left: 0, top: 0,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>

      {/* Heart */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: phase >= 0 ? 1 : 0, opacity: phase >= 0 ? 1 : 0 }}
        transition={{ type: 'spring', damping: 12, delay: 0.5 }}
        style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 30px rgba(255,100,160,0.8))' }}
      >
        ❤️
      </motion.div>

      {/* Line 1 */}
      <AnimatePresence>
        {phase >= 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            style={{
              fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
              fontWeight: 300, fontStyle: 'italic',
              color: '#f8f8f2', textAlign: 'center',
              textShadow: '0 0 40px rgba(255,121,198,0.8), 0 0 80px rgba(189,147,249,0.4)',
              letterSpacing: '0.04em', marginBottom: '1rem',
            }}
          >
            You found our universe.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Line 2 */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            style={{
              maxWidth: 480, textAlign: 'center',
              fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)',
              fontWeight: 300,
              color: 'rgba(248,248,242,0.75)',
              lineHeight: 1.8,
              fontStyle: 'italic',
              letterSpacing: '0.03em',
              padding: '0 2rem',
            }}
          >
            "Maybe every universe tells a different story...
            <br />
            But I'm grateful ours existed."
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stars rain in */}
      {phase >= 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}
        >
          {Array.from({ length: 25 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, x: `${Math.random() * 100}vw`, opacity: 0 }}
              animate={{ y: '110vh', opacity: [0, 1, 1, 0] }}
              transition={{ duration: 3 + Math.random() * 4, delay: Math.random() * 2, repeat: Infinity }}
              style={{
                position: 'absolute', top: 0,
                fontSize: `${0.6 + Math.random() * 1}rem`,
                color: `hsl(${Math.random() * 60 + 280}, 100%, 80%)`,
                textShadow: '0 0 10px currentColor',
              }}
            >
              ✦
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Continue button */}
      <AnimatePresence>
        {phase >= 3 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            onClick={onContinue}
            style={{
              marginTop: '3rem',
              background: 'linear-gradient(135deg, rgba(255,121,198,0.2) 0%, rgba(189,147,249,0.25) 100%)',
              border: '1px solid rgba(255,121,198,0.5)',
              borderRadius: 30, padding: '0.8rem 2.8rem',
              cursor: 'pointer', color: '#f8f8f2',
              fontSize: '1rem', fontWeight: 600,
              letterSpacing: '0.08em',
              boxShadow: '0 0 30px rgba(255,121,198,0.3), 0 0 60px rgba(189,147,249,0.15)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 50px rgba(255,121,198,0.5), 0 0 100px rgba(189,147,249,0.25)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(255,121,198,0.3), 0 0 60px rgba(189,147,249,0.15)'; }}
          >
            Continue →
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Explore hint ─────────────────────────────────────────── */
function ExploreHint() {
  const [visible, setVisible] = useState(true);
  useEffect(() => { const t = setTimeout(() => setVisible(false), 5000); return () => clearTimeout(t); }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', bottom: '5vh', left: '50%', transform: 'translateX(-50%)',
            zIndex: 100, textAlign: 'center',
            fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.1em', pointerEvents: 'none',
          }}
        >
          Drag to explore · Scroll to zoom · Click a universe
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main export ──────────────────────────────────────────── */
export default function AcrossEveryUniverse({ onDismiss }: { onDismiss: () => void }) {
  const [phase, setPhase] = useState<'black' | 'narration' | 'explore' | 'modal' | 'found'>('black');
  const [selectedUniverse, setSelectedUniverse] = useState<SphereData | null>(null);
  const [flyTarget, setFlyTarget] = useState<THREE.Vector3 | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Randomize correct universe once on mount
  const [correctId] = useState(() => Math.floor(Math.random() * TOTAL));
  const universes = useMemo(() => Array.from({ length: TOTAL }, (_, i) => makeUniverse(i)), []);

  // Start fade-in then narration
  useEffect(() => {
    const t = setTimeout(() => setPhase('narration'), 600);
    return () => clearTimeout(t);
  }, []);

  const handleNarrationDone = useCallback(() => { setPhase('explore'); }, []);

  const handleSelect = useCallback((data: SphereData) => {
    setSelectedUniverse(data);
    setFlyTarget(new THREE.Vector3(...data.position));
    setPhase('modal');
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedUniverse(null);
    setFlyTarget(null);
    setPhase('explore');
  }, []);

  const handleReveal = useCallback(() => {
    setIsRevealed(true);
    setPhase('found');
    setSelectedUniverse(null);
  }, []);

  const handleArrived = useCallback(() => { /* camera is close enough */ }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 95, background: '#000508' }}>
      {/* 3D scene always present */}
      <Canvas
        camera={{ position: [0, 0, 18], fov: 65 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <Scene
            universes={universes}
            correctId={correctId}
            onSelect={handleSelect}
            flyTarget={flyTarget}
            onArrived={handleArrived}
            isRevealed={isRevealed}
          />
        </Suspense>
      </Canvas>

      {/* Initial black fade */}
      <AnimatePresence>
        {phase === 'black' && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 500 }}
          />
        )}
      </AnimatePresence>

      {/* Narration overlay */}
      {phase === 'narration' && <NarrationOverlay onDone={handleNarrationDone} />}

      {/* Page title */}
      {(phase === 'explore' || phase === 'modal') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            zIndex: 100,
            padding: '1.2rem 1.5rem',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{
              fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)',
              fontWeight: 700,
              color: '#f8f8f2',
              letterSpacing: '0.06em',
              textShadow: '0 0 20px rgba(189,147,249,0.6)',
            }}>
              🌌 Across Every Universe
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginTop: 2 }}>
              One universe was always waiting for you
            </div>
          </div>
          <div style={{
            fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.1em', textAlign: 'right',
          }}>
            {TOTAL} universes · Find yours
          </div>
        </motion.div>
      )}

      {/* Explore hint */}
      {phase === 'explore' && <ExploreHint />}

      {/* Universe modal */}
      <AnimatePresence>
        {phase === 'modal' && selectedUniverse && (
          <UniverseModal
            data={selectedUniverse}
            isCorrect={selectedUniverse.id === correctId}
            onClose={handleModalClose}
            onReveal={handleReveal}
          />
        )}
      </AnimatePresence>

      {/* Found sequence */}
      <AnimatePresence>
        {phase === 'found' && (
          <FoundOverlay onContinue={onDismiss} />
        )}
      </AnimatePresence>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
