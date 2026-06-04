// Shared structured-data (JSON-LD) helpers for case studies.
//
// Used by BOTH:
//   • the build-time prerender plugin (vite.config.ts), which writes the schema
//     into the initial HTML of each /work/<slug> route so crawlers and AI
//     systems get it without running JS, and
//   • the React page (src/pages/CaseStudy.tsx), which keeps the schema correct
//     across client-side navigation.
// Keeping the logic here means the two can never drift.

// Canonical origin used in structured data, even while served from the v17.*
// staging host (matches the <link rel="canonical"> in index.html).
export const SITE_ORIGIN = "https://clementroze.com";

// Marks every case-study JSON-LD <script> (prerendered or runtime) so the React
// page can find and de-duplicate them.
export const CASE_STUDY_SCHEMA_ATTR = "data-case-study-schema";

// Pull the first 4-digit year out of a registry date string like "2024 - 26",
// "Summer 2025", or "Fall 2025". Returns undefined when none is present, so the
// schema simply omits `datePublished` rather than emitting an invalid value.
export function firstYear(date: string): string | undefined {
  const m = date.match(/\b(?:19|20)\d{2}\b/);
  return m ? m[0] : undefined;
}

export type CaseStudySchemaInput = {
  slug: string;
  title: string;
  description: string;
  /** Image path rooted at the site (e.g. "/images/frog/cs-hero.png"). */
  image: string;
  year?: string;
};

// Build the per-case-study JSON-LD: a CreativeWork describing the project plus a
// BreadcrumbList (Home → Work → project), wrapped in one @graph so a single
// <script> covers both. The author/website point back to the site-wide Person
// and WebSite nodes declared in index.html via their @id.
export function caseStudyJsonLd(opts: CaseStudySchemaInput) {
  const url = `${SITE_ORIGIN}/work/${opts.slug}`;
  const creativeWork: Record<string, unknown> = {
    "@type": "CreativeWork",
    "@id": `${url}#creativework`,
    name: opts.title,
    headline: opts.title,
    url,
    image: `${SITE_ORIGIN}${opts.image}`,
    author: { "@id": `${SITE_ORIGIN}/#person` },
    creator: { "@id": `${SITE_ORIGIN}/#person` },
    isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
    inLanguage: "en",
  };
  if (opts.description) creativeWork.description = opts.description;
  if (opts.year) creativeWork.datePublished = opts.year;

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: "Work", item: `${SITE_ORIGIN}/work` },
      { "@type": "ListItem", position: 3, name: opts.title, item: url },
    ],
  };

  return { "@context": "https://schema.org", "@graph": [creativeWork, breadcrumb] };
}

// Serialize the JSON-LD as a full <script> tag string for prerendering into the
// initial HTML. `<` is escaped to `\u003c` so the JSON can never prematurely
// close the surrounding <script> element.
export function caseStudyJsonLdScript(opts: CaseStudySchemaInput): string {
  const json = JSON.stringify(caseStudyJsonLd(opts)).replace(/</g, "\\u003c");
  return `<script type="application/ld+json" ${CASE_STUDY_SCHEMA_ATTR}="${opts.slug}">${json}</script>`;
}
