import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import FeaturedProject from "../components/FeaturedProject";
import Carousel, { type CarouselSlide } from "../components/Carousel";
import ExperienceCarousel from "../components/ExperienceCarousel";
import CraftPreview from "../components/CraftPreview";
import Button from "../components/Button";
import work from "../data/work";
import arrowBlack from "../assets/arrow-black.svg";

// Temporarily hidden; switch to true to restore the homepage Craft preview.
const SHOW_CRAFT_PREVIEW = false;

const slides: CarouselSlide[] = [
  ...work.slice(0, 4).map((project) => ({
    id: project.name,
    label: project.name,
    render: ({ active, index }: { active: boolean; index: number }) => (
      <FeaturedProject project={project} opening={index === 0} active={active} />
    ),
  })),
  {
    id: "more",
    label: "View more work",
    render: () => (
      <div className="home-project home-carousel__more">
        <div className="home-project__copy home-carousel__more-copy">
          <h2>See more</h2>
          <p>Explore more product, brand, and web design work.</p>
          <Button
            className="home-project__button"
            variant="light-gray"
            href="/work"
            iconSrc={arrowBlack}
            ariaLabel="See all work"
          >
            See all work
          </Button>
        </div>
      </div>
    ),
  },
];

export default function Home() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".home__hero-snap");
    const rows = hero?.querySelectorAll<HTMLElement>(".hero__row");
    if (!hero || !rows) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / Math.max(1, hero.offsetHeight)));
      rows.forEach((row, index) => {
        // Fully separate the exits: “Welcome” leaves first, followed by a
        // deliberate pause before the description begins moving.
        const start = index === 0 ? 0 : 0.8;
        const duration = index === 0 ? 0.38 : 0.3;
        const exit = reduced.matches ? 0 : Math.max(0, Math.min(1, (progress - start) / duration));
        const eased = exit * exit * (3 - 2 * exit);
        row.style.opacity = `${1 - eased}`;
        row.style.transform = `translate3d(0, ${-44 * eased}px, 0)`;
        row.style.filter = `blur(${eased * 6}px)`;
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("home-carousel-page");
    let frame = 0;
    let previousTime = 0;
    let position = window.scrollY;
    let velocity = 0;
    let target = position;
    let lastWheel = -Infinity;
    let lastWheelDelta = 0;
    let lastTransitionAt = -Infinity;
    let direction = 0;
    let ownsGesture = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      velocity = 0;
      ownsGesture = false;
      root.classList.remove("home-carousel-page--settling");
    };
    const tick = (now: number) => {
      const dt = Math.min((now - previousTime) / 1000, 0.04);
      previousTime = now;
      // Critically damped spring: gradual acceleration and a soft landing,
      // with no bounce. Preserve velocity when the gesture reverses.
      // Keep the hero transition slow enough for its two text exits to read as
      // separate moments rather than collapsing into one quick movement.
      const omega = 6;
      const offset = position - target;
      const impulse = velocity + omega * offset;
      const decay = Math.exp(-omega * dt);
      position = target + (offset + impulse * dt) * decay;
      velocity = (velocity - omega * impulse * dt) * decay;
      window.scrollTo({ top: position, behavior: "instant" });
      if (Math.abs(position - target) < 0.4 && Math.abs(velocity) < 4) {
        window.scrollTo({ top: target, behavior: "instant" });
        frame = 0;
        root.classList.remove("home-carousel-page--settling");
      } else frame = requestAnimationFrame(tick);
    };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      if (
        (event.target as Element).closest("nav, aside, [role='dialog'], [data-lenis-prevent], input, textarea, select")
      )
        return;
      const carousel = document.querySelector<HTMLElement>(".home-carousel");
      if (!carousel) return;
      const carouselTop = carousel.getBoundingClientRect().top + window.scrollY;
      const now = performance.now();
      const nextDirection = Math.sign(event.deltaY);
      const elapsed = now - lastWheel;
      const absoluteDelta = Math.abs(event.deltaY);
      const directionChanged = nextDirection !== direction;
      // Never let the ramp-up of the first (even very heavy) gesture count as
      // a second command. Once the spring has been underway for a moment, a
      // distinct follow-up after wheel silence can retarget it by one section.
      const deliberateFollowUp =
        Boolean(frame) &&
        now - lastTransitionAt > 220 &&
        elapsed > 85 &&
        (directionChanged || absoluteDelta >= lastWheelDelta * 0.8);
      const fresh = elapsed > 180 || directionChanged;
      lastWheel = now;
      lastWheelDelta = absoluteDelta;
      direction = nextDirection;
      if (frame) {
        if (elapsed > 180 || deliberateFollowUp) {
          const snapPoints = [
            0,
            ...Array.from(
              document.querySelectorAll<HTMLElement>(
                ".home-carousel, .hybrid-experience, .craft-preview",
              ),
            ).map((section) => section.getBoundingClientRect().top + window.scrollY),
          ].filter((point, index, points) => index === 0 || Math.abs(point - points[index - 1]) > 2);
          const currentIndex = snapPoints.reduce(
            (best, point, index) =>
              Math.abs(point - target) < best.distance ? { index, distance: Math.abs(point - target) } : best,
            { index: 0, distance: Infinity },
          ).index;
          const nextIndex = Math.max(0, Math.min(snapPoints.length - 1, currentIndex + nextDirection));
          if (nextIndex !== currentIndex) {
            ownsGesture = true;
            target = snapPoints[nextIndex];
            lastTransitionAt = now;
          }
        }
        // The spring continues to own rendering while active. Wheel input is
        // either consumed as momentum or translated into the single retarget
        // above, so it can never free-scroll through several sections at once.
        event.preventDefault();
        return;
      }
      // Hold the inertial tail at its destination; a new gesture can leave
      // the carousel for the footer normally.
      if (!fresh && ownsGesture) {
        event.preventDefault();
        return;
      }
      const y = window.scrollY;
      if (y > carouselTop + 2 || (y >= carouselTop - 2 && direction > 0) || (y <= 0 && direction < 0)) {
        ownsGesture = false;
        return;
      }
      event.preventDefault();
      ownsGesture = true;
      target = direction > 0 ? carouselTop : 0;
      lastTransitionAt = now;
      root.classList.add("home-carousel-page--settling");
      if (reducedMotion.matches) {
        window.scrollTo({ top: target, behavior: "instant" });
        stop();
      } else if (!frame) {
        position = y;
        velocity = 0;
        previousTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    reducedMotion.addEventListener("change", stop);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointerdown", stop);
    window.addEventListener("carousel-interaction-start", stop);
    window.addEventListener("resize", stop);
    window.addEventListener("keydown", stop);
    return () => {
      stop();
      reducedMotion.removeEventListener("change", stop);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("carousel-interaction-start", stop);
      window.removeEventListener("resize", stop);
      window.removeEventListener("keydown", stop);
      root.classList.remove("home-carousel-page");
    };
  }, []);

  return (
    <div className="page home-page">
      <Navbar />
      <main id="main-content" className="page__main">
        <div className="home__hero-snap">
          <Hero
            title="Welcome."
            subtitle="Clément Rozé designs and builds web experiences that are accessible, intentional, and beautiful."
            tag="Design Intern @ IBM."
          />
        </div>
        <Carousel label="Selected projects" title="Featured work" moreHref="/work" slides={slides} />
        <ExperienceCarousel />
        {SHOW_CRAFT_PREVIEW && <CraftPreview />}
      </main>
      <div className="home-page__footer" style={{ width: "100%" }}>
        <Footer />
      </div>
    </div>
  );
}
