import React, { useEffect, useRef } from 'react';

// `threshold` is the IntersectionObserver ratio at which the element reveals.
// Defaults to 0.1 (reveal once ~10% is in view). The mobile work carousel passes
// 0 so a slide reveals the instant any sliver of it is visible — that's what lets
// the peeking next pic fade in at rest, while fully off-screen slides (0
// intersection) still wait until they're scrolled into view.
export function useReveal<T extends HTMLElement = HTMLDivElement>(delay = 0, threshold = 0.1) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('reveal--visible'), delay);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold]);
  return ref;
}

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
};

export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: RevealProps) {
  const ref = useReveal(delay);
  return (
    // @ts-expect-error — polymorphic ref; Tag is always a div-compatible element in practice
    <Tag ref={ref} className={`reveal${className ? ` ${className}` : ''}`}>
      {children}
    </Tag>
  );
}
