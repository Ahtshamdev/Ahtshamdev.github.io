// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE and BASE are set by the GitHub Pages workflow; defaults suit local dev.
export default defineConfig({
  site: process.env.SITE ?? 'http://localhost:4321',
  base: process.env.BASE ?? '/',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
});
