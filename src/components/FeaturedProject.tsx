import { useEffect, useRef, useState } from "react";
import { Reveal } from "../lib/reveal";
import Picture from "./Picture";
import Button from "./Button";
import arrowBlack from "../assets/arrow-black.svg";
import type { WorkItem } from "../data/work";

export default function FeaturedProject({ project, opening = false, active = true }: {
  project: WorkItem;
  opening?: boolean;
  active?: boolean;
}) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const [copyReady, setCopyReady] = useState(!opening);
  const copyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!opening) return;
    const section = sectionRef.current;
    const media = mediaRef.current;
    const copy = copyRef.current;
    if (!section || !media || !copy) return;
    let frame = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const mobile = window.innerWidth <= 768;
      const distance = rect.top + window.scrollY;
      const progress = Math.max(0, Math.min(1, window.scrollY / Math.max(1, distance)));
      // Move the artwork inside its clipped frame, independently of the
      // frame's hero transition and the shared reveal wrapper.
      const drift = Math.max(-1, Math.min(1, -rect.top / window.innerHeight));
      if (imageRef.current) {
        imageRef.current.style.transform = reducedMotion.matches
          ? "scale(1.15)"
          : `translate3d(0, ${drift * media.clientHeight * 0.20}px, 0) scale(${1.15 * (1 + Math.abs(drift) * 0.4)})`;
      }
      if (opening) {
        setCopyReady(progress >= 0.85);
        copy.style.visibility = progress < 0.1 ? "hidden" : "visible";

        // Keep the destination tied to the design token, including on mobile.
        media.style.setProperty(
          "--hero-top-radius",
          progress === 1
            ? "var(--radius-img)"
            : `calc(24px * ${1 - progress} + var(--radius-img) * ${progress})`,
        );
      }
      // The first image is a single continuous surface, from the centered hero
      // preview to the project frame. Reverse scrolling retraces the same path.
      if (opening && !mobile && !reducedMotion.matches) {
        const remaining = 1 - progress;
        const width = section.clientWidth;
        const hero = section.closest(".home-page")?.querySelector(".home__hero-snap .container");
        const heroRect = hero?.getBoundingClientRect();
        const heroWidth = heroRect?.width ?? width * 0.9;
        // Measure the hero relative to this slide's resting slot. Using its
        // horizontally scrolled rect would pin the opening image to the viewport
        // during the return and let it overlap the other project slides.
        const track = section.closest<HTMLElement>(".home-carousel__track");
        const slot = section.closest<HTMLElement>(".home-carousel__slide");
        const restingLeft = track && slot
          ? track.getBoundingClientRect().left + slot.offsetLeft
          : rect.left;
        const heroLeft = heroRect ? heroRect.left - restingLeft : width * 0.05;
        const targetWidth = Math.min(width * 0.81, window.innerHeight * 0.76 * 3840 / 2486);
        const currentWidth = targetWidth + (heroWidth - targetWidth) * remaining;
        const targetLeft = width - currentWidth;
        const centeredTop = rect.height / 2 - currentWidth * 2237.4 / 3840 / 2;
        media.style.width = `${currentWidth}px`;
        media.style.transform = `translate3d(${(heroLeft - targetLeft) * remaining}px, ${-centeredTop * remaining}px, 0)`;

      } else {
        media.style.transform = "";
        media.style.width = "";
        if (!opening) copy.style.visibility = "";
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(section);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);
    update();
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", schedule);
    };
  }, [opening]);

  return (
    <div className={`home-project${opening ? " home-project--first" : ""}`} ref={(el) => {
      sectionRef.current = el;
    }}>
      <div className="home-project__copy" ref={copyRef}>
        <Reveal repeat={opening} enabled={copyReady && active}><h2>{project.name}</h2></Reveal>
        {project.homeDescription && <Reveal repeat={opening} enabled={copyReady && active} delay={80}><p>{project.homeDescription}</p></Reveal>}
        <Reveal repeat={opening} enabled={copyReady && active} delay={160}>
        {project.comingSoon ? <span className="home-project__soon">Coming soon</span> : (
          <Button className="home-project__button" variant="light-gray" href={project.href}
            iconSrc={arrowBlack} ariaLabel={`View ${project.name} case study`}>
            See case study
          </Button>
        )}
        </Reveal>
      </div>
      <div className="home-project__media" ref={mediaRef}>
        <Reveal className="home-project__image-reveal">
        <Picture ref={imageRef} src={project.homeImageSrc} alt={`${project.name} project preview`}
          loading={opening ? "eager" : "lazy"} fetchPriority={opening ? "high" : "low"} decoding="async" />
        </Reveal>
      </div>
    </div>
  );
}
