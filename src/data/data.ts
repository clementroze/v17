// ── Global entity registry ──────────────────────────────────────────────────
//
// Single source of truth for an entity's *identity*: its slug (join key), its
// canonical display name, and its colors. work.ts (Home/Work) and about.ts
// (About accordions) reference these by slug and supply only their own
// per-surface fields (role, subtitle, description, layout). Case-study content
// lives in src/work/<slug>.md.
//
// What lives HERE (one value, shared across surfaces):
//   slug, name, date, role (+ optional aboutRole override), accent,
//   textAccentColor, href, hasCaseStudy
// What does NOT live here (intentionally per-surface):
//   subtitle / description         → kept on each surface
//   case-study role (longer form)  → kept in MD frontmatter
//   external "view" links + labels → kept inline in about.ts
//   Work layout (images, number…)  → work.ts
//   case-study body                → the .md file
//
// Records are grouped by category purely for readability; the grouping is NOT
// the source of any page's section layout (About keeps its own ordering).

export type Entity = {
  /** Unique join key. For case studies this is also the URL segment (/work/<slug>). */
  slug: string;
  /** Canonical display name. Surfaces may still show a longer/different label. */
  name: string;
  /**
   * The one date/period string, shown identically on every surface (About
   * accordion period + case-study "Year"). Empty string for entities with no
   * meaningful date (the club activities).
   */
  date: string;
  /**
   * Role label shared by the Work list/grid and the About accordion. (The case
   * study page keeps its own longer role in MD frontmatter.) Empty for entities
   * with no role (the club activities).
   */
  role: string;
  /**
   * Optional About-only role override, when About should show a different label
   * than Work (e.g. gcai is "Freelancing" on Work but "Designer & Developer" on
   * About). Falls back to `role` when omitted.
   */
  aboutRole?: string;
  /** The one accent color (replaces the old work.accent + about.dotColor split). */
  accent: string;
  /**
   * Per-theme color for inline text links. Defaults to `accent` for both
   * variants when omitted (consumers fall back). About is dark → uses `dark`;
   * the case study page is light → uses `light`.
   */
  textAccentColor?: { light: string; dark: string };
  /** Canonical link. "/work/<slug>" for case studies; omitted for route-less entities. */
  href?: string;
  /** True when an MD file + /work/<slug> route exists. */
  hasCaseStudy: boolean;
};

export const internships: Entity[] = [
  {
    slug: "ibm",
    name: "IBM",
    date: "2026 – Now",
    role: "Internship",
    accent: "#226AFE",
    href: "/work/ibm",
    hasCaseStudy: false,
  },
  {
    slug: "frog",
    name: "frog",
    date: "Summer 2025",
    role: "Internship",
    accent: "#ad00e6",
    href: "/work/frog",
    hasCaseStudy: true,
  },
  {
    slug: "replit",
    name: "Replit",
    date: "2022 – 24",
    role: "Internship",
    accent: "#ff3d00",
    href: "/work/replit",
    hasCaseStudy: true,
  },
];

export const freelance: Entity[] = [
  {
    slug: "gcai",
    name: "General Counsel AI",
    date: "2024 – 26",
    role: "Freelancing",
    aboutRole: "Designer & Developer",
    accent: "#003047",
    href: "/work/gcai",
    hasCaseStudy: true,
  },
  {
    slug: "monarcha",
    name: "Monarcha",
    date: "2025",
    role: "Web Designer",
    accent: "#da8535",
    hasCaseStudy: false,
  },
  {
    slug: "deadline",
    name: "Deadline",
    date: "2024 - 26",
    role: "UI & Game Designer",
    accent: "#C0120D",
    hasCaseStudy: false,
  },
  {
    slug: "roze",
    name: "ROZE Clinics",
    date: "2024",
    role: "Web Designer",
    accent: "#F3EDE9",
    hasCaseStudy: false,
  },
  {
    slug: "hyperform",
    name: "Hyperform",
    date: "2022 - 24",
    role: "Multidiscplinary Designer",
    accent: "#62FA20",
    hasCaseStudy: false,
  },
  {
    slug: "oss",
    name: "OSS Capital",
    date: "2022",
    role: "Web Designer",
    accent: "#ee6a0c",
    hasCaseStudy: false,
  },
];

export const collaborations: Entity[] = [
  {
    slug: "google",
    name: "Google",
    date: "Fall 2025",
    role: "Student project",
    accent: "#F3B80B",
    href: "/work/google",
    hasCaseStudy: true,
  },
  {
    slug: "microsoft",
    name: "Microsoft",
    date: "Spring 2024",
    role: "Student project",
    accent: "#00a651",
    href: "/work/microsoft",
    hasCaseStudy: true,
  },
];

export const activities: Entity[] = [
  {
    slug: "dcc",
    name: "Design Consulting at Cornell",
    date: "",
    role: "",
    accent: "#FE5FB7",
    hasCaseStudy: false,
  },
  {
    slug: "dti",
    name: "Cornell Digital Tech & Innovation",
    date: "",
    role: "",
    accent: "#FF575F",
    hasCaseStudy: false,
  },
  {
    slug: "cuxd",
    name: "Cornell User Experience Design",
    date: "",
    role: "",
    accent: "#5DA8A5",
    hasCaseStudy: false,
  },
  {
    slug: "wvbr",
    name: "WVBR 93.5 FM",
    date: "",
    role: "",
    accent: "#BD4A49",
    hasCaseStudy: false,
  },
];

const entities: Entity[] = [
  ...internships,
  ...freelance,
  ...collaborations,
  ...activities,
];

export default entities;

const entityIndex = new Map(entities.map((e) => [e.slug, e]));

/** Look up an entity by slug. */
export const bySlug = (slug: string): Entity | undefined =>
  entityIndex.get(slug);

/** The role label to show on the About accordion (override falls back to role). */
export const aboutRole = (e: Entity): string => e.aboutRole ?? e.role;

/** The dark-mode link/dot color for an entity (About). Falls back to its accent. */
export const darkAccent = (e: Entity): string =>
  e.textAccentColor?.dark ?? e.accent;

/** The light-mode link color for an entity (case study page). Falls back to its accent. */
export const lightAccent = (e: Entity): string =>
  e.textAccentColor?.light ?? e.accent;
