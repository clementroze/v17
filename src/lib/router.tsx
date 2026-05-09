import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export const DOT_LEAD_MS = 350; // dot animates for this long before columns start

// ── types ─────────────────────────────────────────────────────────────────────

type RouterCtx = {
  path: string;
  previousPath: string | null;
  navigate: (href: string) => void;
};

const Ctx = createContext<RouterCtx>({ path: '/', previousPath: null, navigate: () => {} });

export function useRouter() {
  return useContext(Ctx);
}

// ── overlay state machine ─────────────────────────────────────────────────────
// idle → covering (6 columns slide up from bottom, staggered)
//      → [page swap]
//      → revealing (6 columns slide up off screen, staggered)
//      → idle

type Phase = 'idle' | 'covering' | 'revealing';

// 6 equal columns (1 margin + 4 content + 1 margin)
const COLS        = 6;
const STAGGER_MS  = 55;  // delay between each column
const COL_ANIM_MS = 480; // duration of a single column animation
// total cover time = COL_ANIM_MS + (COLS-1)*STAGGER_MS
const COVER_MS    = COL_ANIM_MS + (COLS - 1) * STAGGER_MS + 40; // +40ms buffer
const REVEAL_MS   = COL_ANIM_MS + (COLS - 1) * STAGGER_MS + 40;

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

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath]             = useState(() => window.location.pathname);
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

  const navigate = useCallback((href: string) => {
    if (href === path) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = href;

    const next = href;
    setColColor(wipeColor(next));

    // Dot leads — columns start after DOT_LEAD_MS
    timerRef.current = setTimeout(() => {
      setPhase('covering');

      timerRef.current = setTimeout(() => {
        window.history.pushState(null, '', next);
        setPreviousPath(path);
        setPath(next);
        window.scrollTo(0, 0);
        setPhase('revealing');

        timerRef.current = setTimeout(() => {
          setPhase('idle');
        }, REVEAL_MS);
      }, COVER_MS);
    }, DOT_LEAD_MS);
  }, [path]);

  return (
    <Ctx.Provider value={{ path, previousPath, navigate }}>
      {children}
      {/* Column wipe overlay — 6 equal columns, staggered */}
      {phase !== 'idle' && (
        <div className={`page-transition page-transition--${phase}`} aria-hidden="true">
          {Array.from({ length: COLS }, (_, i) => (
            <div
              key={i}
              className="page-transition__col"
              style={{
                animationDelay: `${i * STAGGER_MS}ms`,
                background: isKonami() ? RAINBOW_COLS[i] : colColor,
              }}
            />
          ))}
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
