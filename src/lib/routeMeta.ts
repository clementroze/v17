// Single source of truth for per-route <head> metadata (title, description,
// canonical, Open Graph, Twitter, robots noindex).
//
// Consumed by BOTH:
//   • the build-time prerender (src/entry-server.tsx → scripts/prerender.mjs),
//     which serializes each route's tags into its static HTML via headTags(), and
//   • the client (src/main.tsx), which applies them on load and on every
//     client-side navigation via applyMeta().
// Keeping both paths here means a route's prerendered metadata and its runtime
// metadata can never drift.

import { SITE_ORIGIN } from "./caseStudySchema";
import { caseExists, loadCase } from "./cases";
import { bySlug } from "../data/data";

export type PageMeta = {
  title: string;
  description: string;
  /** Absolute canonical URL (also used as og:url). */
  canonical: string;
  ogType: string;
  ogTitle: string;
  ogDescription: string;
  /** Absolute image URL. */
  ogImage: string;
  ogImageWidth?: string;
  ogImageHeight?: string;
  ogImageAlt?: string;
  /** When true, emit <meta name="robots" content="noindex">. */
  noindex?: boolean;
};

const SITE_NAME = "Clément Rozé";
const DEFAULT_DESCRIPTION =
  "Clément Rozé designs and builds web experiences that are accessible, intentional, and beautiful. Selected work, case studies, and craft.";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og.png`;
const DEFAULT_OG_IMAGE_WIDTH = "1538";
const DEFAULT_OG_IMAGE_HEIGHT = "811";
const DEFAULT_OG_IMAGE_ALT = "Clément Rozé — portfolio";

const ABOUT_DESCRIPTION =
  "About Clément Rozé — a designer and developer crafting accessible, intentional, and beautiful web experiences. Background, experience, and the teams and companies behind the work.";
const WORK_DESCRIPTION =
  "Selected work and case studies by Clément Rozé — product design and engineering for frog, Replit, Google, Microsoft, General Counsel AI, and more.";
const CRAFT_DESCRIPTION =
  "Craft by Clément Rozé — a collection of visual and interaction design explorations, experiments, and details.";

function normalize(path: string): string {
  return path === "/" ? "/" : path.replace(/\/+$/, "");
}

function home(): PageMeta {
  return {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    canonical: `${SITE_ORIGIN}/`,
    ogType: "website",
    ogTitle: SITE_NAME,
    ogDescription: DEFAULT_DESCRIPTION,
    ogImage: DEFAULT_OG_IMAGE,
    ogImageWidth: DEFAULT_OG_IMAGE_WIDTH,
    ogImageHeight: DEFAULT_OG_IMAGE_HEIGHT,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
  };
}

function section(label: string, slugPath: string, description: string): PageMeta {
  const title = `${SITE_NAME} • ${label}`;
  return {
    title,
    description,
    canonical: `${SITE_ORIGIN}${slugPath}`,
    ogType: "website",
    ogTitle: title,
    ogDescription: description,
    ogImage: DEFAULT_OG_IMAGE,
    ogImageWidth: DEFAULT_OG_IMAGE_WIDTH,
    ogImageHeight: DEFAULT_OG_IMAGE_HEIGHT,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
  };
}

function caseStudy(slug: string): PageMeta {
  const data = loadCase(slug);
  const name = bySlug(slug)?.name ?? data?.meta.title ?? slug;
  const title = `${SITE_NAME} • ${name}`;
  const description = data?.meta.subtitle?.trim() || DEFAULT_DESCRIPTION;
  return {
    title,
    description,
    canonical: `${SITE_ORIGIN}/work/${slug}`,
    ogType: "article",
    ogTitle: title,
    ogDescription: description,
    // The case study's cover image makes a far more relevant social card than the
    // generic site image. Dimensions are omitted because they vary per project.
    ogImage: `${SITE_ORIGIN}/images/${slug}/cover.png`,
    ogImageAlt: `${name} — case study by Clément Rozé`,
  };
}

function notFound(path: string): PageMeta {
  const title = `${SITE_NAME} • Not found`;
  return {
    title,
    description: DEFAULT_DESCRIPTION,
    canonical: `${SITE_ORIGIN}${path}`,
    ogType: "website",
    ogTitle: title,
    ogDescription: DEFAULT_DESCRIPTION,
    ogImage: DEFAULT_OG_IMAGE,
    noindex: true,
  };
}

/** Resolve the metadata for a route path. Never throws. */
export function resolveRouteMeta(rawPath: string): PageMeta {
  const path = normalize(rawPath);
  if (path === "/") return home();
  if (path === "/about") return section("About", "/about", ABOUT_DESCRIPTION);
  if (path === "/work") return section("Work", "/work", WORK_DESCRIPTION);
  if (path === "/craft") return section("Craft", "/craft", CRAFT_DESCRIPTION);
  if (path === "/analytics") return notFound(path); // noindex, owner-only
  const m = path.match(/^\/work\/([^/]+)$/);
  if (m && caseExists(m[1])) return caseStudy(m[1]);
  return notFound(path);
}

// Escape a value for use inside a double-quoted HTML attribute.
function attr(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Escape a value for use as HTML text content (the <title>).
function text(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Serialize a route's metadata to an HTML string for build-time injection into
 * the prerendered <head>. Tags are newline-indented to sit neatly in the file.
 */
export function headTags(meta: PageMeta): string {
  const lines = [
    `<title>${text(meta.title)}</title>`,
    `<meta name="description" content="${attr(meta.description)}" />`,
    `<link rel="canonical" href="${attr(meta.canonical)}" />`,
    `<meta property="og:type" content="${attr(meta.ogType)}" />`,
    `<meta property="og:url" content="${attr(meta.canonical)}" />`,
    `<meta property="og:title" content="${attr(meta.ogTitle)}" />`,
    `<meta property="og:description" content="${attr(meta.ogDescription)}" />`,
    `<meta property="og:image" content="${attr(meta.ogImage)}" />`,
  ];
  if (meta.ogImageWidth) lines.push(`<meta property="og:image:width" content="${attr(meta.ogImageWidth)}" />`);
  if (meta.ogImageHeight) lines.push(`<meta property="og:image:height" content="${attr(meta.ogImageHeight)}" />`);
  if (meta.ogImageAlt) lines.push(`<meta property="og:image:alt" content="${attr(meta.ogImageAlt)}" />`);
  lines.push(
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${attr(meta.ogTitle)}" />`,
    `<meta name="twitter:description" content="${attr(meta.ogDescription)}" />`,
    `<meta name="twitter:image" content="${attr(meta.ogImage)}" />`,
  );
  if (meta.noindex) lines.push(`<meta name="robots" content="noindex" />`);
  return lines.join("\n    ");
}

// ── client runtime application ────────────────────────────────────────────────

function upsertMeta(selector: string, create: () => HTMLElement, content: string) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function metaByName(name: string, content: string) {
  upsertMeta(
    `meta[name="${name}"]`,
    () => {
      const m = document.createElement("meta");
      m.setAttribute("name", name);
      return m;
    },
    content,
  );
}

function metaByProp(prop: string, content: string) {
  upsertMeta(
    `meta[property="${prop}"]`,
    () => {
      const m = document.createElement("meta");
      m.setAttribute("property", prop);
      return m;
    },
    content,
  );
}

// Set the og:image:* property when a value is present, or remove a stale tag
// when it isn't. Case studies omit width/height (they vary per project), so on a
// homepage-shell fallback the home defaults must be cleared rather than left to
// mislead crawlers about the new og:image's dimensions.
function setOrRemoveMetaByProp(prop: string, content: string | undefined) {
  if (content) {
    metaByProp(prop, content);
  } else {
    document.head.querySelector(`meta[property="${prop}"]`)?.remove();
  }
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const ROBOTS_ID = "robots-noindex";

/**
 * Apply a route's metadata to the live document. Called on first paint and on
 * every client-side navigation so JS-capable crawlers and the SPA stay in sync
 * with the prerendered metadata — and so the correct metadata is applied even
 * when the static host serves the homepage shell for an extensionless deep URL.
 */
export function applyMeta(meta: PageMeta): void {
  document.title = meta.title;
  metaByName("description", meta.description);
  setCanonical(meta.canonical);
  metaByProp("og:type", meta.ogType);
  metaByProp("og:url", meta.canonical);
  metaByProp("og:title", meta.ogTitle);
  metaByProp("og:description", meta.ogDescription);
  metaByProp("og:image", meta.ogImage);
  setOrRemoveMetaByProp("og:image:width", meta.ogImageWidth);
  setOrRemoveMetaByProp("og:image:height", meta.ogImageHeight);
  setOrRemoveMetaByProp("og:image:alt", meta.ogImageAlt);
  metaByName("twitter:card", "summary_large_image");
  metaByName("twitter:title", meta.ogTitle);
  metaByName("twitter:description", meta.ogDescription);
  metaByName("twitter:image", meta.ogImage);

  const existing = document.getElementById(ROBOTS_ID);
  if (meta.noindex) {
    if (!existing) {
      const m = document.createElement("meta");
      m.id = ROBOTS_ID;
      m.setAttribute("name", "robots");
      m.setAttribute("content", "noindex");
      document.head.appendChild(m);
    }
  } else if (existing) {
    existing.remove();
  }
}
