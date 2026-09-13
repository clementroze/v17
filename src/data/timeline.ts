export type TimelineEvent = {
  month: string;
  year: string;
  description: string;
  image: string;
  href?: string;
  aboutSlug?: string;
};

const image = (name: string) => `/images/timeline/${name}.png`;

export const timeline: TimelineEvent[] = [
  {
    month: "Oct",
    year: "2006",
    image: image("nyc"),
    description: "I was born in New York City.",
  },
  {
    month: "Sep",
    year: "2020",
    image: image("first"),
    href: "https://nonsense-clementroze.replit.app/",
    description: "Wrote my first line of HTML & CSS and published my first website.",
  },
  {
    month: "Jun",
    year: "2021",
    image: image("slides"),
    description: "Designed my first “website” in Google Slides.",
  },
  {
    month: "Feb",
    year: "2022",
    image: image("oss"),
    href: "/about",
    aboutSlug: "oss",
    description: "My first website design freelancing gig at OSS Capital, which led to many others.",
  },
  {
    month: "Mar",
    year: "2022",
    image: image("iwater"),
    href: "https://iwater.clementroze.com",
    description: "Designed and built iWater.",
  },
  {
    month: "May",
    year: "2022",
    image: image("replit"),
    href: "/work/replit",
    description: "Youngest Design Intern at Replit. Shipped hundreds of polish PRs and contributed to landing pages.",
  },
  {
    month: "May",
    year: "2024",
    image: image("gcai"),
    href: "/work/gcai",
    description: "Joined General Counsel AI as Founding Designer.",
  },
  {
    month: "Aug",
    year: "2024",
    image: image("cornell"),
    description: "Started studying Information Science at Cornell University.",
  },
  {
    month: "Sep",
    year: "2024",
    image: image("dcc"),
    href: "https://designconsultingcornell.com/",
    aboutSlug: "dcc",
    description: "Joined Design Consulting at Cornell, where I found my design community.",
  },
  {
    month: "Jan",
    year: "2025",
    image: image("microsoft"),
    href: "/work/microsoft",
    description: "Collaborated with Microsoft through DCC.",
  },
  {
    month: "May",
    year: "2025",
    image: image("frog"),
    href: "/work/frog",
    description: "A summer in Paris interning at frog.",
  },
  {
    month: "Aug",
    year: "2025",
    image: image("google"),
    href: "/work/google",
    description: "Collaborated with Google through DCC.",
  },
  {
    month: "Sep",
    year: "2025",
    image: image("teach"),
    href: "/about",
    aboutSlug: "dcc",
    description: "Got into teaching, becoming a new member educator for DCC and a Teacher Assistant for INFO 1300.",
  },
  {
    month: "Apr",
    year: "2026",
    image: image("archive"),
    href: "https://archive.clementroze.com",
    description: "Launched archive.clementroze.com with all my personal websites.",
  },
  {
    month: "May",
    year: "2026",
    image: image("ibm"),
    href: "/work/ibm",
    description: "A summer in San Jose interning at IBM.",
  },
];
