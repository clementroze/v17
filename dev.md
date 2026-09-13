# dev.md — Maintenance & Content Guide

Reference doc for adding content and understanding how this portfolio is wired.
Written so future contributors can make changes without re-deriving the
architecture each time. Last audit update: 2026-09-13.

---

## TL;DR mental model

- **One source of truth for identity:** `src/data/data.ts` — an *entity registry*
  keyed by `slug` (name, date, role, accent color, `hasCaseStudy`, href).
- **Per-surface files reference entities by `slug`** and add only their own copy:
  - `src/data/work.ts` → Work page + homepage layout
  - `src/data/about.tsx` → About page accordions
  - `src/work/<slug>.md` → case-study content (the only place body copy lives)
  - `src/data/craft.ts` → Craft gallery (standalone, not entity-based)
  - `src/data/timeline.ts` → homepage experience timeline
- **Two pipelines do the heavy lifting:**
  1. **Images** — author a `.png`/`.jpg`, run `npm run optimize:images`, and it
     generates `.avif` + `.webp` siblings. You only ever *reference* the `.png`;
     `<Picture>` / `bgImageSet()` derive the modern formats at render for public paths.
     Bundled `src/assets` images need explicit format imports because Vite hashes filenames.
  2. **Routes & SEO** — case-study routes, the sitemap, JSON-LD, and per-route
     `<head>` tags are **auto-discovered from `src/work/*.md`** (see
     `src/lib/cases.ts` → `caseSlugs`). Add a markdown file and they all appear.
- **The only manual SEO file is `public/llms.txt`.** Everything else regenerates
  on `npm run build`.

---

## Commands

```bash
npm run dev              # Vite dev server (port 5000)
npm run build            # tsc + client build + SSR build + prerender + 404 copy
npm run preview          # preview the production build
npm run audit:assets     # after build: duplicate pixels/files, image siblings, local links
npx tsc --noEmit --noUnusedLocals --noUnusedParameters  # stricter code hygiene
npm run optimize:images  # generate .avif/.webp for all raster images
node scripts/optimize-images.mjs <filter>   # only paths containing <filter>
```

`npm run build` is the source of truth. It typechecks, builds the client,
builds the SSR bundle (`src/entry-server.tsx`), runs `scripts/prerender.mjs`
(writes per-route HTML + `sitemap.xml` + `robots.txt`), then copies the shell to
`404.html`. It throws loudly if a `work.ts` slug is missing from the registry.

---

## How to: add a new Craft picture

Files: `public/craft/` + `src/data/craft.ts`

1. Drop the image in `public/craft/` (e.g. `proj-home.png`). Prefer `.png`/`.jpg`.
   Videos (`.mov`/`.mp4`/`.webm`) work but are **not optimized** — keep them small.
2. `npm run optimize:images` (or `... optimize-images.mjs proj`).
3. Add one entry to the `ITEMS` array in `craft.ts`:
   ```ts
   { src: c("proj-home.png"), label: "Project — home screen", date: "2026",
     alt: "What the screen actually shows", link: "https://…", linkLabel: "Visit" },
   ```

Notes:
- `id` is auto-generated from array position — never set it.
- Array order = grid order = lightbox order.
- **A11y:** Craft renders `alt={item.alt ?? item.label}` (`CraftCard.tsx`). Most
  existing items only have `label`, so the title doubles as alt. For new items,
  **set a real `alt`** describing the image content, not just its name.
- Optional `aspect` (width/height) reserves layout space pre-load → avoids CLS.

---

## How to: add / edit an About accordion row

Files: `src/data/about.tsx` (+ `src/data/data.ts` if it's a brand-new entity)

- Entity already in `data.ts`? Just add an `AccordionRowProps` entry to the right
  array (`workExperience` / `freelancing` / `collaborations` / `activities`):
  ```ts
  { slug: "thing", description: ["Para one.", "Para two."],
    caseStudyHref: "https://…", caseStudyLabel: "View site" }
  ```
  `description` is a string or string[] (multiple paragraphs). The external link
  fields are only for entities without an internal case study.
- Brand-new entity? Add it to `data.ts` first (slug, name, date, role, accent,
  `hasCaseStudy`). All surfaces reference it by slug afterward.
- `hasBorderTop: false` goes on the **first** row of each section only.
- About content is real DOM text and is server-prerendered → crawlable. No
  metadata edits needed.

---

## How to: add a full case study (the big one)

IBM is now a full case study: `src/work/ibm.md` exists and its registry entry
has `hasCaseStudy: true`. The steps below use IBM's paths as a concrete example
of the setup needed for a new study; substitute the new project's slug and copy.

**A. Create `src/work/<slug>.md`** — this single file unlocks the route. Copy the
frontmatter shape from `src/work/replit.md`:
```markdown
---
slug: ibm
title: IBM
subtitle: One-sentence description (~100–155 chars). Reused as the Work subtitle,
  meta description, OG/Twitter description, and the llms.txt line — write it well.
role: Design Intern
type: Product Design, …
about:
  - First paragraph. Markdown [links](https://…) are supported.
finalDesigns: <label>
---

## Section heading
Body copy.

![Descriptive alt text](/images/ibm/cover.png) Caption
```
The instant this file exists, these auto-generate on build: the `/work/ibm`
route, its `sitemap.xml` entry, `CreativeWork` + `BreadcrumbList` JSON-LD, and
all per-route `<head>` tags (title/description/canonical/OG, with
`cover.png` as the social card). The router also stops treating `/work/ibm`
as a noindex not-found.

**B. Flip `hasCaseStudy: true`** in `data.ts`. This drops the "Coming soon."
label and links the Work/Home card to the study (`comingSoon` is derived from it).

**C. Add body images.** Structural images (`cs-hero`, `grid-1/2/3`, `home-hero`,
`preview`) may already exist. For each in-body image referenced in the markdown:
drop the `.png` in `public/images/<slug>/`, run `npm run optimize:images`, then
reference it with **descriptive alt**. Markdown image syntax:
- Single: `![alt text](/images/ibm/cover.png) Caption`
- Two-up:  `![/images/a.png "alt a" | /images/b.png "alt b"] cap a | cap b`

**D. Update `public/llms.txt`** — add the case study under `## Case studies`
(this is the ONE SEO file that is not auto-generated):
```
- [IBM](https://clementroze.com/work/ibm): one-line summary.
```

**E. `npm run build` and verify:** `dist/work/<slug>.html` has real body content,
`dist/sitemap.xml` lists the new URL, and `<title>`/OG tags are project-specific.

### Image naming conventions (per case study, in `public/images/<slug>/`)
| Name | Purpose | Optimizer cap |
|------|---------|---------------|
| `home-hero.png` | Homepage hero | 3840px (retina) |
| `cs-hero.png` | Case-study hero | 3840px |
| `cover.png` | Case-study cover background + OG social card | 3840px |
| `preview.png` | Floating hover preview on Work list | 2000px |
| `grid-1/2/3.png` | Work-page grid thumbnails | 2000px |
| anything else | In-body content images | 2000px |

`home-hero`, `cs-hero`, `cover` are the only names that get the larger hero cap
(see `HERO_NAMES` in `optimize-images.mjs`). Name accordingly.

---

## Cross-cutting rules (every change)

- **Author images as `.png`/`.jpg`, reference the `.png`, and always run
  `npm run optimize:images` after adding.** The `.avif` (and `.webp`) siblings
  are what ~99% of visitors actually download. Never link `.avif`/`.webp`
  directly for public content. Bundled assets may import a single WebP explicitly
  (for example the LinkedIn icon). Originals are kept as fallbacks.
- **Alt text is the main accessibility lever.** Case-study images → alt in
  markdown. Craft → the `alt` field. Don't rely on `label`/filename.
- **`subtitle:` in case-study frontmatter is reused four ways** — treat it as the
  SEO meta description.
- **Never hand-edit** `sitemap.xml`, `robots.txt`, or the JSON-LD — generated.
- **Do hand-edit** `public/llms.txt` when case studies change.
- **Domain** is the `SITE_ORIGIN` constant in `src/lib/caseStudySchema.ts`
  (`https://clementroze.com`). Everything derives from it — no per-content edits.
- **Verify with `npm run build`**, not just `npm run dev` (dev doesn't prerender).

---

## Key files map

```
src/data/data.ts            Entity registry (identity: slug, name, date, accent…)
src/data/work.ts            Work page + homepage layout (by slug)
src/data/about.tsx          About accordions (by slug)
src/data/craft.ts           Craft gallery items (standalone)
src/work/<slug>.md          Case-study content (frontmatter + body)
src/lib/cases.ts            Route discovery (caseSlugs, caseExists, loadCase)
src/lib/parseCase.ts        Markdown → structured case-study data
src/lib/caseStudySchema.ts  JSON-LD builder + SITE_ORIGIN constant
src/lib/routeMeta.ts        Per-route <head> metadata (title/desc/canonical/OG)
src/lib/router.tsx          Custom history router
src/entry-server.tsx        SSR entry (eager imports — see SSR gotcha below)
scripts/prerender.mjs       Build-time: per-route HTML + sitemap + robots
scripts/optimize-images.mjs PNG/JPG → AVIF/WebP
src/components/Picture.tsx   <picture> AVIF→WebP→PNG fallback + bgImageSet()
public/llms.txt             AI-crawler guide (MANUAL — keep in sync)
public/fonts/               Self-hosted Helvetica Neue (see Fonts below)
```

---

## Gotchas & things to know

- **Hosting is Replit Static.** It **ignores `_redirects`** (Netlify-style).
  Real rewrites would live in `.replit [[deployment.rewrites]]`. Unmatched paths
  fall back to `404.html` served as **200** (a soft-404). Mitigation already in
  place: unknown routes / invalid slugs render a real `NotFound` page with a
  runtime `noindex` (see `routeMeta.ts` + `main.tsx`), and the sitemap only lists
  real URLs. True 404 *status codes* aren't achievable on this host with current
  tooling — don't chase them; the noindex approach is the accepted remedy.
- **SSR requires eager imports.** `src/entry-server.tsx` must import page
  components directly (not via `React.lazy`), or prerender won't await the
  chunks. The client (`main.tsx`) still uses lazy/`createRoot` — that's fine.
- **Browser APIs in components must be SSR-safe.** Keep `window`/`document`
  reads inside `useEffect`/event handlers, or guard render-time reads. The
  prerender wraps each route in try/catch and degrades to the shell on failure.
- **Image priority:** `Picture` accepts typed `fetchPriority` and emits lowercase
  `fetchpriority` for React 18. Only the opening homepage artwork is high priority;
  later project artwork is lazy/low priority. Do not infer priority from an index
  inside a nested one-item list.
- **CSS font variable** is `--font` (it was renamed from `--font-inter` when Inter
  was dropped). Body 400 = Helvetica Neue Roman, headings 500 = Medium.
- **Konami easter egg exists.** ↑↑↓↓←→←→ B A toggles "rainbow mode" (also a Footer
  button + a dismissable toast). State of truth is the `html.konami` class; the
  Footer label syncs to it via a `MutationObserver`. The toast animates in only
  after the 6-column wipe reveal finishes. Relevant CSS: `.konami-*` in
  `styles.css`; logic in `main.tsx` + `Footer.tsx`.

---

## Fonts (licensing — important)

- Self-hosted **Neue Helvetica Pro 55 Roman** (weight 400) + **65 Medium**
  (weight 500) in `public/fonts/`. These are the two weights the site uses.
- **Webfont license is single-domain** (MyFonts/Monotype, Build ID 3867246).
  It covers `clementroze.com`. Don't reuse these files on other domains/sites.
- The `@license` comment in `styles.css` (and `index.html`) is **required** —
  leave it in place.
- The shipped files are the "line height adjustment" kit (corrected vertical
  metrics) — not the default kit. If re-downloading, grab that variant.

---

## Domain migration (v17 → production)

The code is already authored for `clementroze.com` (canonical, OG, `SITE_ORIGIN`
all point there even while served from a `v17.*` staging host). When going live:
- **No code changes needed** — only stale "v17 staging" wording in comments.
- Confirm the **font license domain** is `clementroze.com`.
- Add a **301 redirect** `v17.* → clementroze.com` so any indexed/shared staging
  URLs forward.
- **Re-scrape social cards** (LinkedIn Post Inspector, Facebook Sharing Debugger).
- Validate a couple `/work/<slug>` pages in Google's Rich Results Test once live.

---

## Notes for future sessions

- This repo commits directly to `main` (solo portfolio); per-task commits are the
  norm. Match the existing commit-message style. End commit messages with the
  `Co-Authored-By` trailer.
- Prefer editing the **source-of-truth** file, not generated output. If asked to
  change a URL/title/description, trace it back to `data.ts` / the `.md`
  frontmatter / `routeMeta.ts` — don't patch `dist/`.
- After content changes, run `npm run build` to confirm prerender + sitemap, not
  just `npm run dev`.
- When adding a case study, the checklist is essentially: **one `.md` file + flip
  one boolean in `data.ts` + one `llms.txt` line + images** (then build). Almost
  everything else is derived.
- Watch for SSR-safety when adding components that touch `window`/`document`.


---

## Homepage and gallery architecture

- `Home.tsx` assembles the page and owns vertical hero/page scrolling.
- `Carousel.tsx` owns horizontal project scrolling, drag/scrub state, native snap,
  navigation dots and slide accessibility. Inactive slide content is `inert`;
  the slide wrapper remains clickable to select an adjacent preview.
- `FeaturedProject.tsx` renders one project and the opening artwork transition.
  It replaces the experimental `effects/EffectB.tsx` name and redundant array wrapper.
  Pass `opening` only for the first project. Content comes from `data/work.ts`.
- `ExperienceCarousel.tsx` and its CSS own the timeline cards/ruler. The earlier
  `HybridExperienceCarousel` filename was renamed; existing `hybrid-experience__*`
  CSS classes remain the styling contract. Content lives in `data/timeline.ts`.
- `CraftPreview.tsx` is intentionally retained but disabled by `SHOW_CRAFT_PREVIEW`
  in Home. It curates existing Craft images; do not copy those assets for Home.
  Re-enabling it requires checking pointer, wheel, keyboard and reduced motion.
- `CraftCard.tsx` owns gallery media readiness, lazy image loading and video
  visibility. Videos pause offscreen, while the lightbox is open, when the gallery
  pause toggle is enabled, or when reduced motion is requested. Failed media must
  clear the loading shimmer. Opening a video in the lightbox is user initiated.
- `useCarouselKeyboard.ts` gives focused carousels priority. Viewport-center arrow
  shortcuts apply only when focus is on the page body, never another control.
  Callback refs keep window listeners stable during scroll-driven renders.

### Interaction and lifecycle rules

- Keep native touch scrolling. Mouse drag must distinguish a click from movement,
  release capture on cancellation, and suppress only the gesture's pointer click.
  Keyboard activation must still work immediately afterward.
- Cancel animation frames, observers and delayed scrolls on unmount. Respect
  runtime changes to reduced motion, not just the value at first mount.
- `useReveal` shares a reference-counted scroll-speed listener across gallery cards;
  the last cleanup removes it. New scroll measurements should be batched in rAF.
- About navigation uses `about_open` and optionally `about_scroll` in sessionStorage.
  Timeline links clear `about_scroll`; case-study returns retain it. About restores
  one destination after the accordion expands, with a timeout fallback and cleanup.
  Keep the consumed request in a ref so StrictMode replay can reschedule it.
- Keep inactive controls out of keyboard navigation. The timeline ruler retains
  its compact original spacing and colors by design. Do not rely on opacity alone
  to hide interactive content.
- Homepage featured artwork and experience cards share the homepage `--radius-img`
  token (16px), including on mobile. Other pages retain their existing radius.
  The opening featured artwork keeps its hero-to-card corner transition.

## Audit record — 2026-09-13

Scope: all tracked working-tree changes and new source/assets present at the start
of this audit, plus shared components they affect. Existing user changes were
preserved; no commit or deployment was made.

Fixed priority loading of all four featured images, competing/stale About scroll
restoration, carousel focus ownership, hidden slide links, reveal listener cleanup,
Craft video autoplay lifecycle, and an uncancelled lightbox close animation. Removed
unused experimental About-story/Effect B CSS and an unused case-study type import.
Kept the original timeline marker sizing/colors per design feedback and made the
automatic intro less than five seconds. Component names now describe their purpose.

Removed three unused export families (nine files, about 3.7 MiB):
`craft/wvbr-page.*`, `images/google/poppins.*`, and `images/ibm/cs-hero-t2.*`.
Canonical artwork remains in `wvbr-home.*`, `images/bio/poppins.*`, and
`images/ibm/cs-hero.*`. Optimized format siblings are intentional fallbacks, not
redundant images. The audit script compares original decoded RGBA pixels as well
as exact file hashes; it does not classify visually similar crops as duplicates.

Validation: production TypeScript/client/SSR build and all 10 prerendered routes;
strict unused-symbol check; asset audit (687 image files, 20 HTML files including
route aliases/404, 527 unique local references); desktop/mobile browser smoke tests.
`npm run audit:assets` fails on duplicate exports, missing optimized public-content
siblings, or missing local resources linked from prerendered HTML. Run after build
so it examines current output. It checks public references, not external website
availability or every runtime-only UI state.

Remaining limits: this is not a WCAG certification or a cross-browser/device lab
run. Screen-reader testing, real touch hardware, field Core Web Vitals and semantic
review of all older image alt text remain useful release checks. Large original
PNGs are retained as authoring/fallback assets; AVIF/WebP are the normal delivery
path. The existing stylesheet and legacy scroll compatibility code can be split
further in a dedicated refactor, with route-by-route visual verification.


### Mobile homepage layout

At widths up to 768px, the hero uses its content height. Featured-work slides
vertically center their artwork/copy with 96px top and 112px bottom clearance.
The carousel grows with the tallest slide and uses `min(88svh, 780px)` as its
minimum slide height; do not restore a fixed 100svh height or 24px top padding.
Experience height combines a capped viewport proportion with card height plus
200px clearance, so short/landscape screens can scroll through the full content.
Mobile page snapping is proximity-based; horizontal carousel snapping and the
measured hero spring remain intact. The opening artwork observes layout resize
so its transition keeps following the actual section geometry.

Section footer text is 15px on mobile. Featured-work dots sit above the footer
labels to prevent overlap at narrow widths. Desktop layouts and other pages keep
their existing sizing. The disabled Craft preview has a corresponding mobile
height rule; verify its stacked-card animations if it is enabled again.
