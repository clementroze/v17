/**
 * Effect B — Apple-style expand-to-fullbleed (first card only) + parallax + blur-fade text
 */
import { useEffect, useRef } from "react";
import arrowWhite from "../../assets/arrow.svg";
import Button from "../Button";

type Project = {
  number: string;
  name: string;
  imageSrc: string;
  href: string;
  comingSoon?: boolean;
};

const MARGIN_START = 64;
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
  const numberRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const inner = innerRef.current;
    const img = imgRef.current;
    const number = numberRef.current;
    const name = nameRef.current;
    const btn = btnRef.current;
    if (!section || !inner || !img || !number || !name || !btn) return;

    const els = [number, name, btn];

    // ── Parallax + expand ─────────────────────────────────────────────────────
    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const mid = vh / 2 - rect.top - rect.height / 2;
      const range = vh / 2 + rect.height / 2;
      img.style.transform = `translateY(${(mid / range) * rect.height * 0.28}px)`;
      if (expand) {
        const t = Math.min(1, Math.max(0, 1 - rect.top / (EXPAND_ZONE * vh)));
        inner.style.marginLeft = `${MARGIN_START * (1 - t)}px`;
        inner.style.marginRight = `${MARGIN_START * (1 - t)}px`;
        inner.style.borderRadius = `${RADIUS_START * (1 - t)}px`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // ── Reveal logic ──────────────────────────────────────────────────────────
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let isVisible = false;

    const STAGGER = [0, 80, 180]; // ms delay per element

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

  return (
    <div ref={(el) => { (sectionRef as React.MutableRefObject<HTMLDivElement | null>).current = el; onSectionRef?.(el); }} className="project effect-b__section">
      <div
        ref={innerRef}
        className="effect-b__inner"
        style={
          expand
            ? {
                marginLeft: MARGIN_START,
                marginRight: MARGIN_START,
                borderRadius: RADIUS_START,
              }
            : { marginLeft: 0, marginRight: 0, borderRadius: 0 }
        }
      >
        <img
          ref={imgRef}
          src={project.imageSrc}
          alt=""
          className="effect-b__bg"
        />
        <div className="project__inner">
          <div className="effect-b__text project__text">
            <span
              ref={numberRef}
              className="project__number effect-b__item effect-b__item--number"
            >
              {project.number}
            </span>
            <span
              ref={nameRef}
              className="project__name effect-b__item effect-b__item--name"
            >
              {project.name}
            </span>
          </div>
          <div
            ref={btnRef}
            className="effect-b__item effect-b__item--btn effect-b__btn-wrap"
          >
            <Button
              variant="outline-white-full"
              href={project.href}
              iconSrc={arrowWhite}
              iconAlt="Arrow"
              disabled={project.comingSoon}
            >
              {project.comingSoon ? "Coming soon" : "View"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
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
