import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useRouter } from '../lib/router';

type NavbarProps = {
  watchHideRef?: React.RefObject<Element>;
  watchShowRef?: React.RefObject<Element>;
  forceWhite?: boolean;
  activeLink?: 'about' | 'work' | 'craft';
};

const LINKS = [
  { label: 'About', href: '/about', key: 'about' },
  { label: 'Work',  href: '/work',  key: 'work'  },
  { label: 'Craft', href: '/craft', key: 'craft' },
] as const;

export default function Navbar({ watchHideRef, watchShowRef, forceWhite = false, activeLink }: NavbarProps) {
  const { navigate } = useRouter();
  const [open,    setOpen]    = useState(false);
  const [closing, setClosing] = useState(false);
  const [white,   setWhite]   = useState(forceWhite);

  const navRef = useRef<HTMLElement>(null);

  // ── color: observe watched elements ──────────────────────────────────────────

  useEffect(() => {
    if (forceWhite) { setWhite(true); return; }

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

  const linkStyle = (active: boolean) => ({ opacity: active ? 1 : 0.5 });

  return (
    <>
      <div className="navbar__blur-bg" aria-hidden />

      <nav ref={navRef} className={`navbar${white ? ' navbar--white' : ''}`}>
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
                className="navbar__link"
                style={linkStyle(activeLink === key)}
              >{label}</Link>
            </div>
          ))}

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
