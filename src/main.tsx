import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { RouterProvider, useRouter } from './lib/router';
import { useKonami } from './lib/useKonami';
import Home from './pages/Home';
import About from './pages/About';
import Work from './pages/Work';
import CaseStudy from './pages/CaseStudy';
import Craft from './pages/Craft';

const LS_KEY = 'konami-rainbow';
const RAINBOW_COLS = ['#ff0040', '#ff8800', '#ffee00', '#00cc44', '#0088ff', '#8800ff'];
const STAGGER_MS  = 55;
const COL_ANIM_MS = 480;
const COVER_MS    = COL_ANIM_MS + (RAINBOW_COLS.length - 1) * STAGGER_MS + 40;
const REVEAL_MS   = COL_ANIM_MS + (RAINBOW_COLS.length - 1) * STAGGER_MS + 40;

type WipePhase = 'idle' | 'covering' | 'revealing';

function App() {
  const { path } = useRouter();
  const [wipePhase, setWipePhase] = React.useState<WipePhase>('idle');
  const [wipeRainbow, setWipeRainbow] = React.useState(true);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore from localStorage on first load
  React.useEffect(() => {
    try {
      if (localStorage.getItem(LS_KEY) === '1') {
        document.documentElement.classList.add('konami');
      }
    } catch {}
  }, []);

  const triggerWipe = React.useCallback((targetOn: boolean) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setWipeRainbow(targetOn);
    // Mark exiting so toast can animate out before .konami is removed
    if (!targetOn) document.documentElement.classList.add('konami-exiting');
    setWipePhase('covering');
    timerRef.current = setTimeout(() => {
      document.documentElement.classList.toggle('konami', targetOn);
      document.documentElement.classList.remove('konami-exiting');
      try { localStorage.setItem(LS_KEY, targetOn ? '1' : '0'); } catch {}
      setWipePhase('revealing');
      timerRef.current = setTimeout(() => {
        setWipePhase('idle');
      }, REVEAL_MS);
    }, COVER_MS);
  }, []);

  useKonami(() => {
    const isOn = document.documentElement.classList.contains('konami');
    triggerWipe(!isOn);
  });

  React.useEffect(() => {
    const handler = () => {
      const isOn = document.documentElement.classList.contains('konami');
      triggerWipe(!isOn);
    };
    window.addEventListener('toggle-rainbow', handler);
    return () => window.removeEventListener('toggle-rainbow', handler);
  }, [triggerWipe]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.documentElement.classList.contains('konami')) {
        triggerWipe(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [triggerWipe]);

  const caseMatch = path.match(/^\/work\/(.+)$/);

  return (
    <>
      {path === '/about' ? <About /> :
       path === '/work'  ? <Work />  :
       path === '/craft' ? <Craft /> :
       caseMatch         ? <CaseStudy slug={caseMatch[1]} /> :
                           <Home />}

      {wipePhase !== 'idle' && (
        <div className={`konami-wipe konami-wipe--${wipePhase}`} aria-hidden="true">
          {RAINBOW_COLS.map((color, i) => (
            <div
              key={i}
              className="konami-wipe__col"
              style={{
                animationDelay: `${i * STAGGER_MS}ms`,
                background: wipeRainbow ? color : '#000',
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider>
      <App />
    </RouterProvider>
  </React.StrictMode>,
);
