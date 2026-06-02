import { bySlug } from "./data";

// Per-project images follow a public/ slug convention, served straight from
// /public (no bundler import needed — drop a file in public/images/<slug>/):
//   case-study hero → /images/<slug>/cs-hero.png   (resolved in CaseStudy.tsx)
//   homepage hero   → /images/<slug>/home-hero.png (derived as `homeImageSrc` below)

// Case-study markdown, loaded raw at build time (same glob CaseStudy.tsx uses).
// We only read the frontmatter `subtitle:` line from each — see `mdSubtitle`.
const mdFiles = import.meta.glob("../work/*.md", {
  as: "raw",
  eager: true,
}) as Record<string, string>;

// Pull the `subtitle:` value from a slug's .md frontmatter, or null if there's
// no .md file (e.g. ibm, still "coming soon") or no subtitle line.
function mdSubtitle(slug: string): string | null {
  const raw = mdFiles[`../work/${slug}.md`];
  if (!raw) return null;
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const line = fm[1].match(/^subtitle:\s*(.+)$/m);
  return line ? line[1].trim() : null;
}

/**
 * Work-page layout + per-surface copy for a portfolio project. Identity
 * (name, role, accent, textAccentColor, href) comes from the registry in
 * data.ts via `slug`; the fields here are Work/Home-specific. `subtitle` is the
 * short tagline shown on the Work list/grid — it is NOT authored here but
 * pulled from the case-study .md frontmatter (derived in the map below), so the
 * two stay in sync. Entries without a .md fall back to "Coming soon.".
 *
 * `number` (the "01/" label) and `comingSoon` are NOT authored here — they're
 * derived: `number` from list position, `comingSoon` from the registry's
 * `hasCaseStudy` (a project is "coming soon" until its case study exists).
 */
type WorkSource = {
  slug: string;
  /**
   * True when the homepage hero image is light-toned. The homepage section nav
   * uses it to pick a contrasting pill colour over each section: light image →
   * dark pills, dark image → white pills. Defaults to false (dark image).
   */
  heroIsLight?: boolean;
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
  subtitle: string;
  homeImageSrc: string; // resolved (placeholder when not authored)
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
    heroIsLight: false,
    previewSrc: "/images/ibm/preview.png",
    images: [332, 332, 332],
    imageUrls: ["/images/ibm/grid-1.png", "/images/ibm/grid-2.png", "/images/ibm/grid-3.png"],
  },
  {
    slug: "google",
    heroIsLight: true,
    previewSrc: "/images/google/preview.png",
    images: [332, 332, 332],
    imageUrls: ["/images/google/grid-1.png", "/images/google/grid-2.png", "/images/google/grid-3.png"],
  },
  {
    slug: "frog",
    previewSrc: "/images/frog/preview.png",
    images: [332, 332, 332],
    imageUrls: ["/images/frog/grid-1.png", "/images/frog/grid-2.png", "/images/frog/grid-3.png"],
  },
  {
    slug: "microsoft",
    previewSrc: "/images/microsoft/preview.png",
    images: [332, 332, 332],
    imageUrls: ["/images/microsoft/grid-1.png", "/images/microsoft/grid-2.png", "/images/microsoft/grid-3.png"],
  },
  {
    slug: "gcai",
    previewSrc: "/images/gcai/preview.png",
    images: [332, 332, 332],
    imageUrls: ["/images/gcai/grid-1.png", "/images/gcai/grid-2.png", "/images/gcai/grid-3.png"],
    textPosition: 2,
  },
  {
    slug: "replit",
    previewSrc: "/images/replit/preview.png",
    images: [332, 332, 332],
    imageUrls: ["/images/replit/grid-1.png", "/images/replit/grid-2.png", "/images/replit/grid-3.png"],
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
    // Tagline pulled from the case-study .md frontmatter; entries without a
    // .md yet (ibm) fall back to "Coming soon.".
    subtitle: mdSubtitle(s.slug) ?? "",
    // Homepage hero, by slug convention (see comment at top of file).
    homeImageSrc: `/images/${s.slug}/home-hero.png`,
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
