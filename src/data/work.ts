import ibmHero from "../assets/ibm/hero.png";
import googleHero from "../assets/google/hero.png";
import frogHero from "../assets/frog/hero.png";
import microsoftHero from "../assets/microsoft/hero.png";
import gcaiHero from "../assets/gcai/hero.png";
import replitHero from "../assets/replit/hero.png";

export type WorkItem = {
  slug: string;
  number: string;
  name: string;
  role: string;
  subtitle: string;
  accent: string;
  imageSrc: string; // hero image for homepage EffectB and case study hero
  previewSrc?: string; // floating preview image in work list
  images: number[]; // column heights for Work page grid
  imageUrls: string[]; // Work page grid images, served from public/images/{slug}/grid-N.png (parallel to images)
  href: string;
  comingSoon?: boolean;
};

const work: WorkItem[] = [
  {
    slug: "ibm",
    number: "01/",
    name: "IBM",
    role: "Internship",
    subtitle: "Coming soon.",
    accent: "#0f62fe",
    imageSrc: ibmHero,
    previewSrc: "/images/ibm/preview.png",
    comingSoon: true,
    images: [332, 332, 332],
    imageUrls: [
      "/images/ibm/grid-1.png",
      "/images/ibm/grid-2.png",
      "/images/ibm/grid-3.png",
    ],
    href: "/work/ibm",
  },
  {
    slug: "google",
    number: "02/",
    name: "Google",
    role: "DCC collaboration",
    subtitle: "Engaging college-age users with Google products",
    accent: "#F3B80B",
    imageSrc: googleHero,
    previewSrc: "/images/google/preview.png",
    images: [332, 332, 332],
    imageUrls: [
      "/images/google/grid-1.png",
      "/images/google/grid-2.png",
      "/images/google/grid-3.png",
    ],
    href: "/work/google",
  },
  {
    slug: "frog",
    number: "03/",
    name: "frog",
    role: "Internship",
    subtitle: "Product strategy & interaction design",
    accent: "#ad00e6",
    imageSrc: frogHero,
    previewSrc: "/images/frog/preview.png",
    images: [530, 530, 530],
    imageUrls: [
      "/images/frog/grid-1.png",
      "/images/frog/grid-2.png",
      "/images/frog/grid-3.png",
    ],
    href: "/work/frog",
  },
  {
    slug: "microsoft",
    number: "04/",
    name: "Microsoft",
    role: "DCC collaboration",
    subtitle: "Copilot-powered B2B sales tools",
    accent: "#00a651",
    imageSrc: microsoftHero,
    previewSrc: "/images/microsoft/preview.png",
    images: [420, 332, 420],
    imageUrls: [
      "/images/microsoft/grid-1.png",
      "/images/microsoft/grid-2.png",
      "/images/microsoft/grid-3.png",
    ],
    href: "/work/microsoft",
  },
  {
    slug: "gcai",
    number: "05/",
    name: "General Counsel AI",
    role: "Internship",
    subtitle: "End-to-end AI-powered legal research platform",
    accent: "#003047",
    imageSrc: gcaiHero,
    previewSrc: "/images/gcai/preview.png",
    images: [241, 241, 241],
    imageUrls: [
      "/images/gcai/grid-1.png",
      "/images/gcai/grid-2.png",
      "/images/gcai/grid-3.png",
    ],
    href: "/work/gcai",
  },
  {
    slug: "replit",
    number: "06/",
    name: "Replit",
    role: "Internship",
    subtitle: "XXX",
    accent: "#ff3d00",
    imageSrc: replitHero,
    previewSrc: "/images/replit/preview.png",
    images: [332, 332],
    imageUrls: ["/images/replit/grid-1.png", "/images/replit/grid-2.png"],
    href: "/work/replit",
  },
];

export default work;
