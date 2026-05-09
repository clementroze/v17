import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { RouterProvider, useRouter } from './lib/router';
import { useKonami } from './lib/useKonami';
import { enterChaos, exitChaos } from './lib/chaosMode';
import Home from './pages/Home';
import About from './pages/About';
import Work from './pages/Work';
import CaseStudy from './pages/CaseStudy';
import Craft from './pages/Craft';

const WIPE_COLS       = 6;
const WIPE_COL_MS     = 480;
const WIPE_STAGGER_MS = 55;
const WIPE_COVER_MS   = WIPE_COL_MS + (WIPE_COLS - 1) * WIPE_STAGGER_MS + 40;
const WIPE_REVEAL_MS  = WIPE_COVER_MS;

type WipePhase = 'covering' | 'revealing' | null;

function App() {
  const { path } = useRouter();
  const [chaos, setChaos] = useState(false);
  const [wipe, setWipe]   = useState<WipePhase>(null);
  const chaosRef          = useRef(false);
  const exitingRef        = useRef(false);

  const startChaos = useCallback(() => {
    if (chaosRef.current || exitingRef.current) return;
    chaosRef.current = true;
    setChaos(true);
    // Add class immediately so CSS kicks in before enterChaos picks elements
    document.documentElement.classList.add('chaos');
    enterChaos();
  }, []);

  const stopChaos = useCallback(() => {
    if (!chaosRef.current || exitingRef.current) return;
    exitingRef.current = true;

    // Step 1 — fling elements off screen + fade them out (~850ms)
    // .chaos stays on <html> the whole time so CSS remains active
    exitChaos(() => {
      // Step 2 — DOM is restored but .chaos still on <html>
      // Start the covering wipe (black columns slide up over the still-chaos page)
      setWipe('covering');

      setTimeout(() => {
        // Step 3 — screen is fully black. NOW remove chaos CSS.
        document.documentElement.classList.remove('chaos');
        chaosRef.current   = false;
        exitingRef.current = false;
        setChaos(false);

        // Step 4 — reveal: columns slide off, showing the clean restored page
        setWipe('revealing');

        setTimeout(() => {
          setWipe(null);
        }, WIPE_REVEAL_MS);
      }, WIPE_COVER_MS);
    });
  }, []);

  useKonami(useCallback(() => {
    if (chaosRef.current) stopChaos(); else startChaos();
  }, [startChaos, stopChaos]));

  useEffect(() => {
    if (!chaos) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') stopChaos(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [chaos, stopChaos]);

  const page = (() => {
    if (path === '/about') return <About />;
    if (path === '/work')  return <Work />;
    if (path === '/craft') return <Craft />;
    const m = path.match(/^\/work\/(.+)$/);
    if (m) return <CaseStudy slug={m[1]} />;
    return <Home />;
  })();

  return (
    <>
      {page}
      {wipe && (
        <div className={`page-transition page-transition--${wipe}`} aria-hidden="true">
          {Array.from({ length: WIPE_COLS }, (_, i) => (
            <div
              key={i}
              className="page-transition__col"
              style={{ animationDelay: `${i * WIPE_STAGGER_MS}ms`, background: '#000' }}
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
