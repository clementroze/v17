// Parses a case study markdown file into structured data.
//
// Frontmatter format:
//   ---
//   slug: frog
//   title: frog
//   subtitle: Designing the next-generation…
//   year: 2025
//   role: Design Intern
//   type: Research, UX design, …
//   hero: /images/frog-hero.jpg       ← full-bleed background behind navbar
//   cover: /images/frog-cover.jpg     ← the large card below the hero overlap
//   about:
//     - paragraph one
//     - paragraph two
//   ---
//
// Body block types:
//
//   ## Section title        → { type: 'section', title }
//   plain text paragraph    → { type: 'paragraph', text }
//   - list item             → { type: 'list', items[] }  (consecutive lines merged)
//   ![a.jpg]                → { type: 'images', srcs: ['a.jpg'] }           (1 image, full-width)
//   ![a.jpg | b.jpg]        → { type: 'images', srcs: ['a.jpg','b.jpg'] }   (2-up)
//   ![a.jpg | b.jpg | c.jpg]→ { type: 'images', srcs: [...] }               (3-up)

export type Meta = {
  slug: string;
  title: string;
  subtitle: string;
  year: string;
  role: string;
  type: string;
  hero?: string;
  cover?: string;
  about: string[];
};

export type Block =
  | { type: 'section'; title: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'images'; srcs: string[] };

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

    // section heading
    if (line.startsWith('## ')) {
      blocks.push({ type: 'section', title: line.slice(3).trim() });
      i++;
      continue;
    }

    // image line  ![src1 | src2 | …]
    const imgMatch = line.match(/^!\[(.+)\]$/);
    if (imgMatch) {
      const srcs = imgMatch[1].split('|').map(s => s.trim()).filter(Boolean);
      blocks.push({ type: 'images', srcs });
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
