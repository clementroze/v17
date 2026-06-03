import { useEffect, useRef, useState } from "react";

import Button from "./Button";
import Picture from "./Picture";
import { BioSection, getBioSections } from "../data/about";

// The bio modal pairs a scrolling text column with a floating image stage in the
// left 50% of the screen that cross-fades to the section crossing the text
// column's center as you scroll. The two panes (left stage, right text) stay in
// sync — whichever the user drives pushes the other.

// How long the close animation runs before we unmount — the panel's slide is the
// longest piece (transform 0.55s in .bio-modal__panel), plus a small buffer so
// the node (and its full-screen backdrop) tears down right as it finishes.
const BIO_MODAL_EXIT_MS = 600;

// Selector for the elements the focus trap can land on inside the modal.
const BIO_MODAL_FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Renders one section's images in its chosen layout. Every section's visual is
// stacked absolutely in the stage and cross-faded via `active`.
function BioVisual({ section, active }: { section: BioSection; active?: boolean }) {
  return (
    <div className={`bio-visual bio-visual--${section.layout}${active ? " is-active" : ""}`}>
      {section.images.map((img, i) => (
        <figure
          className="bio-visual__item"
          key={i}
          style={
            section.layout === "scatter"
              ? ({ top: img.top, left: img.left, "--rot": img.rotate } as React.CSSProperties)
              : undefined
          }
        >
          <Picture src={img.src} alt="" loading="lazy" draggable={false} />
        </figure>
      ))}
    </div>
  );
}

type BioModalProps = {
  // Source of truth for "should be open". Drives the enter/exit animation; the
  // node stays mounted through the exit, then unmounts.
  open: boolean;
  // Called when the modal requests to close (backdrop click, X, or Escape).
  onClose: () => void;
  // The "design clubs" inline link — handled by the page (opens accordions,
  // scrolls to Activities). The modal just invokes it.
  onOpenDesignClubs: () => void;
  // Focus returns here on close (the "More" trigger button on the page).
  triggerRef: React.RefObject<HTMLButtonElement>;
};

export default function BioModal({ open, onClose, onOpenDesignClubs, triggerRef }: BioModalProps) {
  // `mounted` keeps the node in the tree through the exit animation; `visible`
  // drives the enter/exit (slide-up + fade) via a class.
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  // Pending async work for the open/close transition, held in refs so any new
  // open/close can cancel it — this is what makes the animation interruptible
  // (spam-clicking, clicking out mid-open, Esc mid-transition, etc.). The CSS
  // transitions themselves reverse smoothly from wherever they are; we just keep
  // the mount lifecycle from fighting that. `closeTimer` is the pending unmount;
  // `openRaf` is the next-frame "flip to visible" used on first mount.
  const closeTimer = useRef<number | null>(null);
  const openRaf = useRef<number | null>(null);

  // Bio-visual state. `activeIndex` is the shared source of truth for "which
  // section are we on" — both scroll panes read and write it.
  const [activeIndex, setActiveIndex] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null); // the smooth-scrolling text column (IO root)
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  // The left image stage is its own snap-scroll container (an invisible track of
  // full-height sections drives the cross-fade); `stageRef` is that container so
  // we can read/set its scrollTop.
  const stageRef = useRef<HTMLDivElement>(null);
  // Mobile (≤768px) swaps the desktop left/right split for a top image carousel
  // + bottom text. The carousel is a horizontal scroll-snap row; on mobile it
  // plays the "left" (image) role in the two-way sync.
  const carouselRef = useRef<HTMLDivElement>(null);
  // Which pane the user is actively driving ("left" = image stage/carousel,
  // "right" = text), so the two-way scroll sync only ever pushes the *other*
  // pane and never fights itself in a feedback loop. Null until first interaction.
  const scrollDriver = useRef<"left" | "right" | null>(null);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const sections = getBioSections(onOpenDesignClubs);

  // Flat list of every image across all sections, each its own carousel slide,
  // tagged with the section it belongs to. `sectionFirstSlide[i]` is the flat
  // index of section i's first image — the slide the carousel scrolls to when
  // section i becomes active (text → carousel sync).
  const flatImages: { src: string; sectionIndex: number }[] = [];
  const sectionFirstSlide: number[] = [];
  sections.forEach((s, si) => {
    sectionFirstSlide[si] = flatImages.length;
    if (isMobile && s.mobileImage) {
      flatImages.push({ src: s.mobileImage, sectionIndex: si });
    } else {
      s.images.forEach((img) => flatImages.push({ src: img.src, sectionIndex: si }));
    }
  });

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

  // Drive mount/unmount from the `open` prop. Mounting only puts the node in the
  // DOM (hidden, off-screen); the slide-in is triggered by a separate effect
  // once `mounted` has actually committed — see below.
  useEffect(() => {
    cancelTransition();
    if (open) {
      if (!mounted) {
        // Fresh open: start at the first section with no pane driving, so the
        // remounted stage (scrollTop 0) and the active visual agree.
        setActiveIndex(0);
        scrollDriver.current = null;
        // Reset `entered` so this new mount cycle starts in the "not yet
        // entered" state. `entered` persists on the component instance across
        // open/close (the DOM unmounts but the component stays alive), so
        // without this the 2nd+ open mounts with `--entered` already set — which
        // makes the `:not(--open).--entered` rules apply on the very first
        // frame (stage opacity 1 + the exit animation's opacity-1 `from`),
        // flashing every image at once before the entrance stagger runs.
        setEntered(false);
        setMounted(true);
      } else {
        // Reopening mid-close — flip straight to visible to reverse instantly,
        // keeping the section the user was on.
        setVisible(true);
      }
    } else if (mounted) {
      setVisible(false);
      closeTimer.current = window.setTimeout(() => {
        closeTimer.current = null;
        setMounted(false);
      }, BIO_MODAL_EXIT_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Slide-in trigger: once the panel has mounted (committed + painted in its
  // hidden, off-screen state), flip to visible so the CSS transition from
  // translateX(100%) → 0 actually runs. A double rAF guarantees the browser has
  // painted the hidden state before we add `--open` — a single frame can fire
  // before that paint and the slide gets skipped. The pending frame id lives in
  // `openRaf` so a quick close (cancelTransition) can cancel it.
  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted]);

  useEffect(() => {
    if (visible) setEntered(true);
  }, [visible]);

  // Tidy up any pending timer/frame if the modal unmounts mid-animation.
  useEffect(() => cancelTransition, []);

  // While the modal is mounted: lock page scroll, move focus inside, trap Tab,
  // close on Escape, and restore focus to the trigger on unmount.
  useEffect(() => {
    if (!mounted) return;

    // Lock background scroll (compensating for the scrollbar so the page doesn't
    // shift) — you can't scroll the page behind the modal.
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;

    // Move focus into the panel so keyboard/AT start inside the dialog.
    requestAnimationFrame(() => panelRef.current?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(BIO_MODAL_FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      // Cycle within [panel, ...focusables]: the panel itself (tabIndex -1) is
      // the fallback anchor so focus can never escape to the page behind.
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
  }, [mounted, onClose, triggerRef]);

  // Right pane → activeIndex: on every scroll of the text column, pick the
  // section whose center is closest to the body's center. This is a continuous
  // nearest-section calc (not a thin IntersectionObserver band), so exactly one
  // section is always active and short sections are never skipped between
  // callbacks — each section's images show in sync as its text passes center.
  // Skipped while the left stage is the driver so the two panes don't fight.
  useEffect(() => {
    if (!mounted) return;
    const body = bodyRef.current;
    if (!body) return;
    let raf = 0;
    const onScroll = () => {
      if (scrollDriver.current === "left") return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Clamp the extremes: the first/last section's center can't reach the
        // body's center (it sits within the top/bottom padding), so at the very
        // top force section 0 and at the very bottom force the last section.
        // Otherwise scrolling fully up could land on section 1 (its center is
        // closer to center than section 0's), leaving section 0 unreachable.
        const maxScroll = body.scrollHeight - body.clientHeight;
        const EDGE = 4; // px tolerance for "at the end"
        let nearest: number;
        if (body.scrollTop <= EDGE) {
          nearest = 0;
        } else if (body.scrollTop >= maxScroll - EDGE) {
          nearest = sections.length - 1;
        } else {
          const bodyRect = body.getBoundingClientRect();
          const center = bodyRect.top + bodyRect.height / 2;
          let best = Infinity;
          nearest = 0;
          sectionRefs.current.forEach((el, i) => {
            if (!el) return;
            const r = el.getBoundingClientRect();
            const dist = Math.abs(r.top + r.height / 2 - center);
            if (dist < best) {
              best = dist;
              nearest = i;
            }
          });
        }
        setActiveIndex((prev) => (prev === nearest ? prev : nearest));
      });
    };
    body.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      body.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Left pane → activeIndex: the snap-scroll stage reports which full-height
  // section it has settled on (scrollTop / viewport height). Only acts while the
  // stage is the driver, so a programmatic sync-scroll from the right pane
  // doesn't bounce back.
  useEffect(() => {
    if (!mounted) return;
    const stage = stageRef.current;
    if (!stage) return;
    let raf = 0;
    const lastIndex = sections.length - 1;
    const onScroll = () => {
      if (scrollDriver.current !== "left") return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Map scroll position over the full range to a section index — robust to
        // any small mismatch between the spacer height (100vh) and clientHeight.
        const range = stage.scrollHeight - stage.clientHeight;
        if (range <= 0) return;
        const idx = Math.round((stage.scrollTop / range) * lastIndex);
        setActiveIndex((prev) => (prev === idx ? prev : idx));
      });
    };
    stage.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      stage.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Mobile carousel → activeIndex: the horizontal image row reports which slide
  // is centered; we map that slide back to its section. Only acts while the
  // carousel is the driver ("left"), so a programmatic sync-scroll from the text
  // doesn't bounce back. Mirrors the desktop stage effect, rotated 90°.
  useEffect(() => {
    if (!mounted || !isMobile) return;
    const carousel = carouselRef.current;
    if (!carousel) return;
    let raf = 0;
    const onScroll = () => {
      if (scrollDriver.current !== "left") return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Which slide's center is nearest the carousel's center.
        const center = carousel.scrollLeft + carousel.clientWidth / 2;
        const slides = carousel.children;
        let nearest = 0;
        let best = Infinity;
        for (let i = 0; i < slides.length; i++) {
          const el = slides[i] as HTMLElement;
          const c = el.offsetLeft + el.offsetWidth / 2;
          const d = Math.abs(c - center);
          if (d < best) {
            best = d;
            nearest = i;
          }
        }
        const sectionIdx = flatImages[nearest]?.sectionIndex ?? 0;
        setActiveIndex((prev) => (prev === sectionIdx ? prev : sectionIdx));
      });
    };
    carousel.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      carousel.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isMobile]);

  // activeIndex → follower pane: whenever the active section changes, scroll the
  // pane the user *isn't* driving to match. Left stage snaps; right text glides
  // smoothly (centering the section the same way the observer band does).
  useEffect(() => {
    if (!mounted) return;
    const driver = scrollDriver.current;
    // No pane is driving yet (e.g. just opened) — leave both at their natural
    // top position instead of yanking the text to center section 0.
    if (!driver) return;

    if (driver !== "left") {
      if (isMobile) {
        // Scroll the carousel to this section's first image slide.
        const carousel = carouselRef.current;
        const slide = carousel?.children[sectionFirstSlide[activeIndex]] as HTMLElement | undefined;
        if (carousel && slide) {
          carousel.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
        }
      } else {
        const stage = stageRef.current;
        if (stage) {
          const range = stage.scrollHeight - stage.clientHeight;
          const lastIndex = sections.length - 1;
          const top = lastIndex > 0 ? (activeIndex / lastIndex) * range : 0;
          stage.scrollTo({ top, behavior: "smooth" });
        }
      }
    }
    if (driver !== "right") {
      const body = bodyRef.current;
      const sec = sectionRefs.current[activeIndex];
      if (body && sec) {
        const delta = sec.getBoundingClientRect().top - body.getBoundingClientRect().top;
        // On mobile the carousel drives this sync, so we want the section heading
        // to appear at the top of the text pane (not centered). Subtract only the
        // body's top padding so the h3 sits flush at the content area top.
        // On desktop centering is kept (the image stage is tall enough to show the
        // whole section, so centering feels more natural).
        const offset = isMobile
          ? parseFloat(getComputedStyle(body).paddingTop) || 0
          : (body.clientHeight - sec.offsetHeight) / 2;
        body.scrollTo({ top: body.scrollTop + delta - offset, behavior: "smooth" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, mounted]);

  if (!mounted) return null;

  return (
    <div
      className={`bio-modal${visible ? " bio-modal--open" : ""}${entered ? " bio-modal--entered" : ""}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="More about me"
    >
      {/* DESKTOP: floating image stage in the left 50% of the screen. A snap-scroll
          container — the pinned `__stage-visuals` overlay holds the cross-fading
          images, an invisible full-height snap track underneath gives it scroll
          height. Scrolling it snaps section-by-section and drives `activeIndex`
          (synced to the text pane). Hidden on mobile (the carousel replaces it). */}
      {!isMobile && (
        <div
          className="bio-modal__stage"
          aria-hidden="true"
          ref={stageRef}
          onWheel={() => (scrollDriver.current = "left")}
          onTouchStart={() => (scrollDriver.current = "left")}
          onPointerDown={() => (scrollDriver.current = "left")}
        >
          <div className="bio-modal__stage-visuals">
            {sections.map((s, i) => (
              <BioVisual key={s.id} section={s} active={i === activeIndex} />
            ))}
          </div>
          {/* Snap track: one full-height spacer per section. The visuals overlay
              above contributes no scroll height (negative margin), so these alone
              define the snap points (one stage-height apart). */}
          {sections.map((s) => (
            <div key={s.id} className="bio-modal__stage-snap" />
          ))}
        </div>
      )}

      <div ref={panelRef} className="bio-modal__panel" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        {/* Header: title on the left, close on the right — both sit at the same
            padding inset (see .bio-modal__header in CSS). */}
        <div className="bio-modal__header">
          <h2 className="bio-modal__title">More about me</h2>
          <button type="button" className="bio-modal__close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* MOBILE: image carousel across the top of the panel. One horizontal
            scroll-snap slide per image (flattened across sections); snapping it
            drives `activeIndex` and scrolling the text below scrolls it back. */}
        {isMobile && (
          <div
            className="bio-modal__carousel"
            aria-hidden="true"
            ref={carouselRef}
            onWheel={() => (scrollDriver.current = "left")}
            onTouchStart={() => (scrollDriver.current = "left")}
            onPointerDown={() => (scrollDriver.current = "left")}
          >
            {flatImages.map((img, i) => (
              <div className="bio-modal__slide" key={i}>
                <Picture src={img.src} alt="" loading="lazy" draggable={false} />
              </div>
            ))}
          </div>
        )}

        {/* Content lives in `sections`; the floating stage / carousel tracks
            which section is centered. */}
        <div
          className="bio-modal__body"
          ref={bodyRef}
          onWheel={() => (scrollDriver.current = "right")}
          onTouchStart={() => (scrollDriver.current = "right")}
          onPointerDown={() => (scrollDriver.current = "right")}
        >
          {sections.map((s, i) => (
            <section key={s.id} className="bio-section" data-bio-index={i} ref={(el) => (sectionRefs.current[i] = el)}>
              <h3>{s.heading}</h3>
              {s.content}
              {/* Accessible images for this section, read by AT right after its
                  text (the visual stage/carousel is an aria-hidden decorative
                  copy). Visually hidden — empty role="img" elements announce
                  their alt without re-fetching the picture. */}
              <div className="bio-section__media">
                {s.images.map((img, idx) => (
                  <span key={idx} role="img" aria-label={img.alt} />
                ))}
              </div>
            </section>
          ))}

          {/* End of the panel — a Close button mirroring the "More" trigger
              (same dark-gray pill) but with a minus glyph, to collapse the modal. */}
          <div className="bio-modal__footer">
            <Button variant="dark-gray" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
