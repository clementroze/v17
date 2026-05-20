import { useEffect, useRef, useState } from "react";

type Props = {
  count: number;
  sectionRefs: React.RefObject<HTMLDivElement>[];
  variant?: "light" | "dark";
  /** Extra px subtracted from the click-to-scroll target — use to clear a sticky navbar. */
  scrollOffset?: number;
  /** When set, overrides the built-in scroll thresholds: true → entering, false → exiting. */
  visible?: boolean;
  /** When true, ignore scroll thresholds and treat as always-visible (until `visible` flips). */
  alwaysVisible?: boolean;
};

type Phase = "hidden" | "entering" | "exiting";

const DOT_W = 6;
const ACTIVE_W = 20;

/**
 * Mobile bottom-right floating bar. Horizontal pill cluster, tap-to-jump AND
 * drag-to-scrub: drag the thumb left/right across the track to rapidly move
 * between sections (mirrors the desktop ProjectsNav's vertical scrub, rotated
 * 90°). Width grows for the active pill instead of height; no labels (saves
 * space).
 */
export default function ProjectsNavMobile({
  count,
  sectionRefs,
  variant = "light",
  scrollOffset = 0,
  visible,
  alwaysVisible = false,
}: Props) {
  const initialPhase: Phase =
    visible === false ? "hidden" : alwaysVisible || visible === true ? "entering" : "hidden";
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [runId, setRunId] = useState(0);
  const prevVisibleRef = useRef<boolean | undefined>(visible);

  useEffect(() => {
    if (visible === undefined) return;
    const prev = prevVisibleRef.current;
    prevVisibleRef.current = visible;
    if (prev === visible) return;
    setPhase(visible ? "entering" : "exiting");
    setRunId((id) => id + 1);
  }, [visible]);

  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const initializedRef = useRef(false);
  const reachedRef = useRef(false);
  const dragMovedRef = useRef(false);
  const [pressed, setPressed] = useState(false);
  // Shared so the drag loop can repaint pills every frame without waiting on
  // (coalesced) scroll events.
  const updatePillsRef = useRef<() => void>(() => {});

  // Update which pill is "active" based on scroll position.
  useEffect(() => {
    const updatePills = () => {
      const tops = sectionRefs.map((r) =>
        r.current ? r.current.getBoundingClientRect().top + window.scrollY : 0,
      );
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
          const w = DOT_W + (ACTIVE_W - DOT_W) * (1 - dist);
          const alpha = 0.35 + 0.65 * (1 - dist);
          el.style.width = `${w}px`;
          el.style.setProperty("--pill-alpha", alpha.toFixed(2));
        } else {
          el.style.width = `${DOT_W}px`;
          el.style.setProperty("--pill-alpha", "0.35");
        }
      });
    };
    updatePillsRef.current = updatePills;

    const onScroll = () => {
      if (alwaysVisible || visible !== undefined) {
        updatePills();
        return;
      }
      // Auto-detect entry/exit based on first/last section position.
      const tops = sectionRefs.map((r) =>
        r.current ? r.current.getBoundingClientRect().top + window.scrollY : 0,
      );
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const firstTop = tops[0];
      const lastBottom =
        sectionRefs[count - 1]?.current?.getBoundingClientRect().bottom ?? Infinity;
      const pastHero = firstTop === undefined ? false : firstTop <= scrollY + vh * 0.5;
      const beforeFooter = lastBottom >= vh * 0.5;
      const reachedNow = pastHero && beforeFooter;

      if (!initializedRef.current) {
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
  }, [sectionRefs, count, alwaysVisible, visible]);

  // ── Horizontal drag-to-scrub ────────────────────────────────────────────────
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let dragging = false;
    let startX = 0;
    let startScrollY = 0;
    let pillPitch = 1; // px between adjacent pill centres along the track
    let sectionTops: number[] = [];
    let scrollMin = 0;
    let scrollMax = 0;
    let targetScrollY = 0;
    let raf: number | null = null;
    let activePointerId: number | null = null;

    const sectionPitchAvg = () =>
      sectionTops.length < 2
        ? 1
        : (sectionTops[sectionTops.length - 1] - sectionTops[0]) /
          (sectionTops.length - 1);

    const computeMetrics = () => {
      sectionTops = sectionRefs
        .map((r) =>
          r.current ? r.current.getBoundingClientRect().top + window.scrollY : null,
        )
        .filter((t): t is number => t !== null);
      scrollMin = sectionTops[0] ?? 0;
      scrollMax = sectionTops[sectionTops.length - 1] ?? scrollMin;
      const pills = wrapRefs.current.filter((w): w is HTMLButtonElement => !!w);
      if (pills.length >= 2) {
        const a = pills[0].getBoundingClientRect();
        const b = pills[pills.length - 1].getBoundingClientRect();
        pillPitch = (b.left - a.left) / (pills.length - 1);
      }
    };

    const tick = () => {
      const cur = window.scrollY;
      const next = cur + (targetScrollY - cur) * 0.3; // lerp for smooth motion
      window.scrollTo({
        top: Math.abs(targetScrollY - next) < 0.5 ? targetScrollY : next,
        behavior: "auto",
      });
      updatePillsRef.current();
      if (dragging || Math.abs(targetScrollY - window.scrollY) > 0.5) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
        (window as unknown as { __pillNavDragging?: boolean }).__pillNavDragging = false;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      computeMetrics();
      if (sectionTops.length < 2) return;
      dragging = true;
      dragMovedRef.current = false;
      activePointerId = e.pointerId;
      startX = e.clientX;
      startScrollY = window.scrollY;
      targetScrollY = startScrollY;
      setPressed(true);
      if (raf === null) raf = requestAnimationFrame(tick);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== activePointerId) return;
      const dx = e.clientX - startX;
      if (!dragMovedRef.current && Math.abs(dx) > 3) {
        // Promote to a real drag: capture the pointer and tell Home's snap
        // controller to stand down. (Capturing on pointerdown would suppress the
        // tap-to-jump click, so we defer it until real motion.)
        dragMovedRef.current = true;
        try {
          track.setPointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
        (window as unknown as { __pillNavDragging?: boolean }).__pillNavDragging = true;
      }
      if (!dragMovedRef.current) return;
      const scale = sectionPitchAvg() / Math.max(1, pillPitch);
      let next = startScrollY + dx * scale;
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
      // Snap to the nearest section.
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
      targetScrollY = Math.max(0, nearest - scrollOffset);
      if (raf === null) raf = requestAnimationFrame(tick);
      // Suppress the click that follows a real drag so it doesn't also tap-jump.
      if (dragMovedRef.current) {
        const suppress = (ev: Event) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        window.addEventListener("click", suppress, { capture: true, once: true });
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
      (window as unknown as { __pillNavDragging?: boolean }).__pillNavDragging = false;
    };
  }, [sectionRefs, count, runId, scrollOffset]);

  const handleTap = (i: number) => {
    if (dragMovedRef.current) return;
    const el = sectionRefs[i]?.current;
    if (!el) return;
    const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - scrollOffset);
    window.scrollTo({ top, behavior: "smooth" });
  };

  const phaseClass =
    phase === "entering"
      ? " projects-nav-m--entering"
      : phase === "exiting"
        ? " projects-nav-m--exiting"
        : "";

  const variantClass =
    variant === "dark" ? " projects-nav-m--dark" : " projects-nav-m--light";

  if (phase === "hidden" && !alwaysVisible) return null;

  return (
    <aside
      key={runId}
      className={`projects-nav-m${variantClass}${phaseClass}`}
      aria-label="Section navigation"
      aria-hidden={phase !== "entering"}
    >
      <div
        ref={trackRef}
        className={`projects-nav-m__track${pressed ? " projects-nav-m__track--pressed" : ""}`}
        style={{ touchAction: "none" }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            ref={(el) => {
              if (el) wrapRefs.current[i] = el;
            }}
            className="projects-nav-m__dot-wrap"
            onClick={() => handleTap(i)}
            aria-label={`Go to section ${i + 1}`}
          >
            <div
              ref={(el) => {
                if (el) dotRefs.current[i] = el;
              }}
              className="projects-nav-m__pill"
            />
          </button>
        ))}
      </div>
    </aside>
  );
}
