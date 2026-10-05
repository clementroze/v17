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
    let manual = false;
    let softGesture = false;
    let settleTimer = 0;
    let direction = 0;
    let ownsGesture = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => {
      window.clearTimeout(settleTimer);
      settleTimer = 0;
      cancelAnimationFrame(frame);
      frame = 0;
      velocity = 0;
      ownsGesture = false;
      manual = false;
      root.classList.remove("home-carousel-page--settling", "home-carousel-page--manual");
    };
    const tick = (now: number) => {
      const dt = Math.min((now - previousTime) / 1000, 0.04);
      previousTime = now;
      // Critically damped spring: gradual acceleration and a soft landing,
      // with no bounce. Preserve velocity when the gesture reverses.
      // Keep the hero transition slow enough for its two text exits to read as
      // separate moments rather than collapsing into one quick movement.
      const omega = manual ? 14 : 6;
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
        if (!manual) root.classList.remove("home-carousel-page--manual");
      } else frame = requestAnimationFrame(tick);
    };
    const scheduleNearestSnap = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        settleTimer = 0;
        if (!manual) return;
        const y = window.scrollY;
        const max = Math.max(0, root.scrollHeight - window.innerHeight);
        const points = [0, ...Array.from(document.querySelectorAll<HTMLElement>(
          ".home-carousel, .hybrid-experience, .craft-preview, .home-page__footer",
        )).map(section => Math.min(max, section.getBoundingClientRect().top + y))];
        target = points.reduce((closest, point) => Math.abs(point - y) < Math.abs(closest - y) ? point : closest, 0);
        position = y;
        manual = false;
        // Reuse the spring's current velocity for a continuous, gentle settle.
        root.classList.add("home-carousel-page--settling");
        if (reducedMotion.matches) {
          window.scrollTo({ top: target, behavior: "instant" });
          stop();
        } else if (!frame) {
          previousTime = performance.now();
          frame = requestAnimationFrame(tick);
        }
      }, 160);
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
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      const directionChanged = nextDirection !== direction;
      // A reversal is deliberate immediately; a new same-direction gesture
      // can also take over without waiting for the section spring to finish.
      const fresh = elapsed > 160 || directionChanged;
      lastWheel = now;
      direction = nextDirection;
      const timeline = document.querySelector<HTMLElement>(".hybrid-experience");
      const timelineTop = timeline ? timeline.getBoundingClientRect().top + window.scrollY : carouselTop;
      if (manual && softGesture && !directionChanged && Math.abs(delta) >= 24) {
        event.preventDefault();
        window.clearTimeout(settleTimer);
        manual = false;
        softGesture = false;
        target = direction > 0 ? (window.scrollY < carouselTop - 32 ? carouselTop : timelineTop) : 0;
        ownsGesture = true;
        return;
      }
      // Rising deltas are still one gesture. Only a distinct new swipe can
      // advance past the Featured Work destination while its spring is active.
      if (frame && !manual && fresh && !directionChanged && Math.abs(delta) >= 24) {
        event.preventDefault();
        target = nextDirection > 0 ? (target < carouselTop - 2 ? carouselTop : timelineTop) : 0;
        ownsGesture = true;
        return;
      }
      if (manual || (frame && fresh)) {
        event.preventDefault();
        if (manual && (!frame || directionChanged)) {
          position = window.scrollY;
          target = position;
          if (velocity * nextDirection < 0) velocity *= 0.15;
        }
        if (!manual) {
          manual = true;
          softGesture = false;
          position = window.scrollY;
          target = position;
          // Brake opposing momentum promptly while keeping position continuous.
          if (velocity * nextDirection < 0) velocity *= 0.15;
          root.classList.add("home-carousel-page--manual");
        }
        const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        target = Math.max(0, Math.min(max, target + delta));
        ownsGesture = false;
        root.classList.add("home-carousel-page--settling");
        if (reducedMotion.matches) {
          window.scrollTo({ top: target, behavior: "instant" });
          stop();
        } else if (!frame) {
          position = window.scrollY;
          previousTime = performance.now();
          frame = requestAnimationFrame(tick);
        }
        scheduleNearestSnap();
        return;
      }
      if (frame) {
        // Only the inertial tail of the original gesture stays with the snap.
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
      const leavingFeatured = fresh && direction > 0 && Math.abs(y - carouselTop) <= 32;
      if ((!leavingFeatured && y > carouselTop + 2) || (y <= 0 && direction < 0)) {
        ownsGesture = false;
        return;
      }
      event.preventDefault();
      ownsGesture = true;
      target = leavingFeatured ? timelineTop : direction > 0 ? carouselTop : 0;
      if (Math.abs(delta) < 24) {
        manual = true;
        softGesture = true;
        ownsGesture = false;
        target = Math.max(0, y + delta);
        root.classList.add("home-carousel-page--manual");
        scheduleNearestSnap();
      }
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
      root.classList.remove("home-carousel-page", "home-carousel-page--manual");
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
