import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import { RouterProvider, useRouter } from "./lib/router";
import { useKonami } from "./lib/useKonami";
import Home from "./pages/Home";
// Home is eager (it's the landing page — no extra round-trip on first paint).
// The remaining routes are code-split so their JS isn't shipped in the homepage
// bundle; each loads on navigation, hidden behind the column-wipe overlay.
const About = lazy(() => import("./pages/About"));
const Work = lazy(() => import("./pages/Work"));
const CaseStudy = lazy(() => import("./pages/CaseStudy"));
const Craft = lazy(() => import("./pages/Craft"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { applyMeta, resolveRouteMeta } from "./lib/routeMeta";

const LS_KEY = "konami-rainbow";
const RAINBOW_COLS = [
  "#ff0040",
  "#ff8800",
  "#ffee00",
  "#00cc44",
  "#0088ff",
  "#8800ff",
];
const STAGGER_MS = 55;
const COL_ANIM_MS = 480;
const COVER_MS = COL_ANIM_MS + (RAINBOW_COLS.length - 1) * STAGGER_MS + 40;
const REVEAL_MS = COL_ANIM_MS + (RAINBOW_COLS.length - 1) * STAGGER_MS + 40;

type WipePhase = "idle" | "covering" | "revealing";

// Home installs a Lenis smooth-scroll instance on window.__lenis. It owns the
// scroll position via a rAF loop, so freezing/restoring the page around the slide
// menu has to go through it — otherwise its next frame snaps back to its target.
type LenisLike = {
  stop?: () => void;
  start?: () => void;
  scrollTo?: (target: number, opts?: { immediate?: boolean; force?: boolean }) => void;
};
const getLenis = (): LenisLike | undefined =>
  (window as unknown as { __lenis?: LenisLike }).__lenis;

const MENU_LINKS = [
  { label: "Home", href: "/", key: "home" },
  { label: "About", href: "/about", key: "about" },
  { label: "Work", href: "/work", key: "work" },
  { label: "Craft", href: "/craft", key: "craft" },
] as const;

function App() {
  const { path: rawPath, navigate } = useRouter();
  // Normalize a trailing slash (e.g. "/about/" -> "/about") so slash variants of
  // known routes aren't misclassified as not-found (which would noindex them).
  const path = rawPath === "/" ? "/" : rawPath.replace(/\/+$/, "");
  const [wipePhase, setWipePhase] = React.useState<WipePhase>("idle");
  const [wipeRainbow, setWipeRainbow] = React.useState(true);
  const [menuOpen, setMenuOpen] = React.useState(false);
  // While fixed, the page panel is a viewport-sized box (slide-out menu); stays
  // true through the close animation, then released so the page flows normally.
  const [panelFixed, setPanelFixed] = React.useState(false);
  const lockYRef = React.useRef(0);
  const lightboxOpenRef = React.useRef(false);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  // The bio "More about me" modal hides the mobile hamburger while open (it sits
  // above the hamburger and would otherwise bleed through its blurred scrim).
  const [bioModalOpen, setBioModalOpen] = React.useState(false);
  const firstScrollRestore = React.useRef(true);
  const [navbarWhite, setNavbarWhite] = React.useState(false);
  const [konamiOn, setKonamiOn] = React.useState(false);
  const [konamiPhase, setKonamiPhase] = React.useState<
    "entering" | "idle" | "exiting"
  >("idle");
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Restore from localStorage on first load
  React.useEffect(() => {
    try {
      if (localStorage.getItem(LS_KEY) === "1") {
        document.documentElement.classList.add("konami");
        setKonamiOn(true);
        setKonamiPhase("entering");
        phaseTimerRef.current = setTimeout(
          () => setKonamiPhase("idle"),
          720,
        );
      }
    } catch {}
  }, []);

  const triggerWipe = React.useCallback((targetOn: boolean) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    setWipeRainbow(targetOn);
    // Mark exiting so toast can animate out before .konami is removed
    if (!targetOn) {
      document.documentElement.classList.add("konami-exiting");
      setKonamiPhase("exiting");
    }
    setWipePhase("covering");
    timerRef.current = setTimeout(() => {
      document.documentElement.classList.toggle("konami", targetOn);
      document.documentElement.classList.remove("konami-exiting");
      if (!targetOn) {
        setKonamiOn(false);
        setKonamiPhase("idle");
      }
      try {
        localStorage.setItem(LS_KEY, targetOn ? "1" : "0");
      } catch {}
      setWipePhase("revealing");
      timerRef.current = setTimeout(() => {
        setWipePhase("idle");
        if (targetOn) {
          // Mount toast only after the reveal columns finish, then settle to idle.
          setKonamiOn(true);
          setKonamiPhase("entering");
          phaseTimerRef.current = setTimeout(
            () => setKonamiPhase("idle"),
            720,
          );
        }
      }, REVEAL_MS);
    }, COVER_MS);
  }, []);

  useKonami(() => {
    const isOn = document.documentElement.classList.contains("konami");
    triggerWipe(!isOn);
  });

  React.useEffect(() => {
    const handler = () => {
      const isOn = document.documentElement.classList.contains("konami");
      triggerWipe(!isOn);
    };
    window.addEventListener("toggle-rainbow", handler);
    return () => window.removeEventListener("toggle-rainbow", handler);
  }, [triggerWipe]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        document.documentElement.classList.contains("konami")
      ) {
        triggerWipe(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [triggerWipe]);

  // Apply route-specific metadata (title, description, canonical, Open Graph,
  // Twitter, and a robots noindex for not-found routes) on first paint and on
  // every client-side navigation. This keeps JS-capable crawlers and the SPA in
  // sync with the per-route metadata that scripts/prerender.mjs bakes into each
  // route's static HTML — and corrects it even when the static host serves the
  // homepage shell (404.html) for an extensionless deep URL. The not-found
  // noindex is a soft-404 mitigation: this static SPA serves every unmatched
  // path as 200, so unknown/typo URLs are marked noindex rather than indexed.
  React.useEffect(() => {
    applyMeta(resolveRouteMeta(path));
  }, [path]);

  // Mobile slide menu: listen for open/close events from the hamburger button
  React.useEffect(() => {
    const open = () => setMenuOpen(true);
    const close = () => setMenuOpen(false);
    const color = (e: Event) => setNavbarWhite((e as CustomEvent<{ white: boolean }>).detail.white);
    const onLightboxOpen = () => { lightboxOpenRef.current = true; setLightboxOpen(true); };
    const onLightboxClose = () => { lightboxOpenRef.current = false; setLightboxOpen(false); };
    const onBioOpen = () => setBioModalOpen(true);
    const onBioClose = () => setBioModalOpen(false);
    window.addEventListener("mobile-menu-open", open);
    window.addEventListener("mobile-menu-close", close);
    window.addEventListener("navbar-color", color);
    window.addEventListener("lightbox-open", onLightboxOpen);
    window.addEventListener("lightbox-close", onLightboxClose);
    window.addEventListener("bio-modal-open", onBioOpen);
    window.addEventListener("bio-modal-close", onBioClose);
    return () => {
      window.removeEventListener("mobile-menu-open", open);
      window.removeEventListener("mobile-menu-close", close);
      window.removeEventListener("lightbox-open", onLightboxOpen);
      window.removeEventListener("lightbox-close", onLightboxClose);
      window.removeEventListener("bio-modal-open", onBioOpen);
      window.removeEventListener("bio-modal-close", onBioClose);
      window.removeEventListener("navbar-color", color);
    };
  }, []);

  // Freeze the page when the menu opens: capture the scroll offset, lock body
  // scroll, and flip the panel to its fixed (viewport-sized) form. On close we
  // keep it fixed through the slide-back, then release it back into normal flow.
  React.useLayoutEffect(() => {
    if (menuOpen) {
      lockYRef.current = window.scrollY;
      setPanelFixed(true);
      document.body.style.overflow = "hidden";
      // Pause Lenis so its rAF loop doesn't keep driving the (now collapsed) page.
      getLenis()?.stop?.();
      return;
    }
    if (!panelFixed) return;
    const t = setTimeout(() => {
      setPanelFixed(false);
      document.body.style.overflow = "";
    }, 580);
    return () => clearTimeout(t);
    // panelFixed is intentionally omitted: re-running on its change while the menu
    // is open would recapture lockY after the document has collapsed to scrollY 0.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  // Once the panel returns to normal flow, restore the scroll position. Runs after
  // layout but before paint, so the page never flashes to the top. Skips the first
  // mount so it doesn't clobber the browser's own scroll restoration.
  React.useLayoutEffect(() => {
    if (firstScrollRestore.current) {
      firstScrollRestore.current = false;
      return;
    }
    if (!panelFixed) {
      window.scrollTo(0, lockYRef.current);
      // Restore through Lenis (matching its internal target) and resume it, or its
      // next frame would snap the page back to the top.
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo?.(lockYRef.current, { immediate: true, force: true });
        lenis.start?.();
      }
    }
  }, [panelFixed]);

  // Swipe to open/close the menu: swipe left opens (page slides left to reveal the
  // nav), swipe right closes — mirror gestures. Mostly-horizontal swipes only, so
  // vertical scrolling isn't hijacked. If the swipe begins inside a horizontally
  // scrollable element (the Work project carousel, the Craft image scroller, etc.)
  // we bail so the gesture scrolls that element instead of opening the menu.
  React.useEffect(() => {
    let startX = 0;
    let startY = 0;
    let fromHScroller = false;

    // Walk up from the touch target; true if any ancestor can actually scroll
    // horizontally (overflow-x auto/scroll and content wider than its box).
    const startedInHorizontalScroller = (target: EventTarget | null): boolean => {
      let el = target instanceof Element ? target : null;
      while (el && el !== document.body) {
        if (el.scrollWidth > el.clientWidth + 1) {
          const ox = getComputedStyle(el).overflowX;
          if (ox === "auto" || ox === "scroll") return true;
        }
        el = el.parentElement;
      }
      return false;
    };

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      fromHScroller = startedInHorizontalScroller(e.target);
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (window.innerWidth > 768) return; // mobile-only menu
      if (lightboxOpenRef.current) return; // lightbox owns all touch gestures
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
      // Don't hijack a swipe meant for a horizontal scroller — but a right-swipe to
      // CLOSE an already-open menu is always honored (the page is frozen anyway).
      if (fromHScroller && !menuOpen) return;
      if (dx < 0 && !menuOpen) window.dispatchEvent(new CustomEvent("mobile-menu-open"));
      else if (dx > 0 && menuOpen) window.dispatchEvent(new CustomEvent("mobile-menu-close"));
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [menuOpen]);

  // Reset menu when navigation completes (path changes mid-wipe, screen is covered).
  // The new route starts at the top, so drop the locked offset and release the panel
  // immediately rather than animating the close.
  React.useEffect(() => {
    setMenuOpen(false);
    setPanelFixed(false);
    lockYRef.current = 0;
    document.body.style.overflow = "";
  }, [path]);

  const activeMenuKey = path === "/"
    ? "home"
    : path === "/about"
    ? "about"
    : path === "/work" || path.startsWith("/work/")
    ? "work"
    : path === "/craft"
    ? "craft"
    : null;

  const handleMenuNav = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("mobile-menu-close"));
    navigate(href);
  };

  const caseMatch = path.match(/^\/work\/([^/]+)\/?$/);

  return (
    <>
      {/* Hamburger — fixed to the viewport (outside app-panel) so the morph
          transition plays in place regardless of the panel sliding left. */}
      <button
        className={`hamburger hamburger--external${menuOpen ? " hamburger--open" : ""}${navbarWhite || menuOpen ? " hamburger--white" : ""}`}
        onClick={() => window.dispatchEvent(new CustomEvent(menuOpen ? "mobile-menu-close" : "mobile-menu-open"))}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-hidden={lightboxOpen || bioModalOpen || undefined}
        style={lightboxOpen || bioModalOpen ? { display: "none" } : undefined}
      >
        <span className="hamburger__bar" />
        <span className="hamburger__bar" />
      </button>

      {/* Mobile nav background — sits behind app-panel, revealed when page slides left */}
      <div
        className={`app-menu-bg${menuOpen ? " app-menu-bg--open" : ""}`}
        onClick={() => window.dispatchEvent(new CustomEvent("mobile-menu-close"))}
        aria-hidden={!menuOpen}
      >
        <nav className="app-menu-bg__nav" onClick={(e) => e.stopPropagation()}>
          {MENU_LINKS.map(({ label, href, key }, i) => (
            <a
              key={key}
              href={href}
              onClick={handleMenuNav(href)}
              className={`app-menu-bg__link${activeMenuKey === key ? " app-menu-bg__link--active" : ""}`}
              style={{ transitionDelay: menuOpen ? `${i * 80 + 80}ms` : "0ms" }}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      {/* Page panel — slides left on mobile when menu opens. While open it's a
          viewport-sized fixed box (so its border-radius rounds the visible sliver's
          corners and travels with the slide); the inner wrapper is pushed up by the
          locked scroll offset so the frozen page stays put. */}
      <div
        className={`app-panel${panelFixed ? " app-panel--fixed" : ""}${menuOpen ? " app-panel--open" : ""}`}
      >
        <div
          className="app-panel__inner"
          style={panelFixed ? { marginTop: -lockYRef.current } : undefined}
        >
          {/* fallback is null: route swaps happen mid-wipe (the overlay covers the
              screen), so the brief lazy-chunk load is never visible. */}
          <Suspense fallback={null}>
            {path === "/about" ? (
              <About />
            ) : path === "/work" ? (
              <Work />
            ) : path === "/craft" ? (
              <Craft />
            ) : caseMatch ? (
              <CaseStudy slug={caseMatch[1]} />
            ) : path === "/" ? (
              <Home />
            ) : (
              <NotFound />
            )}
          </Suspense>
        </div>
      </div>

      {wipePhase !== "idle" && (
        <div
          className={`konami-wipe konami-wipe--${wipePhase}`}
          aria-hidden="true"
        >
          {RAINBOW_COLS.map((color, i) => (
            <div
              key={i}
              className="konami-wipe__col"
              style={{
                animationDelay: `${i * STAGGER_MS}ms`,
                background: wipeRainbow ? color : "#000",
              }}
            />
          ))}
        </div>
      )}

      {konamiOn && (
        <button
          type="button"
          className={`konami-toast konami-toast--${konamiPhase}`}
          onClick={() => triggerWipe(false)}
          aria-label="Disable rainbow mode"
        >
          <span className="konami-toast__icon" aria-hidden="true">
            🌈
          </span>
          <span>Rainbow mode</span>
          <span className="konami-toast__sep" aria-hidden="true">
            &bull;
          </span>
          <span className="konami-toast__hint">Click or Esc to disable</span>
        </button>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider>
      <App />
    </RouterProvider>
  </React.StrictMode>,
);
