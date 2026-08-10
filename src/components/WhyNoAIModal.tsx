import { useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";

import Button from "./Button";
import CaseStudyVideo from "./CaseStudyVideo";
import { renderInlineLinks, scrollToAnchor } from "../lib/inlineLinks";

// A content item can also be a single-media image/video line, same syntax as
// the case study body: ![alt](src) caption {600px}. Lets whyNoAI embed a
// supporting clip without a body-only block type.
const MEDIA_RE = /^!\[([^\]]*)\]\(([^)]+)\)\s*(.*)$/;
const VIDEO_RE = /\.(mp4|mov|webm|ogg)$/i;
const WIDTH_RE = /\{([^}]+)\}\s*$/;

// Right-docked panel on desktop, bottom sheet on mobile — both driven by vaul
// (github.com/emilkowalski/vaul), just switching `direction` at the ≤768px
// breakpoint. Vaul owns mount/animation lifecycle, focus trap, scroll lock,
// and drag-to-dismiss (bottom sheet only) in both modes; this component only
// owns whether it's open.

type WhyNoAIModalProps = {
  open: boolean;
  onClose: () => void;
  /** Each item renders as its own paragraph, spaced apart. */
  content: string[];
  /** Focus returns here on close (the trigger button on the page). */
  triggerRef: React.RefObject<HTMLButtonElement>;
  /** Portal target — pass the .cs-page element so the drawer stays a DOM
   * descendant of it and inherits --cs-accent/--cs-on-accent (and the
   * .cs-page ::selection rule) instead of vaul's default document.body portal. */
  container?: HTMLElement | null;
};

export default function WhyNoAIModal({ open, onClose, content, triggerRef, container }: WhyNoAIModalProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const direction = isMobile ? "bottom" : "right";

  // An in-page anchor link clicked inside the drawer closes it first, but the
  // drawer's scroll lock is still held until its close animation finishes —
  // scrolling immediately is a no-op that gets silently reverted once the
  // lock releases. `open` is a controlled prop here, so vaul's own
  // onAnimationEnd (which only fires from its *internal* dismiss handlers,
  // e.g. drag/Escape) never runs for a close driven by us — wait out the
  // fixed 500ms close transition vaul itself uses instead.
  const anchorScrollTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (anchorScrollTimer.current !== null) window.clearTimeout(anchorScrollTimer.current);
    };
  }, []);

  const handleAnchorClick = (id: string) => {
    onClose();
    if (anchorScrollTimer.current !== null) window.clearTimeout(anchorScrollTimer.current);
    anchorScrollTimer.current = window.setTimeout(() => {
      anchorScrollTimer.current = null;
      scrollToAnchor(id);
    }, 500);
  };

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => !next && onClose()}
      direction={direction}
      onClose={() => triggerRef.current?.focus()}
      autoFocus
    >
      <Drawer.Portal container={container}>
        <Drawer.Overlay className="whynoai-drawer__overlay" />
        <Drawer.Content
          className={`whynoai-drawer__content whynoai-drawer__content--${direction}`}
          data-testid="whynoai-drawer"
        >
          {isMobile && <Drawer.Handle className="whynoai-drawer__handle" />}
          <div className="whynoai-drawer__header">
            <Drawer.Title className="whynoai-drawer__title">Why couldn't AI do this instead of me?</Drawer.Title>
            <Drawer.Description className="whynoai-drawer__description">
              A few notes on which parts of this project AI could and couldn't have done.
            </Drawer.Description>
            {!isMobile && (
              <button type="button" className="whynoai-drawer__close" onClick={onClose} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          {/* data-vaul-no-drag: swipe-to-dismiss still works from the handle
              (mobile) or anywhere else in the panel, but text inside here is
              selectable instead of always being captured as a drag gesture. */}
          <div className="whynoai-drawer__body" data-vaul-no-drag="">
            {content.map((p, i) => {
              const widthToken = p.match(WIDTH_RE);
              const width = widthToken?.[1].trim();
              const pNoWidth = widthToken ? p.slice(0, widthToken.index).trimEnd() : p;
              const media = pNoWidth.match(MEDIA_RE);
              if (media) {
                const [, alt, src, caption] = media;
                return (
                  <figure
                    key={i}
                    className="whynoai-drawer__media"
                    style={width ? { maxWidth: width, width: "100%" } : undefined}
                  >
                    {VIDEO_RE.test(src) ? (
                      <CaseStudyVideo src={src} label={caption || alt} />
                    ) : (
                      <img src={src} alt={alt} />
                    )}
                    {caption && <figcaption className="whynoai-drawer__caption">{caption}</figcaption>}
                  </figure>
                );
              }
              return <p key={i}>{renderInlineLinks(p, handleAnchorClick)}</p>;
            })}
            <div className="whynoai-drawer__footer">
              <Button variant="light-gray" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
