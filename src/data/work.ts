import ibmHero from "../assets/ibm/hero.png";
import googleHero from "../assets/google/hero.png";
import frogHero from "../assets/frog/hero.png";
import microsoftHero from "../assets/microsoft/hero.png";
import gcaiHero from "../assets/gcai/hero.png";
import replitHero from "../assets/replit/hero.png";
import { bySlug } from "./data";

/**
 * Work-page layout + per-surface copy for a portfolio project. Identity
 * (name, role, accent, textAccentColor, href) comes from the registry in
 * data.ts via `slug`; the fields here are Work/Home-specific. `subtitle` is the
 * short tagline shown on the Work list/grid (intentionally different from the
 * case-study .md subtitle).
 *
 * `number` (the "01/" label) and `comingSoon` are NOT authored here — they're
 * derived: `number` from list position, `comingSoon` from the registry's
 * `hasCaseStudy` (a project is "coming soon" until its case study exists).
 */
type WorkSource = {
  slug: string;
  subtitle: string;
  imageSrc: string; // hero image for homepage EffectB and case study hero
  previewSrc?: string; // floating preview image in work list
  images: number[]; // column heights for Work page grid
  imageUrls: string[]; // Work page grid images, served from public/images/{slug}/grid-N.png (parallel to images)
  /**
   * Where the text/CTA column sits among the grid images on the Work page (desktop).
   * 0 = before the first image, 1 = after the first, … N = after the last image.
   * Omit to fall back to the row's default rotating layout. Ignored on mobile,
   * where the text always comes first.
   */
  textPosition?: number;
};

/**
 * A resolved work item: its layout/copy merged with registry identity. Consumers
 * read `name`, `role`, `accent`, `textAccentColor`, `href`, `number`, and
 * `comingSoon` straight off this — they are populated from data.ts / derived,
 * not authored here.
 */
export type WorkItem = WorkSource & {
  name: string;
  role: string;
  accent: string;
  textAccentColor?: { light: string; dark: string };
  href: string;
  number: string;
  comingSoon: boolean;
};

const sources: WorkSource[] = [
  {
    slug: "ibm",
    subtitle: "Coming soon.",
    imageSrc: ibmHero,
    previewSrc: "/images/ibm/preview.png",
    images: [332, 332, 332],
    imageUrls: [
      "/images/ibm/grid-1.png",
      "/images/ibm/grid-2.png",
      "/images/ibm/grid-3.png",
    ],
  },
  {
    slug: "google",
    subtitle: "Engaging college-age users with Google products",
    imageSrc: googleHero,
    previewSrc: "/images/google/preview.png",
    images: [332, 332, 332],
    imageUrls: [
      "/images/google/grid-1.png",
      "/images/google/grid-2.png",
      "/images/google/grid-3.png",
    ],
  },
  {
    slug: "frog",
    subtitle: "Product strategy & interaction design",
    imageSrc: frogHero,
    previewSrc: "/images/frog/preview.png",
    images: [530, 530, 530],
    imageUrls: [
      "/images/frog/grid-1.png",
      "/images/frog/grid-2.png",
      "/images/frog/grid-3.png",
    ],
  },
  {
    slug: "microsoft",
    subtitle: "Copilot-powered B2B sales tools",
    imageSrc: microsoftHero,
    previewSrc: "/images/microsoft/preview.png",
    images: [420, 332, 420],
    imageUrls: [
      "/images/microsoft/grid-1.png",
      "/images/microsoft/grid-2.png",
      "/images/microsoft/grid-3.png",
    ],
  },
  {
    slug: "gcai",
    subtitle: "End-to-end AI-powered legal research platform",
    imageSrc: gcaiHero,
    previewSrc: "/images/gcai/preview.png",
    images: [241, 241, 241],
    imageUrls: [
      "/images/gcai/grid-1.png",
      "/images/gcai/grid-2.png",
      "/images/gcai/grid-3.png",
    ],
    textPosition: 2,
  },
  {
    slug: "replit",
    subtitle: "XXX",
    imageSrc: replitHero,
    previewSrc: "/images/replit/preview.png",
    images: [332, 332, 332],
    imageUrls: [
      "/images/replit/grid-1.png",
      "/images/replit/grid-2.png",
      "/images/replit/grid-3.png",
    ],
    textPosition: 1,
  },
];

// Merge each source with its registry identity (name/role/accent/href) and
// derive the position-based `number` ("01/") and `comingSoon` (true until the
// case study exists). Throws at module load if a slug is missing from data.ts,
// so drift is caught immediately.
const work: WorkItem[] = sources.map((s, i) => {
  const entity = bySlug(s.slug);
  if (!entity) throw new Error(`work.ts: no registry entity for slug "${s.slug}"`);
  return {
    ...s,
    name: entity.name,
    role: entity.role,
    accent: entity.accent,
    textAccentColor: entity.textAccentColor,
    href: entity.href ?? `/work/${s.slug}`,
    number: `${String(i + 1).padStart(2, "0")}/`,
    comingSoon: !entity.hasCaseStudy,
  };
});

export default work;
