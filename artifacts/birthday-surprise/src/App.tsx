import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { isBirthdayEve, isBirthdayFinalDay } from './lib/surprises';
import Entry from './pages/Entry';
import AccessGate from './components/AccessGate';
import MusicPlayer from './components/MusicPlayer';


const DailySurprise  = lazy(() => import('./pages/DailySurprise'));
const BirthdayCake   = lazy(() => import('./components/BirthdayCake'));
const BirthdayFinale = lazy(() => import('./components/BirthdayFinale'));

type Screen = 'gate' | 'entry' | 'surprise' | 'cake' | 'finale';

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#000' }}>
      <div className="text-6xl heartbeat" style={{ filter: 'drop-shadow(0 0 20px #ff79c6)' }}>
        💖
      </div>
    </div>
  );
}

export default function App() {
  // Persist forceBirthday from URL into localStorage so it survives iframe reloads
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('forceBirthday') === '1') {
      localStorage.setItem('forceBirthday', '1');
    }
  }, []);

  // Compute once on mount — never re-checks during the session
  const isFinalDay = useRef(isBirthdayFinalDay()).current;
  console.log('[App] isFinalDay:', isFinalDay, '| url:', window.location.href);

  const [screen, setScreen] = useState<Screen>('gate');
  const cakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAccessGranted = () => {
    setScreen('entry');
  };

  const handleContinue = () => {
    if (isFinalDay) {
      setScreen('surprise');
    } else if (isBirthdayEve()) {
      setScreen('cake');
    } else {
      setScreen('surprise');
    }
  };

  const handleGoToCake = () => {
    console.log('[App] handleGoToCake called — starting 3s timer');
    if (cakeTimerRef.current) return;
    cakeTimerRef.current = setTimeout(() => {
      console.log('[App] 3s done — switching to cake');
      setScreen('cake');
      cakeTimerRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.rel   = 'stylesheet';
    link.href  = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const showMusic = screen === 'surprise' || screen === 'cake' || screen === 'finale';

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#000' }}>
      {screen === 'gate' && (
        <AccessGate onGranted={handleAccessGranted} />
      )}

      {screen === 'entry' && (
        <Entry onContinue={handleContinue} />
      )}

      {screen === 'surprise' && (
        <Suspense fallback={<LoadingScreen />}>
          <DailySurprise onGoToCake={handleGoToCake} />
        </Suspense>
      )}

      {screen === 'cake' && (
        <Suspense fallback={<LoadingScreen />}>
          <BirthdayCake onDone={() => setScreen('finale')} />
        </Suspense>
      )}

      {screen === 'finale' && (
        <Suspense fallback={<LoadingScreen />}>
          <BirthdayFinale />
        </Suspense>
      )}

      {showMusic && <MusicPlayer />}
    </div>
  );
}
