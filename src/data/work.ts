import projectFrog from "../assets/project-frog.png";
import projectMicrosoft from "../assets/project-microsoft.png";
import projectReplit from "../assets/project-replit.png";

export type WorkItem = {
  slug: string;
  number: string;
  name: string;
  role: string;
  subtitle: string;
  accent: string;
  imageSrc: string; // hero image for homepage EffectB
  images: number[]; // column heights for Work page grid
  imageUrls: string[]; // actual image URLs/imports for Work page grid (parallel to images)
  href: string;
};

const work: WorkItem[] = [
  {
    slug: "google",
    number: "01/",
    name: "Google",
    role: "DCC collaboration",
    subtitle: "Engaging college-age users with Google products",
    accent: "#1d68fe",
    imageSrc: projectFrog,
    images: [332, 332, 332],
    imageUrls: [
      '/work-images/google-1.png',
      '/work-images/google-2.png',
      '/work-images/google-3.png',
    ],
    href: "/work/google",
  },
  {
    slug: "microsoft",
    number: "02/",
    name: "Microsoft",
    role: "DCC collaboration",
    subtitle: "Copilot-powered B2B sales tools",
    accent: "#00a651",
    imageSrc: projectMicrosoft,
    images: [420, 332, 420],
    imageUrls: [
      '/work-images/microsoft-1.png',
      '/work-images/microsoft-2.png',
      '/work-images/microsoft-3.png',
    ],
    href: "/work/microsoft",
  },
  {
    slug: "frog",
    number: "03/",
    name: "frog",
    role: "Internship",
    subtitle: "Product strategy & interaction design",
    accent: "#ad00e6",
    imageSrc: projectFrog,
    images: [490, 490, 490],
    imageUrls: [
      '/work-images/frog-1.png',
      '/work-images/frog-2.png',
      '/work-images/frog-3.png',
    ],
    href: "/work/frog",
  },
  {
    slug: "gcai",
    number: "04/",
    name: "General Counsel AI",
    role: "Internship",
    subtitle: "End-to-end AI-powered legal research platform",
    accent: "#003047",
    imageSrc: projectReplit,
    images: [241, 241, 241],
    imageUrls: [
      '/work-images/gcai-1.png',
      '/work-images/gcai-2.png',
      '/work-images/gcai-3.png',
    ],
    href: "/work/gcai",
  },
];

export default work;
