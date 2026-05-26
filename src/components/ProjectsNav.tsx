import { useEffect, useRef, useState } from "react";

type Props = {
  count: number;
  sectionRefs: React.RefObject<HTMLDivElement>[];
  variant?: "light" | "dark";
  alwaysVisible?: boolean;
  snapOnRelease?: boolean;
  labels?: string[];
  /** Extra px subtracted from the click-to-scroll target — use to clear a sticky navbar. */
  scrollOffset?: number;
  /** When set, overrides the built-in scroll thresholds: true → entering, false → exiting.
   *  Use together with alwaysVisible (it bypasses the hero/footer logic). */
  visible?: boolean;
};

const DOT_SIZE = 6;
const ACTIVE_SIZE = 20;

type Phase = "hidden" | "entering" | "exiting";

export default function ProjectsNav({
  count,
  sectionRefs,
  variant = "light",
  alwaysVisible = false,
  snapOnRelease = true,
  labels,
  scrollOffset = 0,
  visible,
}: Props) {
  const initialPhase: Phase =
    visible === false ? "hidden" : alwaysVisible || visible === true ? "entering" : "hidden";
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [runId, setRunId] = useState(0);
  const prevVisibleRef = useRef<boolean | undefined>(visible);

  // When `visible` is controlled externally, run enter/exit animation on each change.
  useEffect(() => {
    if (visible === undefined) return;
    const prev = prevVisibleRef.current;
    prevVisibleRef.current = visible;
    if (prev === visible) return;
    setPhase(visible ? "entering" : "exiting");
    setRunId((id) => id + 1);
  }, [visible]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pressed, setPressed] = useState(false);

  // Clear hover/press state whenever the nav isn't fully shown. Without this,
  // scrolling the nav out of range (e.g. trackpad scroll) while the cursor sits
  // over the track never fires `mouseleave` — the element just fades out under a
  // stationary cursor — so `hoveredIndex` stays set and the track's gray hover
  // pill lingers after the dots are gone. Resetting on exit/hide kills it.
  useEffect(() => {
    if (phase !== "entering") {
      setHoveredIndex(null);
      setPressed(false);
    }
  }, [phase]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const initializedRef = useRef(false);
  const reachedRef = useRef(false);
  const dragMovedRef = useRef(false);

  const updatePillsRef = useRef<() => void>(() => {});
  const scrollToIndexRef = useRef<(i: number) => void>(() => {});

  useEffect(() => {
    const getSectionTops = () =>
      sectionRefs.map((r) => {
        if (!r.current) return 0;
        return r.current.getBoundingClientRect().top + window.scrollY;
      });

    const updatePills = () => {
      const tops = getSectionTops();
      const scrollY = window.scrollY;
      let frac = 0;
      for (let i = 0; i < tops.length - 1; i++) {
        const a = tops[i];
        const b = tops[i + 1];
        if (scrollY >= a && scrollY < b) {
          frac = i + (scrollY - a) / (b - a);
          break;
        } else if (scrollY >= tops[tops.length - 1]) {
          frac = tops.length - 1;
        }
      }
      frac = Math.max(0, Math.min(count - 1, frac));
      dotRefs.current.forEach((el, i) => {
        if (!el) return;
        const dist = Math.abs(frac - i);
        if (dist < 1) {
          const h = DOT_SIZE + (ACTIVE_SIZE - DOT_SIZE) * (1 - dist);
          const alpha = 0.35 + 0.65 * (1 - dist);
          el.style.height = `${h}px`;
          el.style.setProperty("--pill-alpha", alpha.toFixed(2));
        } else {
          el.style.height = `${DOT_SIZE}px`;
          el.style.setProperty("--pill-alpha", "0.35");
        }
      });
    };
    updatePillsRef.current = updatePills;

    const onScroll = () => {
      if (alwaysVisible) {
        if (!initializedRef.current) {
          initializedRef.current = true;
          reachedRef.current = true;
        }
        updatePills();
        return;
      }

      const tops = getSectionTops();
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      // Hero side — enter when first project reaches mid-viewport; exit early when
      // its top drifts back past 55% vh so the fade plays before the white hero overtakes.
      const heroEnter = scrollY + vh * 0.5;
      const heroExit = scrollY + vh * 0.55;
      const firstTop = tops[0];
      const pastHero =
        firstTop === undefined
          ? false
          : reachedRef.current
            ? firstTop <= heroExit
            : firstTop <= heroEnter;

      // Footer side — exit as soon as the last project's bottom rises past 55% vh
      // (so fade plays while the dark project is still on-screen), re-enter when
      // it falls back past 50% vh.
      const lastBottom =
        sectionRefs[count - 1]?.current?.getBoundingClientRect().bottom ??
        Infinity;
      const footerEnter = vh * 0.5; // last-section bottom is below this → in range
      const footerExit = vh * 0.45; // last-section bottom rises above this → exit
      const beforeFooter = reachedRef.current
        ? lastBottom >= footerExit
        : lastBottom >= footerEnter;

      const reachedNow = pastHero && beforeFooter;

      if (!initializedRef.current) {
        // First measurement after mount. If the page loaded already scrolled past
        // the threshold, animate in once; otherwise stay hidden silently.
        initializedRef.current = true;
        reachedRef.current = reachedNow;
        if (reachedNow) {
          setPhase("entering");
          setRunId((id) => id + 1);
        }
      } else if (reachedNow !== reachedRef.current) {
        reachedRef.current = reachedNow;
        setPhase(reachedNow ? "entering" : "exiting");
        setRunId((id) => id + 1);
      }

      updatePills();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [sectionRefs, count, alwaysVisible]);

  // ── Drag-to-scrub ─────────────────────────────────────────────────────────
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let dragging = false;
    let startY = 0;
    let startScrollY = 0;
    let pillPitch = 1; // px between adjacent pill centers in the track
    let sectionTops: number[] = [];
    let scrollMin = 0;
    let scrollMax = 0;
    let targetScrollY = 0;
    let raf: number | null = null;
    let activePointerId: number | null = null;
    let clickHoldTimeout: ReturnType<typeof setTimeout> | null = null;
    let clickRaf: number | null = null;

    const cancelClickAnim = () => {
      if (clickRaf !== null) {
        cancelAnimationFrame(clickRaf);
        clickRaf = null;
      }
    };

    const sectionPitchAvg = () => {
      if (sectionTops.length < 2) return 1;
      return (
        (sectionTops[sectionTops.length - 1] - sectionTops[0]) /
        (sectionTops.length - 1)
      );
    };

    const computeMetrics = () => {
      sectionTops = sectionRefs
        .map((r) =>
          r.current
            ? r.current.getBoundingClientRect().top + window.scrollY
            : null,
        )
        .filter((t): t is number => t !== null);
      scrollMin = sectionTops[0] ?? 0;
      scrollMax = sectionTops[sectionTops.length - 1] ?? scrollMin;

      // Measure pill pitch from DOM so it stays correct even if pills resize.
      const pills = wrapRefs.current.filter((w): w is HTMLButtonElement => !!w);
      if (pills.length >= 2) {
        const a = pills[0].getBoundingClientRect();
        const b = pills[pills.length - 1].getBoundingClientRect();
        pillPitch = (b.top - a.top) / (pills.length - 1);
      }
    };

    const tick = () => {
      const cur = window.scrollY;
      const next = cur + (targetScrollY - cur) * 0.28; // lerp for silky motion
      if (Math.abs(targetScrollY - next) < 0.5) {
        window.scrollTo({ top: targetScrollY, behavior: "auto" });
      } else {
        window.scrollTo({ top: next, behavior: "auto" });
      }
      // Force-update pills each frame so the active pill follows the drag even
      // when scrollTo is a no-op (or scroll events get coalesced under load).
      updatePillsRef.current();
      if (dragging || Math.abs(targetScrollY - window.scrollY) > 0.5) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
        // Programmatic-scroll settle: release the page-level snap-controller
        // hold a beat after motion stops so it doesn't re-fight us.
        if (clickHoldTimeout !== null) clearTimeout(clickHoldTimeout);
        clickHoldTimeout = setTimeout(() => {
          (
            window as unknown as { __pillNavDragging?: boolean }
          ).__pillNavDragging = false;
          clickHoldTimeout = null;
        }, 120);
      }
    };

    scrollToIndexRef.current = (i: number) => {
      computeMetrics();
      const rawTop = sectionTops[i];
      if (rawTop === undefined) return;
      const top = Math.max(0, rawTop - scrollOffset);
      // Tell Home.tsx's snap controller to stand down while we animate, so its
      // idle-snap doesn't fight the click-driven scroll.
      (window as unknown as { __pillNavDragging?: boolean }).__pillNavDragging =
        true;
      if (clickHoldTimeout !== null) {
        clearTimeout(clickHoldTimeout);
        clickHoldTimeout = null;
      }
      // If a drag-driven tick is in flight, stop it so we own the scroll.
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
      cancelClickAnim();

      const startY = window.scrollY;
      const endY = top;
      const delta = endY - startY;
      if (Math.abs(delta) < 0.5) {
        clickHoldTimeout = setTimeout(() => {
          (
            window as unknown as { __pillNavDragging?: boolean }
          ).__pillNavDragging = false;
          clickHoldTimeout = null;
        }, 120);
        return;
      }

      // Duration scales gently with distance so neighbor jumps feel snappy and
      // long jumps still glide. easeInOutCubic gives a soft start AND end.
      const dist = Math.abs(delta);
      const duration = Math.min(
        1400,
        Math.max(520, 420 + Math.sqrt(dist) * 22),
      );
      const ease = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const startT = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - startT) / duration);
        const y = startY + delta * ease(t);
        window.scrollTo({ top: y, behavior: "auto" });
        updatePillsRef.current();
        if (t < 1) {
          clickRaf = requestAnimationFrame(step);
        } else {
          clickRaf = null;
          if (clickHoldTimeout !== null) clearTimeout(clickHoldTimeout);
          clickHoldTimeout = setTimeout(() => {
            (
              window as unknown as { __pillNavDragging?: boolean }
            ).__pillNavDragging = false;
            clickHoldTimeout = null;
          }, 120);
        }
      };
      clickRaf = requestAnimationFrame(step);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      // Interrupt any in-flight click-scroll animation so a fresh drag/click
      // starts cleanly from the current scroll position.
      cancelClickAnim();
      computeMetrics();
      if (sectionTops.length < 2) return;
      dragging = true;
      dragMovedRef.current = false;
      activePointerId = e.pointerId;
      startY = e.clientY;
      startScrollY = window.scrollY;
      targetScrollY = startScrollY;
      setPressed(true);
      // Defer pointer capture until real motion is detected. Capturing on
      // pointerdown suppresses the synthesized click event on the button, which
      // breaks tap-to-jump. We capture inside pointermove once dy > 3px.
      if (raf === null) raf = requestAnimationFrame(tick);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== activePointerId) return;
      const dy = e.clientY - startY;
      if (!dragMovedRef.current && Math.abs(dy) > 3) {
        dragMovedRef.current = true;
        // Real drag: now capture the pointer (so we keep getting moves even if
        // the cursor leaves the track), and flag the page snap controller to
        // stand down.
        try {
          track.setPointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
        (
          window as unknown as { __pillNavDragging?: boolean }
        ).__pillNavDragging = true;
      }
      if (!dragMovedRef.current) return;
      const scale = sectionPitchAvg() / Math.max(1, pillPitch);
      let next = startScrollY + dy * scale;
      if (next < scrollMin) next = scrollMin + (next - scrollMin) * 0.25; // rubber-band
      if (next > scrollMax) next = scrollMax + (next - scrollMax) * 0.25;
      targetScrollY = next;
      e.preventDefault();
    };

    const release = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== activePointerId) return;
      dragging = false;
      activePointerId = null;
      setPressed(false);
      try {
        track.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      if (snapOnRelease) {
        // Snap to nearest section.
        const cur = targetScrollY;
        let nearest = sectionTops[0];
        let bestDist = Math.abs(cur - nearest);
        for (let i = 1; i < sectionTops.length; i++) {
          const d = Math.abs(cur - sectionTops[i]);
          if (d < bestDist) {
            nearest = sectionTops[i];
            bestDist = d;
          }
        }
        targetScrollY = nearest;
        if (raf === null) raf = requestAnimationFrame(tick);
      } else {
        // No snap: leave page wherever the drag ended.
        targetScrollY = window.scrollY;
      }
      // Release the drag flag a moment later so Home.tsx's snap controller doesn't fight us mid-settle.
      setTimeout(() => {
        (
          window as unknown as { __pillNavDragging?: boolean }
        ).__pillNavDragging = false;
      }, 400);
      // Suppress the click that follows a real drag.
      if (dragMovedRef.current) {
        const suppress = (ev: Event) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        window.addEventListener("click", suppress, {
          capture: true,
          once: true,
        });
      }
    };

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", release);
    track.addEventListener("pointercancel", release);

    return () => {
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", release);
      track.removeEventListener("pointercancel", release);
      if (raf !== null) cancelAnimationFrame(raf);
      cancelClickAnim();
      if (clickHoldTimeout !== null) clearTimeout(clickHoldTimeout);
      (window as unknown as { __pillNavDragging?: boolean }).__pillNavDragging =
        false;
    };
    // Re-attach listeners when the container subtree re-mounts (runId change
    // remounts the .projects-nav div via key={runId}, replacing the track DOM).
  }, [sectionRefs, count, runId, snapOnRelease, scrollOffset]);

  const phaseClass =
    phase === "entering"
      ? " projects-nav--entering"
      : phase === "exiting"
        ? " projects-nav--exiting"
        : "";

  const variantClass =
    variant === "dark" ? " projects-nav--dark" : " projects-nav--light";

  return (
    <aside
      key={runId}
      className={`projects-nav${variantClass}${phaseClass}`}
      aria-label="Section navigation"
      aria-hidden={phase !== "entering"}
    >
      <div
        ref={trackRef}
        className={`projects-nav__track${hoveredIndex !== null ? " projects-nav__track--hover" : ""}${pressed ? " projects-nav__track--pressed" : ""}`}
        onMouseLeave={() => setHoveredIndex(null)}
        style={{ touchAction: "none" }}
      >
        {Array.from({ length: count }).map((_, i) => {
          const exitDelay = (count - 1 - i) * 35;
          const enterDelay = i * 50;
          const delay = phase === "exiting" ? exitDelay : enterDelay;
          return (
            <button
              key={i}
              ref={(el) => {
                // Only assign on mount; ignore the null cleanup call so a later
                // re-mount's callback doesn't get clobbered by an earlier unmount's null.
                if (el) wrapRefs.current[i] = el;
              }}
              className="projects-nav__dot-wrap"
              style={
                phase !== "hidden"
                  ? { animationDelay: `${delay}ms` }
                  : undefined
              }
              onClick={() => {
                if (dragMovedRef.current) return;
                scrollToIndexRef.current(i);
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              aria-label={labels?.[i] ?? `Go to project ${i + 1}`}
            >
              {labels?.[i] && (
                <span className="projects-nav__label">{labels[i]}</span>
              )}
              <div
                ref={(el) => {
                  if (el) dotRefs.current[i] = el;
                }}
                className={`projects-nav__pill${hoveredIndex === i ? " projects-nav__pill--hover" : ""}`}
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
