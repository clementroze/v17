import { useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";

import Button from "./Button";

// Desktop: a light-mode, text-only sibling of BioModal's "More about me"
// drawer — same right-docked panel, blurred/dimmed scrim, and open/close
// lifecycle, but no left image stage and light instead of dark.
//
// Mobile (≤768px): a bottom sheet built on vaul (github.com/emilkowalski/vaul)
// instead of the custom slide-in panel — a right-docked half-width drawer
// doesn't work on narrow viewports, and vaul gives us the native-feeling
// drag-to-dismiss bottom sheet for free (its own focus trap + scroll lock too,
// so the desktop-only effects below are skipped in this mode).

// Must be ≥ the desktop panel's slide transition (see .whynoai-modal__panel in
// CSS) so the node unmounts right as the close animation finishes.
const WHYNOAI_MODAL_EXIT_MS = 600;

const WHYNOAI_MODAL_FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

type WhyNoAIModalProps = {
  open: boolean;
  onClose: () => void;
  /** Each item renders as its own paragraph, spaced apart. */
  content: string[];
  /** Focus returns here on close (the trigger button on the page). */
  triggerRef: React.RefObject<HTMLButtonElement>;
};

export default function WhyNoAIModal({ open, onClose, content, triggerRef }: WhyNoAIModalProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // ── desktop-only: custom right-docked slide-in panel ────────────────────────
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const openRaf = useRef<number | null>(null);

  const cancelTransition = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (openRaf.current !== null) {
      cancelAnimationFrame(openRaf.current);
      openRaf.current = null;
    }
  };

  useEffect(() => {
    if (isMobile) return; // vaul owns mount/open state on mobile
    cancelTransition();
    if (open) {
      if (!mounted) {
        setMounted(true);
      } else {
        setVisible(true);
      }
    } else if (mounted) {
      setVisible(false);
      closeTimer.current = window.setTimeout(() => {
        closeTimer.current = null;
        setMounted(false);
      }, WHYNOAI_MODAL_EXIT_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isMobile]);

  // Double rAF so the browser paints the hidden state before the slide-in
  // transition is triggered (a single frame can fire before that paint).
  useEffect(() => {
    if (!mounted || isMobile) return;
    openRaf.current = requestAnimationFrame(() => {
      openRaf.current = requestAnimationFrame(() => {
        openRaf.current = null;
        setVisible(true);
      });
    });
    return () => {
      if (openRaf.current !== null) {
        cancelAnimationFrame(openRaf.current);
        openRaf.current = null;
      }
    };
  }, [mounted, isMobile]);

  useEffect(() => cancelTransition, []);

  // While mounted: lock page scroll, move focus inside, trap Tab, close on
  // Escape, restore focus to the trigger on unmount. Skipped on mobile — vaul
  // (via Radix Dialog) already does all of this for the bottom sheet.
  useEffect(() => {
    if (!mounted || isMobile) return;

    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;

    requestAnimationFrame(() => panelRef.current?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(WHYNOAI_MODAL_FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      const first = focusables[0] ?? panel;
      const last = focusables[focusables.length - 1] ?? panel;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || active === panel || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !panel.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadRight;
      triggerRef.current?.focus();
    };
  }, [mounted, isMobile, onClose, triggerRef]);

  // ── mobile: vaul bottom sheet ────────────────────────────────────────────────
  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={(next) => !next && onClose()}>
        <Drawer.Portal>
          <Drawer.Overlay className="whynoai-drawer__overlay" />
          <Drawer.Content className="whynoai-drawer__content">
            <Drawer.Handle className="whynoai-drawer__handle" />
            <div className="whynoai-drawer__header">
              <Drawer.Title className="whynoai-drawer__title">Why couldn't AI do this?</Drawer.Title>
              <Drawer.Description className="whynoai-drawer__description">
                A few notes on which parts of this project AI could and couldn't have done.
              </Drawer.Description>
            </div>
            <div className="whynoai-drawer__body">
              {content.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <div className="whynoai-drawer__footer">
                <Button variant="dark-gray" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // ── desktop: custom slide-in panel ──────────────────────────────────────────
  if (!mounted) return null;

  return (
    <div
      className={`whynoai-modal${visible ? " whynoai-modal--open" : ""}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Why couldn't AI do this?"
    >
      <div ref={panelRef} className="whynoai-modal__panel" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="whynoai-modal__header">
          <h2 className="whynoai-modal__title">Why couldn't AI do this?</h2>
          <button type="button" className="whynoai-modal__close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="whynoai-modal__body">
          {content.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <div className="whynoai-modal__footer">
            <Button variant="dark-gray" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
