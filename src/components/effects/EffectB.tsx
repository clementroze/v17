/**
 * Effect B — Apple-style expand-to-fullbleed (first card only) + parallax + blur-fade text
 */
import { useEffect, useRef, useState } from "react";
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
};

// Resting inset margin of the first project before it expands to full-bleed.
// Tighter on mobile (16px) so the card uses more of the narrow screen; 64px on
// larger viewports.
const marginStart = () =>
  typeof window !== "undefined" && window.innerWidth <= 768 ? 16 : 64;
const RADIUS_START = 32;
const EXPAND_ZONE = 0.5;

function ParallaxProject({
  project,
  expand,
  sectionIndex,
  onSectionRef,
}: {
  project: Project;
  expand: boolean;
  sectionIndex: number;
  onSectionRef?: (el: HTMLDivElement | null) => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
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
    const cta = ctaRef.current; // "Coming soon" label on coming-soon entries, else "See more" CTA
    if (!section || !inner || !img || !name) return;

    const els: HTMLElement[] = cta ? [name, cta] : [name];

    // ── Parallax + expand ─────────────────────────────────────────────────────
    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const mid = vh / 2 - rect.top - rect.height / 2;
      const range = vh / 2 + rect.height / 2;
      img.style.transform = `translateY(${(mid / range) * rect.height * 0.28}px)`;
      if (expand) {
        const t = Math.min(1, Math.max(0, 1 - rect.top / (EXPAND_ZONE * vh)));
        const m = marginStart();
        inner.style.marginLeft = `${m * (1 - t)}px`;
        inner.style.marginRight = `${m * (1 - t)}px`;
        inner.style.borderRadius = `${RADIUS_START * (1 - t)}px`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // ── Reveal logic ──────────────────────────────────────────────────────────
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let isVisible = false;

    const STAGGER = [0, 120]; // ms delay per element (name, cta)

    const show = () => {
      if (isVisible) return;
      isVisible = true;
      if (showTimer) clearTimeout(showTimer);
      showTimer = setTimeout(() => {
        els.forEach((el, i) => {
          setTimeout(() => el.classList.add("effect-b__item--visible"), STAGGER[i]);
        });
      }, 16);
    };

    const checkActive = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = rect.top + rect.height / 2;
      if (center > vh * 0.1 && center < vh * 0.9) show();
    };

    const onScrollEnd = () => checkActive();
    const onScrollIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(checkActive, 80);
    };

    window.addEventListener("scrollend", onScrollEnd, { passive: true });
    window.addEventListener("scroll", onScrollIdle, { passive: true });
    checkActive();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("scroll", onScrollIdle);
      if (showTimer) clearTimeout(showTimer);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [expand, sectionIndex]);

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
      <div
        ref={innerRef}
        className="effect-b__inner"
        style={
          expand
            ? {
                marginLeft: marginStart(),
                marginRight: marginStart(),
                borderRadius: RADIUS_START,
              }
            : { marginLeft: 0, marginRight: 0, borderRadius: 0 }
        }
      >
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
                <h2 ref={nameRef} className="project__name effect-b__item effect-b__item--name">
                  {project.name}
                </h2>
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
          sectionIndex={i}
          onSectionRef={(el) => onSectionRef?.(i, el)}
        />
      ))}
    </>
  );
}
