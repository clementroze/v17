/**
 * optimize-images.mjs — generate AVIF + WebP siblings for every raster image.
 *
 * Originals (.png/.jpg) are NEVER modified or deleted — they stay as the
 * <picture> fallback (see src/components/Picture.tsx). Browsers download
 * exactly one source (AVIF for ~95%), so the PNG/WebP add no network weight for
 * modern visitors; they're free fallbacks on disk. Git history is the backup.
 *
 * Usage:
 *   node scripts/optimize-images.mjs              # all configured areas
 *   node scripts/optimize-images.mjs home-hero    # only paths containing "home-hero"
 *
 * Quality is tuned to be visually lossless. Resize caps are retina-safe:
 * full-bleed heroes stay ≤3840w; everything else caps at 2000px longest side.
 */
import { readdir, stat } from "node:fs/promises";
import { join, extname, basename, dirname } from "node:path";
import sharp from "sharp";

// src/assets holds Vite-bundled images (pfp, résumé/footer thumbnails); their
// .avif/.webp siblings are imported directly in About.tsx / Footer.tsx.
const ROOTS = ["public/images", "public/craft", "src/assets"];
const SRC_EXT = new Set([".png", ".jpg", ".jpeg"]);

// Full-bleed heroes get the larger retina cap; everything else is content.
const HERO_NAMES = new Set(["home-hero", "cs-hero", "cover"]);

const AVIF = { quality: 80, effort: 4 };
const AVIF_TALL = { quality: 90, effort: 4 }; // higher quality for tall images shown zoomed-in
const WEBP = { quality: 90, effort: 5 };
const WEBP_TALL = { quality: 95, effort: 5 };
const HERO_MAX = 3840; // retina width for ~1888 CSS-px full-bleed display
const CONTENT_MAX = 2000; // longest side for in-body / grid / bio / craft / asset images
const TALL_WIDTH_MAX = 1600; // width cap for tall images (h/w > 1.4) — prevents over-shrinking
// Matches the lightbox auto-zoom threshold in CraftLightbox.tsx
const TALL_ASPECT_RATIO = 1.4; // h/w above which an image is considered "tall"

const filter = process.argv[2] || null;

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // missing dir — skip
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (SRC_EXT.has(extname(e.name).toLowerCase())) yield p;
  }
}

const kb = (bytes) => Math.round(bytes / 1024);

async function main() {
  let origTotal = 0;
  let avifTotal = 0; // what modern browsers actually fetch
  const rows = [];

  for (const root of ROOTS) {
    for await (const file of walk(root)) {
      if (filter && !file.includes(filter)) continue;

      const name = basename(file, extname(file));
      const dir = dirname(file);
      const isHero = HERO_NAMES.has(name);
      const origSize = (await stat(file)).size;
      origTotal += origSize;

      // Detect tall images (h/w > TALL_ASPECT_RATIO) so we cap by width instead
      // of longest side — otherwise a 900×3000 image shrinks to ~600px wide, which
      // looks blurry when the lightbox zooms in to fill the viewport width.
      const meta = await sharp(file).metadata();
      const isTall = !isHero && meta.width && meta.height && (meta.height / meta.width) > TALL_ASPECT_RATIO;

      let resize;
      if (isHero) {
        resize = { width: HERO_MAX, withoutEnlargement: true };
      } else if (isTall) {
        resize = { width: TALL_WIDTH_MAX, withoutEnlargement: true };
      } else {
        resize = { width: CONTENT_MAX, height: CONTENT_MAX, fit: "inside", withoutEnlargement: true };
      }

      const avifOpts = isTall ? AVIF_TALL : AVIF;
      const webpOpts = isTall ? WEBP_TALL : WEBP;
      const base = sharp(file).rotate().resize(resize);
      const avifPath = join(dir, `${name}.avif`);
      const webpPath = join(dir, `${name}.webp`);
      await base.clone().avif(avifOpts).toFile(avifPath);
      await base.clone().webp(webpOpts).toFile(webpPath);

      const avifSize = (await stat(avifPath)).size;
      avifTotal += avifSize;
      rows.push({
        file,
        origKB: kb(origSize),
        avifKB: kb(avifSize),
        webpKB: kb((await stat(webpPath)).size),
        hero: isHero,
      });
    }
  }

  rows.sort((a, b) => b.origKB - a.origKB);
  console.log("\n  PNG/JPG → AVIF / WebP  (original kept as fallback)\n");
  for (const r of rows) {
    console.log(
      `  ${r.file}\n     ${r.origKB} KB  →  ${r.avifKB} KB avif / ${r.webpKB} KB webp${
        r.hero ? "  (hero)" : ""
      }`,
    );
  }
  console.log(
    `\n  ${rows.length} images.  Served (AVIF) total: ${kb(avifTotal)} KB  vs  original ${kb(
      origTotal,
    )} KB  →  ${Math.round((1 - avifTotal / origTotal) * 100)}% lighter.\n`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
