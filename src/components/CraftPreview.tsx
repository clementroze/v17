import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { CRAFT_ITEMS } from "../data/craft";
import { Link } from "../lib/router";
import Picture from "./Picture";
import ProjectsNav from "./ProjectsNav";
import { useCarouselKeyboard } from "../lib/useCarouselKeyboard";
import "./CraftPreview.css";

// Native image dimensions reserve the correct height before lazy images load.
const previewImages = new Map<string, { width: number; height: number }>([
  ["/craft/iwater-pair.png", { width: 902, height: 1043 }],
  ["/craft/deadline-promo.png", { width: 902, height: 500 }],
  ["/craft/souvenir-login.png", { width: 902, height: 942 }],
  ["/craft/roze-faq.png", { width: 902, height: 936 }],
  ["/craft/ebb-home.png", { width: 902, height: 621 }],
  ["/craft/hyperform-design.png", { width: 902, height: 885 }],
]);
const previewItems = CRAFT_ITEMS.map((item, order) => ({ item, order }))
  .filter(({ item }) => item.src && previewImages.has(item.src))
  .sort((a, b) => Number.parseInt(b.item.date, 10) - Number.parseInt(a.item.date, 10) || a.order - b.order)
  .map(({ item }) => ({ ...item, ...previewImages.get(item.src!)! }));
const stackAspect = Math.min(...previewItems.map(item => item.width / item.height));

type Pose = { x: number; y: number; rotation: number; scale: number };
type Gesture = { id: number; startX: number; startY: number; origin: Pose; moved: boolean };

export default function CraftPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [footerVisible, setFooterVisible] = useState(false);
  const [indicatorProgress, setIndicatorProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const activeRef = useRef(0);
  const animations = useRef(new Map<number, Animation>());
  const departureDirections = useRef(new Map<number, { x: number; y: number }>());
  const dragRef = useRef<Gesture | null>(null);
  const wheelRef = useRef<{ origin: Pose; x: number; y: number } | null>(null);
  const wheelTimer = useRef(0);
  const introTimer = useRef(0);
  const suppressClick = useRef(false);
  const sectionRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);
  const count = previewItems.length;
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rotation = (index: number) => ((index % 5) - 2) * 1.25;
  const transform = (pose: Pose) => `translate(calc(-50% + ${pose.x}px), calc(-50% + ${pose.y}px)) rotate(${pose.rotation}deg) scale(${pose.scale})`;
  const restPose = (index: number, selected = activeRef.current): Pose => {
    const depth = (index - selected + count) % count;
    const step = window.innerWidth <= 768 ? 12.8 : Math.min(17.6, window.innerWidth * 0.0144);
    return { x: 0, y: -step * depth, rotation: rotation(index), scale: 1 - Math.min(0.14, 0.012 * depth) };
  };
  const readPose = (index: number): Pose => {
    const card = cards.current[index];
    if (!card) return restPose(index);
    const matrix = new DOMMatrixReadOnly(getComputedStyle(card).transform);
    return { x: matrix.m41 + card.offsetWidth / 2, y: matrix.m42 + card.offsetHeight / 2, rotation: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI, scale: Math.hypot(matrix.a, matrix.b) };
  };
  const stopIntro = () => {
    window.clearTimeout(introTimer.current);
    introTimer.current = 0;
  };
  const cancelCard = (index: number) => {
    animations.current.get(index)?.cancel();
    animations.current.delete(index);
  };
  const animateCard = (index: number, frames: Keyframe[], duration: number, complete?: () => void) => {
    const card = cards.current[index];
    if (!card) return;
    cancelCard(index);
    if (reduced()) { complete?.(); return; }
    const animation = card.animate(frames, { duration, easing: "cubic-bezier(0.22, 0.7, 0.2, 1)", fill: "both" });
    animations.current.set(index, animation);
    animation.onfinish = () => {
      if (animations.current.get(index) !== animation) return;
      animations.current.delete(index);
      animation.cancel();
      complete?.();
    };
  };
  const resetGesture = () => {
    stageRef.current?.classList.remove("is-dragging");
    wheelRef.current = null;
    window.clearTimeout(wheelTimer.current);
  };
  const settle = (preserveWheel = false) => {
    const index = activeRef.current;
    const from = readPose(index);
    cards.current[index]?.style.removeProperty("transform");
    if (preserveWheel) stageRef.current?.classList.remove("is-dragging");
    else resetGesture();
    const destination = restPose(index);
    const distance = Math.hypot(from.x - destination.x, from.y - destination.y);
    const duration = Math.min(420, 180 + Math.sqrt(distance) * 20);
    animateCard(index, [{ transform: transform(from) }, { transform: transform(destination) }], duration);
    setIndicatorProgress(index);
  };
  const moveTo = (requested: number, vector = { x: -1, y: -0.25 }, reverse = false) => {
    stopIntro();
    if (count < 2) return;
    const next = ((Math.round(requested) % count) + count) % count;
    const current = activeRef.current;
    if (next === current) { settle(); return; }
    const flyingIndex = reverse ? next : current;
    const from = readPose(flyingIndex);
    const startingDepth = 30 - ((flyingIndex - current + count) % count);
    if (reverse) vector = departureDirections.current.get(next) ?? vector;
    else departureDirections.current.set(current, vector);
    const poses = cards.current.map((_, index) => readPose(index));
    activeRef.current = next;
    setActiveIndex(next);
    setIndicatorProgress(next);
    resetGesture();
    cards.current[current]?.style.removeProperty("transform");
    // Every item owns its animation. A new gesture can take the next card
    // immediately, while the previous one continues around the stack.
    poses.forEach((pose, index) => {
      if (index === flyingIndex) return;
      animateCard(index, [{ transform: transform(pose) }, { transform: transform(restPose(index, next)) }], 520);
    });
    const end = restPose(flyingIndex, next);
    const card = cards.current[flyingIndex];
    if (!card) return;
    const length = Math.max(1, Math.hypot(vector.x, vector.y));
    const dx = vector.x / length;
    const dy = vector.y / length;
    // Both control points clear the stack, so changing depth halfway through
    // the curve is hidden by spatial separation rather than an opacity cut.
    const reach = Math.min(card.offsetWidth / Math.max(0.01, Math.abs(dx)), card.offsetHeight / Math.max(0.01, Math.abs(dy))) * 1.25;
    const p1 = { x: from.x + dx * reach, y: from.y + dy * reach };
    const p2 = { x: end.x + dx * reach, y: end.y + dy * reach };
    const frames = Array.from({ length: 61 }, (_, i) => {
      const t = i / 60, u = 1 - t;
      const pose = {
        x: u * u * u * from.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * end.x,
        y: u * u * u * from.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * end.y,
        rotation: from.rotation + (end.rotation - from.rotation) * t + Math.sin(Math.PI * t) * dx * 4,
        scale: from.scale + (end.scale - from.scale) * t,
      };
      // On a backward step, the returning card stays behind the stack until
      // it clears the side, then comes forward along its previous exit arc.
      const zIndex = reverse
        ? i < 30 ? startingDepth : 40
        : i < 30 ? 40 : 30 - ((current - next + count) % count);
      return { offset: t, transform: transform(pose), zIndex };
    });
    animateCard(flyingIndex, frames, 950);
  };
  const moveRef = useRef(moveTo);
  moveRef.current = moveTo;
  const paintDrag = (origin: Pose, x: number, y: number) => {
    const card = cards.current[activeRef.current];
    if (!card) return;
    stageRef.current?.classList.add("is-dragging");
    card.style.transform = transform({ ...origin, x: origin.x + x, y: origin.y + y, rotation: origin.rotation + Math.max(-9, Math.min(9, x / 35)) });
    const fraction = Math.min(0.9, Math.hypot(x, y) / Math.max(1, (stageRef.current?.clientWidth ?? 400) * 0.45));
    setIndicatorProgress(Math.min(count - 1, activeRef.current + fraction));
  };
  const grab = () => {
    stopIntro();
    const pose = readPose(activeRef.current);
    cancelCard(activeRef.current);
    const card = cards.current[activeRef.current];
    if (card) card.style.transform = transform(pose);
    return pose;
  };

  useCarouselKeyboard(sectionRef, (key) => {
    if (dragRef.current || wheelRef.current) return;
    const angle = Math.random() * Math.PI * 2;
    const vector = { x: Math.cos(angle), y: Math.sin(angle) };
    if (key === "ArrowLeft") moveTo(activeRef.current - 1, vector, true);
    else if (key === "ArrowRight") moveTo(activeRef.current + 1, vector);
    else moveTo(key === "Home" ? 0 : count - 1);
  });

  useEffect(() => {
    const section = sectionRef.current;
    const footer = footerRef.current;
    if (!section || !footer) return;
    const reveal = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setFooterVisible(true);
      reveal.disconnect();
    }, { threshold: 0.1 });
    const intro = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      intro.disconnect();
      if (!reduced() && !dragRef.current && !wheelRef.current) introTimer.current = window.setTimeout(() => moveRef.current(activeRef.current + 1), 520);
    }, { threshold: 0.55 });
    reveal.observe(footer);
    intro.observe(section);
    return () => {
      reveal.disconnect(); intro.disconnect(); stopIntro();
      window.clearTimeout(wheelTimer.current);
      animations.current.forEach(animation => animation.cancel());
      animations.current.clear();
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      event.stopPropagation();
      if (dragRef.current) return;
      // Empty tail events should not postpone the return animation.
      if (event.deltaX === 0 && event.deltaY === 0) return;
      if (!wheelRef.current) window.dispatchEvent(new Event("carousel-interaction-start"));
      if (!wheelRef.current) wheelRef.current = { origin: grab(), x: 0, y: 0 };
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1;
      // Resume from the rendered pose, including any return already underway.
      // Each delta moves the card directly without jumping back to an old origin.
      const origin = readPose(activeRef.current);
      cancelCard(activeRef.current);
      wheelRef.current.x -= event.deltaX * unit;
      wheelRef.current.y -= event.deltaY * unit;
      paintDrag(origin, -event.deltaX * unit, -event.deltaY * unit);
      const distance = Math.hypot(wheelRef.current.x, wheelRef.current.y);
      // Small gestures are elastic immediately; the timer only groups wheel
      // input, rather than leaving the card motionless before it can return.
      if (distance <= 50) settle(true);
      window.clearTimeout(wheelTimer.current);
      wheelTimer.current = window.setTimeout(() => {
        const gesture = wheelRef.current;
        if (!gesture) return;
        if (Math.hypot(gesture.x, gesture.y) > 50) moveRef.current(activeRef.current + 1, gesture);
        else resetGesture();
      }, 70);
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, []);

  const release = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = dragRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!gesture.moved) { settle(); return; }
    suppressClick.current = true;
    const x = event.clientX - gesture.startX, y = event.clientY - gesture.startY;
    if (event.type === "pointerup" && Math.hypot(x, y) > 55) moveTo(activeRef.current + 1, { x, y });
    else settle();
  };

  return (
    <section ref={sectionRef} className="craft-preview" aria-labelledby="craft-preview-heading">
      <div ref={stageRef} className="craft-preview__stage" style={{ aspectRatio: stackAspect }} data-lenis-prevent
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0 || dragRef.current) return;
          suppressClick.current = false;
          resetGesture();
          dragRef.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, origin: grab(), moved: false };
        }}
        onPointerMove={(event) => {
          const gesture = dragRef.current;
          if (!gesture || gesture.id !== event.pointerId) return;
          const x = event.clientX - gesture.startX, y = event.clientY - gesture.startY;
          if (!gesture.moved && Math.hypot(x, y) < 4) return;
          if (!gesture.moved) event.currentTarget.setPointerCapture(event.pointerId);
          gesture.moved = true;
          paintDrag(gesture.origin, x, y);
          event.preventDefault();
        }}
        onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
        onPointerLeave={(event) => { if (!dragRef.current?.moved) release(event); }}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          if (!suppressClick.current || event.detail === 0) return;
          event.preventDefault(); event.stopPropagation(); suppressClick.current = false;
        }}>
        {previewItems.map((item, index) => (
          <button type="button" ref={(element) => { cards.current[index] = element; }}
            className={`craft-preview__item${index === activeIndex ? " is-active" : ""}`} key={item.id}
            aria-label={index === activeIndex ? `Show the next item after ${item.label}` : item.label}
            aria-hidden={index !== activeIndex} tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => moveTo(activeRef.current + 1)}
            style={{ "--stack-distance": (index - activeIndex + count) % count, "--card-rotation": `${rotation(index)}deg` } as CSSProperties}>
            <Picture src={item.src!} width={item.width} height={item.height} alt={item.alt ?? item.label} loading={index < 3 ? "eager" : "lazy"} draggable={false} />
          </button>
        ))}
      </div>
      <ProjectsNav count={count} sectionRefs={sectionRefs.current} orientation="horizontal"
        progress={indicatorProgress} onSelect={moveTo} onScrub={(position) => {
          if (Math.round(position) !== activeRef.current) moveTo(Math.round(position));
          setIndicatorProgress(position);
        }}
        onScrubStart={stopIntro} labels={previewItems.map(item => item.label)} variant="dark"
        alwaysVisible visible={footerVisible} enterDelay={50} />
      <div ref={footerRef} className={`craft-preview__footer home-carousel__footer home-carousel__footer--${footerVisible ? "entering" : "hidden"}`}
        style={{ "--footer-link-delay": `${(count + 1) * 50}ms` } as CSSProperties}>
        <h2 id="craft-preview-heading">A few things I’ve been making</h2>
        <Link href="/craft" aria-label="See more craft" tabIndex={footerVisible ? undefined : -1}>See more</Link>
      </div>
    </section>
  );
}
