import { AccordionRowProps } from "../components/AccordionRow";

export const workExperience: AccordionRowProps[] = [
  {
    dotColor: "#1d68fe",
    company: "IBM",
    role: "Design Internship",
    period: "2026 – Now",
    description:
      "Incoming Design Intern at IBM's Silicon Valley Lab in San Jose.",
    hasBorderTop: false,
  },
  {
    dotColor: "#ad00e6",
    company: "frog",
    role: "Design Internship",
    period: "Summer 2025",
    description: [
      "As a Design Intern at frog, I spent the summer in Paris collaborating with a cross-functional team to build Egypt’s first B2C mobile trading platform for grain.",
      "I mapped out complex trading workflows, partnered with experts, and designed  “wheel-inspired” interface to make market data and transactions accessible for first-time users.",
    ],
    caseStudyHref: "/work/frog",
  },
  {
    dotColor: "#ff3d00",
    company: "Replit",
    role: "Design Internship",
    period: "2022 – 24",
    description: [
      "I joined Replit at 15 and loved it so much I stayed for three years, working part-time throughout high school!",

      "I revamped the RUI design system, polished every surface, designed marketing pages, and helped launch the Following Feed, Bounties, and Blog.",
    ],
  },
];

export const freelancing: AccordionRowProps[] = [
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

export const collaborations: AccordionRowProps[] = [
  {
    dotColor: "#F3B80B",
    company: "Google",
    role: "Student Project",
    period: "Fall 2025",
    hasBorderTop: false,
    description: [
      "Through Design Consulting at Cornell, I led an 8-person team to develop a three stages mixed method research program on engaging users with various Google products.",

      "I guided the design, refinement, and testing of conceptual interventions based on findings and stakeholder feedback.",
    ],
    caseStudyHref: "/work/google",
  },
  {
    dotColor: "#00a651",
    company: "Microsoft",
    role: "Student Project",
    period: "Spring 2024",
    description: [
      "Also through DCC, I led a team of 6 consultants during a five-month collaboration with Microsoft.",

      "We analyzed 50 research papers, conducted 90 interviews, and designed two integrated solutions spanning the B2B buyer journey.",
    ],
    caseStudyHref: "/work/microsoft",
  },
];

export const activities: AccordionRowProps[] = [
  {
    dotColor: "#FE5FB7",
    company: "Design Consulting at Cornell",
    role: "",
    period: "",
    description: [
      "I joined DCC, the Ivy League's only student-run design consultancy, in Fall 2024 as a freshman consultant. I first worked with AlgoLink, a startup building an interview hiring platform.",
      "The next semester, I became a Project Manager, leading collaborations with Microsoft on Copilot-powered B2B sales tools and with Google to engage college-age users with Google products.",
      "As New Member Educator, I taught, mentored, and onboarded two classes of newbies into the club.",
      "Now, as Vice President, I oversee club operations and events while cultivating a vibrant design community.",
      [
        {
          label: "Learn more about DCC here",
          href: "https://www.designconsultingcornell.com",
        },
      ],
    ],
    hasBorderTop: false,
  },
  {
    dotColor: "#FF575F",
    company: "Cornell Digital Tech & Innovation",
    role: "",
    period: "",
    description: [
      "I also joined DTI, Cornell's largest software development project team,  in Fall 2024 as part of the Design team, while also contributing code across DTI projects. I regularly participate in both design critiques and pull request reviews.",
      "On the Internal Tools team, I led the redesign and launch of our new website to better showcase our team and projects. It was rebuilt from the ground up with accessibility, open-source design, and delightful interactions in mind.",
      [{ label: "Learn more about DTI here", href: "https://cornelldti.org" }],
    ],
  },
  {
    dotColor: "#5DA8A5",
    company: "Cornell User Experience Design",
    role: "",
    period: "",
    description: [
      "Cornell's community for UX designers to connect, learn, and grow together.",
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
      "Cornell's student-run radio station, operated by the Cornell Media Guild. As Web Director, I built and launched a new website celebrating the Guild's 90th anniversary.",
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
        " site for the Guild's record label.",
      ],
    ],
  },
];

export const infoParagraphs = [
  "Born in New York, raised in London, and shaped by French and Singaporean roots, I've always lived at the crossroads. That lens of contrast and connection deeply informs how I design: layered, contextual, and grounded in multiple perspectives.",
  "I believe great design should be both accessible and beautiful. Whether I'm fine-tuning a Figma component, obsessing over a CSS pseudo-element, or diving into ARIA specs, I care about the little things that make interfaces feel just right.",
  "When I'm not up at 4 a.m. nudging pixels into place, you might find me playing piano or ping pong (though not at the same time). I'm also an avid reader – from daily news to science fiction, I love staying curious about the world!",
];
