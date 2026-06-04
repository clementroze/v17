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
import { bySlug } from "./data/data";

const LS_KEY = "konami-rainbow";
const RAINBOW_COLS = [
  "#ff0040",
  "#ff8800",
  "#ffee00",
  "#00cc44",
  "#0088ff",
  "#8800ff",
];
// ── Document title per route ─────────────────────────────────────────────────
// Base name shown alone on the homepage; other routes append " • <Page>".
// Case studies resolve the project's canonical name from the slug registry.
const SITE_NAME = "Clément Rozé";

function pageTitle(path: string): string {
  const caseMatch = path.match(/^\/work\/([^/]+)\/?$/);
  if (caseMatch) {
    const name = bySlug(caseMatch[1])?.name ?? caseMatch[1];
    return `${SITE_NAME} • ${name}`;
  }
  if (path === "/about") return `${SITE_NAME} • About`;
  if (path === "/work") return `${SITE_NAME} • Work`;
  if (path === "/craft") return `${SITE_NAME} • Craft`;
  return SITE_NAME;
}

const STAGGER_MS = 55;
const COL_ANIM_MS = 480;
const COVER_MS = COL_ANIM_MS + (RAINBOW_COLS.length - 1) * STAGGER_MS + 40;
const REVEAL_MS = COL_ANIM_MS + (RAINBOW_COLS.length - 1) * STAGGER_MS + 40;

type WipePhase = "idle" | "covering" | "revealing";

function App() {
  const { path } = useRouter();
  const [wipePhase, setWipePhase] = React.useState<WipePhase>("idle");
  const [wipeRainbow, setWipeRainbow] = React.useState(true);
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

  React.useEffect(() => {
    document.title = pageTitle(path);
  }, [path]);

  const caseMatch = path.match(/^\/work\/([^/]+)\/?$/);

  return (
    <>
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
        ) : (
          <Home />
        )}
      </Suspense>

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
