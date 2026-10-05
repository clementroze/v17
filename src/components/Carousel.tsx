import { useRef, useEffect, useState } from "react";
import type { ReactNode } from "react";
import ProjectsNav from "./ProjectsNav";
import { Link } from "../lib/router";
import { useCarouselKeyboard } from "../lib/useCarouselKeyboard";

export type CarouselSlide = {
  id: string;
  label: string;
  render: (state: { active: boolean; index: number }) => ReactNode;
};

type CarouselProps = { label: string; slides: CarouselSlide[]; title: string; moreHref: string };

const slidePitch = (track: HTMLDivElement) => {
  const slides = track.children;
  return slides.length > 1
    ? (slides[1] as HTMLElement).offsetLeft - (slides[0] as HTMLElement).offsetLeft
    : track.clientWidth;
};

// Ignore zero events and minor sideways drift in a vertical trackpad gesture.
const isHorizontalIntent = (event: { shiftKey: boolean; deltaX: number; deltaY: number }) =>
  event.shiftKey
    ? Math.max(Math.abs(event.deltaX), Math.abs(event.deltaY)) > 2
    : Math.abs(event.deltaX) > 2 && Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.2;

/** Reusable native-scroll carousel with spring navigation and independent pill progress. */
export default function Carousel({ label, slides, title, moreHref }: CarouselProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerPhase, setFooterPhase] = useState<"hidden" | "entering" | "exiting">("hidden");
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const active = Math.round(progress);
  const sectionRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);
  const drag = useRef<{ id: number; x: number; left: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [entered, setEntered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const slideMotion = useRef({ frame: 0, target: 0, position: 0, velocity: 0, time: 0, spring: 11 });
  const interacting = useRef(false);
  const returningToHero = useRef(false);
  const swipeHint = useRef({ played: false, frame: 0 });

  const cancelSwipeHint = (consume = true) => {
    const hint = swipeHint.current;
    if (consume) hint.played = true;
    if (hint.frame) {
      cancelAnimationFrame(hint.frame);
      hint.frame = 0;
      trackRef.current?.classList.remove("home-carousel__track--animating");
    }
  };

  const startSwipeHint = () => {
    const track = trackRef.current;
    const hint = swipeHint.current;
    if (!track || hint.played || slides.length < 2 || interacting.current || slideMotion.current.frame || track.scrollLeft > 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    hint.played = true;
    const start = performance.now();
    const distance = Math.min(80, slidePitch(track) * 0.1);
    track.classList.add("home-carousel__track--animating");
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1000);
      const offset = distance * Math.pow(Math.sin(Math.PI * t), 2);
      track.scrollTo({ left: t === 1 ? 0 : offset, behavior: "instant" });
      if (t < 1) hint.frame = requestAnimationFrame(tick);
      else {
        hint.frame = 0;
        track.classList.remove("home-carousel__track--animating");
      }
    };
    hint.frame = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setFooterPhase("entering");
      observer.disconnect();
    }, { threshold: 0.1 });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const stopSlideMotion = () => {
    const wasAnimating = slideMotion.current.frame !== 0;
    cancelAnimationFrame(slideMotion.current.frame);
    slideMotion.current.frame = 0;
    slideMotion.current.velocity = 0;
    if (wasAnimating && !swipeHint.current.frame) trackRef.current?.classList.remove("home-carousel__track--animating");
    if (returningToHero.current) {
      returningToHero.current = false;
      setEntered((sectionRef.current?.getBoundingClientRect().top ?? 0) <= 32);
    }
  };

  const goTo = (index: number, spring = 11) => {
    cancelSwipeHint();
    const track = trackRef.current;
    if (!track) return;
    const motion = slideMotion.current;
    motion.spring = spring;
    motion.target = Math.max(0, Math.min(slides.length - 1, index)) * slidePitch(track);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stopSlideMotion();
      track.scrollTo({ left: motion.target, behavior: "instant" });
      return;
    }
    track.classList.add("home-carousel__track--animating");
    if (motion.frame) return;
    motion.position = track.scrollLeft;
    motion.time = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.04, (now - motion.time) / 1000);
      motion.time = now;
      const omega = motion.spring;
      const offset = motion.position - motion.target;
      const impulse = motion.velocity + omega * offset;
      const decay = Math.exp(-omega * dt);
      motion.position = motion.target + (offset + impulse * dt) * decay;
      motion.velocity = (motion.velocity - omega * impulse * dt) * decay;
      track.scrollTo({ left: motion.position, behavior: "instant" });
      if (Math.abs(motion.position - motion.target) < 0.4 && Math.abs(motion.velocity) < 4) {
        track.scrollTo({ left: motion.target, behavior: "instant" });
        stopSlideMotion();
      } else motion.frame = requestAnimationFrame(tick);
    };
    motion.frame = requestAnimationFrame(tick);
  };

  const beginInteraction = () => {
    cancelSwipeHint();
    const track = trackRef.current;
    if (!track) return;
    const left = track.scrollLeft;
    interacting.current = true;
    track.classList.add("home-carousel__track--interacting");
    stopSlideMotion();
    track.scrollTo({ left, behavior: "instant" });
  };

  const endInteraction = () => {
    interacting.current = false;
    trackRef.current?.classList.remove("home-carousel__track--interacting");
  };

  const scrubTo = (position: number) => {
    const track = trackRef.current;
    if (!track) return;
    if (!interacting.current) beginInteraction();
    track.scrollLeft = Math.max(0, Math.min(slides.length - 1, position)) * slidePitch(track);
    syncProgress(track);
  };

  useCarouselKeyboard(sectionRef, (key) => {
    if (interacting.current) return;
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round((slideMotion.current.frame ? slideMotion.current.target : track.scrollLeft) / Math.max(1, slidePitch(track)));
    goTo(key === "Home" ? 0 : key === "End" ? slides.length - 1 : index + (key === "ArrowRight" ? 1 : -1));
  });

  const syncProgress = (track: HTMLDivElement) => {
    setProgress(track.scrollLeft / Math.max(1, slidePitch(track)));
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => syncProgress(track);
    let wasEntered = false;
    let previousTop = track.parentElement?.getBoundingClientRect().top ?? 0;
    const updateEntrance = () => {
      const top = track.parentElement?.getBoundingClientRect().top ?? 0;
      const entranceDistance = Math.max(1, top + window.scrollY);
      const entranceProgress = Math.max(0, Math.min(1, window.scrollY / entranceDistance));
      track.style.setProperty("--carousel-preview-reveal", `${entranceProgress * entranceProgress * (3 - 2 * entranceProgress)}`);
      // Trigger from actual landing geometry, not a delayed React effect.
      // The incoming vertical gesture may still have an inertial wheel tail.
      const landingBottom = -Math.max(96, window.innerHeight * 0.15);
      const inLanding = top <= 24 && top >= landingBottom;
      if (inLanding) startSwipeHint();
      else if (swipeHint.current.frame) cancelSwipeHint();
      const isEntered = top <= 32;
      const movingTowardHero = top > previousTop;
      previousTop = top;
      // Begin the return as the hero reappears, once per upward crossing.
      if (isEntered) wasEntered = true;
      if (wasEntered && !isEntered && movingTowardHero && !interacting.current) {
        wasEntered = false;
        if (track.scrollLeft > 0.4) {
          returningToHero.current = true;
          goTo(0, 7.5);
        }
      }
      // Keep the real slides visible while they glide back instead of fading
      // the current slide out as soon as the section leaves its entered state.
      setEntered(isEntered || returningToHero.current);
      track.style.setProperty("--carousel-parallax-y", `${Math.max(-1, Math.min(1, -top / window.innerHeight)) * 5}%`);
    };
    const stopForHorizontalWheel = (event: WheelEvent) => {
      // Vertical wheel input is moving the page back to the hero and must not
      // repeatedly cancel/restart the horizontal return animation.
      if (isHorizontalIntent(event)) stopSlideMotion();
    };
    let entranceFrame = 0;
    const scheduleEntrance = () => {
      if (!entranceFrame) entranceFrame = requestAnimationFrame(() => { entranceFrame = 0; updateEntrance(); });
    };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => { if (reducedMotion.matches) { cancelSwipeHint(); stopSlideMotion(); } };
    updateEntrance();
    reducedMotion.addEventListener("change", onMotionChange);
    window.addEventListener("resize", scheduleEntrance);
    window.addEventListener("scroll", scheduleEntrance, { passive: true });
    track.addEventListener("wheel", stopForHorizontalWheel, { passive: true });
    let width = slidePitch(track);
    const observer = new ResizeObserver(() => {
      if (Math.abs(slidePitch(track) - width) < 1) return;
      if (swipeHint.current.frame) cancelSwipeHint();
      const index = Math.round(track.scrollLeft / Math.max(1, width));
      stopSlideMotion();
      width = slidePitch(track);
      track.scrollTo({ left: index * width, behavior: "instant" });
    });
    observer.observe(track);
    track.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelSwipeHint(false);
      stopSlideMotion();
      cancelAnimationFrame(entranceFrame);
      reducedMotion.removeEventListener("change", onMotionChange);
      window.removeEventListener("resize", scheduleEntrance);
      window.removeEventListener("scroll", scheduleEntrance);
      track.removeEventListener("wheel", stopForHorizontalWheel);
      observer.disconnect();
      track.removeEventListener("scroll", update);
    };
  }, []);

  const release = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    const track = event.currentTarget;
    const releasedLeft = track.scrollLeft;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    if (current.moved) {
      const distance = releasedLeft - current.left;
      const origin = Math.round(current.left / slidePitch(track));
      const target =
        Math.abs(distance) > Math.min(100, slidePitch(track) * 0.15)
          ? distance > 0
            ? Math.max(origin + 1, Math.round(releasedLeft / slidePitch(track)))
            : Math.min(origin - 1, Math.round(releasedLeft / slidePitch(track)))
          : origin;
      goTo(target);
    }
    track.classList.remove("home-carousel__track--dragging");
    endInteraction();
  };

  return (
    <section
      ref={sectionRef}
      className={`home-carousel${entered ? " home-carousel--entered" : ""}${dragging ? " home-carousel--dragging" : ""}`}
      aria-label={label}
      aria-roledescription="carousel"
      onPointerDownCapture={() => {
        if ((sectionRef.current?.getBoundingClientRect().top ?? Infinity) <= 32) cancelSwipeHint();
      }}
      onKeyDownCapture={(event) => {
        if (["ArrowLeft", "ArrowRight", "Home", "End", "Enter", " "].includes(event.key)) cancelSwipeHint();
      }}
      onWheelCapture={(event) => {
        if (isHorizontalIntent(event)) cancelSwipeHint();
      }}
    >
      <div
        ref={trackRef}
        className="home-carousel__track"
        tabIndex={0}
        aria-label={`Swipe or use left and right arrow keys to explore ${label.toLowerCase()}`}
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          if (event.pointerType !== "mouse") {
            stopSlideMotion();
            return;
          }
          beginInteraction();
          suppressClick.current = false;
          drag.current = { id: event.pointerId, x: event.clientX, left: event.currentTarget.scrollLeft, moved: false };
        }}
        onPointerMove={(event) => {
          const current = drag.current;
          if (!current || current.id !== event.pointerId) return;
          const delta = event.clientX - current.x;
          if (!current.moved && Math.abs(delta) < 5) return;
          if (!current.moved) {
            setDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.classList.add("home-carousel__track--dragging");
          }
          current.moved = true;
          suppressClick.current = true;
          event.currentTarget.scrollLeft = current.left - delta;
          // Scroll events can be coalesced while a pointer is moving. Sync the
          // pills immediately so the indicator stays under the cursor.
          syncProgress(event.currentTarget);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onPointerLeave={(event) => {
          if (!drag.current?.moved) release(event);
        }}
        onClickCapture={(event) => {
          if (suppressClick.current && event.detail !== 0) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
      >
        {slides.map((slide, index) => (
          <div
            className={`home-carousel__slide${index !== active ? " home-carousel__slide--preview" : ""}`}
            key={slide.id}
            role="group"
            onClickCapture={(event) => {
              if (index === active) return;
              event.preventDefault();
              event.stopPropagation();
              goTo(index);
            }}
            style={
              {
                "--slide-scale": 1 - Math.min(1, Math.abs(progress - index)) * 0.06,
                "--carousel-horizontal-reveal": Math.min(1, Math.max(0, progress)),
                "--slide-opacity": 1 - Math.min(1, Math.abs(progress - index)) * 0.45,
                "--next-preview": Math.max(0, Math.min(1, index - progress)),
                "--carousel-parallax-x": `${Math.max(-1, Math.min(1, index - progress)) * -12}%`,
              } as React.CSSProperties
            }
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}: ${slide.label}`}
          >
            <div style={{ display: "contents" }} {...(index !== active ? { inert: "" } : {})}>
              {slide.render({ active: index === active, index })}
            </div>
          </div>
        ))}
      </div>
      <div
        ref={footerRef}
        className={`home-carousel__footer home-carousel__footer--${footerPhase}`}
        style={{ "--footer-link-delay": `${(slides.length + 1) * 50}ms` } as React.CSSProperties}
      >
        <h2>{title}</h2>
        <Link href={moreHref} aria-label={`See more: ${title}`} tabIndex={footerPhase === "entering" ? undefined : -1}>
          See more
        </Link>
      </div>
      <ProjectsNav
        count={slides.length}
        sectionRefs={sectionRefs.current}
        orientation="horizontal"
        progress={progress}
        onSelect={goTo}
        onScrub={scrubTo}
        onScrubStart={beginInteraction}
        onScrubEnd={endInteraction}
        labels={slides.map((slide) => slide.label)}
        variant="dark"
        alwaysVisible
        visible={footerPhase === "entering"}
        enterDelay={50}
      />
    </section>
  );
}
