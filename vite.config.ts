import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { bySlug } from './src/data/data';
import { parseCase } from './src/lib/parseCase';
import { caseStudyJsonLdScript, firstYear } from './src/lib/caseStudySchema';

// ── Case-study schema prerender ──────────────────────────────────────────────
// After the bundle is written, emit a static HTML file per /work/<slug> route
// that contains its CreativeWork + BreadcrumbList JSON-LD in the INITIAL HTML
// (not just injected after React mounts), so crawlers and AI systems that run
// little or no JS still receive route-level structured data.
//
// For each case study we write BOTH `dist/work/<slug>.html` and
// `dist/work/<slug>/index.html` so the route resolves regardless of whether the
// static host uses ".html" extension resolution or directory-index resolution.
// Each file is the normal SPA shell (same bundle/assets, absolute paths) with
// one extra <script type="application/ld+json"> added before </head>. The React
// app boots identically and reconciles the schema at runtime (see CaseStudy.tsx).
function prerenderCaseStudySchema(): Plugin {
  return {
    name: 'prerender-case-study-schema',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist');
      const indexPath = path.join(dist, 'index.html');
      const workSrc = path.resolve(__dirname, 'src/work');
      if (!fs.existsSync(indexPath) || !fs.existsSync(workSrc)) return;

      const indexHtml = fs.readFileSync(indexPath, 'utf8');
      const slugs = fs
        .readdirSync(workSrc)
        .filter((f) => f.endsWith('.md'))
        .map((f) => f.replace(/\.md$/, ''));

      for (const slug of slugs) {
        const { meta } = parseCase(fs.readFileSync(path.join(workSrc, `${slug}.md`), 'utf8'));
        const script = caseStudyJsonLdScript({
          slug,
          title: meta.title,
          description: meta.subtitle,
          image: `/images/${slug}/cs-hero.png`,
          year: firstYear(bySlug(slug)?.date ?? ''),
        });
        const html = indexHtml.replace('</head>', `    ${script}\n  </head>`);

        const workDir = path.join(dist, 'work');
        fs.mkdirSync(path.join(workDir, slug), { recursive: true });
        fs.writeFileSync(path.join(workDir, `${slug}.html`), html);
        fs.writeFileSync(path.join(workDir, slug, 'index.html'), html);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), prerenderCaseStudySchema()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
});
