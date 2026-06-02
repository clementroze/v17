import React, { useEffect, useRef, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import AccordionRow from "../components/AccordionRow";
import { Reveal } from "../lib/reveal";
import profilePhoto from "../assets/pfp.png";
import resumeThumbnail from "../assets/resume-thumbnail.png";
import linkedinIcon from "../assets/linkedin-icon.svg";
import emailIcon from "../assets/email-icon.svg";
import { workExperience, freelancing, collaborations, activities, infoParagraphs } from "../data/about";

// ─── bio-visual stage ─────────────────────────────────────────────────────────
// The bio modal pairs a scrolling text column with a floating image stage in the
// left 50% of the screen that cross-fades to the section crossing the text
// column's center as you scroll.
//
// Each section is tagged with one of four *layouts* (how the images are
// arranged). Each image displays at its own natural aspect ratio — size/crop
// the source files themselves to control their shape.
type BioLayout = "solo" | "stack" | "scatter" | "pair";
type BioImage = {
  src: string;
  // scatter-only placement (ignored by the other layouts)
  top?: string;
  left?: string;
  rotate?: string;
};
type BioSection = {
  id: string;
  heading: string;
  layout: BioLayout;
  images: BioImage[];
  content: React.ReactNode;
};

// Renders one section's images in its chosen layout. Every section's visual is
// stacked absolutely in the stage and cross-faded via `active`.
function BioVisual({ section, active }: { section: BioSection; active?: boolean }) {
  return (
    <div className={`bio-visual bio-visual--${section.layout}${active ? " is-active" : ""}`}>
      {section.images.map((img, i) => (
        <figure
          className="bio-visual__item"
          key={i}
          style={
            section.layout === "scatter"
              ? ({ top: img.top, left: img.left, "--rot": img.rotate } as React.CSSProperties)
              : undefined
          }
        >
          <img src={img.src} alt="" loading="lazy" draggable={false} />
        </figure>
      ))}
    </div>
  );
}

// ─── section label reveal ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Reveal>
      <h2 className="about-section-row__label">{children}</h2>
    </Reveal>
  );
}

// How long the close animation runs before we unmount — the panel's slide is
// the longest piece (transform 0.55s in .bio-modal__panel), plus a small buffer
// so the node (and its full-screen backdrop) tears down right as it finishes,
// not a beat later.
const BIO_MODAL_EXIT_MS = 600;

// Selector for the elements the focus trap can land on inside the modal.
const BIO_MODAL_FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// ─── page ─────────────────────────────────────────────────────────────────────

export default function About() {
  // Slugs of accordions to auto-open — set when returning from a case study
  // (one slug) or when a modal link targets related rows (the "design clubs"
  // link opens both dcc + dti).
  const [openSlugs, setOpenSlugs] = useState<string[]>([]);
  // Activities section — scrolled into view when "design clubs" is clicked.
  const activitiesRef = useRef<HTMLDivElement>(null);

  // Bio "+ More" modal. `mounted` keeps the node in the tree through the exit
  // animation; `visible` drives the enter/exit (slide-up + fade) via a class.
  const [bioMounted, setBioMounted] = useState(false);
  const [bioVisible, setBioVisible] = useState(false);
  const bioPanelRef = useRef<HTMLDivElement>(null);
  // The element that opened the modal — focus returns here on close.
  const bioTriggerRef = useRef<HTMLButtonElement>(null);
  // Pending async work for the open/close transition, held in refs so any new
  // open/close can cancel it — this is what makes the animation interruptible
  // (spam-clicking More, clicking out mid-open, Esc mid-transition, etc.). The
  // CSS transitions themselves reverse smoothly from wherever they are; we just
  // keep the mount lifecycle from fighting that. `bioCloseTimer` is the pending
  // unmount; `bioOpenRaf` is the next-frame "flip to visible" used on first
  // mount (cancellable so a close in that same frame wins).
  const bioCloseTimer = useRef<number | null>(null);
  const bioOpenRaf = useRef<number | null>(null);

  // Bio-visual state. `activeIndex` is the shared source of truth for "which
  // section are we on" — both scroll panes read and write it.
  const [activeIndex, setActiveIndex] = useState(0);
  const bioBodyRef = useRef<HTMLDivElement>(null); // the smooth-scrolling text column (IO root)
  const bioSectionRefs = useRef<(HTMLElement | null)[]>([]);
  // The left image stage is its own snap-scroll container (an invisible track
  // of full-height sections drives the cross-fade); `bioStageRef` is that
  // container so we can read/set its scrollTop.
  const bioStageRef = useRef<HTMLDivElement>(null);
  // Which pane the user is actively driving ("left" stage vs "right" text), so
  // the two-way scroll sync only ever pushes the *other* pane and never fights
  // itself in a feedback loop. Null until the first interaction.
  const scrollDriver = useRef<"left" | "right" | null>(null);

  const cancelBioTransition = () => {
    if (bioCloseTimer.current !== null) {
      window.clearTimeout(bioCloseTimer.current);
      bioCloseTimer.current = null;
    }
    if (bioOpenRaf.current !== null) {
      cancelAnimationFrame(bioOpenRaf.current);
      bioOpenRaf.current = null;
    }
  };

  const openBio = () => {
    // Cancel a pending unmount/flip so reopening mid-close keeps the node alive
    // and the panel just slides back in from its current position.
    cancelBioTransition();
    if (bioMounted) {
      // Already in the DOM (reopening mid-close) — flip straight to visible to
      // reverse instantly, keeping the section the user was on.
      setBioVisible(true);
      return;
    }
    // Fresh open: start at the first section with no pane driving, so the
    // remounted stage (scrollTop 0) and the active visual agree.
    setActiveIndex(0);
    scrollDriver.current = null;
    setBioMounted(true);
    // Next frame so the element paints in its hidden state first, then
    // transitions to visible — otherwise the enter animation is skipped.
    bioOpenRaf.current = requestAnimationFrame(() => {
      bioOpenRaf.current = null;
      setBioVisible(true);
    });
  };

  const closeBio = () => {
    // Cancel any in-flight open flip or queued unmount so we don't stack timers
    // or get re-opened by a stale rAF after closing.
    cancelBioTransition();
    setBioVisible(false);
    bioCloseTimer.current = window.setTimeout(() => {
      bioCloseTimer.current = null;
      setBioMounted(false);
    }, BIO_MODAL_EXIT_MS);
  };

  // The More button toggles: if the drawer is showing (or sliding in) it
  // closes, otherwise it opens. `bioVisible` is the source of truth for
  // "should be open", so this stays correct even mid-animation.
  const toggleBio = () => (bioVisible ? closeBio() : openBio());

  // Tidy up any pending timer/frame if the page unmounts mid-animation.
  useEffect(() => cancelBioTransition, []);

  // "design clubs" link inside the drawer: open the DCC + DTI accordions, close
  // the drawer, then (once it unmounts and the scroll lock lifts) scroll the
  // Activities section into view.
  const openDesignClubs = () => {
    setOpenSlugs((prev) => Array.from(new Set([...prev, "dcc", "dti"])));
    closeBio();
    window.setTimeout(() => {
      const el = activitiesRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top, behavior: "smooth" });
    }, BIO_MODAL_EXIT_MS + 60);
  };

  // While the modal is mounted: lock page scroll, move focus inside, trap Tab,
  // close on Escape, and restore focus to the trigger on unmount. All of this
  // is scoped to `bioMounted` so it only applies when the modal is open.
  useEffect(() => {
    if (!bioMounted) return;

    // Lock background scroll (compensating for the scrollbar so the page
    // doesn't shift) — you can't scroll the page behind the modal.
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;

    // Move focus into the panel so keyboard/AT start inside the dialog.
    requestAnimationFrame(() => bioPanelRef.current?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeBio();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = bioPanelRef.current;
      if (!panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(BIO_MODAL_FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      // Cycle within [panel, ...focusables]: the panel itself (tabIndex -1) is
      // the fallback anchor so focus can never escape to the page behind.
      const first = focusables[0] ?? panel;
      const last = focusables[focusables.length - 1] ?? panel;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || active === panel || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !panel.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadRight;
      bioTriggerRef.current?.focus();
    };
  }, [bioMounted]);

  // Right pane → activeIndex: the text section crossing the body's center sets
  // the active section. Skipped while the left stage is the one being scrolled
  // (it's the driver then) so the two panes don't fight.
  useEffect(() => {
    if (!bioMounted) return;
    const root = bioBodyRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (scrollDriver.current === "left") return;
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.bioIndex);
            if (!Number.isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      // Only the section passing through the middle 10% band counts as active.
      { root, rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    bioSectionRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [bioMounted]);

  // Left pane → activeIndex: the snap-scroll stage reports which full-height
  // section it has settled on (scrollTop / viewport height). Only acts while
  // the stage is the driver, so a programmatic sync-scroll from the right pane
  // doesn't bounce back.
  useEffect(() => {
    if (!bioMounted) return;
    const stage = bioStageRef.current;
    if (!stage) return;
    let raf = 0;
    const lastIndex = bioSections.length - 1;
    const onScroll = () => {
      if (scrollDriver.current !== "left") return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Map scroll position over the full range to a section index — robust to
        // any small mismatch between the spacer height (100vh) and clientHeight.
        const range = stage.scrollHeight - stage.clientHeight;
        if (range <= 0) return;
        const idx = Math.round((stage.scrollTop / range) * lastIndex);
        setActiveIndex((prev) => (prev === idx ? prev : idx));
      });
    };
    stage.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      stage.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [bioMounted]);

  // activeIndex → follower pane: whenever the active section changes, scroll the
  // pane the user *isn't* driving to match. Left stage snaps; right text glides
  // smoothly (centering the section the same way the observer band does).
  useEffect(() => {
    if (!bioMounted) return;
    const driver = scrollDriver.current;
    // No pane is driving yet (e.g. just opened) — leave both at their natural
    // top position instead of yanking the text to center section 0.
    if (!driver) return;

    if (driver !== "left") {
      const stage = bioStageRef.current;
      if (stage) {
        const range = stage.scrollHeight - stage.clientHeight;
        const lastIndex = bioSections.length - 1;
        const top = lastIndex > 0 ? (activeIndex / lastIndex) * range : 0;
        stage.scrollTo({ top, behavior: "smooth" });
      }
    }
    if (driver !== "right") {
      const body = bioBodyRef.current;
      const sec = bioSectionRefs.current[activeIndex];
      if (body && sec) {
        const delta = sec.getBoundingClientRect().top - body.getBoundingClientRect().top;
        const target = body.scrollTop + delta - (body.clientHeight - sec.offsetHeight) / 2;
        body.scrollTo({ top: target, behavior: "smooth" });
      }
    }
  }, [activeIndex, bioMounted]);

  useEffect(() => {
    const slug = sessionStorage.getItem("about_open");
    const scrollY = sessionStorage.getItem("about_scroll");
    if (slug) {
      sessionStorage.removeItem("about_open");
      sessionStorage.removeItem("about_scroll");
      setOpenSlugs([slug]);
      if (scrollY) {
        const target = parseInt(scrollY, 10);
        const onTransitionEnd = (e: TransitionEvent) => {
          if ((e.target as HTMLElement).closest(".accordion-row__body")) {
            document.removeEventListener("transitionend", onTransitionEnd);
            window.scrollTo({ top: target, behavior: "instant" });
          }
        };
        document.addEventListener("transitionend", onTransitionEnd);
        // fallback in case transition never fires
        setTimeout(() => {
          document.removeEventListener("transitionend", onTransitionEnd);
          window.scrollTo({ top: target, behavior: "instant" });
        }, 600);
      }
    }
  }, []);

  // ── bio content + visuals ──────────────────────────────────────────────────
  // Defined inside the component so `content` can close over openDesignClubs.
  const bioSections: BioSection[] = [
    {
      id: "origin",
      heading: "How did I get here?",
      layout: "stack",
      images: [{ src: "/images/bio/html.png" }, { src: "/images/bio/python.png" }],
      content: (
        <>
          <p>
            My journey started in 7th grade, when we were learning Python as part of a CS class. I always found it
            fascinating how typing a few commands would lead to outputs on the black terminal screen. The following
            year, we did a module on HTML/CSS/JS and I found this to be even more of an upgrade! Instead of just white
            text on the black terminal screen, you could see shapes, colors, images, and more! I found this so fun that
            I went deeper into all this web design part, which I soon learnt was essentially the UI/UX design field.
          </p>
          <p>
            Since then, design has been my main thing, but I've always kept the technical side close. Being able to
            actually build what I design is a superpower that unlocks so much.
          </p>
        </>
      ),
    },
    {
      id: "corner",
      heading: "Design is broad. What's my corner of it?",
      layout: "stack",
      images: [{ src: "/images/bio/mess.png" }, { src: "/images/bio/details.png" }, { src: "/images/bio/system.png" }],
      content: (
        <p>
          I'm most at home in the visual and systematic side of things: high-fidelity mockups, design systems, and
          accessibility. Getting the details right — color tokens, type scales, interaction states — is genuinely so
          satisfying to me!.
        </p>
      ),
    },
    {
      id: "takes",
      heading: "Takes",
      layout: "scatter",
      images: [
        { src: "/images/bio/radius.png", top: "-4%", left: "6%", rotate: "-6deg" },
        { src: "/images/bio/respond.png", top: "0%", left: "56%", rotate: "5deg" },
        { src: "/images/bio/poppins.png", top: "30%", left: "28%", rotate: "-3deg" },
        { src: "/images/bio/shortcuts.png", top: "65%", left: "0%", rotate: "7deg" },
        { src: "/images/bio/browsers.png", top: "58%", left: "60%", rotate: "-8deg" },
      ],
      content: (
        <>
          <p>A few of my strong convictions, loosely held:</p>
          <ul>
            <li>The Poppins font is an abomination</li>
            <li>Designers should code — and ship to production at least once</li>
            <li>Keyboard shortcuts are the ultimate productivity hack</li>
            <li>Every app needs a "Remind me in X hours" button</li>
            <li>School should teach how to type fast</li>
            <li>Your personal site is your hardest client</li>
            <li>High agency is the most underrated work attribute — do what you say you'll do, and do it well</li>
            <li>Honest feedback is a gift, but most people are too scared to give it</li>
            <li>Less border radius is better</li>
            <li>Naming things in a design system is 40% of the work</li>
            <li>People should respond faster to emails, texts or messages</li>
            <li>You should switch browsers every couple of months just to explore</li>
            <li>Don't trust a bulleted list of hot takes</li>
          </ul>
        </>
      ),
    },
    {
      id: "grass",
      heading: "Touching grass",
      layout: "scatter",
      images: [
        { src: "/images/bio/tennis.png", top: "-2%", left: "9%", rotate: "-9deg" },
        { src: "/images/bio/climb.png", top: "3%", left: "61%", rotate: "4deg" },
        { src: "/images/bio/gym.png", top: "23%", left: "22%", rotate: "-6deg" },
        { src: "/images/bio/rappel.png", top: "62%", left: "4%", rotate: "11deg" },
        { src: "/images/bio/cpr.png", top: "65%", left: "57%", rotate: "-5deg" },
      ],
      content: (
        <>
          <p>
            I've made it a goal to try out a new sport every semester at Cornell! So far: ping pong, fencing, bowling,
            rock-climbing, wilderness first aid training, tennis.{" "}
            <a href="https://scl.cornell.edu/pe/pe/courses/fall-2026" target="_blank">
              Let me know
            </a>{" "}
            what I should try next!
          </p>
          <p>I also enjoy going to the gym regularly: it's the best reset after a full day of staring at screens.</p>
        </>
      ),
    },
    {
      id: "community",
      heading: "Community",
      layout: "stack",
      images: [{ src: "/images/bio/comm-a.png" }, { src: "/images/bio/comm-b.png" }],
      content: (
        <>
          <p>
            Giving back matters a lot to me. I've found real joy in teaching — whether that's TAing{" "}
            <a href="https://classes.cornell.edu/browse/roster/FA26/class/INFO/1300" target="_blank">
              an intro web design course at Bowers
            </a>{" "}
            or mentoring students through my{" "}
            <button type="button" className="bio-modal__inline-link" onClick={openDesignClubs}>
              design clubs
            </button>
            .
          </p>
          <p>
            My goal as a teacher is to pass on the same curiosity that got me into this field in the first place. I
            wouldn't be here without the people who took the time to show me things, and that still shapes how I work
            today.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="page page--dark">
      <Navbar forceWhite activeLink="about" />

      <Hero title="Who am I?" subtitle="I design at the intersection of cultures, systems, and thoughtful detail." />

      {/* Content sections */}
      <div className="container-wrapper">
        <div className="container">
          <div className="about-sections">
            {/* Picture */}
            <div className="about-section-row">
              <SectionLabel>Picture</SectionLabel>
              <div className="about-section-row__content">
                <Reveal>
                  <div className="about-photo-wrap">
                    <img src={profilePhoto} alt="Picture of Clément Rozé" className="about-photo" />
                  </div>
                </Reveal>
              </div>
            </div>

            {/* Information */}
            <div className="about-section-row">
              <SectionLabel>Bio</SectionLabel>
              <div className="about-section-row__content about-info-text">
                {infoParagraphs.map((text, i) => (
                  <Reveal key={i} delay={i * 70}>
                    <p>{text}</p>
                  </Reveal>
                ))}
                <Reveal delay={infoParagraphs.length * 70}>
                  <button
                    ref={bioTriggerRef}
                    type="button"
                    className="about-info-more"
                    onClick={toggleBio}
                    aria-haspopup="dialog"
                    aria-expanded={bioVisible}
                  >
                    <span className="about-info-more__label">More</span>
                    <span className="about-info-more__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <line className="about-info-more__bar" x1="5" y1="12" x2="19" y2="12" />
                        <line className="about-info-more__bar" x1="12" y1="5" x2="12" y2="19" />
                      </svg>
                    </span>
                  </button>
                </Reveal>
              </div>
            </div>

            {/* Work experience */}
            <div className="about-section-row">
              <SectionLabel>Work experience</SectionLabel>
              <div className="about-section-row__content">
                <div className="about-accordion-list">
                  {workExperience.map((item, i) => (
                    <Reveal key={item.slug} delay={i * 60}>
                      <AccordionRow {...item} defaultOpen={openSlugs.includes(item.slug)} />
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>

            {/* Freelancing */}
            <div className="about-section-row">
              <SectionLabel>Freelancing</SectionLabel>
              <div className="about-section-row__content">
                <div className="about-accordion-list">
                  {freelancing.map((item, i) => (
                    <Reveal key={item.slug} delay={i * 60}>
                      <AccordionRow {...item} defaultOpen={openSlugs.includes(item.slug)} />
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>

            {/* Collaborations */}
            <div className="about-section-row">
              <SectionLabel>Collaborations</SectionLabel>
              <div className="about-section-row__content">
                <div className="about-accordion-list">
                  {collaborations.map((item, i) => (
                    <Reveal key={item.slug} delay={i * 60}>
                      <AccordionRow {...item} defaultOpen={openSlugs.includes(item.slug)} />
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>

            {/* Activities */}
            <div className="about-section-row" ref={activitiesRef}>
              <SectionLabel>Activities</SectionLabel>
              <div className="about-section-row__content">
                <div className="about-accordion-list">
                  {activities.map((item, i) => (
                    <Reveal key={item.slug} delay={i * 60}>
                      <AccordionRow {...item} defaultOpen={openSlugs.includes(item.slug)} />
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>

            {/* Resume */}
            <div className="about-section-row">
              <SectionLabel>Contact</SectionLabel>
              <div className="about-section-row__content">
                <div className="about-more-row">
                  <Reveal>
                    <a
                      href="/Clement-Roze-Resume.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="about-resume-link"
                      aria-label="View full résumé (opens in new tab)"
                    >
                      <div className="about-resume-clip">
                        <div className="about-resume-card">
                          <div className="about-resume-thumbnail-wrap">
                            <img src={resumeThumbnail} alt="Résumé preview" className="about-resume-thumbnail" />
                          </div>
                        </div>
                      </div>
                      <p className="about-resume-label">View my full résumé</p>
                    </a>
                  </Reveal>

                  <Reveal delay={80}>
                    <div className="about-contact-col">
                      <a
                        href="https://www.linkedin.com/in/clementroze"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="about-contact-link"
                      >
                        <div className="about-contact-card">
                          <img src={linkedinIcon} alt="" className="about-contact-icon" />
                        </div>
                        <p className="about-contact-label">Message me on LinkedIn</p>
                      </a>
                      <a href="mailto:cpr58@cornell.edu" className="about-contact-link" target="_blank">
                        <div className="about-contact-card">
                          <img src={emailIcon} alt="" className="about-contact-icon" />
                        </div>
                        <p className="about-contact-label">Email me</p>
                      </a>
                    </div>
                  </Reveal>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {bioMounted && (
        <div
          className={`bio-modal${bioVisible ? " bio-modal--open" : ""}`}
          onClick={closeBio}
          role="dialog"
          aria-modal="true"
          aria-label="More about me"
        >
          {/* Floating image stage in the left 50% of the screen. It's a
              snap-scroll container: the pinned `__stage-visuals` overlay holds
              the cross-fading images, while an invisible track of full-height
              snap sections underneath gives it scrollable height. Scrolling it
              snaps section-by-section and drives `activeIndex` (synced to the
              text pane). Clicks still bubble up to close. */}
          <div
            className="bio-modal__stage"
            aria-hidden="true"
            ref={bioStageRef}
            onWheel={() => (scrollDriver.current = "left")}
            onTouchStart={() => (scrollDriver.current = "left")}
            onPointerDown={() => (scrollDriver.current = "left")}
          >
            <div className="bio-modal__stage-visuals">
              {bioSections.map((s, i) => (
                <BioVisual key={s.id} section={s} active={i === activeIndex} />
              ))}
            </div>
            {/* Snap track: one full-height spacer per section. The visuals
                overlay above contributes no scroll height (negative margin), so
                these alone define the snap points (one stage-height apart). */}
            {bioSections.map((s) => (
              <div key={s.id} className="bio-modal__stage-snap" />
            ))}
          </div>

          <div ref={bioPanelRef} className="bio-modal__panel" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
            {/* Header: title on the left, close on the right — both sit at the
                same padding inset (see .bio-modal__header in CSS). */}
            <div className="bio-modal__header">
              <h2 className="bio-modal__title">More about me</h2>
              <button type="button" className="bio-modal__close" onClick={closeBio} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {/* Content lives in `bioSections` above; the floating stage tracks
                which section is centered. */}
            <div
              className="bio-modal__body"
              ref={bioBodyRef}
              onWheel={() => (scrollDriver.current = "right")}
              onTouchStart={() => (scrollDriver.current = "right")}
              onPointerDown={() => (scrollDriver.current = "right")}
            >
              {bioSections.map((s, i) => (
                <section
                  key={s.id}
                  className="bio-section"
                  data-bio-index={i}
                  ref={(el) => (bioSectionRefs.current[i] = el)}
                >
                  <h3>{s.heading}</h3>
                  {s.content}
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
