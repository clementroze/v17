import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useRouter } from '../lib/router';

type NavbarProps = {
  // Element to observe: when visible → black, when out of view → white (use for hero/light sections)
  watchHideRef?: React.RefObject<Element>;
  // Element to observe: when visible → white, when out of view → black (use for dark sections)
  watchShowRef?: React.RefObject<Element>;
  // Skip the observer and always show white (e.g. About page)
  forceWhite?: boolean;
  activeLink?: 'about' | 'work' | 'craft';
};

const LINKS = [
  { label: 'About', href: '/about', key: 'about' },
  { label: 'Work',  href: '/work',  key: 'work'  },
  { label: 'Craft', href: '/craft', key: 'craft' },
] as const;

type LinkKey = typeof LINKS[number]['key'] | 'home';

export default function Navbar({ watchHideRef, watchShowRef, forceWhite = false, activeLink }: NavbarProps) {
  const { navigate } = useRouter();
  const [open,       setOpen]    = useState(false);
  const [closing,    setClosing] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<LinkKey | null>(null);
  const [white,      setWhite]   = useState(forceWhite);

  const anchorPos = useRef<{ x: number; y: number } | null>(null);
  const dotPos    = useRef<{ x: number; y: number } | null>(null);
  const springRaf = useRef<number>(0);

  const navRef   = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const dotRef   = useRef<HTMLSpanElement>(null);
  const linkRefs = useRef<Partial<Record<LinkKey, HTMLAnchorElement>>>({});

  // ── color: observe watched elements ──────────────────────────────────────────

  useEffect(() => {
    if (forceWhite) { setWhite(true); return; }

    const observers: IntersectionObserver[] = [];

    if (watchHideRef?.current) {
      // white when this element is gone (scrolled past), black when visible
      const obs = new IntersectionObserver(
        ([entry]) => setWhite(!entry.isIntersecting),
        { threshold: 0 }
      );
      obs.observe(watchHideRef.current);
      observers.push(obs);
    }

    if (watchShowRef?.current) {
      // white when this element is visible, black when gone
      const obs = new IntersectionObserver(
        ([entry]) => setWhite(entry.isIntersecting),
        { threshold: 0 }
      );
      obs.observe(watchShowRef.current);
      observers.push(obs);
    }

    return () => observers.forEach(o => o.disconnect());
  }, [watchHideRef, watchShowRef, forceWhite]);

  // ── mobile menu ──────────────────────────────────────────────────────────────

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const closeMenu = useCallback((cb?: () => void) => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); cb?.(); }, 440);
  }, []);

  const handleMobileNav = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    closeMenu(() => navigate(href));
  };

  // ── dot positioning ───────────────────────────────────────────────────────────

  const measureAnchor = useCallback((key: LinkKey): { x: number; y: number } | null => {
    const linkEl = linkRefs.current[key];
    const inner  = innerRef.current;
    if (!linkEl || !inner) return null;
    const lr = linkEl.getBoundingClientRect();
    const ir = inner.getBoundingClientRect();
    return { x: lr.left - ir.left + lr.width / 2, y: lr.bottom - ir.top };
  }, []);

  const moveDotTo = useCallback((
    target: { x: number; y: number },
    opts: { instant?: boolean } = {}
  ) => {
    const el = dotRef.current;
    if (!el) return;
    const isFirst = !dotPos.current;
    dotPos.current = { ...target };
    el.style.transition = isFirst || opts.instant
      ? 'none'
      : 'left 0.9s cubic-bezier(0.16, 1, 0.3, 1), top 0.9s cubic-bezier(0.16, 1, 0.3, 1)';
    el.style.left = `${target.x}px`;
    el.style.top  = `${target.y}px`;
  }, []);

  useEffect(() => {
    const key: LinkKey = activeLink ?? 'home';
    const update = () => {
      const a = measureAnchor(key);
      if (!a) return;
      anchorPos.current = a;
      moveDotTo(a, { instant: !dotPos.current });
    };
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, [activeLink, measureAnchor, moveDotTo]);

  const launchDotTo = useCallback((key: LinkKey) => {
    const a = measureAnchor(key);
    if (!a) return;
    moveDotTo(a);
  }, [measureAnchor, moveDotTo]);

  const leanToward = useCallback((key: LinkKey) => {
    const anchor = anchorPos.current;
    const target = measureAnchor(key);
    if (!anchor || !target) return;
    const dx = target.x - anchor.x;
    const dy = target.y - anchor.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    const pull = Math.min(8, dist * 0.12);
    moveDotTo({ x: anchor.x + (dx / dist) * pull, y: anchor.y + (dy / dist) * pull });
  }, [measureAnchor, moveDotTo]);

  const resetDot = useCallback(() => {
    if (anchorPos.current) moveDotTo(anchorPos.current);
  }, [moveDotTo]);

  // Mouse Y nudge on dot
  useEffect(() => {
    const nav = navRef.current;
    const inner = innerRef.current;
    if (!nav || !inner) return;
    const onMove = (e: MouseEvent) => {
      const anchor = anchorPos.current;
      const el = dotRef.current;
      if (!anchor || !el) return;
      const ir = inner.getBoundingClientRect();
      const dy = Math.max(-8, Math.min(8, (e.clientY - ir.top - anchor.y) * 0.5));
      el.style.transition = 'top 0.15s cubic-bezier(0.25, 0, 0.1, 1)';
      el.style.top = `${anchor.y + dy}px`;
    };
    const onLeave = () => {
      const anchor = anchorPos.current;
      const el = dotRef.current;
      if (!anchor || !el) return;
      el.style.transition = 'top 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.top = `${anchor.y}px`;
    };
    nav.addEventListener('mousemove', onMove, { passive: true });
    nav.addEventListener('mouseleave', onLeave, { passive: true });
    return () => {
      nav.removeEventListener('mousemove', onMove);
      nav.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(springRaf.current);
    };
  }, []);

  const linkStyle = (active: boolean) => ({
    opacity: active ? 1 : 0.5,
  });

  return (
    <>
      {/* Gradient blur backdrop — fades from opaque blur at top to transparent */}
      <div className="navbar__blur-bg" aria-hidden />

      <nav ref={navRef} className={`navbar${white ? ' navbar--white' : ''}`}>
        <div ref={innerRef} className="navbar__inner">

          <div className="navbar__col">
            <Link
              ref={(el: HTMLAnchorElement | null) => { if (el) linkRefs.current['home'] = el; }}
              href="/"
              className="navbar__link"
              style={linkStyle(!activeLink || hoveredKey === 'home')}
              onMouseEnter={() => { setHoveredKey('home'); leanToward('home'); }}
              onMouseLeave={() => { setHoveredKey(null); resetDot(); }}
              onClick={() => launchDotTo('home')}
            >
              Clément Rozé
            </Link>
          </div>

          {LINKS.map(({ label, href, key }) => (
            <div key={key} className="navbar__col navbar__col--desktop">
              <Link
                ref={(el: HTMLAnchorElement | null) => { if (el) linkRefs.current[key] = el; }}
                href={href}
                className="navbar__link"
                style={linkStyle(activeLink === key || hoveredKey === key)}
                onMouseEnter={() => { setHoveredKey(key); leanToward(key); }}
                onMouseLeave={() => { setHoveredKey(null); resetDot(); }}
                onClick={() => launchDotTo(key)}
              >{label}</Link>
            </div>
          ))}

          <span ref={dotRef} className="navbar__dot" />

          <button
            className={`hamburger${open ? ' hamburger--open' : ''}`}
            onClick={() => open ? closeMenu() : setOpen(true)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <span className="hamburger__bar" />
            <span className="hamburger__bar" />
          </button>

        </div>
      </nav>

      {(open || closing) && (
        <div className={`menu-overlay${closing ? ' menu-overlay--closing' : ''}`}>
          <div className="menu-overlay__inner">
            <div className="menu-overlay__header">
              <a href="/" onClick={handleMobileNav('/')} className="menu-overlay__name">
                Clément Rozé
              </a>
              <button
                className="hamburger hamburger--open"
                onClick={() => closeMenu()}
                aria-label="Close menu"
              >
                <span className="hamburger__bar" />
                <span className="hamburger__bar" />
              </button>
            </div>
            <nav className="menu-overlay__nav">
              {LINKS.map(({ label, href, key }, i) => (
                <a
                  key={key}
                  href={href}
                  onClick={handleMobileNav(href)}
                  className={`menu-overlay__link${activeLink === key ? ' menu-overlay__link--active' : ''}`}
                  style={{ animationDelay: `${i * 70 + 80}ms` }}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
