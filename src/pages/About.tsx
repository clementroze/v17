import React, { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import AccordionRow, { AccordionRowProps } from "../components/AccordionRow";
import { Reveal } from "../lib/reveal";
import profilePhoto from "../assets/pfp.png";

// ─── data ─────────────────────────────────────────────────────────────────────

const workExperience: AccordionRowProps[] = [
  {
    dotColor: "#1d68fe",
    company: "IBM",
    role: "Design Internship",
    period: "2026 – Now",
    description:
      "Leading design for enterprise AI products, working across research, prototyping, and design systems.",
    hasBorderTop: false,
  },
  {
    dotColor: "#ad00e6",
    company: "frog",
    role: "Design Internship",
    period: "Summer 2025",
    description: "Worked with cross-functional teams on product strategy and interaction design for Fortune 500 clients.",
    caseStudyHref: "/work/frog",
  },
  {
    dotColor: "#ff3d00",
    company: "Replit",
    role: "Design Internship",
    period: "2022 – 24",
    description:
      "Shaped the core IDE and onboarding experience, collaborating closely with engineering and product.",
  },
];

const freelancing: AccordionRowProps[] = [
  {
    dotColor: "#003047",
    company: "General Counsel AI",
    role: "Designer & Developer",
    period: "2024 – Now",
    hasBorderTop: false,
    description: "xxx.",
    caseStudyHref: "/work/gcai",
  },
  {
    dotColor: "#da8535",
    company: "Monarcha",
    role: "Web Designer",
    period: "2025",
    description: "xxx",
  },
  {
    dotColor: "#C0120D",
    company: "Deadline",
    role: "Game Designer",
    period: "2024 - 26",
    description: "xxx",
  },
  {
    dotColor: "#F3EDE9",
    company: "ROZE Clinics",
    role: "Web Designer",
    period: "2024",
    description: "xxx",
  },
  {
    dotColor: "#62FA20",
    company: "Hyperform",
    role: "Multidiscplinary Designer",
    period: "2022 - 24",
    description: "xxx",
  },
  {
    dotColor: "#ee6a0c",
    company: "OSS Capital",
    role: "Web Designer",
    period: "2022",
    description: "xxx",
  },
];

const collaborations: AccordionRowProps[] = [
  {
    dotColor: "#F3B80B",
    company: "Google",
    role: "Student Project",
    period: "Fall 2025",
    hasBorderTop: false,
    description: "Freelance design and front-end work across multiple early-stage AI startups.",
    caseStudyHref: "/work/google",
  },
  {
    dotColor: "#00a651",
    company: "Microsoft",
    role: "Student Project",
    period: "Spring 2024",
    description: "Freelance design and front-end work across multiple early-stage AI startups.",
    caseStudyHref: "/work/microsoft",
  },
];

const activities: AccordionRowProps[] = [
  {
    dotColor: "#FE5FB7",
    company: "Design Consulting at Cornell",
    role: "",
    period: "",
    description: [
      "I joined DCC, the Ivy League’s only student-run design consultancy, in Fall 2024 as a freshman consultant. I first worked with AlgoLink, a startup building an interview hiring platform.",
      "The next semester, I became a Project Manager, leading collaborations with Microsoft on Copilot-powered B2B sales tools and with Google to engage college-age users with Google products.",
      "As New Member Educator, I taught, mentored, and onboarded two classes of newbies into the club.",
      "Now, as Vice President, I oversee club operations and events while cultivating a vibrant design community.",
    ],
    hasBorderTop: false,
  },
  {
    dotColor: "#FF575F",
    company: "Cornell Digital Tech & Innovation",
    role: "",
    period: "",
    description: [
      "I also joined DTI, Cornell’s largest software development project team,  in Fall 2024 as part of the Design team, while also contributing code across DTI projects. I regularly participate in both design critiques and pull request reviews.",
      "On the Internal Tools team, I led the redesign and launch of our new website to better showcase our team and projects. It was rebuilt from the ground up with accessibility, open-source design, and delightful interactions in mind.",
    ],
  },
  {
    dotColor: "#5DA8A5",
    company: "Cornell User Experience Design",
    role: "",
    period: "",
    description: [
      "Cornell’s community for UX designers to connect, learn, and grow together.",
      [
        "I write ",
        { label: "CU Design", href: "https://cudesign.beehiiv.com/" },
        ", a weekly newsletter with design tips, inspiration, and resources for the Cornell community.",
      ],
    ],
  },
  {
    dotColor: "#BD4A49",
    company: "WVBR 93.5 FM",
    role: "",
    period: "",
    description: [
      "Cornell’s student-run radio station, operated by the Cornell Media Guild. As Web Director, I built and launched a new website celebrating the Guild’s 90th anniversary.",
      [
        "I designed and developed the ",
        {
          label: "Cornell Media Guild website",
          href: "https://cornellmediaguild.org/",
        },
        " and the ",
        {
          label: "Electric Buffalo Records",
          href: "https://www.electricbuffalorecords.com",
        },
        " site for the Guild’s record label.",
      ],
    ],
  },
];

const infoParagraphs = [
  "Born in New York, raised in London, and shaped by French and Singaporean roots, I've always lived at the crossroads. That lens of contrast and connection deeply informs how I design: layered, contextual, and grounded in multiple perspectives.",
  "I believe great design should be both accessible and beautiful. Whether I'm fine-tuning a Figma component, obsessing over a CSS pseudo-element, or diving into ARIA specs, I care about the little things that make interfaces feel just right.",
  "When I'm not up at 4 a.m. nudging pixels into place, you might find me playing piano or ping pong (though not at the same time). I'm also an avid reader – from daily news to science fiction, I love staying curious about the world!",
];

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
