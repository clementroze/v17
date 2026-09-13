import { useEffect, useRef, type RefObject } from "react";

/** Focus owns navigation; viewport shortcuts apply only when focus is on the page. */
export function useCarouselKeyboard(
  sectionRef: RefObject<HTMLElement>,
  navigate: (key: string, event: KeyboardEvent) => void,
  release?: (key: string | null) => void,
) {
  const callbacks = useRef({ navigate, release });
  callbacks.current = { navigate, release };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const section = sectionRef.current;
      const target = event.target;
      if (!section || !(target instanceof HTMLElement)) return;
      if (target.isContentEditable || target.closest('input, textarea, select, video, audio, [role="slider"], [role="dialog"], dialog')) return;
      const focusedWithin = section.contains(target);
      const bounds = section.getBoundingClientRect();
      const atCenter = bounds.top <= window.innerHeight / 2 && bounds.bottom > window.innerHeight / 2;
      if (!focusedWithin && (!atCenter || (target !== document.body && target !== document.documentElement))) return;
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key) && !(focusedWithin && ['Home', 'End'].includes(event.key))) return;
      event.preventDefault();
      callbacks.current.navigate(event.key, event);
    };
    const onKeyUp = (event: KeyboardEvent) => callbacks.current.release?.(event.key);
    const onBlur = () => callbacks.current.release?.(null);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      callbacks.current.release?.(null);
    };
  }, [sectionRef]);
}
