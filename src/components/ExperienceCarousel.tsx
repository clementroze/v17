import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { timeline } from "../data/timeline";
import { Link } from "../lib/router";
import { useCarouselKeyboard } from "../lib/useCarouselKeyboard";
import Picture from "./Picture";
import "./ExperienceCarousel.css";

const rulerHeights = [36, 27, 20, 12];
const hoverRulerHeights = [10, 7, 4, 0];
const introDuration = 4800;
const keyboardHoldDelay = 300;
type DragVelocity = { time: number; lastLeft: number; velocity: number };

function rulerHeight(index: number, center: number, heights = rulerHeights) {
  const distance = Math.abs(index - center);
  const lower = Math.min(heights.length - 1, Math.floor(distance));
  const upper = Math.min(heights.length - 1, lower + 1);
  const mix = distance - Math.floor(distance);
  return heights[lower] + (heights[upper] - heights[lower]) * mix;
}

export default function ExperienceCarousel() {
  const sectionRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerPhase, setFooterPhase] = useState<"hidden" | "entering" | "exiting">("hidden");
  const trackRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const drag = useRef<({ id: number; x: number; y: number; left: number; moved: boolean; pointerType: string } & DragVelocity) | null>(null);
  const suppressClick = useRef(false);
  const frame = useRef(0);
  const introFrame = useRef(0);
  const introPlayed = useRef(false);
  const introActive = useRef(false);
  const keyboardMotion = useRef({ frame: 0, key: "", started: 0, time: 0, position: 0, velocity: 0, launchSpeed: 0, cruising: false });
  const rulerDrag = useRef<({ id: number; x: number; moved: boolean } & DragVelocity) | null>(null);
  const snapMotion = useRef({ frame: 0, velocity: 0 });
  const suppressRulerClick = useRef(false);
  const [active, setActive] = useState(0);
  const hoverIndex = useRef<number | null>(null);
  const rulerCenter = useRef(0);
  const [isRulerDragging, setIsRulerDragging] = useState(false);

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

  const rulerPosition = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(timeline.length - 1, (event.clientX - bounds.left + event.currentTarget.scrollLeft) / event.currentTarget.scrollWidth * timeline.length - 0.5));
  };

  const setHoverIndex = (position: number | null) => {
    hoverIndex.current = position;
    // Hover only changes the ruler; don't rerender every image/card per move.
    Array.from(rulerRef.current?.children ?? []).forEach((button, index) => {
      (button as HTMLElement).style.setProperty("--ruler-hover-height", `${position === null ? 0 : rulerHeight(index, position, hoverRulerHeights)}px`);
    });
  };

  const cancelIntro = () => {
    if (!introActive.current) return;
    introPlayed.current = true;
    introActive.current = false;
    cancelAnimationFrame(introFrame.current);
    introFrame.current = 0;
    trackRef.current?.classList.remove("hybrid-experience__track--intro");
  };

  const cardTarget = (index: number) => {
    const track = trackRef.current;
    const card = cardRefs.current[Math.max(0, Math.min(timeline.length - 1, index))];
    if (!track || !card) return null;
    return card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
  };

  const positionTarget = (position: number) => {
    const clamped = Math.max(0, Math.min(timeline.length - 1, position));
    const lower = Math.floor(clamped);
    const upper = Math.min(timeline.length - 1, lower + 1);
    const mix = clamped - lower;
    const lowerTarget = cardTarget(lower);
    const upperTarget = cardTarget(upper);
    return lowerTarget === null || upperTarget === null ? null : lowerTarget + (upperTarget - lowerTarget) * mix;
  };

  const nearestCardIndex = () => {
    const track = trackRef.current;
    if (!track) return active;
    const center = track.scrollLeft + track.clientWidth / 2;
    return cardRefs.current.reduce((nearest, card, index) => {
      if (!card) return nearest;
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      const nearestCard = cardRefs.current[nearest];
      const nearestDistance = nearestCard
        ? Math.abs(nearestCard.offsetLeft + nearestCard.offsetWidth / 2 - center)
        : Infinity;
      return distance < nearestDistance ? index : nearest;
    }, 0);
  };

  const stopKeyboardMotion = () => {
    const motion = keyboardMotion.current;
    cancelAnimationFrame(motion.frame);
    motion.frame = 0;
    motion.key = "";
    motion.cruising = false;
    motion.velocity = 0;
    motion.launchSpeed = 0;
    trackRef.current?.classList.remove("hybrid-experience__track--keyboard");
  };

  const stopSnapMotion = () => {
    cancelAnimationFrame(snapMotion.current.frame);
    snapMotion.current.frame = 0;
    snapMotion.current.velocity = 0;
    trackRef.current?.classList.remove("hybrid-experience__track--settling");
  };

  const goTo = (index: number, releaseVelocity?: number) => {
    const track = trackRef.current;
    const target = cardTarget(index);
    if (!track || target === null) return;
    const velocity = releaseVelocity ?? snapMotion.current.velocity;
    stopSnapMotion();
    track.classList.add("hybrid-experience__track--settling");
    stopKeyboardMotion();
    introPlayed.current = true;
    cancelIntro();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      track.scrollTo({ left: target, behavior: "instant" });
      stopSnapMotion();
      return;
    }
    let position = track.scrollLeft;
    let time = performance.now();
    snapMotion.current.velocity = velocity;
    const tick = (now: number) => {
      const dt = Math.min(0.04, (now - time) / 1000);
      time = now;
      const omega = 13;
      const offset = position - target;
      const impulse = snapMotion.current.velocity + omega * offset;
      const decay = Math.exp(-omega * dt);
      position = target + (offset + impulse * dt) * decay;
      snapMotion.current.velocity = (snapMotion.current.velocity - omega * impulse * dt) * decay;
      const max = track.scrollWidth - track.clientWidth;
      position = Math.max(0, Math.min(max, position));
      track.scrollTo({ left: position, behavior: "instant" });
      if (Math.abs(position - target) < 0.4 && Math.abs(snapMotion.current.velocity) < 4) {
        track.scrollTo({ left: target, behavior: "instant" });
        stopSnapMotion();
      } else snapMotion.current.frame = requestAnimationFrame(tick);
    };
    snapMotion.current.frame = requestAnimationFrame(tick);
  };

  const sampleDrag = (gesture: DragVelocity) => {
    const track = trackRef.current;
    if (!track) return;
    const now = performance.now();
    const dt = Math.max(0.008, (now - gesture.time) / 1000);
    const velocity = (track.scrollLeft - gesture.lastLeft) / dt;
    gesture.velocity += (velocity - gesture.velocity) * (1 - Math.exp(-dt * 22));
    gesture.lastLeft = track.scrollLeft;
    gesture.time = now;
    track.style.setProperty("--drag-tilt", `${Math.max(-1.5, Math.min(1.5, -gesture.velocity / 1600))}deg`);
  };

  const settleDrag = (gesture: DragVelocity, momentum = true) => {
    const track = trackRef.current;
    if (!track) return;
    const pitch = Math.max(1, (cardTarget(1) ?? 1) - (cardTarget(0) ?? 0));
    const velocity = momentum && performance.now() - gesture.time < 100 ? Math.max(-pitch * 6, Math.min(pitch * 6, gesture.velocity)) : 0;
    const projection = Math.max(-pitch * 1.5, Math.min(pitch * 1.5, velocity * 0.16));
    const target = Math.round((track.scrollLeft + projection - (cardTarget(0) ?? 0)) / pitch);
    goTo(target, velocity);
  };

  const beginInteraction = (lockSnap: boolean) => {
    const track = trackRef.current;
    if (!track) return;
    const left = track.scrollLeft;
    if (lockSnap) track.classList.add("hybrid-experience__track--interacting");
    // Deliberate input also consumes an intro that has not started yet.
    introPlayed.current = true;
    stopKeyboardMotion();
    stopSnapMotion();
    cancelIntro();
    track.classList.remove("hybrid-experience__track--settling");
    track.scrollTo({ left, behavior: "instant" });
  };

  useCarouselKeyboard(sectionRef, (key, event) => {
    if (drag.current || rulerDrag.current) return;
    // Native repeat must not keep restarting a smooth scroll while held.
    if (event.repeat) return;
    goTo(key === "Home" ? 0 : key === "End" ? timeline.length - 1 : nearestCardIndex() + (key === "ArrowRight" ? 1 : -1));
    if (!key.startsWith("Arrow") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const track = trackRef.current;
    if (!track) return;
    const motion = keyboardMotion.current;
    motion.key = key;
    motion.started = motion.time = performance.now();
    motion.position = track.scrollLeft;
    const direction = key === "ArrowRight" ? 1 : -1;
    const tick = (now: number) => {
      const bounds = sectionRef.current?.getBoundingClientRect();
      if (!bounds || (!sectionRef.current?.contains(document.activeElement) && (bounds.top > window.innerHeight / 2 || bounds.bottom <= window.innerHeight / 2))) {
        stopKeyboardMotion();
        return;
      }
      const dt = Math.max(0.001, Math.min(0.04, (now - motion.time) / 1000));
      motion.time = now;
      if (now - motion.started < keyboardHoldDelay) {
        // Sample the single-card animation so taking over keeps its momentum.
        motion.velocity = (track.scrollLeft - motion.position) / dt;
        motion.launchSpeed = Math.max(motion.launchSpeed, direction * motion.velocity);
        motion.position = track.scrollLeft;
      } else {
        if (!motion.cruising) {
          motion.cruising = true;
          motion.position = track.scrollLeft;
          track.classList.add("hybrid-experience__track--keyboard");
          stopSnapMotion();
          track.scrollTo({ left: motion.position, behavior: "instant" });
        }
        const first = cardTarget(0) ?? 0;
        const last = cardTarget(timeline.length - 1) ?? first;
        // The intro peaks at five times its average speed. Build toward that
        // peak with hold duration, then brake according to remaining distance.
        const peakSpeed = Math.max(motion.launchSpeed, 5 * (last - first) / (introDuration / 1000));
        const held = Math.min(1, (now - motion.started - keyboardHoldDelay) / 1800);
        const ramp = held * held * (3 - 2 * held);
        // Start from the observed single-card speed, never from a lower fixed
        // cruising speed. Preserve current momentum throughout acceleration.
        const currentSpeed = Math.max(0, direction * motion.velocity);
        const desiredSpeed = Math.max(currentSpeed, motion.launchSpeed + (peakSpeed - motion.launchSpeed) * ramp);
        const remaining = direction > 0 ? last - motion.position : motion.position - first;
        const easedSpeed = currentSpeed + (desiredSpeed - currentSpeed) * (1 - Math.exp(-dt * 8));
        // A shrinking speed limit produces a soft approach instead of hitting
        // the boundary at full speed. It applies even while the key stays down.
        motion.velocity = direction * Math.min(easedSpeed, remaining / 0.24);
        motion.position = Math.max(first, Math.min(last, motion.position + motion.velocity * dt));
        track.scrollTo({ left: motion.position, behavior: "instant" });
        if (remaining < 0.5) {
          track.scrollTo({ left: direction > 0 ? last : first, behavior: "instant" });
          stopKeyboardMotion();
          return;
        }
      }
      motion.frame = requestAnimationFrame(tick);
    };
    motion.frame = requestAnimationFrame(tick);
  }, (key) => {
    const motion = keyboardMotion.current;
    if (key === null) {
      stopKeyboardMotion();
      return;
    }
    if (!motion.key || key !== motion.key) return;
    const track = trackRef.current;
    if (!track || !motion.cruising) {
      stopKeyboardMotion();
      return;
    }
    cancelAnimationFrame(motion.frame);
    motion.key = "";
    const start = track.scrollLeft;
    const first = cardTarget(0) ?? 0;
    const last = cardTarget(timeline.length - 1) ?? first;
    const pitch = Math.max(1, (cardTarget(1) ?? first + 1) - first);
    const peakSpeed = Math.max(1, 5 * (last - first) / (introDuration / 1000));
    const coastDuration = 0.4 + 0.4 * Math.min(1, Math.abs(motion.velocity) / peakSpeed);
    const projectedIndex = Math.round((start + motion.velocity * coastDuration / 3 - first) / pitch);
    const forwardIndex = motion.velocity >= 0 ? Math.ceil((start - first) / pitch) : Math.floor((start - first) / pitch);
    const targetIndex = motion.velocity >= 0 ? Math.max(forwardIndex, projectedIndex) : Math.min(forwardIndex, projectedIndex);
    const target = cardTarget(targetIndex) ?? start;
    const distance = target - start;
    const duration = Math.max(0.24, Math.min(0.95, 3 * Math.abs(distance) / Math.max(1, Math.abs(motion.velocity))));
    const tangent = Math.sign(distance) * Math.min(Math.abs(motion.velocity * duration), Math.abs(distance) * 3);
    const started = performance.now();
    const settle = (now: number) => {
      const t = Math.min(1, (now - started) / (duration * 1000));
      // Hermite easing preserves release velocity and arrives with zero speed.
      const position = start + distance * (3 * t * t - 2 * t * t * t) + tangent * (t * t * t - 2 * t * t + t);
      track.scrollTo({ left: position, behavior: "instant" });
      if (t < 1) motion.frame = requestAnimationFrame(settle);
      else stopKeyboardMotion();
    };
    motion.frame = requestAnimationFrame(settle);
  });

  useEffect(() => {
    const track = trackRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      if (reducedMotion.matches) {
        stopKeyboardMotion();
        stopSnapMotion();
      }
    };
    track?.addEventListener("wheel", stopKeyboardMotion, { passive: true });
    reducedMotion.addEventListener("change", onMotionChange);
    return () => {
      stopKeyboardMotion();
      stopSnapMotion();
      track?.removeEventListener("wheel", stopKeyboardMotion);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      frame.current = 0;
      const center = track.scrollLeft + track.clientWidth / 2;
      let nearest = 0;
      let nearestDistance = Infinity;
      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
        if (distance < nearestDistance) {
          nearest = index;
          nearestDistance = distance;
        }
      });
      // Follow the actual scroll position for every input method, smoothly
      // transferring marker height between cards without a trailing transition.
      const first = cardTarget(0);
      const next = cardTarget(1);
      rulerCenter.current = first !== null && next !== null && next > first
        ? Math.max(0, Math.min(timeline.length - 1, (track.scrollLeft - first) / (next - first)))
        : nearest;
      Array.from(rulerRef.current?.children ?? []).forEach((button, index) => {
        (button as HTMLElement).style.setProperty("--ruler-height", `${rulerHeight(index, rulerCenter.current)}px`);
      });
      setActive(nearest);
    };
    const schedule = () => {
      if (!frame.current) frame.current = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(track);
    track.addEventListener("scroll", schedule, { passive: true });
    update();
    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const animateToLatest = () => {
      if (introPlayed.current) return;
      introPlayed.current = true;
      // Consume the intro without moving the carousel when motion is reduced.
      if (reducedMotion.matches) return;
      introActive.current = true;
      const firstCard = cardRefs.current[0];
      const latestCard = cardRefs.current[timeline.length - 1];
      if (!firstCard || !latestCard) {
        introActive.current = false;
        return;
      }

      const getTarget = (card: HTMLElement) => card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
      const firstTarget = getTarget(firstCard);
      const latestTarget = getTarget(latestCard);
      track.classList.add("hybrid-experience__track--intro");
      track.scrollTo({ left: firstTarget, behavior: "instant" });

      const started = performance.now();
      const duration = introDuration;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = progress < 0.5 ? 16 * Math.pow(progress, 5) : 1 - Math.pow(-2 * progress + 2, 5) / 2;
        track.scrollLeft = firstTarget + (latestTarget - firstTarget) * eased;
        if (progress < 1) introFrame.current = requestAnimationFrame(tick);
        else {
          introFrame.current = 0;
          track.classList.remove("hybrid-experience__track--intro");
          introActive.current = false;
        }
      };
      introFrame.current = requestAnimationFrame(tick);
    };

    const checkPosition = () => {
      const bounds = section.getBoundingClientRect();
      const reached = bounds.top <= 32 && bounds.bottom > 0;
      if (reached) {
        animateToLatest();
      } else if (bounds.bottom <= 0 || bounds.top > window.innerHeight) {
        cancelIntro();
      }
    };
    const handleMotionChange = () => {
      if (reducedMotion.matches) cancelIntro();
    };
    reducedMotion.addEventListener("change", handleMotionChange);
    window.addEventListener("scroll", checkPosition, { passive: true });
    window.addEventListener("resize", checkPosition);
    checkPosition();
    return () => {
      reducedMotion.removeEventListener("change", handleMotionChange);
      window.removeEventListener("scroll", checkPosition);
      window.removeEventListener("resize", checkPosition);
      cancelIntro();
    };
  }, []);

  const release = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    if (current.moved && current.pointerType === "mouse") settleDrag(current, event.type === "pointerup");
    event.currentTarget.classList.remove("hybrid-experience__track--dragging", "hybrid-experience__track--interacting");
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <section ref={sectionRef} className="hybrid-experience" data-footer-phase={footerPhase} aria-labelledby="hybrid-experience-heading">
      <div
        className="hybrid-experience__track"
        ref={trackRef}
        tabIndex={0}
        aria-label="Swipe through experience cards"
        data-lenis-prevent
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          beginInteraction(event.pointerType === "mouse");
          suppressClick.current = false;
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, moved: false, pointerType: event.pointerType, time: performance.now(), lastLeft: event.currentTarget.scrollLeft, velocity: 0 };
        }}
        onWheel={(event) => {
          if (event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
            introPlayed.current = true;
            cancelIntro();
            if (event.currentTarget.classList.contains("hybrid-experience__track--settling")) beginInteraction(false);
          }
        }}
        onPointerMove={(event) => {
          const current = drag.current;
          if (!current || current.id !== event.pointerId) return;
          const delta = event.clientX - current.x;
          if (!current.moved && Math.hypot(delta, event.clientY - current.y) < 6) return;
          suppressClick.current = true;
          // Touch and pen keep native scrolling and momentum.
          if (current.pointerType !== "mouse") {
            current.moved = true;
            return;
          }
          if (!current.moved) {
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.classList.add("hybrid-experience__track--dragging");
          }
          current.moved = true;
          event.currentTarget.scrollLeft = current.left - delta;
          sampleDrag(current);
        }}
        onPointerUp={release}
        onPointerCancel={(event) => {
          suppressClick.current = true;
          release(event);
        }}
        onLostPointerCapture={release}
        onPointerLeave={(event) => {
          if (!drag.current?.moved) release(event);
        }}
        onClickCapture={(event) => {
          // Keyboard activation remains available after a pointer gesture.
          if (!suppressClick.current || event.detail === 0) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }}
      >
        <div className="hybrid-experience__cards">
          {timeline.map((event, index) => (
            <article
              className={`hybrid-experience__card${index === active ? " is-active" : ""}`}
              key={`${event.month}-${event.year}-${index}`}
              ref={(element) => {
                cardRefs.current[index] = element;
              }}
              onClick={(event) => {
                // The arrow link owns navigation. A click on the card body
                // selects and centers the experience; click suppression above
                // keeps a drag from accidentally activating it.
                if ((event.target as HTMLElement).closest("a")) return;
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                goTo(index);
              }}
            >
              <Picture
                className="hybrid-experience__image"
                src={event.image}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
              />
              {event.href && (() => {
                const content = (
                  <svg className="hybrid-experience__arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 18 18 6M6 6h12v12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                );
                const props = {
                  className: "hybrid-experience__card-link",
                  "aria-label": `${event.month} ${event.year}: ${event.description}`,
                  draggable: false,
                };
                return event.href.startsWith("/") ? (
                  <Link {...props} href={event.href} onClick={() => {
                    if (event.aboutSlug) {
                      sessionStorage.setItem("about_open", event.aboutSlug);
                      sessionStorage.removeItem("about_scroll");
                    }
                  }}>{content}</Link>
                ) : (
                  <a {...props} href={event.href} target="_blank" rel="noopener noreferrer">{content}</a>
                );
              })()}
              <time>
                <span>{event.month}</span>
                <strong>{event.year}</strong>
              </time>
              <p>{event.description}</p>
            </article>
          ))}
        </div>
      </div>

      <nav
        ref={rulerRef}
        className={`hybrid-experience__ruler${isRulerDragging ? " hybrid-experience__ruler--dragging" : ""}`}
        aria-label="Select an experience"
        style={{ touchAction: "none" }}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") setHoverIndex(rulerPosition(event));
        }}
        onPointerMove={(event) => {
          const position = rulerPosition(event);
          if (event.pointerType !== "touch") setHoverIndex(position);
          const drag = rulerDrag.current;
          if (!drag || drag.id !== event.pointerId) return;
          if (!drag.moved && Math.abs(event.clientX - drag.x) < 3) return;
          drag.moved = true;
          setIsRulerDragging(true);
          cancelIntro();
          event.currentTarget.setPointerCapture(event.pointerId);
          trackRef.current?.classList.add("hybrid-experience__track--dragging");
          event.preventDefault();
          const target = positionTarget(position);
          if (target !== null && trackRef.current) {
            trackRef.current.scrollLeft = target;
            sampleDrag(drag);
            setActive(nearestCardIndex());
          }
        }}
        onPointerDown={(event) => {
          if (!event.isPrimary) return;
          if (event.pointerType === "mouse" && event.button !== 0) return;
          beginInteraction(true);
          rulerDrag.current = { id: event.pointerId, x: event.clientX, moved: false, time: performance.now(), lastLeft: trackRef.current?.scrollLeft ?? 0, velocity: 0 };
          suppressRulerClick.current = false;
        }}
        onPointerUp={(event) => {
          const drag = rulerDrag.current;
          if (!drag || drag.id !== event.pointerId) return;
          rulerDrag.current = null;
          setIsRulerDragging(false);
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
          if (drag.moved) {
            settleDrag(drag);
          }
          trackRef.current?.classList.remove("hybrid-experience__track--dragging", "hybrid-experience__track--interacting");
          suppressRulerClick.current = drag.moved;
        }}
        onPointerCancel={() => {
          suppressRulerClick.current = !!rulerDrag.current?.moved;
          rulerDrag.current = null;
          setIsRulerDragging(false);
          trackRef.current?.classList.remove("hybrid-experience__track--dragging", "hybrid-experience__track--interacting");
        }}
        onLostPointerCapture={() => {
          if (!rulerDrag.current) return;
          suppressRulerClick.current = rulerDrag.current.moved;
          rulerDrag.current = null;
          setIsRulerDragging(false);
          trackRef.current?.classList.remove("hybrid-experience__track--dragging", "hybrid-experience__track--interacting");
        }}
        onClickCapture={(event) => {
          if (!suppressRulerClick.current) return;
          event.preventDefault();
          event.stopPropagation();
          suppressRulerClick.current = false;
        }}
        onPointerLeave={() => {
          setHoverIndex(null);
          if (rulerDrag.current && !rulerDrag.current.moved) {
            rulerDrag.current = null;
            trackRef.current?.classList.remove("hybrid-experience__track--interacting");
          }
        }}
      >
        {timeline.map((event, index) => {
          return (
            <button
              key={`${event.year}-${index}`}
              type="button"
              tabIndex={footerPhase === "entering" ? undefined : -1}
              aria-label={`${event.month} ${event.year}`}
              aria-current={index === active ? "date" : undefined}
              onClick={(clickEvent) => {
                // Ruler dragging already snaps on pointer-up; only a genuine
                // click should select this marker's corresponding card.
                if (suppressRulerClick.current) {
                  clickEvent.preventDefault();
                  suppressRulerClick.current = false;
                  return;
                }
                goTo(index);
              }}
              style={
                {
                  animationDelay: `${footerPhase === "exiting" ? (timeline.length - 1 - index) * 35 : (index + 1) * 50}ms`,
                  "--ruler-height": `${rulerHeight(index, rulerCenter.current)}px`,
                  "--ruler-hover-height": `${hoverIndex.current === null ? 0 : rulerHeight(index, hoverIndex.current, hoverRulerHeights)}px`,
                } as CSSProperties
              }
            >
              <span />
            </button>
          );
        })}
      </nav>

      <div ref={footerRef} className="hybrid-experience__footer">
        <h2 id="hybrid-experience-heading">My experiences so far</h2>
        <Link href="/about" tabIndex={footerPhase === "entering" ? undefined : -1} style={{ animationDelay: footerPhase === "entering" ? `${(timeline.length + 1) * 50}ms` : "0ms" }}>See more</Link>
      </div>
    </section>
  );
}
