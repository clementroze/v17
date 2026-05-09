/**
 * Effect B — Apple-style expand-to-fullbleed (first card only) + parallax + blur-fade text
 */
import { useEffect, useRef } from "react";
import arrowWhite from "../../assets/arrow.svg";
import Button from "../Button";

type Project = { number: string; name: string; imageSrc: string; href: string };

const MARGIN_START = 64; // px each side at rest
const RADIUS_START = 32; // px border-radius at rest, scrolls down to 0 (fullbleed)
const EXPAND_ZONE = 0.7; // fraction of vh over which expansion happens

function ParallaxProject({
  project,
  expand,
}: {
  project: Project;
  expand: boolean;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const inner = innerRef.current;
    const img = imgRef.current;
    const text = textRef.current;
    const btn = btnRef.current;
    if (!section || !inner || !img || !text || !btn) return;

    // fade-in trigger
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          text.classList.add("effect-b__text--visible");
          btn.classList.add("effect-b__text--visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(section);

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;

      // parallax
      const mid = vh / 2 - rect.top - rect.height / 2;
      const range = vh / 2 + rect.height / 2;
      const progress = mid / range;
      img.style.transform = `translateY(${progress * rect.height * 0.28}px)`;

      // expand-to-fullbleed (first card only)
      if (expand) {
        const t = Math.min(1, Math.max(0, 1 - rect.top / (EXPAND_ZONE * vh)));
        inner.style.marginLeft = `${MARGIN_START * (1 - t)}px`;
        inner.style.marginRight = `${MARGIN_START * (1 - t)}px`;
        inner.style.borderRadius = `${RADIUS_START * (1 - t)}px`;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [expand]);

  return (
    <div ref={sectionRef} className="project effect-b__section">
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
          <div ref={textRef} className="effect-b__text project__text">
            <span className="project__number">{project.number}</span>
            <span className="project__name">{project.name}</span>
          </div>
          <div ref={btnRef} className="effect-b__text effect-b__btn-wrap">
            <Button
              variant="outline-white-full"
              href={project.href}
              iconSrc={arrowWhite}
              iconAlt="Arrow"
            >
              View
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EffectB({ projects }: { projects: Project[] }) {
  return (
    <>
      {projects.map((p, i) => (
        <ParallaxProject key={p.name} project={p} expand={i === 0} />
      ))}
    </>
  );
}
