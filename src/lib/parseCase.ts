// Parses a case study markdown file into structured data.
//
// Frontmatter format:
//   ---
//   slug: frog
//   title: frog
//   subtitle: Designing the next-generation…
//   role: Design Intern
//   type: Research, UX design, …
//   about:
//     - paragraph one
//     - paragraph two
//   finalDesigns: Final flow & high-fidelity mockups   (optional)
//   ---
//
// The "Year" shown in the meta block comes from the global registry (data.ts,
// the entity's `date`) — NOT from frontmatter — so it stays consistent with the
// About page. Hero image comes from work.ts (imageSrc), and the cover image is
// derived from the slug as /images/<slug>/cover.png (NOT frontmatter).
// `finalDesigns` (optional) enables a "View final designs" button below the About
// block; its value must match a `## ` section heading exactly to scroll there.
//
// Body block types:
//
//   ## Section title              → { type: 'section', title }
//   plain text paragraph          → { type: 'paragraph', text }
//   - list item                   → { type: 'list', items[] }  (consecutive lines merged)
//   ![a.jpg]                      → { type: 'images', srcs: ['a.jpg'] }
//   ![a.jpg | b.jpg]              → { type: 'images', srcs: ['a.jpg','b.jpg'] }
//   ![a.jpg] Caption text         → { type: 'images', srcs: [...], caption: 'Caption text' }
//   ![alt](src) Caption text      → { type: 'images', srcs: ['src'], caption: 'Caption text' }
//   ```lang\n…\n```                → { type: 'code', lang, lines[] }

export type Meta = {
  slug: string;
  title: string;
  subtitle: string;
  role: string;
  type: string;
  about: string[];
  /**
   * Optional. When set, a "View final designs" button is rendered below the
   * About meta block. The value is the exact text of a `## ` section heading in
   * the body — clicking the button scrolls to that section.
   */
  finalDesigns?: string;
};

export type Col = { heading?: string; body?: string };

export type Block =
  | { type: 'section'; title: string }
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'hmw'; text: string }
  | { type: 'cols'; columns: Col[] }
  | { type: 'list'; items: string[] }
  | { type: 'images'; srcs: string[]; alts?: string[]; captions?: string[]; width?: string }
  | { type: 'code'; lang?: string; lines: string[] };

export type CaseStudy = { meta: Meta; blocks: Block[] };

export function parseCase(raw: string): CaseStudy {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) throw new Error('No frontmatter found');

  const fmRaw = fmMatch[1];
  const body = fmMatch[2].trim();

  // ── parse frontmatter ──────────────────────────────────────────────────────
  const meta: Partial<Meta> & { about: string[] } = { about: [] };
  let inAbout = false;

  for (const line of fmRaw.split('\n')) {
    if (inAbout) {
      const li = line.match(/^\s{2,}-\s+(.+)$/);
      if (li) { meta.about.push(li[1]); continue; }
      inAbout = false;
    }
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, val] = kv;
    if (key === 'about') { inAbout = true; continue; }
    (meta as unknown as Record<string, string>)[key] = val.trim();
  }

  // ── parse body ─────────────────────────────────────────────────────────────
  const blocks: Block[] = [];
  const lines = body.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // blank
    if (!line.trim()) { i++; continue; }

    // fenced code block (```lang … ```)
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] || undefined;
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '```') {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing ```
      blocks.push({ type: 'code', lang, lines: codeLines });
      continue;
    }

    // COLS block
    if (line.trim() === 'COLS') {
      i++;
      const colLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== 'ENDCOLS') {
        colLines.push(lines[i]);
        i++;
      }
      i++; // consume ENDCOLS
      const columns: Col[] = colLines.join('\n').split(/\n---\n/).map(chunk => {
        const chunkLines = chunk.trim().split('\n');
        const headingLine = chunkLines.find(l => l.startsWith('### '));
        const bodyLines = chunkLines.filter(l => !l.startsWith('### ') && l.trim());
        return {
          heading: headingLine ? headingLine.slice(4).trim() : undefined,
          body: bodyLines.join(' ').trim() || undefined,
        };
      });
      blocks.push({ type: 'cols', columns });
      continue;
    }

    // section heading (##) and subheading (###)
    if (line.startsWith('### ')) {
      blocks.push({ type: 'heading', text: line.slice(4).trim() });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'section', title: line.slice(3).trim() });
      i++;
      continue;
    }

    // image line — two supported formats, optional trailing caption(s) and width:
    //   ![src1 | src2 | …] Caption            single shared caption
    //   ![src1 | src2 | …] Cap1 | Cap2        per-image captions (parallel to srcs)
    //   ![src "alt" | src "alt"] Cap1 | Cap2  per-image alt (quoted, after each src)
    //   ![alt](src) Caption                   standard markdown image
    //   any format can end with {600px} or {50%} to constrain width, e.g.:
    //   ![alt](src) Caption {600px}
    //   ![src] {400px}
    // NB: within the brackets, alt text can't contain " | ] (they're delimiters).
    const widthToken = line.match(/\{([^}]+)\}\s*$/);
    const width = widthToken?.[1].trim();
    const lineNoWidth = widthToken ? line.slice(0, widthToken.index).trimEnd() : line;
    const imgMulti = lineNoWidth.match(/^!\[(.+?)\](?:\s+(.+))?$/);
    const imgStd = !imgMulti ? lineNoWidth.match(/^!\[([^\]]*)\]\(([^)]+)\)(?:\s+(.+))?$/) : null;
    if (imgMulti) {
      // Each pipe-separated entry is `src` or `src "alt"` — peel the optional
      // quoted alt off each so multi-image rows can be described per image.
      const srcs: string[] = [];
      const alts: string[] = [];
      let hasAlt = false;
      imgMulti[1].split('|').map(s => s.trim()).filter(Boolean).forEach(entry => {
        const m = entry.match(/^(.*?)\s*"([^"]*)"$/);
        if (m) {
          srcs.push(m[1].trim());
          alts.push(m[2].trim());
          hasAlt = true;
        } else {
          srcs.push(entry);
          alts.push('');
        }
      });
      const captionRaw = imgMulti[2]?.trim();
      const captions = captionRaw ? captionRaw.split('|').map(s => s.trim()) : undefined;
      blocks.push({ type: 'images', srcs, alts: hasAlt ? alts : undefined, captions, width });
      i++;
      continue;
    }
    if (imgStd) {
      const alt = imgStd[1].trim() || undefined;
      const captionRaw = imgStd[3]?.trim();
      const captions = captionRaw ? [captionRaw] : undefined;
      blocks.push({ type: 'images', srcs: [imgStd[2].trim()], alts: alt ? [alt] : undefined, captions, width });
      i++;
      continue;
    }

    // HMW statement
    if (line.startsWith('HMW ')) {
      blocks.push({ type: 'hmw', text: line.slice(4).trim() });
      i++;
      continue;
    }

    // blockquote
    if (line.startsWith('> ')) {
      blocks.push({ type: 'quote', text: line.slice(2).trim() });
      i++;
      continue;
    }

    // list items — collect consecutive lines starting with -
    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2).trim());
        i++;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    // paragraph
    blocks.push({ type: 'paragraph', text: line.trim() });
    i++;
  }

  return { meta: meta as Meta, blocks };
}
