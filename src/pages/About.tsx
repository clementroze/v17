import React, { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import AccordionRow from "../components/AccordionRow";
import { Reveal } from "../lib/reveal";
import profilePhoto from "../assets/pfp.png";
import resumeThumbnail from "../assets/resume-thumbnail.png";
import linkedinIcon from "../assets/linkedin-icon.svg";
import emailIcon from "../assets/email-icon.svg";
import {
  workExperience,
  freelancing,
  collaborations,
  activities,
  infoParagraphs,
} from "../data/about";

// ─── section label reveal ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Reveal>
      <p className="about-section-row__label">{children}</p>
    </Reveal>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function About() {
  // Slug of the accordion to auto-open after returning from a case study.
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  useEffect(() => {
    const slug = sessionStorage.getItem("about_open");
    const scrollY = sessionStorage.getItem("about_scroll");
    if (slug) {
      sessionStorage.removeItem("about_open");
      sessionStorage.removeItem("about_scroll");
      setOpenSlug(slug);
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

      <Hero
        title="Who am I?"
        subtitle="I design at the intersection of cultures, systems, and thoughtful detail."
      />

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
                    <img
                      src={profilePhoto}
                      alt="Picture of Clément Rozé"
                      className="about-photo"
                    />
                  </div>
                </Reveal>
              </div>
            </div>

            {/* Information */}
            <div className="about-section-row">
              <SectionLabel>Information</SectionLabel>
              <div className="about-section-row__content about-info-text">
                {infoParagraphs.map((text, i) => (
                  <Reveal key={i} delay={i * 70}>
                    <p>{text}</p>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* Work experience */}
            <div className="about-section-row">
              <SectionLabel>Work experience</SectionLabel>
              <div className="about-section-row__content">
                <div className="about-accordion-list">
                  {workExperience.map((item, i) => (
                    <Reveal key={item.slug} delay={i * 60}>
                      <AccordionRow
                        {...item}
                        defaultOpen={openSlug === item.slug}
                      />
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
                      <AccordionRow
                        {...item}
                        defaultOpen={openSlug === item.slug}
                      />
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
                      <AccordionRow
                        {...item}
                        defaultOpen={openSlug === item.slug}
                      />
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>

            {/* Activities */}
            <div className="about-section-row">
              <SectionLabel>Activities</SectionLabel>
              <div className="about-section-row__content">
                <div className="about-accordion-list">
                  {activities.map((item, i) => (
                    <Reveal key={item.slug} delay={i * 60}>
                      <AccordionRow
                        {...item}
                        defaultOpen={openSlug === item.slug}
                      />
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
                            <img
                              src={resumeThumbnail}
                              alt="Résumé preview"
                              className="about-resume-thumbnail"
                            />
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
                          <img
                            src={linkedinIcon}
                            alt=""
                            className="about-contact-icon"
                          />
                        </div>
                        <p className="about-contact-label">
                          Message me on LinkedIn
                        </p>
                      </a>
                      <a
                        href="mailto:clement.roze@gmail.com"
                        className="about-contact-link"
                        target="_blank"
                      >
                        <div className="about-contact-card">
                          <img
                            src={emailIcon}
                            alt=""
                            className="about-contact-icon"
                          />
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

      <Footer />
    </div>
  );
}
