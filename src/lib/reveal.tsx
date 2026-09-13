import React, { useEffect, useRef } from 'react';

// ── shared scroll-velocity tracker (lazily started on first scroll-aware reveal) ──
// `scrollSpeed` is in px/ms. It jumps up immediately on a faster burst and
// decays gently otherwise, so the value read at the instant a card reveals
// reflects the recent fling rather than a long-term average.
let scrollSpeed = 0;
let lastY = 0;
let lastT = 0;
let trackingUsers = 0;

function trackScrollSpeed() {
  const now = performance.now();
  const dt = now - lastT;
  if (dt <= 0) return;
  const instant = Math.abs(window.scrollY - lastY) / dt;
  scrollSpeed = instant > scrollSpeed ? instant : scrollSpeed * 0.85 + instant * 0.15;
  lastY = window.scrollY;
  lastT = now;
}

function startScrollTracking() {
  if (trackingUsers++ === 0) {
    scrollSpeed = 0;
    lastY = window.scrollY;
    lastT = performance.now();
    window.addEventListener('scroll', trackScrollSpeed, { passive: true });
  }
  return () => {
    if (--trackingUsers === 0) window.removeEventListener('scroll', trackScrollSpeed);
  };
}

// `threshold` is the IntersectionObserver ratio at which the element reveals.
// Defaults to 0.1 (reveal once ~10% is in view). The mobile work carousel passes
// 0 so a slide reveals the instant any sliver of it is visible — that's what lets
// the peeking next pic fade in at rest, while fully off-screen slides (0
// intersection) still wait until they're scrolled into view.
//
// `scrollAware` (Craft grid) scales the entrance to the current scroll speed:
// scrolling fast — e.g. flinging to the middle of the page and skipping many
// images — shortens both the stagger delay and the transition so the cards you
// land on snap in quicker (but still animate). Normal scrolling reveals normally.
export function useReveal<T extends HTMLElement = HTMLDivElement>(delay = 0, threshold = 0.1, scrollAware = false, enabled = true, repeat = false) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!enabled) {
      if (repeat) el.classList.remove('reveal--visible');
      return;
    }
    if (!("IntersectionObserver" in window)) {
      el.classList.add('reveal--visible');
      return;
    }
    const stopTracking = scrollAware ? startScrollTracking() : undefined;
    let timeoutId = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          if (repeat) {
            clearTimeout(timeoutId);
            el.classList.remove('reveal--visible');
          }
          return;
        }
        let effDelay = delay;
        if (scrollAware) {
          // Match the general <Reveal> timing (0.65s) at normal speed, only
          // shortening it the faster you scroll.
          const BASE = 0.65; // normal-scroll reveal duration (s)
          const FAST = 2.5; // px/ms treated as "fast" (full speed-up)
          const t = Math.min(scrollSpeed / FAST, 1); // 0 (slow) … 1 (fast)
          const factor = 1 - t * 0.7; // 1 (slow) … 0.3 (fast), never instant
          effDelay = delay * factor;
          el.style.setProperty('--reveal-dur', `${(BASE * factor).toFixed(3)}s`);
        }
        timeoutId = window.setTimeout(() => el.classList.add('reveal--visible'), effDelay);
        if (!repeat) observer.disconnect();
      },
      { threshold },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      stopTracking?.();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [delay, threshold, scrollAware, enabled, repeat]);
  return ref;
}

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  /** Scale the entrance to scroll velocity (Craft grid). See useReveal. */
  scrollAware?: boolean;
  /** Defer observing until an overlapping entrance has cleared the content. */
  enabled?: boolean;
  /** Replay when re-entering the viewport or re-enabled. */
  repeat?: boolean;
};

export function Reveal({ children, delay = 0, className = '', as: Tag = 'div', scrollAware = false, enabled = true, repeat = false }: RevealProps) {
  const ref = useReveal(delay, 0.1, scrollAware, enabled, repeat);
  return (
    // @ts-expect-error — polymorphic ref; Tag is always a div-compatible element in practice
    <Tag ref={ref} className={`reveal${className ? ` ${className}` : ''}`}>
      {children}
    </Tag>
  );
}
