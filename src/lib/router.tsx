import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export const DOT_LEAD_MS = 350; // dot animates for this long before columns start

// ── types ─────────────────────────────────────────────────────────────────────

type RouterCtx = {
  path: string;
  previousPath: string | null;
  navigate: (href: string) => void;
  // Run the column wipe as a standalone effect with no page change. Used by the
  // mobile menu. `mode` controls how many sweeps play:
  //   'full'   — cover → reveal (two sweeps)
  //   'cover'  — columns sweep up to cover, then the overlay tears down (one sweep)
  //   'reveal' — overlay starts covering, columns sweep off (one sweep)
  // The mobile menu uses 'reveal' on open and 'cover' on close so each tap shows
  // exactly one sweep. Returns the total duration in ms so the caller can sequence.
  wipe: (color?: string, mode?: WipeMode) => number;
};

type WipeMode = 'full' | 'cover' | 'reveal';

const Ctx = createContext<RouterCtx>({
  path: '/',
  previousPath: null,
  navigate: () => {},
  wipe: () => 0,
});

export type { WipeMode };

export function useRouter() {
  return useContext(Ctx);
}

// ── overlay state machine ─────────────────────────────────────────────────────
// idle → covering (columns slide up from bottom, staggered)
//      → [page swap]
//      → revealing (columns slide up off screen, staggered)
//      → idle

type Phase = 'idle' | 'covering' | 'revealing';

// Column count is responsive: 4 on mobile, 6 on larger screens. The mobile
// breakpoint matches the CSS (≤768px). Read at navigation time so a resize is
// reflected on the next transition.
const MOBILE_COLS  = 4;
const DESKTOP_COLS = 6;
export const colCount = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768 ? MOBILE_COLS : DESKTOP_COLS;

const STAGGER_MS  = 55;  // delay between each column
const COL_ANIM_MS = 480; // duration of a single column animation
// total time scales with the column count so the FULL stagger always plays
// before the page swaps / the overlay tears down. Sized for the max (desktop)
// count so a mid-transition resize never truncates the animation.
const maxStagger  = (DESKTOP_COLS - 1) * STAGGER_MS;
export const COVER_MS  = COL_ANIM_MS + maxStagger + 40; // +40ms buffer
export const REVEAL_MS = COL_ANIM_MS + maxStagger + 40;

// Column color is chosen to contrast with the DESTINATION page background,
// and stays the same color for both the cover and reveal phases.
// This avoids any color switch mid-transition.
const DARK_PATHS = new Set(['/about', '/craft']);
const RAINBOW_COLS = ['#ff0040', '#ff8800', '#ffee00', '#00cc44', '#0088ff', '#8800ff'];

function wipeColor(to: string) {
  return DARK_PATHS.has(to) ? '#fff' : '#000';
}

function isKonami() {
  return document.documentElement.classList.contains('konami');
}

// ── provider ──────────────────────────────────────────────────────────────────

export function RouterProvider({
  children,
  initialPath,
}: {
  children: React.ReactNode;
  // When provided (build-time prerender / SSR), the router starts at this path
  // instead of reading window.location — which doesn't exist in Node.
  initialPath?: string;
}) {
  const [path, setPath]             = useState(() =>
    initialPath !== undefined
      ? initialPath
      : typeof window !== 'undefined'
        ? window.location.pathname
        : '/',
  );
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [phase, setPhase]           = useState<Phase>('idle');
  const [colColor, setColColor]     = useState('#000');
  const pendingRef                  = useRef<string | null>(null);
  const timerRef                    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep browser URL in sync (no actual page load — just history state)
  useEffect(() => {
    window.history.replaceState(null, '', path);
  }, [path]);

  // Handle browser back/forward
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Column count is fixed for the duration of one transition so cover and
  // reveal use the same grid (avoids a mid-transition reflow on resize).
  const [cols, setCols] = useState(colCount);

  const navigate = useCallback((href: string) => {
    if (href === path) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = href;

    const next = href;
    setCols(colCount());
    setColColor(wipeColor(next));

    // Dot leads — columns start after DOT_LEAD_MS
    timerRef.current = setTimeout(() => {
      setPhase('covering');

      timerRef.current = setTimeout(() => {
        window.history.pushState(null, '', next);
        setPreviousPath(path);
        setPath(next);
        // Always land at the top on navigation. Pages that need to restore a
        // prior scroll position on return (About, Work) do so themselves in a
        // mount effect, reading a position they stashed in sessionStorage when
        // the user left for a case study. That overrides this scroll-to-top.
        window.scrollTo(0, 0);
        setPhase('revealing');

        timerRef.current = setTimeout(() => {
          setPhase('idle');
        }, REVEAL_MS);
      }, COVER_MS);
    }, DOT_LEAD_MS);
  }, [path]);

  // Standalone wipe with no page swap. `mode` selects how many sweeps play (see
  // the type docs above). Default color contrasts the current page (same logic
  // as navigation). Returns the total duration in ms so the caller can sequence.
  const wipe = useCallback((color?: string, mode: WipeMode = 'full') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCols(colCount());
    setColColor(color ?? wipeColor(path));

    if (mode === 'reveal') {
      // Overlay starts fully covering, then a single reveal sweep clears it.
      setPhase('revealing');
      timerRef.current = setTimeout(() => setPhase('idle'), REVEAL_MS);
      return REVEAL_MS;
    }

    setPhase('covering');
    if (mode === 'cover') {
      // A single cover sweep, then the overlay tears down (no reveal sweep).
      timerRef.current = setTimeout(() => setPhase('idle'), COVER_MS);
      return COVER_MS;
    }

    // full: cover → reveal → idle.
    timerRef.current = setTimeout(() => {
      setPhase('revealing');
      timerRef.current = setTimeout(() => setPhase('idle'), REVEAL_MS);
    }, COVER_MS);
    return COVER_MS + REVEAL_MS;
  }, [path]);

  return (
    <Ctx.Provider value={{ path, previousPath, navigate, wipe }}>
      {children}
      {/* Column wipe overlay — responsive column count, staggered. Both the
          cover (left→right) and reveal (right→left) stagger delays are computed
          inline so any column count animates fully and correctly. */}
      {phase !== 'idle' && (
        <div
          className={`page-transition page-transition--${phase}`}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          aria-hidden="true"
        >
          {Array.from({ length: cols }, (_, i) => {
            const coverDelay = i * STAGGER_MS;
            const revealDelay = (cols - 1 - i) * STAGGER_MS;
            return (
              <div
                key={i}
                className="page-transition__col"
                style={{
                  animationDelay: `${phase === 'revealing' ? revealDelay : coverDelay}ms`,
                  background: isKonami() ? RAINBOW_COLS[i % RAINBOW_COLS.length] : colColor,
                }}
              />
            );
          })}
        </div>
      )}
    </Ctx.Provider>
  );
}

// ── convenience link component ────────────────────────────────────────────────

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  function Link({ href, onClick, children, ...rest }, ref) {
    const { navigate } = useRouter();
    return (
      <a
        ref={ref}
        href={href}
        onClick={e => {
          // Let modifier keys / middle-click pass through normally
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          onClick?.(e);
          navigate(href);
        }}
        {...rest}
      >
        {children}
      </a>
    );
  }
);
