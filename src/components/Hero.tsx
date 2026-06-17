import { useEffect, useRef } from "react";
import { Reveal } from "../lib/reveal";

type HeroProps = {
  title: string;
  subtitle: string;
  tag?: string;
};

const DURATION = 3000;
const START_DELAY = 0;
const TRACK = 3.2;
const BLUE_CENTER = TRACK / 2;
const GRAD_START = -2.15;
const GRAD_END = -0.05;
const SCALE_AMP = 0.12;
const SIGMA_FRAC = 0.16;

const KONAMI = [
  "ArrowUp","ArrowUp","ArrowDown","ArrowDown",
  "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight",
  "KeyB","KeyA",
];

const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2;

function HeroTag({ text }: { text: string }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const letters = lettersRef.current.filter(
      (el): el is HTMLSpanElement => el !== null,
    );
    if (!letters.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let rects: { left: number; center: number }[] = [];
    let width = 1;
    let lastEased = 0;
    let raf = 0;
    let timer = 0;
    let startTime = 0;
    let rainbowTimer = 0;
    let konamiIdx = 0;

    const measure = () => {
      width = root.offsetWidth || 1;
      const base = root.getBoundingClientRect().left;
      rects = letters.map((el) => {
        const r = el.getBoundingClientRect();
        const left = r.left - base;
        return { left, center: left + r.width / 2 };
      });
      const size = `${TRACK * width}px 100%`;
      letters.forEach((el) => {
        el.style.backgroundSize = size;
      });
    };

    const apply = (eased: number) => {
      lastEased = eased;
      const gradLeft = (GRAD_START + (GRAD_END - GRAD_START) * eased) * width;
      const blueX = gradLeft + BLUE_CENTER * width;
      const sigma = SIGMA_FRAC * width;
      letters.forEach((el, i) => {
        const { left, center } = rects[i];
        el.style.backgroundPositionX = `${gradLeft - left}px`;
        const d = (center - blueX) / sigma;
        el.style.transform = `scale(${1 + SCALE_AMP * Math.exp(-d * d)})`;
      });
    };

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const p = Math.min((now - startTime) / DURATION, 1);
      apply(easeInOutQuart(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    const play = () => {
      cancelAnimationFrame(raf);
      startTime = 0;
      raf = requestAnimationFrame(tick);
    };

    // Konami easter egg: per-letter rainbow hues, hue-rotate spin on the parent.
    // Each letter gets a gradient at a spread hue so they form a continuous
    // rainbow; the CSS animation on .hero__tag--rainbow spins hue-rotate(360deg)
    // for a looping cycle. Reverts to the IBM blue after 6 s.
    const playRainbow = () => {
      cancelAnimationFrame(raf);
      clearTimeout(rainbowTimer);
      letters.forEach((el, i) => {
        const hue = Math.round((i / Math.max(letters.length - 1, 1)) * 300);
        el.style.backgroundImage = `linear-gradient(135deg, hsl(${hue}deg 100% 62%), hsl(${hue + 50}deg 90% 52%))`;
        el.style.backgroundSize = "100% 100%";
        el.style.backgroundPositionX = "0px";
        el.style.transform = "scale(1)";
      });
      root.classList.add("hero__tag--rainbow");
      rainbowTimer = window.setTimeout(() => {
        root.classList.remove("hero__tag--rainbow");
        // restore IBM blue gradient on each letter
        letters.forEach((el) => {
          el.style.backgroundImage = "";
          el.style.transform = "scale(1)";
        });
        measure();
        play();
      }, 6000);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === KONAMI[konamiIdx]) {
        konamiIdx++;
        if (konamiIdx === KONAMI.length) {
          konamiIdx = 0;
          playRainbow();
        }
      } else {
        konamiIdx = e.code === KONAMI[0] ? 1 : 0;
      }
    };

    const onResize = () => {
      measure();
      apply(lastEased);
    };

    root.classList.add("hero__tag--animate");
    measure();
    apply(0);
    timer = window.setTimeout(play, START_DELAY);
    root.addEventListener("pointerenter", play);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    document.fonts?.ready
      .then(() => {
        if (disposed) return;
        measure();
        apply(lastEased);
      })
      .catch(() => {});

    return () => {
      disposed = true;
      clearTimeout(timer);
      clearTimeout(rainbowTimer);
      cancelAnimationFrame(raf);
      root.removeEventListener("pointerenter", play);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [text]);

  return (
    <span ref={rootRef} className="hero__tag" aria-label={text}>
      {[...text].map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="hero__tag-letter"
          ref={(el) => {
            lettersRef.current[i] = el;
          }}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

export default function Hero({ title, subtitle, tag }: HeroProps) {
  return (
    <div className="container-wrapper">
      <div className="container">
        <div className="hero">
          <div className="hero__row">
            <div className="hero__left">
              <Reveal>
                <h1 className="hero__title">{title}</h1>
              </Reveal>
            </div>
            <div className="hero__right" />
          </div>
          <div className="hero__row hero__row--right">
            <div className="hero__left" />
            <div className="hero__right">
              <Reveal delay={80}>
                <p className="hero__subtitle">
                  {subtitle}
                  {tag && <> <HeroTag text={tag} /></>}
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
