import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useRouter, COVER_MS, DOT_LEAD_MS } from '../lib/router';

type NavbarProps = {
  watchHideRef?: React.RefObject<Element>;
  watchShowRef?: React.RefObject<Element>;
  // White once this element's top scrolls up to the navbar band, i.e. you've
  // left the hero and are now over the first project. Stays white for every
  // section below it; only the hero (above this element) is black.
  watchPastRef?: React.RefObject<Element>;
  // Per-section tone (homepage): the navbar contrasts against whichever section
  // sits under the navbar band. Light section (or the white welcome hero above
  // them all) → black text; dark section → white text. Takes over the color
  // logic when provided. `isLight: true` means the section background is light.
  sections?: { ref: React.RefObject<Element>; isLight: boolean }[];
  forceWhite?: boolean;
  activeLink?: 'about' | 'work' | 'craft';
};

const LINKS = [
  { label: 'About', href: '/about', key: 'about' },
  { label: 'Work',  href: '/work',  key: 'work'  },
  { label: 'Craft', href: '/craft', key: 'craft' },
] as const;

export default function Navbar({ watchHideRef, watchShowRef, watchPastRef, sections, forceWhite = false, activeLink }: NavbarProps) {
  const { navigate } = useRouter();
  const [open,    setOpen]    = useState(false);   // panel mounted (through the slide-out)
  const [menuIn,  setMenuIn]  = useState(false);   // panel slid into view (drives the CSS transition)
  const [closing, setClosing] = useState(false);
  // The hamburger morph reflects intent immediately on tap.
  const [showX,   setShowX]   = useState(false);
  const [white,   setWhite]   = useState(forceWhite);

  const navRef = useRef<HTMLElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── color: observe watched elements ──────────────────────────────────────────

  useEffect(() => {
    if (forceWhite) { setWhite(true); return; }
    if (sections) return; // per-section tone logic (below) owns the color

    const observers: IntersectionObserver[] = [];

    if (watchHideRef?.current) {
      // Shrink the observer root to a thin band at the top of the viewport (just
      // the navbar zone). The instant the hero's bottom scrolls above that band —
      // i.e. as the snap into the first project begins — the hero stops
      // intersecting and the navbar flips to white, instead of waiting for the
      // hero to fully clear the viewport.
      const NAV_BAND = 96;
      const bottomMargin = Math.max(0, window.innerHeight - NAV_BAND);
      const obs = new IntersectionObserver(
        ([entry]) => setWhite(!entry.isIntersecting),
        { threshold: 0, rootMargin: `0px 0px -${bottomMargin}px 0px` }
      );
      obs.observe(watchHideRef.current);
      observers.push(obs);
    }

    if (watchShowRef?.current) {
      const obs = new IntersectionObserver(
        ([entry]) => setWhite(entry.isIntersecting),
        { threshold: 0 }
      );
      obs.observe(watchShowRef.current);
      observers.push(obs);
    }

    return () => observers.forEach(o => o.disconnect());
  }, [watchHideRef, watchShowRef, forceWhite, sections]);

  // ── color: "past the hero" — white once the watched element's top reaches
  // the navbar band. Black is reserved for the hero (everything above it). ──────

  useEffect(() => {
    if (forceWhite || sections || !watchPastRef) return;

    const NAV_BAND = 96;
    const update = () => {
      const el = watchPastRef.current;
      if (!el) return;
      // The element's top has scrolled up to (or above) the navbar band → we're
      // on the first project or below, so the navbar should be white.
      setWhite(el.getBoundingClientRect().top <= NAV_BAND);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [watchPastRef, forceWhite]);

  // ── color: per-section tone (homepage). Sample which section sits under the
  // navbar band and contrast against it: light section → black text, dark
  // section → white text. Above the first section (white welcome hero) → black. ─
  useEffect(() => {
    if (forceWhite || !sections) return;

    const NAV_BAND = 96;
    const update = () => {
      // Walk sections top-to-bottom; the one whose span crosses the navbar band
      // is the section under the navbar. Default (none yet, still on the white
      // hero) → not white (black text).
      let isLightUnderNav = true; // welcome hero is light/white
      for (const { ref, isLight } of sections) {
        const el = ref.current;
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= NAV_BAND && r.bottom > NAV_BAND) {
          isLightUnderNav = isLight;
          break;
        }
      }
      setWhite(!isLightUnderNav);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [sections, forceWhite]);

  // ── mobile menu ──────────────────────────────────────────────────────────────

  useEffect(() => {
    document.body.style.overflow = open || showX ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open, showX]);

  // Tidy the pending unmount timer if the navbar unmounts mid-transition.
  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }, []);

  // The black menu panel SLIDES in/out on its own (no column wipe). The column
  // wipe is reserved for actual page navigation. `open` keeps the panel mounted;
  // `menuIn` drives the slide via a CSS class, flipped a frame after mount so the
  // transition runs. The hamburger morphs to an X immediately via `showX`.
  const MENU_SLIDE_MS = 480;

  const openMenu = useCallback(() => {
    setShowX(true);
    setOpen(true);
    // Next frame: panel is mounted off-screen, now flip the class to slide it in.
    requestAnimationFrame(() => setMenuIn(true));
  }, []);

  // Plain close (tapping the X to dismiss the menu, NOT navigating): slide the
  // panel back out, then unmount once the transition has finished.
  const closeMenu = useCallback((cb?: () => void) => {
    setShowX(false);
    setMenuIn(false);
    setClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
      cb?.();
    }, MENU_SLIDE_MS);
  }, []);

  const handleMobileNav = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    // Navigating to a page: the router's OWN column wipe is the transition here.
    // Slide the menu panel out at the same time and unmount once the wipe has
    // covered the screen, so the new page is revealed cleanly underneath.
    setShowX(false);
    setMenuIn(false);
    navigate(href);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, COVER_MS + DOT_LEAD_MS);
  };

  const linkStyle = (active: boolean) => ({ opacity: active ? 1 : 0.5 });

  return (
    <>
      <div className="navbar__blur-bg" aria-hidden />

      <nav
        ref={navRef}
        className={`navbar${white ? ' navbar--white' : ''}${open || closing || showX ? ' navbar--above-overlay' : ''}`}
      >
        <div className="navbar__inner">

          <div className="navbar__col">
            <Link
              href="/"
              className="navbar__link"
              style={linkStyle(!activeLink)}
            >
              Clément Rozé
            </Link>
          </div>

          {LINKS.map(({ label, href, key }) => (
            <div key={key} className="navbar__col navbar__col--desktop">
              <Link
                href={href}
                className={`navbar__link${activeLink === key ? ' navbar__link--active' : ''}`}
                style={linkStyle(activeLink === key)}
              >{label}</Link>
            </div>
          ))}

          {/* Single, persistent hamburger: the SAME two bars morph from lines
              into the X in place. It sits above the overlay (see CSS z-index)
              and doubles as the close button when the menu is open. */}
          <button
            className={`hamburger${showX ? ' hamburger--open' : ''}${open || closing || showX ? ' hamburger--over-overlay' : ''}`}
            onClick={() => (showX ? closeMenu() : openMenu())}
            aria-label={showX ? 'Close menu' : 'Open menu'}
            aria-expanded={showX}
          >
            <span className="hamburger__bar" />
            <span className="hamburger__bar" />
          </button>

        </div>
      </nav>

      {open && (
        <div className={`menu-overlay${menuIn ? ' menu-overlay--open' : ''}`}>
          <div className="menu-overlay__inner">
            {/* Empty spacer matching the navbar height. The name and the
                hamburger both live in the navbar above this overlay (z-index
                300), so the overlay needs neither — just the top offset so the
                links start below the navbar. */}
            <div className="menu-overlay__header" aria-hidden />
            <nav className="menu-overlay__nav">
              {LINKS.map(({ label, href, key }, i) => (
                <a
                  key={key}
                  href={href}
                  onClick={handleMobileNav(href)}
                  className={`menu-overlay__link${activeLink === key ? ' menu-overlay__link--active' : ''}`}
                  style={{ animationDelay: `${i * 120 + 120}ms` }}
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
