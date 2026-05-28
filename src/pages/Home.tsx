import { useRef, useCallback, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import EffectB from '../components/effects/EffectB';
import ProjectsNav from '../components/ProjectsNav';
import ProjectsNavMobile from '../components/ProjectsNavMobile';
import work from '../data/work';

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<React.RefObject<HTMLDivElement>[]>(
    work.map(() => ({ current: null } as React.RefObject<HTMLDivElement>))
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

  useEffect(() => {
    const projectTops = (): number[] =>
      sectionRefs.current
        .map((r) => (r.current ? Math.round(r.current.getBoundingClientRect().top + window.scrollY) : null))
        .filter((t): t is number => t !== null);

    // Snap targets include the hero so scrolling from the homepage snaps into the first project.
    // Footer is NOT a snap target — past the last project the page scrolls freely.
    const snapTops = (): number[] => {
      const tops: number[] = [];
      if (heroRef.current) tops.push(Math.round(heroRef.current.getBoundingClientRect().top + window.scrollY));
      tops.push(...projectTops());
      return tops;
    };

    // Range within which snapping is active: [hero top, last project top].
    const snapRange = (): { min: number; max: number } | null => {
      const tops = snapTops();
      if (tops.length === 0) return null;
      return { min: tops[0], max: tops[tops.length - 1] };
    };

    const nearestSnapTop = (y: number): number => {
      const tops = snapTops();
      let best = tops[0];
      let bestDist = Math.abs(y - best);
      for (let i = 1; i < tops.length; i++) {
        const d = Math.abs(y - tops[i]);
        if (d < bestDist) { best = tops[i]; bestDist = d; }
      }
      return best;
    };

    const currentSnapIndex = (y: number): number => {
      const tops = snapTops();
      let idx = 0;
      let bestDist = Math.abs(y - tops[0]);
      for (let i = 1; i < tops.length; i++) {
        const d = Math.abs(y - tops[i]);
        if (d < bestDist) { idx = i; bestDist = d; }
      }
      return idx;
    };

    let isSnapping = false;
    let snapCooldownUntil = 0;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let wheelAccum = 0;
    let wheelResetTimer: ReturnType<typeof setTimeout> | null = null;

    const SNAP_COOLDOWN_MS = 900; // coalesce fast swipes into one move
    const IDLE_SNAP_MS = 140;      // after scroll quiets, snap to nearest
    const STEP_THRESHOLD = 60;     // px of wheel delta to count as an intentional step

    let scrollRaf: number | null = null;
    const cancelManualScroll = () => {
      if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);
      scrollRaf = null;
    };

    // Manual eased scroll so we can vary duration for long-press acceleration.
    const easedScrollTo = (y: number, durationMs: number) => {
      cancelManualScroll();
      const startY = window.scrollY;
      const delta = y - startY;
      if (Math.abs(delta) < 1) return;
      const start = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
      isSnapping = true;
      snapCooldownUntil = performance.now() + durationMs + 50;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        window.scrollTo({ top: startY + delta * ease(t), behavior: 'auto' });
        if (t < 1) {
          scrollRaf = requestAnimationFrame(step);
        } else {
          scrollRaf = null;
          isSnapping = false;
        }
      };
      scrollRaf = requestAnimationFrame(step);
    };

    const smoothScrollTo = (y: number) => {
      isSnapping = true;
      snapCooldownUntil = performance.now() + SNAP_COOLDOWN_MS;
      window.scrollTo({ top: y, behavior: 'smooth' });
      // 'scrollend' isn't universally reliable; fall back on a timer.
      const release = () => { isSnapping = false; };
      setTimeout(release, SNAP_COOLDOWN_MS);
    };

    const inSnapZone = (y: number): boolean => {
      const r = snapRange();
      if (!r) return false;
      return y >= r.min - 1 && y <= r.max + 1;
    };

    const scheduleIdleSnap = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (isSnapping) return;
        if (performance.now() < snapCooldownUntil) return;
        const y = window.scrollY;
        if (!inSnapZone(y)) return;
        const target = nearestSnapTop(y);
        if (Math.abs(target - y) > 1) smoothScrollTo(target);
      }, IDLE_SNAP_MS);
    };

    const onWheel = (e: WheelEvent) => {
      if (isPillDragging()) return;
      const y = window.scrollY;
      const r = snapRange();
      if (!r) return;

      // Free scroll above first project or below last project — but if user is
      // entering the snap zone from above/below, capture them at the boundary.
      if (y < r.min || y > r.max) {
        // Crossing into the zone: let native scroll happen, idle snap will tidy.
        scheduleIdleSnap();
        return;
      }

      if (isSnapping || performance.now() < snapCooldownUntil) {
        e.preventDefault();
        return;
      }

      // Coalesce wheel deltas so a single big swipe = one step.
      wheelAccum += e.deltaY;
      if (wheelResetTimer) clearTimeout(wheelResetTimer);
      wheelResetTimer = setTimeout(() => { wheelAccum = 0; }, 260);

      if (Math.abs(wheelAccum) < STEP_THRESHOLD) {
        e.preventDefault();
        return;
      }

      const idx = currentSnapIndex(y);
      const tops = snapTops();
      const dir = wheelAccum > 0 ? 1 : -1;
      const nextIdx = Math.max(0, Math.min(tops.length - 1, idx + dir));
      wheelAccum = 0;

      e.preventDefault();
      // If already at last project and scrolling down → release into footer.
      if (dir > 0 && idx === tops.length - 1) {
        snapCooldownUntil = performance.now() + 150;
        window.scrollBy({ top: e.deltaY, behavior: 'auto' });
        return;
      }
      smoothScrollTo(tops[nextIdx]);
    };

    let touchStartY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? null;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartY === null) return;
      const endY = e.changedTouches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - endY;
      touchStartY = null;
      const y = window.scrollY;
      if (!inSnapZone(y)) { scheduleIdleSnap(); return; }
      if (isSnapping || performance.now() < snapCooldownUntil) return;
      if (Math.abs(delta) < 30) { scheduleIdleSnap(); return; }
      const tops = snapTops();
      const idx = currentSnapIndex(y);
      const dir = delta > 0 ? 1 : -1;
      const nextIdx = Math.max(0, Math.min(tops.length - 1, idx + dir));
      if (nextIdx === idx) { scheduleIdleSnap(); return; }
      smoothScrollTo(tops[nextIdx]);
    };

    const isPillDragging = () =>
      (window as unknown as { __pillNavDragging?: boolean }).__pillNavDragging === true;

    const onScroll = () => {
      if (isSnapping) return;
      if (isPillDragging()) return;
      scheduleIdleSnap();
    };

    let heldKey: 'ArrowDown' | 'ArrowUp' | null = null;
    let holdStreak = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();

      // Track hold streak: each repeat of the same key bumps the counter; releasing or
      // switching direction resets it. Repeats arrive while `e.repeat` is true.
      if (heldKey === e.key && e.repeat) {
        holdStreak++;
      } else {
        heldKey = e.key as 'ArrowDown' | 'ArrowUp';
        holdStreak = e.repeat ? holdStreak + 1 : 0;
      }

      const tops = snapTops();
      const scrollY = window.scrollY;

      // Step count grows with hold: 1 (tap) → 2 → 3 → … capped at 5 sections per press.
      const stepCount = Math.min(5, 1 + Math.floor(holdStreak / 2));
      let target: number;

      if (e.key === 'ArrowDown') {
        const candidates = tops.filter((t) => t > scrollY + 10);
        target = candidates[Math.min(candidates.length, stepCount) - 1] ?? tops[tops.length - 1];
      } else {
        const candidates = [...tops].reverse().filter((t) => t < scrollY - 10);
        target = candidates[Math.min(candidates.length, stepCount) - 1] ?? tops[0];
      }

      // Duration shrinks as hold grows so the page feels like it accelerates.
      // 520ms tap → ~180ms when holding hard.
      const duration = Math.max(180, 520 - holdStreak * 40);
      easedScrollTo(target, duration);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === heldKey) {
        heldKey = null;
        holdStreak = 0;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cancelManualScroll();
      if (idleTimer) clearTimeout(idleTimer);
      if (wheelResetTimer) clearTimeout(wheelResetTimer);
    };
  }, []);

  return (
    <div className="page">
      <Navbar sections={navSections} />
      <div ref={heroRef} className="home__hero-snap">
        <Hero
          title="Welcome."
          subtitle="Clément Rozé designs and builds web experiences that are accessible, intentional, and beautifully."
        />
      </div>
      <EffectB projects={work} onSectionRef={handleSectionRef} />
      <ProjectsNav
        count={work.length}
        sectionRefs={sectionRefs.current}
        tones={work.map((w) => Boolean(w.heroIsLight))}
      />
      <ProjectsNavMobile count={work.length} sectionRefs={sectionRefs.current} variant="light" />
      <div ref={footerRef} style={{ width: '100%' }}><Footer /></div>
    </div>
  );
}
