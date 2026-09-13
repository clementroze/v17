import { useState, useRef, useEffect } from "react";
import { Reveal } from "../lib/reveal";
import Picture from "./Picture";
import type { CraftItem } from "../data/craft";

export default function CraftCard({
  item,
  delay,
  onOpen,
  onAspectResolved,
  aspect,
  registerEl,
  previewsPaused,
}: {
  previewsPaused: boolean;
  item: CraftItem;
  delay: number;
  onOpen: (id: string) => void;
  onAspectResolved: (id: string, aspect: number) => void;
  aspect: number;
  registerEl: (id: string, el: HTMLElement | null) => void;
}) {
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inViewport, setInViewport] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [nearViewport, setNearViewport] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (!("IntersectionObserver" in window)) {
      setNearViewport(true);
      setInViewport(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearViewport(true);
        observer.disconnect();
      }
    }, { rootMargin: "300px" });
    const visibility = new IntersectionObserver(([entry]) => setInViewport(entry.isIntersecting));
    observer.observe(card);
    visibility.observe(card);
    return () => { observer.disconnect(); visibility.disconnect(); };
  }, []);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inViewport && !previewsPaused && !reducedMotion) void video.play().catch(() => {});
    else video.pause();
  }, [inViewport, nearViewport, previewsPaused, reducedMotion]);
  const isVideo = item.src ? /\.(mp4|mov|webm|ogg)$/i.test(item.src) : false;
  return (
    <Reveal delay={delay} scrollAware>
      <button
        ref={(el) => { cardRef.current = el; registerEl(item.id, el); }}
        type="button"
        className={`craft-card${!ready ? " craft-card--loading" : ""}`}
        style={{ aspectRatio: String(aspect) }}
        onClick={() => onOpen(item.id)}
        aria-label={`Open ${item.label}`}
      >
        {item.src &&
          (isVideo ? (
            nearViewport && <video
              ref={videoRef}
              src={item.src}
              onLoadedData={() => setReady(true)}
              onPlaying={() => setReady(true)}
              className="craft-card__img"
              loop
              muted
              playsInline
              preload="auto"
              onError={() => setReady(true)}
              aria-label={item.alt ?? item.label}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth && v.videoHeight) {
                  onAspectResolved(item.id, v.videoWidth / v.videoHeight);
                }
              }}
            />
          ) : (
            <Picture
              src={item.src}
              alt={item.alt ?? item.label}
              className="craft-card__img"
              loading="lazy"
              onError={() => setReady(true)}
              onLoad={(e) => {
                setReady(true);
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  onAspectResolved(item.id, img.naturalWidth / img.naturalHeight);
                }
              }}
            />
          ))}
      </button>
    </Reveal>
  );
}
