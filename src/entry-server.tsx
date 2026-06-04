// Build-time server entry. Bundled by `vite build --ssr` and consumed by
// scripts/prerender.mjs to render each public route's body content and <head>
// metadata into static HTML, so crawlers, AI systems, and social preview bots
// receive real content and route-specific metadata without running JavaScript.
//
// Pages are imported EAGERLY here (not via React.lazy as in the client entry):
// renderToStaticMarkup does not await Suspense, so a lazy component would render
// as its (empty) fallback. Eager imports add no client bundle weight because
// this module is only used for the build.

import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { RouterProvider } from "./lib/router";
import Home from "./pages/Home";
import About from "./pages/About";
import Work from "./pages/Work";
import Craft from "./pages/Craft";
import CaseStudy from "./pages/CaseStudy";
import NotFound from "./pages/NotFound";
import { caseExists, caseSlugs, loadCase } from "./lib/cases";
import { bySlug } from "./data/data";
import { resolveRouteMeta, headTags } from "./lib/routeMeta";
import { caseStudyJsonLdScript, firstYear, SITE_ORIGIN } from "./lib/caseStudySchema";

export { SITE_ORIGIN };

/** Every public route to prerender: the marketing pages plus each case study. */
export function publicRoutes(): string[] {
  return ["/", "/about", "/work", "/craft", ...caseSlugs.map((s) => `/work/${s}`)];
}

function pageFor(path: string): ReactElement {
  if (path === "/about") return <About />;
  if (path === "/work") return <Work />;
  if (path === "/craft") return <Craft />;
  const m = path.match(/^\/work\/([^/]+)$/);
  if (m && caseExists(m[1])) return <CaseStudy slug={m[1]} />;
  if (path === "/") return <Home />;
  return <NotFound />;
}

/**
 * Render a route to its body markup and serialized <head> metadata.
 *
 * Body rendering is wrapped in try/catch: if a component throws under static
 * rendering (e.g. an unguarded browser API), the route degrades gracefully to
 * the empty shell while still receiving its route-specific metadata, so the
 * build never breaks.
 */
export function renderRoute(path: string): { appHtml: string; headTags: string } {
  const meta = resolveRouteMeta(path);
  let head = headTags(meta);

  // Case studies also carry their CreativeWork + BreadcrumbList JSON-LD, kept in
  // sync with the runtime via the shared helper (see src/lib/caseStudySchema.ts).
  const m = path.match(/^\/work\/([^/]+)$/);
  if (m && caseExists(m[1])) {
    const data = loadCase(m[1]);
    if (data) {
      head +=
        "\n    " +
        caseStudyJsonLdScript({
          slug: m[1],
          title: data.meta.title,
          description: data.meta.subtitle,
          image: `/images/${m[1]}/cs-hero.png`,
          year: firstYear(bySlug(m[1])?.date ?? ""),
        });
    }
  }

  let appHtml = "";
  try {
    appHtml = renderToStaticMarkup(
      <RouterProvider initialPath={path}>{pageFor(path)}</RouterProvider>,
    );
  } catch (err) {
    appHtml = "";
    console.warn(
      `[prerender] body render failed for ${path}; emitting shell instead. ` +
        `${(err as Error)?.message ?? err}`,
    );
  }

  return { appHtml, headTags: head };
}
