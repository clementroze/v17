import React from "react";
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
    description: "Design Intern at IBM's Silicon Valley Lab in San Jose.",
    hasBorderTop: false,
  },
  {
    slug: "frog",
    description: [
      "As a Design Intern at frog, I spent the summer in Paris collaborating with a cross-functional team to build Egypt’s first B2C mobile trading platform for grain.",
      "I mapped out complex trading workflows, partnered with experts, and designed  a “wheel-inspired” interface to make market data and transactions accessible for first-time users.",
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

      "As the sole designer I also helped out on various tasks, like polishing the landing page and creating conference assets to designing lawyer-themed Slack emojis and custom GC AI mugs!",
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
      "This was my first experience designing for games, and it pushed me to think beyond traditional UI design. I worked on systems and interactions tied to gameplay, including spawn-in flows, attachment texture customization, and end-of-match animations.",
    ],
    caseStudyHref: "https://www.roblox.com/games/12144402492/Deadline",
    caseStudyLabel: "Play on Roblox",
  },
  {
    slug: "roze",
    description: "Website audit and design work for a Dubai-based dental clinic ecommerce site.",
  },
  {
    slug: "hyperform",
    description: "Concept UI design for a UGC creator payments and invoicing app.",
    caseStudyHref: "https://web.archive.org/web/20221116004249/https://www.hyperform.app/",
    caseStudyLabel: "View archived site",
  },
  {
    slug: "oss",
    description:
      "My first freelancing gig! Since then, OSS Capital has changed their website, but I remember how immensely proud I was to have something I designed actually be built out live on the web! This led me to take on more freelance work.",
    caseStudyHref: "https://web.archive.org/web/20230317210013/https://oss.capital/",
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
      "I joined DCC, the Ivy League's only student-run design consultancy, in Fall 2024 as a consultant. I first worked with Evallos (fka. AlgoLink), a startup building an interview hiring platform.",
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
          href: "https://cornelldti.org/",
        },
        " to better showcase our team and projects. It was rebuilt from the ground up with accessibility, ",
        { label: "open-source design", href: "https://cornelldti.org/design-system" },
        ", and delightful interactions in mind.",
      ],
      [
        "And with ",
        { label: "Redi", href: "https://redi.love" },
        ", we created Cornell's first viral dating app! I helped design and build the app in React Native.",
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
  "Born in New York, raised in London, and shaped by French and Singaporean roots, I've always lived at the crossroads. That lens of contrast and connection deeply informs how I design: layered and grounded in multiple perspectives.",
  "I believe great design should be both accessible and beautiful. Whether I'm fine-tuning a Figma component, obsessing over a CSS pseudo-element, or diving into ARIA specs, I care about the little things that make interfaces feel just right.",
  "When I'm not up at 3 a.m. nudging pixels into place, I'm usually on a side quest – a new sport every semester, taking part in a random research study, or hours deep into some obscure internet lore.",
];

// ─── bio modal sections ───────────────────────────────────────────────────────
// Content for the "More about me" bio modal (rendered by <BioModal>). Each
// section pairs scrolling text with a floating image stage; `layout` controls
// how that section's images are arranged. Each image displays at its own natural
// aspect ratio — size/crop the source files to control their shape.
export type BioLayout = "solo" | "stack" | "scatter" | "pair";
export type BioImage = {
  src: string;
  // Screen-reader description. Rendered after each section's text (see BioModal)
  // so AT reads "section text → its image". The visual stage/carousel is a
  // decorative duplicate and stays aria-hidden.
  alt: string;
  // scatter-only placement (ignored by the other layouts)
  top?: string;
  left?: string;
  rotate?: string;
  // Optional per-image width override (e.g. "80%" or "320px"). Overrides the
  // layout's default figure width (stack = 62%, scatter = 34%) for this one
  // image only. The image still renders at its own aspect ratio.
  width?: string;
  // Optional per-image aspect-ratio override (e.g. "4/3", "1", "16/9"). Forces
  // the figure to that ratio so its height is deterministic instead of the
  // image's intrinsic proportions (which can overflow + get clipped by the
  // stage). The image fills the frame via `object-fit: cover` (cropping the
  // overflowing edges).
  aspectRatio?: string;
};
export type BioSection = {
  id: string;
  heading: string;
  layout: BioLayout;
  images: BioImage[];
  // On mobile the carousel shows individual images; set this to replace the
  // whole section's images with one composite slide instead.
  mobileImage?: string;
  content: React.ReactNode;
};

// Built as a factory so the "design clubs" inline link can call back into the
// About page (it opens the DCC + DTI accordions and scrolls to Activities —
// state the page owns, not the modal).
export function getBioSections(onOpenDesignClubs: () => void): BioSection[] {
  return [
    {
      id: "origin",
      heading: "Where am I from?",
      layout: "scatter",
      mobileImage: "/images/bio/all-flags.png",
      images: [
        {
          src: "/images/bio/us.png",
          alt: "American flag",
          top: "25%",
          left: "5%",
          rotate: "-7deg",
        },
        {
          src: "/images/bio/fr.png",
          alt: "French flag",
          top: "15%",
          left: "50%",
          rotate: "6deg",
        },
        {
          src: "/images/bio/sg.png",
          alt: "Singaporean flag",
          top: "55%",
          left: "15%",
          rotate: "-4deg",
        },
        {
          src: "/images/bio/uk.png",
          alt: "British flag",
          top: "40%",
          left: "57%",
          rotate: "8deg",
        },
      ],
      content: (
        <>
          <p>I was born in New York City and raised in London.</p>

          <p>My mom is from Singapore and my dad from France.</p>

          <p>
            Between family, school, and travel, I was constantly switching between cultures, languages, accents, and
            foods of course. It's influenced the way I see the world and approach design by opening me up to different
            perspectives of doing things.
          </p>
        </>
      ),
    },
    {
      id: "journey",
      heading: "How did I get here?",
      layout: "stack",
      images: [
        { src: "/images/bio/python.png", alt: "My first Python program", rotate: "-2deg" },
        { src: "/images/bio/html.png", alt: "My first HTML website", rotate: "1.5deg" },
      ],
      content: (
        <>
          <p>
            My journey started in 7th grade, when we were learning Python as part of a CS class. I always found it
            fascinating how typing a few commands would lead to outputs on the black terminal screen. The following
            year, we did a module on HTML/CSS/JS and that felt like an even bigger leap! Instead of just white text on
            the black terminal screen, you could create shapes, colors, images, and more! I enjoyed it so much that I
            started exploring web design more deeply, which eventually led me to discover the world of UI/UX design.
          </p>
          <p>
            Since then, design has been my main focus, but I've always kept the technical side close. Being able to
            actually build what I design feels like a superpower that closes the gap between an idea and a finished
            product.
          </p>
          <p>
            That mindset led me to my first professional experience: interning at Replit at 15 years old. I spent three
            years there, working during the summers and part-time throughout high school, and those years shaped me
            immensely. They deepened my technical knowledge and I consider many of my design opinions to have been
            formed at Replit.
          </p>
          <p>
            I still remember the first time I shipped code to production. It was a one-line change: adding an icon to a
            button component. Tiny in scope, but incredibly meaningful to me. Seeing something I had contributed become
            part of a real product—and being able to point to that specific change—was just so rewarding!
          </p>
        </>
      ),
    },
    {
      id: "corner",
      heading: "Design is broad. What's my corner of it?",
      layout: "stack",
      images: [
        { src: "/images/bio/a11y.png", alt: "An example of my Figma file", aspectRatio: "1/1", rotate: "1deg" },
        { src: "/images/bio/details.png", alt: "Detailed UI I like to make", rotate: "-2deg" },
        { src: "/images/bio/system.png", alt: "An example of a design system", rotate: "1.5deg" },
      ],
      content: (
        <>
          <p>
            I've always been drawn to the visual and systemic side of things. I love making interfaces that feel
            polished and intentional, but I also enjoy the underlying structure that makes them consistent and scalable.
          </p>
          <p>
            I'm most at home with things like high-fidelity mockups, design systems, and accessibility. Getting the
            details right (eg: color tokens, type scales, spacing systems, interaction states) is genuinely satisfying
            to me because those small decisions compound. Most users won't consciously notice them, but together they're
            what make an interface feel intuitive and polished.
          </p>
          <p>
            Recently, I've also gained an interest in the orchestration side: pulling together user and business needs,
            design constraints, engineering resources, and edge cases into something coherent.
          </p>
        </>
      ),
    },
    {
      id: "takes",
      heading: "Takes",
      layout: "scatter",
      images: [
        {
          src: "/images/bio/radius.png",
          alt: "A red cross next to a round button, a green checkmark next to a less round button",
          top: "-4%",
          left: "6%",
          rotate: "-6deg",
        },
        {
          src: "/images/bio/respond.png",
          alt: "iMessage conversation showing how fast I respond",
          top: "0%",
          left: "56%",
          rotate: "5deg",
        },
        {
          src: "/images/bio/poppins.png",
          alt: "Poppins, the worst font ever",
          top: "30%",
          left: "28%",
          rotate: "-3deg",
        },
        {
          src: "/images/bio/shortcuts.png",
          alt: "Shift A, Cmd C/V, Spotlight, Tab, and Option keys",
          top: "65%",
          left: "0%",
          rotate: "7deg",
        },
        {
          src: "/images/bio/browsers.png",
          alt: "Safari, Chrome, Firefox, Dia, and Edge browsers",
          top: "58%",
          left: "60%",
          rotate: "-8deg",
        },
      ],
      content: (
        <>
          <p>A few of my strong convictions, loosely held:</p>
          <ul>
            <li>The Poppins font is an abomination</li>
            <li>Helvetica is king</li>
            <li>Designers should code and ship to production (at least once)</li>
            <li>Keyboard shortcuts are the ultimate productivity hack</li>
            <li>
              Every app needs a "Remind me in X hours" button (like the{" "}
              <a href="https://slack.com/help/articles/208423427-Set-a-reminder" target="_blank">
                Slack feature
              </a>
              )
            </li>
            <li>School should teach how to type fast</li>
            <li>A 2 hour lunch break is sacred</li>
            <li>Your personal site is your hardest client</li>
            <li>High agency is the most underrated work attribute; do what you say you'll do, and do it well</li>
            <li>Honest feedback is a gift, but most people are too scared to give it</li>
            <li>Less border radius is better</li>
            <li>Naming things in a design system is 40% of the work</li>
            <li>People should respond to messages faster</li>
            <li>You should switch browsers every couple of months because variety is the spice of life</li>
            <li>Most importantly: never trust a bulleted list of hot takes!</li>
          </ul>
        </>
      ),
    },
    {
      id: "grass",
      heading: "Touching grass",
      layout: "scatter",
      images: [
        { src: "/images/bio/tennis.png", alt: "Playing tennis with friends", top: "-2%", left: "9%", rotate: "-9deg" },
        { src: "/images/bio/climb.png", alt: "Belaying at the climbing wall", top: "3%", left: "61%", rotate: "4deg" },
        {
          src: "/images/bio/gym.png",
          alt: "On the pec fly machine at the gym",
          top: "23%",
          left: "22%",
          rotate: "-6deg",
        },
        {
          src: "/images/bio/rappel.png",
          alt: "Rappelling off of Schoellkopf Stadium",
          top: "62%",
          left: "4%",
          rotate: "11deg",
        },
        { src: "/images/bio/cpr.png", alt: "Practicing CPR on a dummy", top: "65%", left: "57%", rotate: "-5deg" },
      ],
      content: (
        <>
          <p>
            I've made it a goal to try out at least 1 new sport every semester at Cornell! So far: ping pong, fencing,
            bowling, rock-climbing, wilderness first aid training, tennis.{" "}
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
      id: "cooking",
      heading: "Cooking",
      layout: "scatter",
      images: [
        { src: "/images/bio/crepes.png", alt: "Homemade crepes", top: "-4%", left: "8%", rotate: "-7deg" },
        { src: "/images/bio/chicken-rice.png", alt: "Chicken rice bowl", top: "2%", left: "55%", rotate: "5deg" },
        { src: "/images/bio/curry.png", alt: "A pan of curry", top: "28%", left: "24%", rotate: "-3deg" },
        {
          src: "/images/bio/grilled-cheese.png",
          alt: "Grilled cheese sandwich",
          top: "60%",
          left: "5%",
          rotate: "9deg",
        },
        { src: "/images/bio/beef-bowl.png", alt: "Beef bowl", top: "63%", left: "58%", rotate: "-6deg" },
      ],
      content: (
        <>
          <p>
            I cook! Simple stuff mostly and nothing too elaborate, but enough to feel like a functioning adult. Small
            things like chicken, rice bowls, grilled cheese, stir-fry vegetables...
          </p>
        </>
      ),
    },
    {
      id: "shows",
      heading: "Shows",
      layout: "scatter",
      images: [
        {
          src: "/images/bio/backrooms.png",
          alt: "Backrooms movie poster",
          top: "20%",
          left: "-4%",
          rotate: "-3deg",
        },
        {
          src: "/images/bio/pluribus.png",
          alt: "Pluribus show poster",
          top: "55%",
          left: "22%",
          rotate: "-2deg",
        },
        {
          src: "/images/bio/silo.png",
          alt: "Silo show poster",
          top: "35%",
          left: "70%",
          rotate: "2deg",
        },
        {
          src: "/images/bio/severance.png",
          alt: "Severance show poster",
          top: "10%",
          left: "45%",
          rotate: "3deg",
        },
      ],
      content: (
        <>
          <p>
            I've started watching a lot more television lately, both series and films, and I've found myself drawn to a
            very specific kind of storytelling.
          </p>
          <p>
            My favorite genre sits somewhere between psychological thriller and surreal horror. Think <em>Severance</em>
            , <em>Backrooms</em>, or anything that weaponizes the mundane against you. The more unsettling, the better!
          </p>
        </>
      ),
    },
    {
      id: "community",
      heading: "Community",
      layout: "stack",
      images: [
        { src: "/images/bio/present.png", alt: "Presenting a new website at DTI, a club at Cornell", rotate: "-1deg" },
        { src: "/images/bio/collab.png", alt: "Collaborating with teammates on a whiteboard", rotate: "3deg" },
        { src: "/images/bio/nme.png", alt: "Welcoming the new members at DCC, a club at Cornell", rotate: "-2.5deg" },
      ],
      content: (
        <>
          <p>
            Giving back matters a lot to me. I've found real joy in teaching — whether that's TAing{" "}
            <a href="https://classes.cornell.edu/browse/roster/FA26/class/INFO/1300" target="_blank">
              an intro web design course at Bowers
            </a>{" "}
            or mentoring students through my{" "}
            <button type="button" className="bio-modal__inline-link" onClick={onOpenDesignClubs}>
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
}
