import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Per-route prerendering (body content + route-specific <head> metadata),
// sitemap.xml, and robots.txt are generated after the build by
// scripts/prerender.mjs, which renders the SSR bundle (src/entry-server.tsx).
// See package.json's "build" script for the full pipeline.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
});
