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
  images: number[]; // column heights for Work page grid
  imageUrls: string[]; // actual image URLs/imports for Work page grid (parallel to images)
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
    comingSoon: true,
    images: [332, 332, 332],
    imageUrls: [
      "/work-images/ibm-1.png",
      "/work-images/ibm-2.png",
      "/work-images/ibm-3.png",
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
    images: [332, 332, 332],
    imageUrls: [
      "/work-images/google-1.png",
      "/work-images/google-2.png",
      "/work-images/google-3.png",
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
    images: [490, 490, 490],
    imageUrls: [
      "/work-images/frog-1.png",
      "/work-images/frog-2.png",
      "/work-images/frog-3.png",
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
    images: [420, 332, 420],
    imageUrls: [
      "/work-images/microsoft-1.png",
      "/work-images/microsoft-2.png",
      "/work-images/microsoft-3.png",
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
    images: [241, 241, 241],
    imageUrls: [
      "/work-images/gcai-1.png",
      "/work-images/gcai-2.png",
      "/work-images/gcai-3.png",
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
    images: [241, 241, 241],
    imageUrls: [
      "/work-images/replit-1.png",
      "/work-images/replit-2.png",
      "/work-images/replit-3.png",
    ],
    href: "/work/replit",
  },
];

export default work;
