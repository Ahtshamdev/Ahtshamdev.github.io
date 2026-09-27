# Loom & Field

A fictional textile shop and portfolio demo built with Next.js 16, React 19 and TypeScript. Products, makers and stories are illustrative. Nothing is for sale and checkout collects no personal or payment details.

## Local development

Run `npm ci`, then `npm run dev` from this directory.
Production: `npm run build`, then `npm start -- --port 3102`.
Checks: `npm run lint` and `npx tsc --noEmit` after build generates route types.

## Features

Collection filtering and price sorting, product sizes and SVG galleries, a localStorage bag with quantity controls, a keyboard-accessible bag dialog, and an editorial journal. The bag is saved only in the visitor's browser.

Set `NEXT_PUBLIC_SITE_URL` to the deployed origin for canonical links and sitemap URLs. Vercel's production domain is used when available; the fallback is https://loom-and-field-demo.vercel.app. Deploy with this directory as the Vercel project root. `vercel.json` skips builds when this directory has no changes.

Browser verification output belongs in the Git-ignored `.shots/` directory.

From this monorepo, run `node scripts/verify.mjs` while the production server is on port 3102. This uses the root Playwright dependency and installed Chrome to check desktop and 360px layouts, filters, bag persistence, the dialog and demo checkout, and saves screenshots in `.shots/`.
