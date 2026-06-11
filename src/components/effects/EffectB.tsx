/**
 * Effect B — Apple-style expand-to-fullbleed (first card only) + parallax + blur-fade text
 */
import { useEffect, useRef, useState } from "react";
import { LinearBlur } from "progressive-blur";
import arrowWhite from "../../assets/arrow.svg";
import arrowBlack from "../../assets/arrow-black.svg";
import Button from "../Button";
import Picture from "../Picture";

type Project = {
  number: string;
  name: string;
  homeImageSrc: string; // homepage image (distinct from the case-study hero `imageSrc`)
  href: string;
  accent: string;
  /** Per-theme readable variant of `accent` for use as text on the hero. Falls
   *  back to `accent` when not provided. Light heroes use the `.light` value. */
  textAccentColor?: { light: string; dark: string };
  /** True when the hero image is light-toned → use dark border/CTA for contrast. */
  heroIsLight?: boolean;
  comingSoon?: boolean;
  /** Short description shown below the project name. Editable via `homeDescription:` in the case-study .md frontmatter. */
  homeDescription?: string;
};

// Window / film-reel recede: while a section is away from its settled position
// the inner scales down and rounds its corners, revealing the white section
// behind it as a rounded shell — "looking through a window". It sits flush to
// the page edges once landed. Position-driven, so it tracks the snap, the
// free-scroll mode, and momentum alike.
const RECEDE_PEAK = 1.0; // viewport fraction away at full recede — 1.0 so the scale/radius
// track scroll amount across the WHOLE transition (no early plateau) and only
// reach max once a section is a full viewport away (i.e. essentially off-screen).
const RECEDE_SCALE = 0.04; // max scale-down (0.04 → ~96%); smaller = thinner shell, frames closer in size
const RECEDE_RADIUS = 32; // max inner corner radius (px) at full recede (all projects)

function ParallaxProject({
  project,
  expand,
  isLast,
  sectionIndex,
  onSectionRef,
}: {
  project: Project;
  expand: boolean;
  isLast: boolean;
  sectionIndex: number;
  onSectionRef?: (el: HTMLDivElement | null) => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLSpanElement>(null);
  const [revealed, setRevealed] = useState(false);

  // Reveal entrance — only for the first (expand) section. Uses
  // opacity + filter so the section's getBoundingClientRect (used by the
  // parallax/expand math below) is unaffected.
  useEffect(() => {
    if (!expand) return;
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [expand]);

  useEffect(() => {
    const section = sectionRef.current;
    const inner = innerRef.current;
    const img = imgRef.current;
    const name = nameRef.current;
    const desc = project.homeDescription ? descRef.current : null;
    const cta = ctaRef.current; // "Coming soon" label on coming-soon entries, else "See more" CTA
    if (!section || !inner || !img || !name) return;

    const revealEls: Array<[HTMLElement, number]> = [[name, 0]];
    if (desc) revealEls.push([desc, 60]);
    if (cta) revealEls.push([cta, desc ? 160 : 120]);

    // ── Per-frame transforms + reveal (rAF-coalesced) ──────────────────────────
    // Everything reads the section rect ONCE per animation frame, then writes —
    // so multiple scroll events in a single frame can't each force a layout
    // (the old per-event getBoundingClientRect + animated box-shadow was the
    // jank). Parallax, the window/recede, and the text reveal share that read.
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let isVisible = false;

    const show = () => {
      if (isVisible) return;
      isVisible = true;
      if (showTimer) clearTimeout(showTimer);
      showTimer = setTimeout(() => {
        revealEls.forEach(([el, delay]) => {
          setTimeout(() => el.classList.add("effect-b__item--visible"), delay);
        });
      }, 16);
    };

    let frameRaf = 0;
    const applyFrame = () => {
      frameRaf = 0;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;

      // Parallax image (GPU transform).
      const mid = vh / 2 - rect.top - rect.height / 2;
      const range = vh / 2 + rect.height / 2;
      img.style.transform = `translate3d(0, ${(mid / range) * rect.height * 0.65}px, 0)`;

      // Window/recede: 0 when settled (top at viewport top) → 1 as it scrolls
      // away. The inner scales down + rounds so the white section behind reads as
      // a rounded shell; flush when landed. The last section only recedes on the
      // way IN (rect.top > 0) — scrolling past it stays flush so the footer
      // reveals with no shell.
      const away = isLast ? Math.max(0, rect.top) : Math.abs(rect.top);
      const t = Math.min(1, away / (vh * RECEDE_PEAK));
      inner.style.transform = `scale(${1 - t * RECEDE_SCALE})`;
      inner.style.borderRadius = `${t * RECEDE_RADIUS}px`;

      // Reveal the text once the section is near-centred (≈landed).
      const center = rect.top + rect.height / 2;
      if (center > vh * 0.35 && center < vh * 0.55) show();
    };

    const schedule = () => {
      if (frameRaf) return;
      frameRaf = requestAnimationFrame(applyFrame);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("scrollend", schedule, { passive: true });
    applyFrame(); // initial paint

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("scrollend", schedule);
      if (frameRaf) cancelAnimationFrame(frameRaf);
      if (showTimer) clearTimeout(showTimer);
    };
  }, [expand, isLast, sectionIndex]);

  const section = (
    <div
      ref={(el) => {
        (sectionRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        onSectionRef?.(el);
      }}
      className={`project effect-b__section${
        expand ? ` effect-b__section--reveal${revealed ? " effect-b__section--revealed" : ""}` : ""
      }`}
    >
      {/* transform/border-radius/box-shadow are driven per-scroll in the effect
          above (the window/recede). Starts flush; recedes as it scrolls away. */}
      <div ref={innerRef} className="effect-b__inner">
        <Picture
          ref={imgRef}
          src={project.homeImageSrc}
          alt=""
          className="effect-b__bg"
          /* First project is above the fold on the landing page: fetch it
             eagerly at high priority; defer the rest so they don't compete
             with the first paint. */
          fetchPriority={sectionIndex === 0 ? "high" : "low"}
          loading={sectionIndex === 0 ? "eager" : "lazy"}
          decoding="async"
        />
        <div className="project__inner">
          {/* Progressive gradient blur (replaces the old uniform blur(20px)):
              four masked layers ramp the blur from strong at the bottom to
              clear at the top. Styling lives in .project__blur* in styles.css. */}
          <LinearBlur
            side="bottom"
            steps={8}
            strength={32}
            style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}
            aria-hidden="true"
          />
          {(() => {
            // The row is NOT a link — only the Button on the right is. Tone
            // class flips the border/ink to contrast with light vs dark heroes.
            const contentClass = `project__content${
              project.heroIsLight ? " project__content--light" : ""
            }${project.comingSoon ? " project__content--disabled" : ""}`;
            const btnVariant = project.heroIsLight ? "light-gray" : "dark-gray";
            const btnArrow = project.heroIsLight ? arrowBlack : arrowWhite;
            return (
              <div className={contentClass}>
                <div className="project__name-group">
                  <h2 ref={nameRef} className="project__name effect-b__item effect-b__item--name">
                    {project.name}
                  </h2>
                  {project.homeDescription && (
                    <p ref={descRef} className="project__description effect-b__item effect-b__item--description">
                      {project.homeDescription}
                    </p>
                  )}
                </div>
                <span ref={ctaRef} className="project__cta effect-b__item effect-b__item--cta">
                  {project.comingSoon ? (
                    <Button variant={btnVariant} disabled>
                      Coming soon
                    </Button>
                  ) : (
                    <Button
                      href={project.href}
                      variant={btnVariant}
                      iconSrc={btnArrow}
                      ariaLabel={`View ${project.name} case study`}
                    >
                      See case study
                    </Button>
                  )}
                </span>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );

  return section;
}

export default function EffectB({
  projects,
  onSectionRef,
}: {
  projects: Project[];
  onSectionRef?: (index: number, el: HTMLDivElement | null) => void;
}) {
  return (
    <>
      {projects.map((p, i) => (
        <ParallaxProject
          key={p.name}
          project={p}
          expand={i === 0}
          isLast={i === projects.length - 1}
          sectionIndex={i}
          onSectionRef={(el) => onSectionRef?.(i, el)}
        />
      ))}
    </>
  );
}
