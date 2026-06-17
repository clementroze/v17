import { useState, useEffect, useRef } from "react";
import { LinearBlur } from "progressive-blur";
import { Link } from "../lib/router";
import { Reveal } from "../lib/reveal";
import work from "../data/work";

// Published case studies, in Work-page order (drops "coming soon" entries like
// IBM). Used for the hover reveal under the navbar "Work" link.
const caseStudies = work.filter((w) => !w.comingSoon);

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
  activeLink?: "about" | "work" | "craft";
};

const LINKS = [
  { label: "About", href: "/about", key: "about" },
  { label: "Work", href: "/work", key: "work" },
  { label: "Craft", href: "/craft", key: "craft" },
] as const;

export default function Navbar({
  watchHideRef,
  watchShowRef,
  watchPastRef,
  sections,
  forceWhite = false,
  activeLink,
}: NavbarProps) {
  const [white, setWhite] = useState(forceWhite);
  // The Work reveal opens on hover (mouse) OR when "pinned" open via the
  // keyboard chevron toggle — either path shows the case-study links.
  const [workHover, setWorkHover] = useState(false);
  const [workPinned, setWorkPinned] = useState(false);
  const workOpen = workHover || workPinned;
  // Vertical offset (px) the chevron nudges to so it subtly tracks the hovered
  // list item — 0 over the first item (its resting spot next to "Work") and a
  // small step per item down, staying within the chevron's own frame.
  const [chevronOffset, setChevronOffset] = useState(0);

  const navRef = useRef<HTMLElement>(null);
  const workChevronRef = useRef<HTMLButtonElement>(null);

  // ── color: observe watched elements ──────────────────────────────────────────

  useEffect(() => {
    if (forceWhite) {
      setWhite(true);
      return;
    }
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
      const obs = new IntersectionObserver(([entry]) => setWhite(!entry.isIntersecting), {
        threshold: 0,
        rootMargin: `0px 0px -${bottomMargin}px 0px`,
      });
      obs.observe(watchHideRef.current);
      observers.push(obs);
    }

    if (watchShowRef?.current) {
      const obs = new IntersectionObserver(([entry]) => setWhite(entry.isIntersecting), { threshold: 0 });
      obs.observe(watchShowRef.current);
      observers.push(obs);
    }

    return () => observers.forEach((o) => o.disconnect());
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
    // rAF-coalesce the scroll path so we read layout at most once per frame.
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (raf) cancelAnimationFrame(raf);
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
    // rAF-coalesce the scroll path: the loop over all sections reads layout, so
    // we run it at most once per frame instead of on every scroll event.
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sections, forceWhite]);

  // Broadcast navbar color so the external hamburger (in main.tsx) can match.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("navbar-color", { detail: { white } }));
  }, [white]);

  const linkStyle = (active: boolean) => ({ opacity: active ? 1 : 0.5 });

  return (
    <>
      <a href="#main-content" className="skip-to-main">Skip to main content</a>

      <div className="navbar__blur-bg" aria-hidden>
        <LinearBlur side="top" steps={8} strength={48} style={{ position: "absolute", inset: 0 }} />
      </div>

      <nav
        ref={navRef}
        className={`navbar${white ? " navbar--white" : ""}`}
      >
        <div className="navbar__inner">
          <div className="navbar__col">
            <Reveal delay={0}>
              <Link href="/" className="navbar__link" style={linkStyle(!activeLink)}>
                Clément Rozé
              </Link>
            </Reveal>
          </div>

          {LINKS.map(({ label, href, key }, i) => (
            <div
              key={key}
              className={`navbar__col navbar__col--desktop${
                key === "work" ? " navbar__col--work" : ""
              }`}
              onMouseEnter={key === "work" ? () => setWorkHover(true) : undefined}
              onMouseLeave={key === "work" ? () => setWorkHover(false) : undefined}
              // Close the keyboard-pinned menu once focus leaves the whole
              // group (link + chevron + reveal links).
              onBlur={
                key === "work"
                  ? (e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) setWorkPinned(false);
                    }
                  : undefined
              }
              // Escape closes the menu and returns focus to the chevron.
              onKeyDown={
                key === "work"
                  ? (e) => {
                      if (e.key === "Escape" && workPinned) {
                        setWorkPinned(false);
                        workChevronRef.current?.focus();
                      }
                    }
                  : undefined
              }
            >
              <Reveal delay={80 + i * 80}>
                <Link
                  href={href}
                  className={`navbar__link${activeLink === key ? " navbar__link--active" : ""}`}
                  style={linkStyle(activeLink === key || (key === "work" && workOpen))}
                >
                  {label}
                </Link>
              </Reveal>

              {/* Keyboard affordance: a chevron toggle that only surfaces on
                  keyboard focus (see CSS :focus-visible). Tab from "Work" lands
                  here; Enter/Space opens the case-study menu so the links below
                  become tabbable. Hover users never see it. */}
              {key === "work" && (
                <button
                  ref={workChevronRef}
                  type="button"
                  className={`navbar__chevron${workPinned ? " navbar__chevron--open" : ""}`}
                  aria-label={workPinned ? "Hide work case studies" : "Show work case studies"}
                  aria-expanded={workPinned}
                  onClick={(e) => { if (e.detail === 0) setWorkPinned((v) => !v); }}
                  style={{ transform: `translateY(${chevronOffset}px)` }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path
                      d="M2 4l3 3 3-3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}

              {/* Reveal: case-study links drop in under "Work", left-aligned
                  with the link. Desktop only — the col is hidden on mobile
                  (navbar__col--desktop), so this never shows there. */}
              {key === "work" && (
                <div
                  className={`navbar__reveal${workOpen ? " navbar__reveal--open" : ""}`}
                  aria-hidden={!workOpen}
                  // Leaving the list returns the chevron to its resting spot.
                  onMouseLeave={() => setChevronOffset(0)}
                >
                  {caseStudies.map((cs, j) => (
                    <Link
                      key={cs.slug}
                      href={cs.href}
                      className="navbar__reveal-link"
                      tabIndex={workOpen ? 0 : -1}
                      // Small per-item nudge so the chevron stays inside its
                      // frame instead of sliding down the whole list.
                      onMouseEnter={() => setChevronOffset(j * 2.5)}
                    >
                      <span
                        className="navbar__reveal-text"
                        // Enter cascades top→bottom; exit is the same ripple in
                        // reverse (bottom→top), so it reads as the enter played
                        // backwards.
                        style={{
                          transitionDelay: `${
                            workOpen
                              ? 60 + j * 35
                              : (caseStudies.length - 1 - j) * 35
                          }ms`,
                        }}
                      >
                        {cs.name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Hamburger lives outside the app-panel in main.tsx so it stays
              viewport-fixed and can morph to X without being clipped by the
              panel's transform/overflow. Spacer keeps the navbar layout intact. */}
          <div className="hamburger" aria-hidden />
        </div>
      </nav>

    </>
  );
}
