import React, { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import AccordionRow from "../components/AccordionRow";
import { Reveal } from "../lib/reveal";
import profilePhoto from "../assets/pfp.png";
import { workExperience, freelancing, collaborations, activities, infoParagraphs } from "../data/about";

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
  const [openCompany, setOpenCompany] = useState<string | null>(null);

  useEffect(() => {
    const company = sessionStorage.getItem('about_open');
    const scrollY = sessionStorage.getItem('about_scroll');
    if (company) {
      sessionStorage.removeItem('about_open');
      sessionStorage.removeItem('about_scroll');
      setOpenCompany(company);
      if (scrollY) {
        // defer scroll until after render + layout
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({ top: parseInt(scrollY, 10), behavior: 'instant' });
          });
        });
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
                    <Reveal key={item.company} delay={i * 60}>
                      <AccordionRow {...item} defaultOpen={openCompany === item.company} />
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
                    <Reveal key={item.company} delay={i * 60}>
                      <AccordionRow {...item} defaultOpen={openCompany === item.company} />
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
                    <Reveal key={item.company} delay={i * 60}>
                      <AccordionRow {...item} defaultOpen={openCompany === item.company} />
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
                    <Reveal key={item.company} delay={i * 60}>
                      <AccordionRow {...item} defaultOpen={openCompany === item.company} />
                    </Reveal>
                  ))}
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
