import { useEffect, useRef, useState, useCallback } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import AccordionRow from "../components/AccordionRow";
import BioModal from "../components/BioModal";
import Button from "../components/Button";
import { Reveal } from "../lib/reveal";
import profilePhoto from "../assets/pfp.png";
import profilePhotoAvif from "../assets/pfp.avif";
import profilePhotoWebp from "../assets/pfp.webp";
import resumeThumbnail from "../assets/resume-thumbnail.png";
import resumeThumbnailAvif from "../assets/resume-thumbnail.avif";
import resumeThumbnailWebp from "../assets/resume-thumbnail.webp";
import linkedinIcon from "../assets/linkedin-icon.png";
import { workExperience, freelancing, collaborations, activities, infoParagraphs } from "../data/about";

// ─── section label reveal ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Reveal>
      <h2 className="about-section-row__label">{children}</h2>
    </Reveal>
  );
}

// Matches the bio modal's exit duration — used to time the "design clubs"
// scroll-to-Activities so it fires once the modal has closed and the scroll
// lock has lifted. Kept in sync with BIO_MODAL_EXIT_MS in BioModal.tsx.
const BIO_MODAL_EXIT_MS = 600;

// ─── page ─────────────────────────────────────────────────────────────────────

export default function About() {
  // Slugs of accordions to auto-open — set when returning from a case study
  // (one slug) or when a modal link targets related rows (the "design clubs"
  // link opens both dcc + dti).
  const [openSlugs, setOpenSlugs] = useState<string[]>([]);
  // Activities section — scrolled into view when "design clubs" is clicked.
  const activitiesRef = useRef<HTMLDivElement>(null);

  // Bio "More" modal open/close state — the modal (BioModal) owns its own mount
  // lifecycle and animations; the page just owns whether it should be open.
  const [bioOpen, setBioOpen] = useState(false);
  // The button that opened the modal — focus returns here on close.
  const bioTriggerRef = useRef<HTMLButtonElement>(null);
  const toggleBio = () => setBioOpen((o) => !o);
  const closeBio = () => setBioOpen(false);

  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCopyEmail = useCallback(() => {
    navigator.clipboard.writeText("cpr58@cornell.edu").then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // "design clubs" link inside the modal: open the DCC + DTI accordions, close
  // the modal, then (once it unmounts and the scroll lock lifts) scroll the
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

  return (
    <div className="page page--dark">
      <Navbar forceWhite activeLink="about" />

      <main id="main-content" className="page__main">
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
                      <picture>
                        <source srcSet={profilePhotoAvif} type="image/avif" />
                        <source srcSet={profilePhotoWebp} type="image/webp" />
                        <img src={profilePhoto} alt="Picture of Clément Rozé" className="about-photo" />
                      </picture>
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
                    <div className="about-info-more-wrap">
                      <Button
                        ref={bioTriggerRef}
                        variant="dark-gray"
                        icon="plus"
                        onClick={toggleBio}
                        ariaHaspopup="dialog"
                        ariaExpanded={bioOpen}
                      >
                        More
                      </Button>
                    </div>
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
                    {/* Résumé card scales up; the two contact cards slide in from
                      opposite sides — each card gets a distinct reveal. */}
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
                              <picture>
                                <source srcSet={resumeThumbnailAvif} type="image/avif" />
                                <source srcSet={resumeThumbnailWebp} type="image/webp" />
                                <img src={resumeThumbnail} alt="Résumé preview" className="about-resume-thumbnail" />
                              </picture>
                            </div>
                          </div>
                        </div>
                        <p className="about-resume-label">View my full résumé</p>
                      </a>
                    </Reveal>

                    <div className="about-contact-col">
                      <Reveal delay={80}>
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
                      </Reveal>
                      <Reveal delay={160}>
                        <div className="about-contact-link about-email-wrap">
                          <div className="about-contact-card about-email-card">
                            <Button
                              className={`about-email-pill${copied ? " about-email-pill--copied" : ""}`}
                              onClick={handleCopyEmail}
                            >
                              <div className="about-email-icon-wrap">
                                <svg
                                  className="about-email-svg icon-copy"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                <svg
                                  className="about-email-svg icon-check"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                              <span className="label">Copy email</span>
                            </Button>
                            <Button href="mailto:cpr58@cornell.edu" className="about-email-pill">
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <g className="about-open-arrow">
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </g>
                              </svg>
                              <span className="label">Open</span>
                            </Button>
                          </div>
                          <p className="about-contact-label">Email me</p>
                        </div>
                      </Reveal>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BioModal open={bioOpen} onClose={closeBio} onOpenDesignClubs={openDesignClubs} triggerRef={bioTriggerRef} />

      <Footer />
    </div>
  );
}
