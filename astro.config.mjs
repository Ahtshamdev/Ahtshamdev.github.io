// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE is the canonical origin. On Vercel it falls back to the project's production domain;
// the GitHub Pages workflow sets SITE and BASE itself.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE ?? (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:4321');

export default defineConfig({
  site,
  base: process.env.BASE ?? '/',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
});
