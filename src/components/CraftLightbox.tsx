import { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import type { CraftItem } from '../data/craft';
import CaseStudyVideo from './CaseStudyVideo';
import Picture from './Picture';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const MORPH_IN_MS = 520;
const MORPH_OUT_MS = 380;
// How much accumulated same-direction wheel intent it takes to dismiss the
// lightbox. Tuned so casual scrolling within a tall screenshot doesn't
// accidentally close, while a deliberate flick commits crisply.
const SCROLL_DISMISS_PX = 360;
// Edge-overflow grace: when the user pans a zoomed image past the top/bottom
// bound, this much "wasted" wheel must accumulate before we start counting
// toward dismiss. Lets you reach the end of a screenshot and pause without
// triggering close on the next nudge.
const EDGE_GRACE_PX = 120;

// Base zoom button steps. Tall images get extra steps appended so the +/-
// buttons can step above the natural maximum (3×) when the per-item initial
// zoom (computed from aspect) is itself > 3.
const ZOOM_STEPS_BASE = [1, 1.5, 2.25, 3];
const ZOOM_MIN = 1;
// Only auto-zoom when the image is meaningfully taller than wide — short or
// square images keep zoom = 1 so the contain-fit shows them in full.
const TALL_ASPECT_THRESHOLD = 1.4; // natH / natW (= 1/aspect, since aspect = w/h)

/**
 * Decide how to frame a tall image on open. Takes the image's aspect (w/h)
 * and returns the initial zoom + vertical pan needed to align the TOP of
 * the image with the top of the card, with the image scaled up so it fills
 * the viewport width (so a tall screenshot reads like "viewing the page"
 * rather than the whole image squashed into 85vh).
 *
 * Returns zoom = 1 for non-tall images, leaving them in default contain-fit.
 */
function computeInitialFraming(aspect: number): { zoom: number; panY: number } {
  if (!aspect || 1 / aspect < TALL_ASPECT_THRESHOLD) {
    return { zoom: 1, panY: 0 };
  }
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const renderedH = 0.85 * vh; // matches .craft-lightbox__img { height: 85vh }
  const renderedW = aspect * renderedH;
  // Target ~70% of the available viewport width (which itself has a 64px
  // gutter on each side). Tuned by eye — filling the full width felt too
  // aggressive; 70% leaves comfortable air around a screenshot while still
  // showing it at a readable size.
  const targetW = (vw - 128) * 0.7;
  const zoom = Math.max(1, targetW / renderedW);
  if (zoom <= 1.05) return { zoom: 1, panY: 0 };
  // transform-origin is center center, so scaling pushes the top edge up by
  // (z-1)*H/2; translate down by that amount to snap the top back into view.
  const panY = ((zoom - 1) * renderedH) / 2;
  return { zoom, panY };
}

type Props = {
  items: CraftItem[];
  index: number;
  /** Aspect ratios (w/h) keyed by item id, populated as grid images load.
   *  Used to compute initial zoom synchronously on open so tall screenshots
   *  don't flash at 1× before jumping to their framed zoom. */
  aspectMap?: Record<string, number>;
  // Returns the source element to morph from/to for a given item index — we
  // re-measure it each frame so it tracks the page scrolling underneath the
  // overlay. Queried for the CURRENT index (not the one first clicked) so that
  // closing after prev/next navigation animates back to the item actually shown.
  getOriginEl: (index: number) => HTMLElement | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
};

type Phase = 'origin' | 'center' | 'idle' | 'closing';

type Rect = { top: number; left: number; width: number; height: number };

function measure(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export default function CraftLightbox({
  items,
  index,
  aspectMap,
  getOriginEl,
  onClose,
  onIndexChange,
}: Props) {
  // Compute initial framing synchronously from the current item's already-
  // measured aspect (if the grid resolved one). Falls back to zoom=1, and the
  // image's onLoad below will catch it up once the bitmap decodes. Doing this
  // in lazy initializers means the very first render of the lightbox already
  // has the correct zoom/pan — no visible flash from 1× to N×.
  const initialFraming = (() => {
    const id = items[index]?.id;
    const measured = id ? aspectMap?.[id] : undefined;
    const a = measured ?? items[index]?.aspect ?? 0;
    return computeInitialFraming(a);
  })();
  const [phase, setPhase] = useState<Phase>(() => (getOriginEl(index) ? 'origin' : 'idle'));
  const [mounted, setMounted] = useState(false);
  const [dir, setDir] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  // Backdrop progress driven by scroll dismissal — 1 = fully open, 0 = fully gone.
  const [scrollProgress, setScrollProgress] = useState(1);
  // Signed "tug" offset (px) applied to the card while the user is pushing
  // toward dismiss. Positive = image drifts down (user is scrolling down past
  // the bottom edge); negative = drifts up. Resets to 0 when the dismiss
  // accumulator resets, so the card snaps back if the user pauses or reverses.
  const [dismissDrift, setDismissDrift] = useState(0);
  // User-controlled zoom multiplier applied to the centered card. Seeded from
  // initialFraming so tall images open already at their framed zoom — no
  // flash from 1× during the morph-in.
  const [zoom, setZoom] = useState(initialFraming.zoom);
  // Per-item initial zoom — bumped above 1 for tall screenshots so the user
  // sees the image filling the viewport width instead of squashed into 85vh.
  // Resets and re-derives when the item changes.
  const [initialZoom, setInitialZoom] = useState(initialFraming.zoom);
  // Effective max zoom — the user can always step up to at least 2× the
  // initial zoom even when the initial is already > 3.
  const [zoomMax, setZoomMax] = useState(
    Math.max(
      ZOOM_STEPS_BASE[ZOOM_STEPS_BASE.length - 1],
      initialFraming.zoom * 2,
    ),
  );
  // Pan offset (px) applied alongside zoom when zoomed in. Seeded so the TOP
  // of the image aligns with the top of the card on tall images.
  const [pan, setPan] = useState({ x: 0, y: initialFraming.panY });
  // Live drag state — refs to avoid re-renders on every mousemove.
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    panStartX: number;
    panStartY: number;
    moved: boolean;
  }>({ active: false, startX: 0, startY: 0, panStartX: 0, panStartY: 0, moved: false });
  const [isDragging, setIsDragging] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const closingRef = useRef(false);
  // True when close was triggered by Esc — we then suppress the focus ring
  // on the restored element so it doesn't get a keyboard focus-visible halo.
  const closedByEscRef = useRef(false);
  const [originTransform, setOriginTransform] = useState<string | null>(null);
  // The transform string set at the moment close starts. React passes this as
  // the card's `style.transform` during 'closing' so subsequent re-renders
  // (e.g. from scroll-progress) don't overwrite our imperative rAF writes.
  const [closingStartTransform, setClosingStartTransform] = useState<string | null>(null);

  // Always-current index for callbacks (close / origin transform) that must read
  // the latest value WITHOUT being recreated on every navigation — recreating
  // `close` would needlessly re-bind the heavy wheel listener and reset its
  // gesture accumulators.
  const indexRef = useRef(index);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  // Compute the inverted origin transform — re-measures the source card every
  // time so it tracks scroll/layout changes. Uses a UNIFORM scale to preserve
  // aspect ratio (no distortion). The source card uses `object-fit: cover`
  // which crops, so morphing between two different aspect rects without a
  // uniform scale would stretch the image. We scale to fit the source rect
  // entirely (max of sx, sy) and center the difference with translate.
  const computeOriginTransform = useCallback((): string | null => {
    const card = cardRef.current;
    const sourceEl = getOriginEl(indexRef.current);
    if (!card || !sourceEl) return null;
    const finalRect = measure(card);
    const sourceRect = measure(sourceEl);
    if (finalRect.width === 0 || finalRect.height === 0) return null;
    const sx = sourceRect.width / finalRect.width;
    const sy = sourceRect.height / finalRect.height;
    // Use the LARGER scale so the morphed card fully covers the source slot
    // (matching `object-fit: cover` behavior on the grid card).
    const scale = Math.max(sx, sy);
    const scaledW = finalRect.width * scale;
    const scaledH = finalRect.height * scale;
    // Center the scaled card over the source rect
    const dx = sourceRect.left - finalRect.left - (scaledW - sourceRect.width) / 2;
    const dy = sourceRect.top - finalRect.top - (scaledH - sourceRect.height) / 2;
    return `translate(${dx}px, ${dy}px) scale(${scale})`;
  }, [getOriginEl]);

  // Initial morph: pin to origin synchronously after first paint.
  useLayoutEffect(() => {
    if (phase !== 'origin') return;
    const t = computeOriginTransform();
    if (t) setOriginTransform(t);
  }, [phase, computeOriginTransform]);

  // After origin paints, advance to center on next frame to trigger transition.
  useEffect(() => {
    if (phase !== 'origin' || originTransform === null) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setPhase('center'));
    });
    return () => {
      cancelAnimationFrame(r1);
      if (r2) cancelAnimationFrame(r2);
    };
  }, [phase, originTransform]);

  // When the centering transition ends, mark idle.
  useEffect(() => {
    if (phase !== 'center') return;
    const card = cardRef.current;
    if (!card) return;
    const onEnd = (e: TransitionEvent) => {
      if (e.target !== card || e.propertyName !== 'transform') return;
      setPhase('idle');
      card.removeEventListener('transitionend', onEnd);
    };
    card.addEventListener('transitionend', onEnd);
    const t = window.setTimeout(() => setPhase('idle'), MORPH_IN_MS + 80);
    return () => {
      card.removeEventListener('transitionend', onEnd);
      clearTimeout(t);
    };
  }, [phase]);

  // Backdrop fade-in
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    const card = cardRef.current;
    const sourceEl = getOriginEl(indexRef.current);
    if (!card || !sourceEl) {
      setMounted(false);
      setPhase('closing');
      window.setTimeout(onClose, 240);
      return;
    }

    // Measure the card's natural (untransformed) box. offsetWidth/Height
    // ignore the current CSS transform, giving us the layout size.
    const naturalW = card.offsetWidth;
    const naturalH = card.offsetHeight;
    if (naturalW === 0 || naturalH === 0) {
      setMounted(false);
      setPhase('closing');
      window.setTimeout(onClose, 240);
      return;
    }
    // For position, we need the card's untransformed origin. Compute it from
    // the current visible rect minus the current transform offset.
    const visibleRect = measure(card);
    const currentMatrix = new DOMMatrixReadOnly(getComputedStyle(card).transform);
    const naturalLeft = visibleRect.left - currentMatrix.e;
    const naturalTop = visibleRect.top - currentMatrix.f;
    const finalRect = { left: naturalLeft, top: naturalTop, width: naturalW, height: naturalH };

    // Starting point: read the current visual transform from the matrix so we
    // pick up wherever the card actually is (it may be mid-open transition).
    const startMatrix = currentMatrix;
    const start = {
      dx: startMatrix.e,
      dy: startMatrix.f,
      scale: startMatrix.a || 1, // uniform scale, so .a == .d. Fallback to 1 if no transform.
    };

    // Pin the React-side style.transform to the starting value BEFORE flipping
    // to 'closing'. That way every re-render during the close (e.g. from the
    // scroll-progress rAF) keeps the same stable transform string — React won't
    // overwrite our imperative rAF writes by clearing/changing the prop.
    const startTransformStr = `translate(${start.dx}px, ${start.dy}px) scale(${start.scale})`;
    setClosingStartTransform(startTransformStr);
    setMounted(false);
    setPhase('closing');

    // Also write it imperatively right now so there's no flicker if React
    // hasn't committed the re-render yet.
    card.style.transformOrigin = 'top left';
    card.style.transition = 'none';
    card.style.willChange = 'transform';
    card.style.transform = startTransformStr;

    // Easing — iOS-style smooth deceleration
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / MORPH_OUT_MS);
      const e = ease(t);

      // Re-measure the source EVERY frame so the target tracks scroll/layout.
      const src = measure(sourceEl);
      const sx = src.width / finalRect.width;
      const sy = src.height / finalRect.height;
      const scaleEnd = Math.max(sx, sy);
      const scaledW = finalRect.width * scaleEnd;
      const scaledH = finalRect.height * scaleEnd;
      const dxEnd = src.left - finalRect.left - (scaledW - src.width) / 2;
      const dyEnd = src.top - finalRect.top - (scaledH - src.height) / 2;

      // Interpolate from start (identity) toward the live target.
      const dx = start.dx + (dxEnd - start.dx) * e;
      const dy = start.dy + (dyEnd - start.dy) * e;
      const scale = start.scale + (scaleEnd - start.scale) * e;

      card.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onClose();
      }
    };
    raf = requestAnimationFrame(tick);
  }, [onClose, getOriginEl]);

  const go = useCallback(
    (delta: number) => {
      const next = (index + delta + items.length) % items.length;
      setDir(delta > 0 ? 1 : -1);
      setAnimKey((k) => k + 1);
      // Reset per-item state; initialZoom will be re-derived from the new
      // image's natural size in onImgLoad.
      setZoom(1);
      setInitialZoom(1);
      setZoomMax(ZOOM_STEPS_BASE[ZOOM_STEPS_BASE.length - 1]);
      setPan({ x: 0, y: 0 });
      onIndexChange(next);
    },
    [index, items.length, onIndexChange]
  );

  // Fallback path: when the parent didn't yet have an aspect for this item
  // (rare — the grid measures aspects on first paint), derive it from the
  // image's natural size and apply the same framing. We skip this when the
  // synchronous init already set a zoom > 1 so we don't fight a user mid-
  // pan/zoom by re-applying the initial frame.
  const onImgLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (initialZoom > 1) return;
      const img = e.currentTarget;
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      if (!natW || !natH) return;
      const { zoom: z, panY } = computeInitialFraming(natW / natH);
      if (z <= 1) return;
      setInitialZoom(z);
      setZoomMax(Math.max(ZOOM_STEPS_BASE[ZOOM_STEPS_BASE.length - 1], z * 2));
      setZoom(z);
      setPan({ x: 0, y: panY });
    },
    [initialZoom],
  );

  // Clamp pan so the image edges don't drift too far outside the viewport.
  // At zoom z, the card is z× bigger; allowed pan range is ±((z-1)/2) of card
  // size, since transform-origin is center.
  const clampPan = useCallback((x: number, y: number, z: number) => {
    const card = cardRef.current;
    if (!card || z <= 1) return { x: 0, y: 0 };
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const maxX = (w * (z - 1)) / 2;
    const maxY = (h * (z - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, []);

  // The effective ladder of zoom stops. Includes the base 1/1.5/2.25/3 steps
  // plus the per-item `initialZoom` (when it's bigger than 1), plus an extra
  // step at 1.5× initial so a tall screenshot can still be zoomed-in further
  // from its already-zoomed starting point.
  const zoomSteps = (() => {
    const set = new Set<number>(ZOOM_STEPS_BASE);
    if (initialZoom > 1) {
      set.add(initialZoom);
      set.add(initialZoom * 1.5);
    }
    return [...set].sort((a, b) => a - b);
  })();

  const zoomIn = useCallback(() => {
    const next = zoomSteps.find((s) => s > zoom + 0.01) ?? zoomMax;
    setZoom(next);
    setPan((p) => clampPan(p.x, p.y, next));
  }, [zoom, zoomMax, zoomSteps, clampPan]);

  const zoomOut = useCallback(() => {
    const reversed = [...zoomSteps].reverse();
    const next = reversed.find((s) => s < zoom - 0.01) ?? ZOOM_MIN;
    setZoom(next);
    if (next <= 1) setPan({ x: 0, y: 0 });
    else setPan((p) => clampPan(p.x, p.y, next));
  }, [zoom, zoomSteps, clampPan]);

  // Reset to the item's initial framing (how it opened): 1× for normal images,
  // the auto-framed zoom + top-aligned pan for tall screenshots. Bound to "R".
  const resetZoom = useCallback(() => {
    const id = items[index]?.id;
    const a = (id ? aspectMap?.[id] : undefined) ?? items[index]?.aspect ?? 0;
    const { zoom: z, panY } = computeInitialFraming(a);
    setZoom(z);
    setPan({ x: 0, y: panY });
  }, [items, index, aspectMap]);

  // ── Drag-to-pan ────────────────────────────────────────────────────────────
  // Zoom is controlled exclusively by the top-right zoom buttons (and +/-
  // keys). Clicking the image no longer zooms. Pointer interaction on the card
  // is solely for drag-to-pan once the image is already zoomed in.
  const onCardPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      // Always keep a click on the card from bubbling to the backdrop (which
      // would close the lightbox), but only start a pan gesture when zoomed.
      e.stopPropagation();
      if (zoom <= 1) return;
      e.preventDefault();
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        panStartX: pan.x,
        panStartY: pan.y,
        moved: false,
      };
      setIsDragging(true);

      const onMove = (ev: PointerEvent) => {
        const d = dragRef.current;
        if (!d.active) return;
        const dx = ev.clientX - d.startX;
        const dy = ev.clientY - d.startY;
        if (!d.moved && Math.hypot(dx, dy) > 3) d.moved = true;
        setPan(clampPan(d.panStartX + dx, d.panStartY + dy, zoom));
      };
      const onUp = () => {
        dragRef.current.active = false;
        setIsDragging(false);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [zoom, pan.x, pan.y, clampPan]
  );

  // Briefly flash the hover/pressed state on a nav button (for arrow-key feedback)
  const pulseNavButton = useCallback((btn: HTMLButtonElement | null) => {
    if (!btn) return;
    btn.classList.add('is-pressed');
    window.setTimeout(() => btn.classList.remove('is-pressed'), 220);
  }, []);

  // Disable horizontal browser back-swipe while the lightbox is open. macOS
  // / iPadOS trackpads otherwise navigate the page on a strong horizontal
  // swipe even if individual wheel events are preventDefault'd.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overscrollBehaviorX;
    const prevBody = body.style.overscrollBehaviorX;
    html.style.overscrollBehaviorX = 'none';
    body.style.overscrollBehaviorX = 'none';
    return () => {
      html.style.overscrollBehaviorX = prevHtml;
      body.style.overscrollBehaviorX = prevBody;
    };
  }, []);

  // Latest pan/zoom for the wheel handler. We keep these in refs so the
  // single window-level wheel listener can read the current values without
  // having to re-bind (and lose its captured accumulators) every time pan
  // or zoom updates.
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // ── Unified wheel handling ───────────────────────────────────────────────
  // Three jobs from one listener:
  //   - Horizontal swipe → prev/next.
  //   - Vertical wheel, zoomed in → pan the image. Edge overflow accumulates
  //     toward dismiss only after a grace period so reaching the bottom of a
  //     tall screenshot doesn't auto-dismiss on the very next nudge.
  //   - Vertical wheel, not zoomed → dismiss accumulator directly.
  //
  // Friction model: the dismiss accumulator is SIGNED (running sum of dy in
  // the most recent direction). Reversing direction zeroes it. So the user
  // has to push a sustained 420px in one direction to close — short
  // back-and-forth scrolling never adds up. preventDefault on every event so
  // the page underneath never scrolls.
  useEffect(() => {
    let accumX = 0;
    let dismissAccum = 0;
    let dismissDir = 0; // -1 / 0 / 1 — last counted direction
    let edgeOverflow = 0; // |signed overflow| since hitting an edge
    let lastNavAt = 0;
    let lastEventAt = 0;
    const NAV_THRESHOLD = 140;
    const COOLDOWN_MS = 500;
    // Wider decay window — a half-second pause still counts as "same gesture".
    const DECAY_MS = 500;
    // ── Elastic release ────────────────────────────────────────────────────
    // As soon as wheel events stop, ease the dismiss accumulator (and the
    // visible drift + scrim) back to 0 so the card never gets "stuck"
    // partway between framed and dismiss. Frame-by-frame so it feels alive
    // — purely CSS transitions wouldn't decay the underlying dismissAccum,
    // so reaching the threshold from intermediate states would still work
    // with the same total push.
    let releaseRaf = 0;
    let releaseTimer = 0;
    const RELEASE_DELAY_MS = 60; // brief settle after last event
    const MAX_DRIFT_PX = 120;
    // Release spring (under-damped → a small elastic overshoot on snap-back).
    // Operates on `v` = pull progress (= accum / SCROLL_DISMISS_PX). k/c are
    // tuned for a subtle bounce (damping ratio ≈ 0.6); dt is clamped so a
    // dropped frame can't make it explode.
    const SPRING_K = 200;
    const SPRING_C = 17;
    let springV = 0;
    let springVel = 0;
    let lastFrameAt = 0;

    // Writes BOTH the scrim and the card drift from one pull value `v`, so they
    // stay visually locked. Drift is a rubber-band (tanh) so the card keeps
    // responding across the WHOLE pull — no dead zone where the back half of
    // the scroll stops moving it — and is signed so the release spring's
    // overshoot can bounce the card a hair past center. The scrim only dims for
    // a positive (toward-dismiss) pull.
    const applyPull = (v: number, dir: number) => {
      setDismissDrift(v === 0 ? 0 : -dir * Math.tanh(v * 1.1) * MAX_DRIFT_PX);
      const p = Math.max(0, Math.min(1, v));
      const eased = 1 - Math.pow(1 - p, 2);
      setScrollProgress(1 - eased);
    };

    const tick = (now: number) => {
      const dt = Math.min(lastFrameAt === 0 ? 16 : now - lastFrameAt, 32) / 1000;
      lastFrameAt = now;
      // Critically-ish damped spring toward rest (v = 0).
      const a = -SPRING_K * springV - SPRING_C * springVel;
      springVel += a * dt;
      springV += springVel * dt;
      // Keep the gate accumulator synced to the spring so a re-scroll mid-bounce
      // continues smoothly from where the card actually is.
      dismissAccum = Math.max(0, springV) * SCROLL_DISMISS_PX;
      if (Math.abs(springV) < 0.002 && Math.abs(springVel) < 0.02) {
        springV = 0;
        springVel = 0;
        dismissAccum = 0;
        dismissDir = 0;
        applyPull(0, dismissDir);
        releaseRaf = 0;
        return;
      }
      applyPull(springV, dismissDir);
      releaseRaf = requestAnimationFrame(tick);
    };
    const scheduleRelease = () => {
      cancelAnimationFrame(releaseRaf);
      releaseRaf = 0;
      // Use a tiny setTimeout so a burst of wheel events doesn't start the
      // spring mid-gesture. Each wheel cancels the pending start.
      window.clearTimeout(releaseTimer);
      releaseTimer = window.setTimeout(() => {
        lastFrameAt = 0;
        springV = dismissAccum / SCROLL_DISMISS_PX;
        springVel = 0;
        releaseRaf = requestAnimationFrame(tick);
      }, RELEASE_DELAY_MS);
    };
    const cancelRelease = () => {
      window.clearTimeout(releaseTimer);
      cancelAnimationFrame(releaseRaf);
      releaseRaf = 0;
    };

    const onWheel = (e: WheelEvent) => {
      if (closingRef.current) return;
      // Mac trackpad pinch-to-zoom comes through as wheel with ctrlKey —
      // ignore so the OS gesture isn't fought over.
      if (e.ctrlKey) return;
      e.preventDefault();
      cancelRelease();

      const now = performance.now();
      if (now - lastEventAt > DECAY_MS) {
        accumX = 0;
        dismissAccum = 0;
        dismissDir = 0;
        edgeOverflow = 0;
        applyPull(0, 0);
      }
      lastEventAt = now;

      // Horizontal swipe wins when clearly horizontal.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        accumX += e.deltaX;
        if (now - lastNavAt < COOLDOWN_MS) return;
        if (accumX > NAV_THRESHOLD) {
          pulseNavButton(nextBtnRef.current);
          go(1);
          accumX = 0;
          lastNavAt = now;
        } else if (accumX < -NAV_THRESHOLD) {
          pulseNavButton(prevBtnRef.current);
          go(-1);
          accumX = 0;
          lastNavAt = now;
        }
        return;
      }

      // Vertical wheel.
      const dy = e.deltaY;
      const z = zoomRef.current;
      let dismissContribution = dy; // default: all of dy when not zoomed

      if (z > 1) {
        // Natural-scroll direction: wheel down reveals lower parts of image.
        const p = panRef.current;
        const proposed = { x: p.x, y: p.y - dy };
        const clamped = clampPan(proposed.x, proposed.y, z);
        // Signed amount the clamp ate — sign of (proposed - clamped) equals
        // sign of (dy) when we're pushed past the edge in dy's direction.
        const overflow = proposed.y - clamped.y;
        setPan(clamped);

        if (Math.abs(overflow) < 0.5) {
          // Inside the bounds — pure pan, nothing toward dismiss. Reset the
          // edge grace so the next time we hit an edge it has to overflow
          // EDGE_GRACE_PX again before counting.
          edgeOverflow = 0;
          dismissContribution = 0;
        } else {
          // We're past the edge. Pad EDGE_GRACE_PX of "free" overflow before
          // any wheel intent counts toward dismiss.
          edgeOverflow += Math.abs(overflow);
          if (edgeOverflow <= EDGE_GRACE_PX) {
            dismissContribution = 0;
          } else {
            // Only the portion beyond the grace counts, with the sign of dy
            // (so reverse direction still cancels).
            const beyond = edgeOverflow - EDGE_GRACE_PX;
            dismissContribution = Math.sign(dy) * Math.min(Math.abs(dy), beyond);
          }
        }
      }

      // Update the signed dismiss accumulator. Direction reversal zeroes it
      // — short back-and-forth scrolling never adds up to dismiss. Scrim
      // and drift are both written from the same pull progress so they
      // stay visually locked together (see applyPull).
      if (dismissContribution !== 0) {
        const dir = Math.sign(dismissContribution);
        if (dir !== dismissDir) {
          dismissAccum = 0;
          dismissDir = dir;
        }
        dismissAccum += Math.abs(dismissContribution);
        applyPull(dismissAccum / SCROLL_DISMISS_PX, dismissDir);
        if (dismissAccum > SCROLL_DISMISS_PX) close();
      }
      // Always schedule release after each event — if more wheel events
      // come in, scheduleRelease cancels itself. The moment the user lets
      // go, the rAF kicks in and eases everything back to 0.
      scheduleRelease();
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
      cancelRelease();
    };
  }, [close, clampPan, go, pulseNavButton]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closedByEscRef.current = true;
        close();
      }
      else if (e.key === 'ArrowRight') {
        pulseNavButton(nextBtnRef.current);
        go(1);
      } else if (e.key === 'ArrowLeft') {
        pulseNavButton(prevBtnRef.current);
        go(-1);
      }
      else if (e.key === '+' || e.key === '=') zoomIn();
      else if (e.key === '-' || e.key === '_') zoomOut();
      else if (e.key === 'r' || e.key === 'R') resetZoom();
      else if (e.key === 'Tab') {
        const root = rootRef.current;
        if (!root) return;
        const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !root.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !root.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, go, zoomIn, zoomOut, resetZoom, pulseNavButton]);

  // Focus mgmt
  useEffect(() => {
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    const root = rootRef.current;
    // Focus the root (not a button) so no visible control gets a focus ring
    // by default. Tab trap below moves focus into actual controls only when
    // the user explicitly tabs.
    if (root) root.focus();
    return () => {
      const target = prevFocusRef.current;
      if (!target) return;
      // preventScroll: restoring focus must NOT scroll the source back into
      // view. After a scroll-to-dismiss the user has often scrolled elsewhere,
      // and yanking them back to the just-closed item is jarring — let their
      // new scroll position stand.
      target.focus?.({ preventScroll: true });
      // If the close was triggered by Esc, drop the focus immediately so the
      // restored element doesn't display a keyboard focus ring. The user can
      // still tab back to it if they actually want keyboard focus.
      if (closedByEscRef.current) {
        target.blur?.();
      }
    };
  }, []);

  const item = items[index];

  const cardStyle: React.CSSProperties = (() => {
    // Single coordinate system — top-left origin — for every phase. Pan/zoom
    // are still authored with "around the center" semantics for clarity, but
    // converted to a top-left translate here. Keeping ONE origin across all
    // phases prevents the abrupt shift that used to happen when phase flipped
    // from 'center' (top-left) to 'idle' (center-center) — that transition
    // swap would visually snap a zoomed-in tall image to a new position.
    const card = cardRef.current;
    const w = card?.offsetWidth ?? 0;
    const h = card?.offsetHeight ?? 0;
    const framedTransform = (px: number, py: number, z: number): string => {
      const tx = px - ((z - 1) * w) / 2;
      const ty = py - ((z - 1) * h) / 2;
      return `translate(${tx}px, ${ty}px) scale(${z})`;
    };

    if (phase === 'origin' && originTransform) {
      return {
        transformOrigin: 'top left',
        transform: originTransform,
        transition: 'none',
        willChange: 'transform',
      };
    }
    if (phase === 'center') {
      // Animate from origin (top-left anchored thumb position) to the final
      // framed transform (pan/zoom expressed in top-left coordinates).
      return {
        transformOrigin: 'top left',
        transform: framedTransform(pan.x, pan.y, zoom),
        transition: `transform ${MORPH_IN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        willChange: 'transform',
        // The card's scale(zoom) would also scale its border-radius, making the
        // corners look rounder when zoomed. Divide the authored radius by zoom
        // so the rendered radius stays a constant --radius-img at any zoom.
        borderRadius: `calc(var(--radius-img) / ${zoom})`,
      };
    }
    if (phase === 'idle') {
      // Same expression as 'center' — no origin or basis change between the
      // two phases, just whether there's a transition wrapping the change.
      // Dismiss drift is added to pan.y so the card tugs in the direction
      // of the gesture as the user pushes past an edge toward dismiss.
      // Wheel events update pan continuously, so suppress the slow ease
      // during active drift/drag — otherwise the card lags behind the wheel.
      // The natural snap-back to dismissDrift = 0 still gets a transition
      // because the lighter 'transform 200ms ...' kicks in once drift is 0.
      const live = isDragging || dismissDrift !== 0;
      return {
        transformOrigin: 'top left',
        transform: framedTransform(pan.x, pan.y + dismissDrift, zoom),
        transition: live
          ? 'transform 80ms linear'
          : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        // Keep the rendered corner radius constant regardless of zoom — the
        // card's scale(zoom) would otherwise enlarge the border-radius too.
        borderRadius: `calc(var(--radius-img) / ${zoom})`,
      };
    }
    if (phase === 'closing' && closingStartTransform) {
      // Locked to the starting transform so React doesn't fight with the
      // rAF that's mutating style.transform every frame. The imperative
      // writes win because they happen between React commits. Box-shadow
      // gets its own transition so it fades out alongside the morph back to
      // the source — otherwise the shadow follows the card the whole way
      // and snaps off when the lightbox unmounts.
      return {
        transformOrigin: 'top left',
        transform: closingStartTransform,
        transition: `box-shadow ${MORPH_OUT_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        boxShadow: 'none',
        willChange: 'transform',
      };
    }
    return {};
  })();

  const cardAnimClass =
    phase === 'idle' && dir !== 0
      ? dir > 0
        ? 'craft-lightbox__card--next'
        : 'craft-lightbox__card--prev'
      : 'craft-lightbox__card--morph';

  // Backdrop opacity multiplier from scroll progress (1 = full, 0 = gone)
  const backdropStyle: React.CSSProperties = {
    // Tie the backdrop opacity to scroll-dismiss progress for a continuous feel
    '--lb-scroll-progress': scrollProgress,
  } as React.CSSProperties;

  return (
    <div
      ref={rootRef}
      className={`craft-lightbox${mounted ? ' is-open' : ''}${
        phase === 'closing' ? ' is-closing' : ''
      }`}
      style={backdropStyle}
      onClick={close}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div className="craft-lightbox__meta">
        <div
          key={index}
          className={`craft-lightbox__meta-inner craft-lightbox__meta-inner--${
            dir > 0 ? 'next' : dir < 0 ? 'prev' : 'enter'
          }`}
        >
          <div className="craft-lightbox__label-row">
            <h3 className="craft-lightbox__label">{item.label}</h3>
            {item.link ? (
              <span className="craft-lightbox__link-sep" aria-hidden="true">
                •
              </span>
            ) : null}
            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="craft-lightbox__link"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="craft-lightbox__link-label">
                  {item.linkLabel ?? 'Visit'}
                </span>
                <svg
                  className="craft-lightbox__link-arrow"
                  width="18"
                  height="18"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2.5 6H9.5M9.5 6L6 2.5M9.5 6L6 9.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            ) : null}
          </div>
          <p className="craft-lightbox__date">{item.date}</p>
        </div>
      </div>

      <div className="craft-lightbox__top-actions">
        <button
          type="button"
          className="craft-lightbox__icon-btn craft-lightbox__icon-btn--zoom-out"
          aria-label="Zoom out"
          disabled={zoom <= ZOOM_MIN + 0.01}
          onClick={(e) => {
            e.stopPropagation();
            zoomOut();
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M5.5 8H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          className="craft-lightbox__icon-btn craft-lightbox__icon-btn--zoom-in"
          aria-label="Zoom in"
          disabled={zoom >= zoomMax - 0.01}
          onClick={(e) => {
            e.stopPropagation();
            zoomIn();
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M5.5 8H10.5M8 5.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          className="craft-lightbox__icon-btn craft-lightbox__icon-btn--close"
          aria-label="Close"
          onClick={(e) => {
            e.stopPropagation();
            close();
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <button
        ref={prevBtnRef}
        type="button"
        className="craft-lightbox__nav craft-lightbox__nav--prev"
        aria-label="Previous"
        onClick={(e) => {
          e.stopPropagation();
          go(-1);
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path d="M13.5 4L6.5 11L13.5 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        ref={nextBtnRef}
        type="button"
        className="craft-lightbox__nav craft-lightbox__nav--next"
        aria-label="Next"
        onClick={(e) => {
          e.stopPropagation();
          go(1);
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path d="M8.5 4L15.5 11L8.5 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        ref={cardRef}
        key={animKey}
        className={`craft-lightbox__card ${cardAnimClass} ${
          isDragging
            ? 'craft-lightbox__card--grabbing'
            : zoom > 1
            ? 'craft-lightbox__card--pannable'
            : ''
        }`}
        style={cardStyle}
        onPointerDown={onCardPointerDown}
        onClick={(e) => {
          // Stop a click on the card from bubbling to the backdrop, which would
          // close the lightbox. Zoom is controlled only by the top-right buttons.
          e.stopPropagation();
        }}
      >
        {item.src ? (
          /\.(mp4|mov|webm|ogg)$/i.test(item.src) ? (
            <CaseStudyVideo src={item.src} label={item.label} />
          ) : (
            <Picture
              src={item.src}
              alt={item.alt ?? item.label}
              className="craft-lightbox__img"
              onLoad={onImgLoad}
            />
          )
        ) : (
          <div className="craft-lightbox__placeholder" />
        )}
      </div>
    </div>
  );
}
