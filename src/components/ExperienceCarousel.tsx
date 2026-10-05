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
  const hoverPointer = useRef<{ x: number; y: number } | null>(null);
  const hoveredCard = useRef<HTMLElement | null>(null);
  const updateCardHover = () => {
    const pointer = hoverPointer.current;
    const candidate = pointer
      ? document.elementFromPoint(pointer.x, pointer.y)?.closest<HTMLElement>(".hybrid-experience__card") ?? null
      : null;
    const card = candidate && trackRef.current?.contains(candidate) ? candidate : null;
    if (card === hoveredCard.current) return;
    hoveredCard.current?.removeAttribute("data-pointer-hovered");
    card?.setAttribute("data-pointer-hovered", "");
    hoveredCard.current = card;
  };
  const drag = useRef<({ id: number; x: number; y: number; lastX: number; left: number; moved: boolean; pointerType: string } & DragVelocity) | null>(null);
  const suppressClick = useRef(false);
  const frame = useRef(0);
  const introFrame = useRef(0);
  const introPlayed = useRef(false);
  const introActive = useRef(false);
  const keyboardMotion = useRef({ frame: 0, key: "", started: 0, time: 0, position: 0, velocity: 0, launchSpeed: 0, cruising: false });
  const rulerDrag = useRef<({ id: number; x: number; moved: boolean } & DragVelocity) | null>(null);
  const rulerMotion = useRef({ frame: 0, target: 0, time: 0 });
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

  const cardSway = useRef<{ time: number; cards: { angle: number; velocity: number }[] }>({ time: 0, cards: [] });
  const setCardTilt = (velocity: number) => {
    const track = trackRef.current;
    if (!track) return;
    const now = performance.now();
    const sway = cardSway.current;
    const elapsed = (now - sway.time) / 1000;
    const dt = Math.min(0.04, Math.max(0.001, elapsed));
    sway.time = now;
    const center = track.scrollLeft + track.clientWidth / 2;
    const pitch = Math.max(1, (cardTarget(1) ?? 1) - (cardTarget(0) ?? 0));
    const lean = Math.max(-0.9, Math.min(0.9, -velocity / 2667));
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const position = (card.offsetLeft + card.offsetWidth / 2 - center) / pitch;
      const distance = Math.min(1, Math.abs(position));
      // Centered cards feel more planted. Trailing cards react a little later
      // than approaching cards, with continuous weights as they cross center.
      const trailing = Math.max(-1, Math.min(1, -position * Math.sign(velocity)));
      const omega = 16 - distance * 3 - trailing * 3;
      const target = lean * (0.6 + distance * 0.4);
      const state = sway.cards[index] ?? (sway.cards[index] = { angle: 0, velocity: 0 });
      if (elapsed > 0.2) { state.angle = 0; state.velocity = 0; }
      const offset = state.angle - target;
      const impulse = state.velocity + omega * offset;
      const decay = Math.exp(-omega * dt);
      state.angle = target + (offset + impulse * dt) * decay;
      state.velocity = (state.velocity - omega * impulse * dt) * decay;
      card.style.setProperty("--drag-tilt", `${state.angle}deg`);
    });
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
    trackRef.current?.classList.remove("hybrid-experience__track--settling", "hybrid-experience__track--snap-tilt");
  };

  const goTo = (index: number, releaseVelocity?: number, keyboardTilt = true) => {
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
    if (keyboardTilt) {
      setCardTilt(velocity);
      track.classList.add("hybrid-experience__track--snap-tilt");
    }
    let position = track.scrollLeft;
    let time = performance.now();
    // A release keeps its incoming speed and coasts with gentle friction;
    // explicit selections use a firmer spring for a responsive start.
    const omega = releaseVelocity !== undefined && Math.abs(releaseVelocity) > 80 ? 4.2 : 8.5;
    snapMotion.current.velocity = velocity;
    const tick = (now: number) => {
      const dt = Math.min(0.04, (now - time) / 1000);
      time = now;
      const offset = position - target;
      const impulse = snapMotion.current.velocity + omega * offset;
      const decay = Math.exp(-omega * dt);
      position = target + (offset + impulse * dt) * decay;
      snapMotion.current.velocity = (snapMotion.current.velocity - omega * impulse * dt) * decay;
      if (keyboardTilt) setCardTilt(snapMotion.current.velocity);
      const max = track.scrollWidth - track.clientWidth;
      position = Math.max(0, Math.min(max, position));
      if ((position === 0 && snapMotion.current.velocity < 0) || (position === max && snapMotion.current.velocity > 0)) {
        snapMotion.current.velocity = 0;
      }
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
    const dt = Math.max(0.001, (now - gesture.time) / 1000);
    const velocity = (track.scrollLeft - gesture.lastLeft) / dt;
    gesture.velocity += (velocity - gesture.velocity) * (1 - Math.exp(-dt * 22));
    gesture.lastLeft = track.scrollLeft;
    gesture.time = now;
    setCardTilt(gesture.velocity);
  };

  const stopRulerMotion = () => {
    cancelAnimationFrame(rulerMotion.current.frame);
    rulerMotion.current.frame = 0;
  };

  const moveRulerTo = (target: number) => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      track.scrollLeft = target;
      return;
    }
    const motion = rulerMotion.current;
    motion.target = target;
    if (motion.frame) return;
    motion.time = performance.now();
    const tick = (now: number) => {
      const gesture = rulerDrag.current;
      if (!gesture) { stopRulerMotion(); return; }
      const dt = Math.min(0.04, (now - motion.time) / 1000);
      motion.time = now;
      // A short exponential follow softens scrubbing without adding bounce.
      const remaining = motion.target - track.scrollLeft;
      track.scrollLeft = Math.abs(remaining) < 1 ? motion.target : track.scrollLeft + remaining * (1 - Math.exp(-dt / 0.055));
      sampleDrag(gesture);
      if (Math.abs(remaining) >= 1) motion.frame = requestAnimationFrame(tick);
      else stopRulerMotion();
    };
    motion.frame = requestAnimationFrame(tick);
  };

  const settleDrag = (gesture: DragVelocity, momentum = true) => {
    const track = trackRef.current;
    if (!track) return;
    const pitch = Math.max(1, (cardTarget(1) ?? 1) - (cardTarget(0) ?? 0));
    // Decay stale samples continuously so pausing before release feels like
    // braking, without a sudden cutoff between a flick and a stationary drop.
    const idle = Math.max(0, performance.now() - gesture.time - 40) / 1000;
    const velocity = momentum ? Math.max(-pitch * 8, Math.min(pitch * 8, gesture.velocity)) * Math.exp(-idle * 18) : 0;
    // Match the coast spring's friction: faster flicks can travel several cards.
    const projection = velocity / 4.2;
    const position = (track.scrollLeft - (cardTarget(0) ?? 0)) / pitch;
    const projected = Math.round(position + projection / pitch);
    // A deliberate flick should never reverse back to the card behind it.
    const target = Math.abs(velocity) > 180
      ? velocity > 0 ? Math.max(Math.ceil(position), projected) : Math.min(Math.floor(position), projected)
      : projected;
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

  const startNavigation = (key: string, repeat = false) => {
    if (drag.current || rulerDrag.current) return;
    // Native repeat must not keep restarting a smooth scroll while held.
    if (repeat) return;
    goTo(key === "Home" ? 0 : key === "End" ? timeline.length - 1 : nearestCardIndex() + (key === "ArrowRight" ? 1 : -1), undefined, key.startsWith("Arrow"));
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
        const held = Math.min(1, (now - motion.started - keyboardHoldDelay) / 650);
        const ramp = held * held * (3 - 2 * held);
        // Start from the observed single-card speed, never from a lower fixed
        // cruising speed. Preserve current momentum throughout acceleration.
        const currentSpeed = Math.max(0, direction * motion.velocity);
        const desiredSpeed = Math.max(currentSpeed, motion.launchSpeed + (peakSpeed - motion.launchSpeed) * ramp);
        const remaining = direction > 0 ? last - motion.position : motion.position - first;
        const easedSpeed = currentSpeed + (desiredSpeed - currentSpeed) * (1 - Math.exp(-dt * 14));
        // A shrinking speed limit produces a soft approach instead of hitting
        // the boundary at full speed. It applies even while the key stays down.
        motion.velocity = direction * Math.min(easedSpeed, remaining / 0.24);
        motion.position = Math.max(first, Math.min(last, motion.position + motion.velocity * dt));
        setCardTilt(motion.velocity);
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
  };

  const releaseNavigation = (key: string | null) => {
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
      setCardTilt((distance * (6 * t - 6 * t * t) + tangent * (3 * t * t - 4 * t + 1)) / duration);
      track.scrollTo({ left: position, behavior: "instant" });
      if (t < 1) motion.frame = requestAnimationFrame(settle);
      else stopKeyboardMotion();
    };
    motion.frame = requestAnimationFrame(settle);
  };

  useCarouselKeyboard(sectionRef, (key, event) => startNavigation(key, event.repeat), releaseNavigation);

  const chevronHold = useRef<{ id: number; key: string } | null>(null);
  const releaseChevron = (event: PointerEvent<HTMLButtonElement>) => {
    const hold = chevronHold.current;
    if (!hold || hold.id !== event.pointerId) return;
    chevronHold.current = null;
    releaseNavigation(hold.key);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

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
      stopRulerMotion();
      track?.removeEventListener("wheel", stopKeyboardMotion);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let tiltFrame = 0;
    let lastLeft = track.scrollLeft;
    let time = performance.now();
    let velocity = 0;
    const isControlled = () => introActive.current || drag.current || rulerDrag.current
      || snapMotion.current.frame || keyboardMotion.current.frame;
    const stop = () => {
      cancelAnimationFrame(tiltFrame);
      tiltFrame = 0;
      velocity = 0;
      track.classList.remove("hybrid-experience__track--scroll-tilt");
    };
    const tick = (now: number) => {
      if (isControlled() || reducedMotion.matches) { stop(); return; }
      const dt = Math.max(0.001, Math.min(0.04, (now - time) / 1000));
      const delta = track.scrollLeft - lastLeft;
      velocity += (delta / dt - velocity) * (1 - Math.exp(-dt * 22));
      lastLeft = track.scrollLeft;
      time = now;
      setCardTilt(velocity);
      if (Math.abs(delta) < 0.01 && Math.abs(velocity) < 4) { stop(); return; }
      tiltFrame = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      if (isControlled() || reducedMotion.matches) { stop(); lastLeft = track.scrollLeft; return; }
      if (tiltFrame) return;
      time = performance.now() - 16;
      track.classList.add("hybrid-experience__track--scroll-tilt");
      tiltFrame = requestAnimationFrame(tick);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    reducedMotion.addEventListener("change", stop);
    return () => {
      stop();
      track.removeEventListener("scroll", onScroll);
      reducedMotion.removeEventListener("change", stop);
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      frame.current = 0;
      updateCardHover();
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
    window.addEventListener("scroll", schedule, { passive: true });
    update();
    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", schedule);
      window.removeEventListener("scroll", schedule);
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
      setCardTilt(0);
      track.scrollTo({ left: firstTarget, behavior: "instant" });

      const started = performance.now();
      const duration = introDuration;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = progress < 0.5 ? 16 * Math.pow(progress, 5) : 1 - Math.pow(-2 * progress + 2, 5) / 2;
        // Derivative of the intro easing, in pixels per second, shared with
        // the sway used by dragging, trackpad scrolling, and navigation.
        const speed = 80 * Math.pow(Math.min(progress, 1 - progress), 4)
          * (latestTarget - firstTarget) / (duration / 1000);
        setCardTilt(speed);
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
    if (current.pointerType === "mouse") {
      if (current.moved) settleDrag(current, event.type === "pointerup");
      else goTo(nearestCardIndex());
    }
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
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, left: event.currentTarget.scrollLeft, moved: false, pointerType: event.pointerType, time: performance.now(), lastLeft: event.currentTarget.scrollLeft, velocity: 0 };
        }}
        onWheel={(event) => {
          if (event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
            introPlayed.current = true;
            cancelIntro();
            if (event.currentTarget.classList.contains("hybrid-experience__track--settling")) beginInteraction(false);
          }
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") {
            hoverPointer.current = { x: event.clientX, y: event.clientY };
            updateCardHover();
          }
        }}
        onPointerMove={(event) => {
          if (event.pointerType === "mouse") {
            hoverPointer.current = { x: event.clientX, y: event.clientY };
            updateCardHover();
          }
          const current = drag.current;
          if (!current || current.id !== event.pointerId) return;
          const delta = event.clientX - current.x;
          if (!current.moved && (current.pointerType === "mouse" ? Math.abs(delta) : Math.hypot(delta, event.clientY - current.y)) < 6) return;
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
          // Relative movement makes reversing at either edge immediate, even
          // after the pointer has travelled beyond the scrollable range.
          event.currentTarget.scrollLeft += current.lastX - event.clientX;
          current.lastX = event.clientX;
          sampleDrag(current);
        }}
        onPointerUp={release}
        onPointerCancel={(event) => {
          suppressClick.current = true;
          release(event);
        }}
        onLostPointerCapture={release}
        onPointerLeave={(event) => {
          hoverPointer.current = null;
          updateCardHover();
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
            moveRulerTo(target);
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
          stopRulerMotion();
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
          stopRulerMotion();
          setIsRulerDragging(false);
          trackRef.current?.classList.remove("hybrid-experience__track--dragging", "hybrid-experience__track--interacting");
        }}
        onLostPointerCapture={() => {
          if (!rulerDrag.current) return;
          suppressRulerClick.current = rulerDrag.current.moved;
          rulerDrag.current = null;
          stopRulerMotion();
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
                  animationDelay: `${footerPhase === "exiting" ? (timeline.length - index) * 35 : (index + 1) * 50}ms`,
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

      {([-1, 1] as const).map((direction) => (
        <button
          key={direction}
          type="button"
          className={`hybrid-experience__chevron hybrid-experience__chevron--${direction < 0 ? "previous" : "next"}`}
          aria-label={direction < 0 ? "Previous experience" : "Next experience"}
          disabled={direction < 0 ? active === 0 : active === timeline.length - 1}
          tabIndex={footerPhase === "entering" ? undefined : -1}
          style={{ animationDelay: `${footerPhase === "exiting" ? (direction < 0 ? timeline.length + 1 : 0) * 35 : (direction < 0 ? 0 : timeline.length + 1) * 50}ms` }}
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0) return;
            const key = direction < 0 ? "ArrowLeft" : "ArrowRight";
            chevronHold.current = { id: event.pointerId, key };
            event.currentTarget.setPointerCapture(event.pointerId);
            startNavigation(key);
          }}
          onPointerUp={releaseChevron}
          onPointerCancel={releaseChevron}
          onLostPointerCapture={releaseChevron}
          onClick={(event) => {
            // Pointer presses already navigate on down; retain keyboard and
            // assistive activation without advancing twice on a normal tap.
            if (event.detail === 0) goTo(nearestCardIndex() + direction);
          }}
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden="true">
            <path d={direction < 0 ? "M8 3 3 8l5 5" : "m4 3 5 5-5 5"} stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}

      <div ref={footerRef} className="hybrid-experience__footer">
        <h2 id="hybrid-experience-heading">My experiences so far</h2>
        <Link href="/about" tabIndex={footerPhase === "entering" ? undefined : -1} style={{ animationDelay: footerPhase === "entering" ? `${(timeline.length + 1) * 50}ms` : "0ms" }}>See more</Link>
      </div>
    </section>
  );
}
