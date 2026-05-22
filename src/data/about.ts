import { AccordionRowProps } from "../components/AccordionRow";

// About-page accordions. Each row references a registry entity by `slug`
// (data.ts) for its color, name, and default link, and supplies only the
// About-specific copy: role, description, and — for entities without a case
// study — an external link + label. The date/period now comes from the registry
// (data.ts), shared with the case study. The four exported arrays encode the
// About page's section grouping and order (an About-only concern).

export const workExperience: AccordionRowProps[] = [
  {
    slug: "ibm",
    description:
      "Incoming Design Intern at IBM's Silicon Valley Lab in San Jose.",
    hasBorderTop: false,
  },
  {
    slug: "frog",
    description: [
      "As a Design Intern at frog, I spent the summer in Paris collaborating with a cross-functional team to build Egypt’s first B2C mobile trading platform for grain.",
      "I mapped out complex trading workflows, partnered with experts, and designed  “wheel-inspired” interface to make market data and transactions accessible for first-time users.",
    ],
  },
  {
    slug: "replit",
    description: [
      "I joined Replit at 15 and loved it so much I stayed for three years, working part-time throughout high school!",

      "I revamped the RUI design system, polished every surface, designed marketing pages, and helped launch the Following Feed, Bounties, and Blog.",
    ],
  },
];

export const freelancing: AccordionRowProps[] = [
  {
    slug: "gcai",
    hasBorderTop: false,
    description: [
      "General Counsel AI, or GC AI is a legal workspace that helps in-house teams with their day-to-day legal tasks.",

      "I joined as the first designer to lead the design and development of the user interface, working closely with the founders to shape multiple iterations of the product.",

      "As the sole designer I also helped out on various tasks, like polishing the landing page and creating conference asses to designing lawyer-themed Slack emojis and custom GC AI mugs!",
    ],
  },
  {
    slug: "monarcha",
    description:
      "Designed and developed Monarcha’s initial marketing website in Figma Sites, helping launch the AI-powered geospatial intelligence platform with a polished early web presence.",
  },
  {
    slug: "deadline",
    description: [
      "Deadline, developed by RECOIL Studios, is a fast-paced, semi-realistic shooter on Roblox featuring one of the platform’s most advanced gun customization systems.",
      "After discovering the game as a player, I noticed the interface felt inconsistent and difficult to navigate. I reached out to the developers with suggestions for improving the UI, which eventually led to a part-time role redesigning every major screen in the game — from the main menu to the in-depth gun editor.",
      "This was my first experience designing for games, and it pushed me to think beyond traditional UI design. I worked on systems and interactions tied to gameplay, including spawn-in flows, attachment texture Scustomization, and end-of-match animations.",
    ],
    caseStudyHref: "https://www.roblox.com/games/12144402492/Deadline",
    caseStudyLabel: "Play on Roblox",
  },
  {
    slug: "roze",
    description:
      "Website audit and design work for a Dubai-based dental clinic ecommerce site.",
  },
  {
    slug: "hyperform",
    description:
      "Concept UI design for a UGC creator payments and invoicing app.",
    caseStudyHref:
      "https://web.archive.org/web/20221116004249/https://www.hyperform.app/",
    caseStudyLabel: "View archived site",
  },
  {
    slug: "oss",
    description:
      "My first freelancing gig! Since then, OSS Capital has changed their website, but I remember how immensely proud I was to have something I designed actually be built out live on the web! This led me to take on more freelance work.",
    caseStudyHref:
      "https://web.archive.org/web/20230317210013/https://oss.capital/",
    caseStudyLabel: "View archived site",
  },
];

export const collaborations: AccordionRowProps[] = [
  {
    slug: "google",
    hasBorderTop: false,
    description: [
      "Through Design Consulting at Cornell, I led an 8-person team to develop a three stages mixed method research program on engaging users with various Google products.",

      "I guided the design, refinement, and testing of conceptual interventions based on findings and stakeholder feedback.",
    ],
  },
  {
    slug: "microsoft",
    description: [
      "Also through DCC, I led a team of 6 consultants during a five-month collaboration with Microsoft.",

      "We analyzed 50 research papers, conducted 90 interviews, and designed two integrated solutions spanning the B2B buyer journey.",
    ],
  },
];

export const activities: AccordionRowProps[] = [
  {
    slug: "dcc",
    description: [
      "I joined DCC, the Ivy League's only student-run design consultancy, in Fall 2024 as a consultant. I first worked with AlgoLink, a startup building an interview hiring platform.",
      [
        "The next semester, I became a Project Manager, leading collaborations with ",
        { label: "Microsoft", href: "/work/microsoft" },
        " on Copilot-powered B2B sales tools and with ",
        { label: "Google", href: "/work/google" },
        " to engage college-age users with Google products.",
      ],
      "As New Member Educator, I taught, mentored, and onboarded two classes of newbies into the club.",
      "Now, as Vice President, I oversee club operations and events while cultivating a vibrant design community.",
    ],
    caseStudyHref: "https://www.designconsultingcornell.com",
    caseStudyLabel: "Learn more about DCC",
    hasBorderTop: false,
  },
  {
    slug: "dti",
    description: [
      "I also joined DTI, Cornell's largest software development project team,  as a freshman on the Design team, while contributing code across multiple projects. I regularly participate in both design critiques and pull request reviews.",
      [
        "On the Internal Tools team, I led the redesign and launch of ",
        {
          label: "our new website",
          href: "https://cornelldti.org/design-system",
        },
        " to better showcase our team and projects. It was rebuilt from the ground up with accessibility, open-source design, and delightful interactions in mind.",
      ],
      [
        "With ",
        { label: "Redi", href: "https://redi.love" },
        ", we created Cornell's first viral dating app!",
      ],
    ],
    caseStudyHref: "https://cornelldti.org",
    caseStudyLabel: "Learn more about DTI",
  },
  {
    slug: "cuxd",
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
    slug: "wvbr",
    description: [
      "Cornell's student-run radio station, operated by the Cornell Media Guild. ",
      [
        "As Web Director, I built and launched the new ",
        {
          label: "Cornell Media Guild website",
          href: "https://cornellmediaguild.org/",
        },
        " celebrating the Guild's 90th anniversary, and the ",
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
