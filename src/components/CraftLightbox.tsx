import { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import type { CraftItem } from '../data/craft';
import CaseStudyVideo from './CaseStudyVideo';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const MORPH_IN_MS = 520;
const MORPH_OUT_MS = 380;
const SCROLL_DISMISS_PX = 80;

const ZOOM_STEPS = [1, 1.5, 2.25, 3];
const ZOOM_MIN = ZOOM_STEPS[0];
const ZOOM_MAX = ZOOM_STEPS[ZOOM_STEPS.length - 1];

type Props = {
  items: CraftItem[];
  index: number;
  // Returns the source card element so we can re-measure its current viewport
  // position (which moves as the user scrolls the page underneath the overlay).
  getOriginEl: () => HTMLElement | null;
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
  getOriginEl,
  onClose,
  onIndexChange,
}: Props) {
  const [phase, setPhase] = useState<Phase>(() => (getOriginEl() ? 'origin' : 'idle'));
  const [mounted, setMounted] = useState(false);
  const [dir, setDir] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  // Backdrop progress driven by scroll dismissal — 1 = fully open, 0 = fully gone.
  const [scrollProgress, setScrollProgress] = useState(1);
  // User-controlled zoom multiplier applied to the centered card.
  const [zoom, setZoom] = useState(1);
  // Pan offset (px) applied alongside zoom when zoomed in.
  const [pan, setPan] = useState({ x: 0, y: 0 });
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

  // Compute the inverted origin transform — re-measures the source card every
  // time so it tracks scroll/layout changes. Uses a UNIFORM scale to preserve
  // aspect ratio (no distortion). The source card uses `object-fit: cover`
  // which crops, so morphing between two different aspect rects without a
  // uniform scale would stretch the image. We scale to fit the source rect
  // entirely (max of sx, sy) and center the difference with translate.
  const computeOriginTransform = useCallback((): string | null => {
    const card = cardRef.current;
    const sourceEl = getOriginEl();
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
    const sourceEl = getOriginEl();
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
      setZoom(1);
      setPan({ x: 0, y: 0 });
      onIndexChange(next);
    },
    [index, items.length, onIndexChange]
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

  const zoomIn = useCallback(() => {
    setZoom((z) => {
      const next = ZOOM_STEPS.find((s) => s > z + 0.01) ?? ZOOM_MAX;
      // Re-clamp pan against the new (larger) bounds — usually a no-op.
      setPan((p) => clampPan(p.x, p.y, next));
      return next;
    });
  }, [clampPan]);

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const reversed = [...ZOOM_STEPS].reverse();
      const next = reversed.find((s) => s < z - 0.01) ?? ZOOM_MIN;
      if (next <= 1) setPan({ x: 0, y: 0 });
      else setPan((p) => clampPan(p.x, p.y, next));
      return next;
    });
  }, [clampPan]);

  // Click-to-zoom on the IMAGE toggles between 1× and the first zoom step.
  // Repeated zoom-in/out only lives on the top-right buttons.
  const toggleImageZoom = useCallback(() => {
    setZoom((z) => {
      if (z > 1) {
        setPan({ x: 0, y: 0 });
        return 1;
      }
      const next = ZOOM_STEPS[1];
      setPan((p) => clampPan(p.x, p.y, next));
      return next;
    });
  }, [clampPan]);

  // ── Click-to-zoom + Drag-to-pan ────────────────────────────────────────────
  // ALL pointer logic is handled here so there's no race between React's
  // synthesized onClick and our pointerup handler. Listeners are bound
  // synchronously on pointerdown — onClick is not used for the image at all.
  const onCardPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      e.stopPropagation();
      const startedZoomed = zoom > 1;
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        panStartX: pan.x,
        panStartY: pan.y,
        moved: false,
      };
      if (startedZoomed) setIsDragging(true);

      const onMove = (ev: PointerEvent) => {
        const d = dragRef.current;
        if (!d.active) return;
        const dx = ev.clientX - d.startX;
        const dy = ev.clientY - d.startY;
        if (!d.moved && Math.hypot(dx, dy) > 3) d.moved = true;
        if (startedZoomed) {
          setPan(clampPan(d.panStartX + dx, d.panStartY + dy, zoom));
        }
      };
      const onUp = () => {
        const wasMoved = dragRef.current.moved;
        dragRef.current.active = false;
        if (startedZoomed) setIsDragging(false);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        // If the pointer hardly moved, treat as a click → toggle zoom.
        if (!wasMoved) toggleImageZoom();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [zoom, pan.x, pan.y, clampPan, toggleImageZoom]
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

  // ── Horizontal trackpad scroll → navigate prev/next ──────────────────────
  // Two-finger swipe horizontally moves between images. Requires a meaningful
  // amount of accumulated motion before triggering — small swipes don't count.
  // The accumulator also decays when the user stops, so a brief swipe doesn't
  // sit at the threshold waiting for the next nudge.
  useEffect(() => {
    let accumX = 0;
    let lastNavAt = 0;
    let lastEventAt = 0;
    const THRESHOLD = 140; // px of accumulated deltaX — feels like a real swipe
    const COOLDOWN_MS = 500;
    const DECAY_MS = 120; // accum resets if no wheel events in this long
    const onWheel = (e: WheelEvent) => {
      if (closingRef.current) return;
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) {
        accumX = 0;
        return;
      }
      // preventDefault stops the page from horizontally scrolling under the
      // lightbox (and contributes to suppressing browser back-swipe).
      e.preventDefault();
      const now = performance.now();
      // Decay: if there's been a pause, the previous swipe has "settled" —
      // start fresh instead of letting tiny residual deltas push past the
      // threshold.
      if (now - lastEventAt > DECAY_MS) accumX = 0;
      lastEventAt = now;
      accumX += e.deltaX;
      if (now - lastNavAt < COOLDOWN_MS) return;
      if (accumX > THRESHOLD) {
        pulseNavButton(nextBtnRef.current);
        go(1);
        accumX = 0;
        lastNavAt = now;
      } else if (accumX < -THRESHOLD) {
        pulseNavButton(prevBtnRef.current);
        go(-1);
        accumX = 0;
        lastNavAt = now;
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [go, pulseNavButton]);

  // ── Scroll-to-dismiss ─────────────────────────────────────────────────────
  // Page scrolls freely. Once user has scrolled SCROLL_DISMISS_PX from the
  // initial offset, we trigger close — and because the source card moves with
  // the page, the morph-back lands wherever it now sits in the viewport.
  useEffect(() => {
    // Skip scroll-dismiss when zoomed — user is inspecting the image.
    if (zoom > 1) {
      setScrollProgress(1);
      return;
    }
    const initialOffset = window.scrollY;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (closingRef.current) return;
      const delta = Math.abs(window.scrollY - initialOffset);
      // Map [0..SCROLL_DISMISS_PX] → [1..0] for backdrop fade
      const p = Math.max(0, 1 - delta / SCROLL_DISMISS_PX);
      setScrollProgress(p);
      if (delta > SCROLL_DISMISS_PX) close();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [close, zoom]);

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
  }, [close, go, zoomIn, zoomOut, pulseNavButton]);

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
      target.focus?.();
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
    if (phase === 'origin' && originTransform) {
      return {
        transformOrigin: 'top left',
        transform: originTransform,
        transition: 'none',
        willChange: 'transform',
      };
    }
    if (phase === 'center') {
      return {
        transformOrigin: 'top left',
        transform: 'translate(0px, 0px) scale(1)',
        transition: `transform ${MORPH_IN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        willChange: 'transform',
      };
    }
    if (phase === 'idle') {
      // Zoom + pan around the card's center.
      return {
        transformOrigin: 'center center',
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transition: isDragging
          ? 'none'
          : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
      };
    }
    if (phase === 'closing' && closingStartTransform) {
      // Locked to the starting transform so React doesn't fight with the
      // rAF that's mutating style.transform every frame. The imperative
      // writes win because they happen between React commits.
      return {
        transformOrigin: 'top left',
        transform: closingStartTransform,
        transition: 'none',
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
          <div className="craft-lightbox__label">{item.label}</div>
          <div className="craft-lightbox__date">{item.date}</div>
        </div>
      </div>

      <div className="craft-lightbox__top-actions">
        <button
          type="button"
          className="craft-lightbox__icon-btn"
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
          className="craft-lightbox__icon-btn"
          aria-label="Zoom in"
          disabled={zoom >= ZOOM_MAX - 0.01}
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
          className="craft-lightbox__icon-btn"
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
            ? 'craft-lightbox__card--zoom-out'
            : 'craft-lightbox__card--zoom-in'
        }`}
        style={cardStyle}
        onPointerDown={onCardPointerDown}
        onClick={(e) => {
          // Zoom toggle is handled in onCardPointerDown / pointerup so the
          // browser-synthesized click can't double-toggle after a re-render.
          // We only stop propagation here so a click on the card doesn't
          // bubble to the backdrop and close the lightbox.
          e.stopPropagation();
        }}
      >
        {item.src ? (
          /\.(mp4|mov|webm|ogg)$/i.test(item.src) ? (
            <CaseStudyVideo src={item.src} label={item.label} />
          ) : (
            <img src={item.src} alt={item.alt ?? item.label} className="craft-lightbox__img" />
          )
        ) : (
          <div className="craft-lightbox__placeholder" />
        )}
      </div>
    </div>
  );
}
