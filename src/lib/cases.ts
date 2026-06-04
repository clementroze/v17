import { parseCase, type CaseStudy as CaseStudyData } from "./parseCase";

// Single source of truth for which case studies exist: the markdown files under
// src/work. Shared by the case-study page (to load content) and the router (to
// decide whether a /work/<slug> URL is real, so unknown slugs render a noindex
// not-found instead of being silently indexable). The build reads the same
// directory directly (vite.config.ts) to keep the prerender and sitemap in sync.
const mdFiles = import.meta.glob("../work/*.md", {
  as: "raw",
  eager: true,
}) as Record<string, string>;

export function caseExists(slug: string): boolean {
  return `../work/${slug}.md` in mdFiles;
}

export function loadCase(slug: string): CaseStudyData | null {
  const key = `../work/${slug}.md`;
  if (!(key in mdFiles)) return null;
  return parseCase(mdFiles[key]);
}
