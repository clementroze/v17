---
name: Replit Static SPA — SEO / routing constraints
description: Hard constraints on Replit Static deployments for SPA routing, 404 status, sitemaps, and rewrites
---

# Replit Static (deploymentTarget=static) SPA constraints

Discovered while wiring SEO crawlability/indexation on a Vite+React SPA (publicDir=dist).

## Rewrites cannot be set by the agent
- Direct edits to `.replit` are BLOCKED by tooling.
- The deployment skill's `deployConfig()` does NOT support a `rewrites` param: passing `rewrites:[...]` returns `success:true` but does NOT write `[[deployment.rewrites]]` to `.replit` (silently ignored). Verify with `cat .replit`.
- **Conclusion:** `[[deployment.rewrites]]` is effectively unsettable from the agent right now. Don't design solutions that depend on adding rewrites.

## `_redirects` is ignored; `404.html` is the real SPA fallback
- Replit Static ignores Netlify-style `public/_redirects` (`/* /index.html 200` is a no-op). Confirmed via docs + live probes.
- The actual SPA fallback is `dist/404.html`. Keep `cp dist/index.html dist/404.html` in the build (the build note "never remove the cp" is correct).
- **The host serves `404.html` with HTTP 200** for every unmatched path. So extensionless known routes (`/about`, `/work`, `/craft`) only resolve via this 200 fallback when there are no rewrites — and a *real* 404 STATUS is therefore impossible without `.replit` rewrites.

## Best-achievable soft-404 fix without a real 404 status
- Render a real NotFound UI (not the homepage) for unknown routes, AND inject `<meta name="robots" content="noindex">` at runtime for not-found routes (unknown path OR `/work/<slug>` with no case study). Google treats runtime noindex as a valid soft-404 remedy. Remove the meta on valid routes so they stay indexable; never bake noindex into `index.html`.
- Normalize a trailing slash before route classification (`/about/` -> `/about`) or slash variants get misclassified as not-found and noindexed.

## sitemap.xml / robots.txt
- Generate them in the Vite build plugin (closeBundle) into `dist/`, deriving case-study URLs from `src/work/*.md` so the URL list never drifts. Canonical origin lives in `SITE_ORIGIN` (`src/lib/caseStudySchema.ts`).

**Why:** these are environment facts (not in the code), cost >2 attempts to pin down, and any future SEO/routing work on this host will otherwise repeat the same dead ends (trying rewrites, trying `_redirects`, expecting a 404 status).
