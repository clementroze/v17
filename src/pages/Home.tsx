import { useRef, useCallback, useEffect, useMemo } from "react";
import Lenis from "lenis";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import EffectB from "../components/effects/EffectB";
import ProjectsNav from "../components/ProjectsNav";
import ProjectsNavMobile from "../components/ProjectsNavMobile";
import work from "../data/work";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<React.RefObject<HTMLDivElement>[]>(
    work.map(() => ({ current: null }) as React.RefObject<HTMLDivElement>),
  );

  const handleSectionRef = useCallback((index: number, el: HTMLDivElement | null) => {
    (sectionRefs.current[index] as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, []);

  // Per-section tone for the navbar: each project's section ref + whether its
  // hero is light. Stable identity (refs + work are fixed) so the Navbar effect
  // doesn't re-subscribe on every render.
  const navSections = useMemo(
    () =>
      work.map((w, i) => ({
        ref: sectionRefs.current[i] as React.RefObject<Element>,
        isLight: Boolean(w.heroIsLight),
      })),
    [],
  );

  // ── Instagram-Reels-style paging (Lenis) ──────────────────────────────────
  // Each section is a full-viewport "page" (hero = page 0, then one per
  // project). A single wheel gesture / arrow advances exactly ONE page and
  // locks — momentum can't carry you past it (true Reels paging, not free
  // scroll). We run Lenis with smoothWheel OFF and intercept the wheel
  // ourselves, driving one snappy scrollTo per gesture; a post-slide cooldown
  // swallows the trackpad's momentum tail so one flick == one page. Past the
  // last project the feed releases to native scroll so the footer stays
  // reachable. Touch paging is handled by CSS scroll-snap on mobile.
  useEffect(() => {
    const snapTops = (): number[] => {
      const tops: number[] = [0]; // top of page: the hero
      for (const r of sectionRefs.current) {
        if (r.current) tops.push(Math.round(r.current.getBoundingClientRect().top + window.scrollY));
      }
      return tops;
    };

    // Index of the page whose top is nearest the given scroll position.
    const pageIndexFor = (y: number): number => {
      const tops = snapTops();
      let best = 0;
      let bestDist = Math.abs(y - tops[0]);
      for (let i = 1; i < tops.length; i++) {
        const d = Math.abs(y - tops[i]);
        if (d < bestDist) {
          best = i;
          bestDist = d;
        }
      }
      return best;
    };

    const isPillDragging = () => (window as unknown as { __pillNavDragging?: boolean }).__pillNavDragging === true;

    const lenis = new Lenis({
      // smoothWheel OFF: we own the wheel and convert each gesture into a single
      // page jump, so Lenis must not also free-scroll on the same deltas. It
      // still drives the animated scrollTo slides and emits scroll events.
      smoothWheel: false,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    // Opt this page's document scroll into mobile CSS scroll-snap (touch paging).
    // Scoped to the home route so other pages keep normal scrolling.
    document.documentElement.classList.add("home-paging");

    // Drive Lenis's clock. While a pill-nav drag/jump owns the scroll (it writes
    // window.scrollTo directly), we yield: skip Lenis's frame so we don't fight
    // it, then resync on resume so there's no positional jump.
    let yielding = false;
    let rafId = requestAnimationFrame(function raf(time: number) {
      if (isPillDragging()) {
        yielding = true;
      } else {
        if (yielding) {
          yielding = false;
          lenis.scrollTo(window.scrollY, { immediate: true, force: true });
        }
        lenis.raf(time);
      }
      rafId = requestAnimationFrame(raf);
    });

    // ── Paging ────────────────────────────────────────────────────────────────
    // easeOutQuint: a smooth decelerating approach — quick off the line, eased
    // into place without the hard "slam" of easeOutExpo. Smoother on its own and
    // gentler when a mid-slide skip re-targets (no big velocity jump).
    const EASE = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(1 - t, 5));
    const SLIDE_S = 0.85; // slide duration (seconds) — higher = slower/gentler, lower = snappier
    const COOLDOWN_MS = 140; // brief lock at rest after a slide settles
    const WHEEL_THRESHOLD = 150; // accumulated |deltaY| to advance from rest (leaves peek room)
    const WHEEL_IDLE_MS = 180; // reset the accumulator after this much wheel silence
    const GESTURE_GAP_MS = 140; // wheel silence that marks the start of a new gesture
    // Re-acceleration detection: trackpad momentum only ever decays, so a jump up
    // in scroll delta (or a direction flip) while coasting after a commit means a
    // fresh, deliberate touch — even with no quiet gap. This is what lets a second
    // touch cancel the running slide and advance again while momentum still flows.
    const REACCEL_RATIO = 1.2; // a new push's delta must exceed the last by this factor…
    const REACCEL_MIN = 5; // …and by this absolute amount, to count as a fresh touch
    const MIN_COMMIT_GAP_MS = 80; // floor between commits so one flick's own ramp can't double-fire
    // Free-scroll mode: when a second gesture interrupts a snap, the lock is
    // released and the wheel drives the scroll position directly so you can
    // accelerate through sections; we snap to the nearest one once the wheel
    // quiets. This is the "cancel the snap and scroll almost freely" feel.
    const FREE_MULT = 1.3; // wheel delta → free-scroll distance while unlocked
    const FREE_FOLLOW_S = 0.22; // how quickly free-scroll eases toward its moving target
    const FREE_IDLE_MS = 130; // wheel silence in free mode before snapping to nearest
    // Teaser/peek: a sub-threshold gesture doesn't advance — it nudges the feed
    // toward the neighbouring section (a sneak-peek), then rubber-bands back to
    // rest if you don't push past the commit threshold. The peek follows an
    // asymptotic resistance curve: a light scroll reveals a little, a stronger
    // scroll reveals more (scaled by accumulated scroll "power"), easing toward a
    // generous cap rather than a hard clamp — so you can hold a good look down.
    const PEEK_DAMP = 1.35; // how strongly the peek tracks accumulated scroll
    const PEEK_MAX_FRAC = 0.45; // peek asymptote, as a fraction of viewport height

    let isPaging = false;
    let cooldownUntil = 0;
    let wheelAccum = 0;
    let wheelIdleTimer: ReturnType<typeof setTimeout> | null = null;
    // Page we're currently sliding toward (or resting on). A second gesture
    // mid-slide chains off this, not off the in-between scroll position.
    let targetIndex = pageIndexFor(window.scrollY);
    // Timestamp of the last committed slide, to floor the gap between commits.
    let lastCommitAt = 0;
    // Resting top of the page we're currently peeking from (for the rubber-band).
    let peekFromTop = window.scrollY;
    // True while a peek offset is applied (uncommitted) — gates the rubber-band.
    let isPeeking = false;
    // True once the current gesture has committed an advance — it then ignores
    // the rest of its own momentum (no bounce-peek, no runaway chaining). Cleared
    // only when a brand-new gesture is detected (quiet gap or re-acceleration).
    let gestureConsumed = false;
    // Wheel-event bookkeeping for gesture-boundary detection.
    let lastWheelTs = 0;
    let lastAbsDelta = 0;
    let lastDir = 0;
    // Free-scroll mode state (engaged when a second gesture cancels a snap).
    let freeMode = false;
    let freeTarget = 0;
    let freeIdleTimer: ReturnType<typeof setTimeout> | null = null;

    const goToPage = (idx: number) => {
      const tops = snapTops();
      const clamped = Math.max(0, Math.min(tops.length - 1, idx));
      isPaging = true;
      targetIndex = clamped;
      lastCommitAt = performance.now();
      // Re-targeting while a slide is in flight: lenis.scrollTo animates from the
      // *current* scroll position, so this redirects smoothly toward the new page
      // (no teleport) — the "cancel and continue" feel. easeOutQuint restarts from
      // here, so it stays responsive without a hard cut.
      lenis.scrollTo(tops[clamped], {
        duration: SLIDE_S,
        easing: EASE,
        lock: true, // hold the target so nothing can drift back out mid-slide
        onComplete: () => {
          isPaging = false;
          cooldownUntil = performance.now() + COOLDOWN_MS;
        },
      });
    };

    // Drop into free-scroll: cancel the running snap and let the wheel move the
    // page directly. easeOutCubic follow makes repeated deltas accelerate smoothly.
    const freeEase = (t: number) => 1 - Math.pow(1 - t, 3);
    const enterFreeMode = () => {
      freeMode = true;
      isPaging = false; // take over from the (now-cancelled) snap
      isPeeking = false;
      gestureConsumed = false;
      freeTarget = window.scrollY;
    };
    const freeScrollBy = (dy: number) => {
      const tops = snapTops();
      const maxY = tops[tops.length - 1]; // keep free movement within the feed
      freeTarget = Math.max(0, Math.min(maxY, freeTarget + dy * FREE_MULT));
      lenis.scrollTo(freeTarget, { duration: FREE_FOLLOW_S, easing: freeEase });
      // Wheel quiet → leave free mode and snap to the nearest section.
      if (freeIdleTimer) clearTimeout(freeIdleTimer);
      freeIdleTimer = setTimeout(() => {
        freeMode = false;
        goToPage(pageIndexFor(freeTarget));
      }, FREE_IDLE_MS);
    };

    // Wheel: accumulate a gesture's delta, commit a single page once it crosses
    // the threshold, then ignore everything until the slide + cooldown finishes.
    const onWheel = (e: WheelEvent) => {
      if (isPillDragging()) return;
      if (e.ctrlKey) return; // trackpad pinch-zoom — leave it to the browser
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // horizontal-dominant gesture

      // Free-scroll mode owns the wheel entirely until it settles.
      if (freeMode) {
        e.preventDefault();
        freeScrollBy(e.deltaY);
        return;
      }

      const tops = snapTops();
      const y = window.scrollY;
      const dir = e.deltaY > 0 ? 1 : -1;
      // Mid-slide, chain off the page we're heading to so a second flick goes to
      // the *next* one; at rest, base it on the current scroll position.
      const cur = isPaging ? targetIndex : pageIndexFor(y);

      // Below the feed → native free scroll (footer). A down-flick from the last
      // project also releases into the footer rather than locking.
      if (y > tops[tops.length - 1] + 2) return;
      if (dir === 1 && cur >= tops.length - 1) return;

      // Inside the feed: capture the gesture so the browser never free-scrolls.
      e.preventDefault();
      if (cur + dir < 0) return; // already at the hero, nothing above

      const now = performance.now();
      const absD = Math.abs(e.deltaY);
      // Detect the start of a fresh gesture: either the wheel was quiet for a beat,
      // or — while coasting on a committed gesture's momentum — the delta jumped
      // back up / flipped direction, which only a deliberate new touch can do.
      const reaccel =
        gestureConsumed &&
        (absD > lastAbsDelta * REACCEL_RATIO + REACCEL_MIN ||
          (dir !== lastDir && lastDir !== 0 && absD > REACCEL_MIN));
      const newGesture = now - lastWheelTs > GESTURE_GAP_MS || reaccel;
      lastWheelTs = now;
      lastAbsDelta = absD;
      lastDir = dir;

      // Mid-slide: a fresh, deliberate second gesture CANCELS the snap and drops
      // into free scroll, so you can accelerate through sections instead of being
      // held one-at-a-time; it re-snaps to the nearest section when you stop. The
      // floor since the last commit keeps a single flick's own ramp from tripping
      // this, and momentum that isn't a fresh gesture is ignored — so a lone flick
      // still snaps cleanly to exactly one section.
      if (isPaging) {
        if (newGesture && now - lastCommitAt >= MIN_COMMIT_GAP_MS) {
          enterFreeMode();
          freeScrollBy(e.deltaY);
        } else if (newGesture) {
          gestureConsumed = true; // floored (same flick's ramp) — consume, don't act
        }
        return;
      }

      // ── At rest ──────────────────────────────────────────────────────────────
      if (now < cooldownUntil) return; // brief settle lock just after a slide
      if (newGesture) {
        gestureConsumed = false; // a fresh scroll from rest: may peek / accumulate
        wheelAccum = 0;
      }
      if (gestureConsumed) return; // momentum tail of an already-committed gesture

      wheelAccum += e.deltaY;

      // Firm scroll → advance one page.
      if (Math.abs(wheelAccum) >= WHEEL_THRESHOLD) {
        gestureConsumed = true;
        isPeeking = false;
        wheelAccum = 0;
        if (wheelIdleTimer) {
          clearTimeout(wheelIdleTimer);
          wheelIdleTimer = null;
        }
        goToPage(cur + dir);
        return;
      }

      // Sub-threshold → teaser peek: nudge the neighbour in along an asymptotic
      // resistance curve (scales with scroll power, eases toward a cap), then
      // rubber-band back on idle. We only reach here for a deliberate scroll from
      // a settled section, so a committing flick's inertia can never trip it.
      const cap = window.innerHeight * PEEK_MAX_FRAC;
      peekFromTop = tops[cur];
      const mag = cap * (1 - Math.exp((-Math.abs(wheelAccum) * PEEK_DAMP) / cap));
      const offset = Math.sign(wheelAccum) * mag;
      lenis.scrollTo(peekFromTop + offset, { immediate: true, force: true });
      isPeeking = true;

      // Gesture went quiet → reset the accumulator, and rubber-band back if we
      // were peeking.
      if (wheelIdleTimer) clearTimeout(wheelIdleTimer);
      wheelIdleTimer = setTimeout(() => {
        wheelAccum = 0;
        if (isPeeking && !isPaging) lenis.scrollTo(peekFromTop, { duration: 0.45, easing: EASE });
        isPeeking = false;
      }, WHEEL_IDLE_MS);
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    // Keyboard: arrows (and PageUp/PageDown) move one page.
    const onKeyDown = (e: KeyboardEvent) => {
      const down = e.key === "ArrowDown" || e.key === "PageDown";
      const up = e.key === "ArrowUp" || e.key === "PageUp";
      if (!down && !up) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const tops = snapTops();
      const cur = isPaging ? targetIndex : pageIndexFor(window.scrollY);
      // Let the footer scroll naturally when paging down off the last project.
      if (down && cur >= tops.length - 1) return;
      e.preventDefault();
      const now = performance.now();
      if (!isPaging && now < cooldownUntil) return;
      goToPage(cur + (down ? 1 : -1));
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      if (wheelIdleTimer) clearTimeout(wheelIdleTimer);
      if (freeIdleTimer) clearTimeout(freeIdleTimer);
      document.documentElement.classList.remove("home-paging");
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return (
    <div className="page">
      <Navbar sections={navSections} />
      <main id="main-content" className="page__main">
        <div ref={heroRef} className="home__hero-snap">
          <Hero
            title="Welcome."
            subtitle="Clément Rozé designs and builds web experiences that are accessible, intentional, and beautiful."
            tag="Design Intern @ IBM."
          />
        </div>
        <EffectB projects={work} onSectionRef={handleSectionRef} />
        <ProjectsNav
          count={work.length}
          sectionRefs={sectionRefs.current}
          tones={work.map((w) => Boolean(w.heroIsLight))}
        />
        {/* Hidden on mobile — the full-screen TikTok-style snap makes dots redundant. */}
        <ProjectsNavMobile
          count={work.length}
          sectionRefs={sectionRefs.current}
          variant="light"
          className="projects-nav-m--home"
        />
      </main>
      <div ref={footerRef} style={{ width: "100%" }}>
        <Footer />
      </div>
    </div>
  );
}
