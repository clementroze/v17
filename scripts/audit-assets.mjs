/** Validate image families, duplicate exports, and local prerender references. */
import { readdir, readFile, access } from "node:fs/promises";
import { extname, join } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

const exists = async (path) => access(path).then(() => true, () => false);
const hash = (data) => createHash("sha256").update(data).digest("hex");
const errors = [];
const bytes = new Map();
const pixels = new Map();
let images = 0;
const add = (map, key, path) => map.set(key, [...(map.get(key) ?? []), path]);

for (const root of ["public", "src/assets"]) {
  for (const name of await readdir(root, { recursive: true })) {
    if (!/\.(png|jpe?g|webp|avif|svg)$/i.test(name)) continue;
    const path = join(root, name);
    images++;
    add(bytes, hash(await readFile(path)), path);
    if (!/\.(png|jpe?g)$/i.test(name)) continue;
    const { data, info } = await sharp(path).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    add(pixels, `${info.width}x${info.height}:${hash(data)}`, path);
    // Picture derives siblings only for public content; bundled assets use
    // explicit imports and the social card deliberately references its PNG.
    if (!path.startsWith("public/images/") && !path.startsWith("public/craft/")) continue;
    for (const ext of [".avif", ".webp"]) {
      const sibling = path.slice(0, -extname(path).length) + ext;
      if (!await exists(sibling)) errors.push(`Missing image sibling: ${sibling}`);
    }
  }
}
for (const [label, groups] of [["Identical files", bytes], ["Identical original pixels", pixels]]) {
  for (const paths of groups.values()) {
    if (paths.length > 1) errors.push(`${label}: ${paths.join(", ")}`);
  }
}

if (!await exists("dist/index.html")) throw new Error("Run npm run build before npm run audit:assets.");
let pages = 0;
const checked = new Set();
for (const name of await readdir("dist", { recursive: true })) {
  if (!name.endsWith(".html")) continue;
  pages++;
  const html = await readFile(join("dist", name), "utf8");
  for (const match of html.matchAll(/\b(?:src|srcset|href)="([^"]+)"/gi)) {
    for (const candidate of match[1].split(",")) {
      const url = candidate.trim().split(/\s+/)[0];
      if (!url.startsWith("/") || url.startsWith("//")) continue;
      const path = decodeURIComponent(url.split(/[?#]/)[0]);
      if (checked.has(path)) continue;
      checked.add(path);
      const target = `dist${path}`;
      if (!(await exists(target) || await exists(`${target}.html`))) {
        errors.push(`Missing local reference in ${name}: ${path}`);
      }
    }
  }
}
console.log(`Audited ${images} image files, ${pages} HTML files, and ${checked.size} local references.`);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else console.log("No duplicate exports, missing content image siblings, or broken prerender references.");
