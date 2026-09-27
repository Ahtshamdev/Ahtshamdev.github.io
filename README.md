# Portfolio

Personal portfolio for a mobile and full-stack engineer: four case studies, an experience timeline and a printable résumé.

The home page pairs each case study with a phone that opens the matching app as you scroll. The app screens are HTML and CSS rather than screenshots, so they stay sharp at any size and in any theme.

## Stack

- [Astro](https://astro.build) static site, TypeScript in strict mode
- Hand-written CSS with design tokens, plus light and dark themes
- Self-hosted Schibsted Grotesk variable font
- Playwright end-to-end tests on desktop and mobile viewports
- GitHub Actions: type check, test, then deploy to GitHub Pages

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run check      # type check
npm test           # builds, serves and runs the Playwright suite
npm run build      # static output in dist/
```

## Edit the content

All copy lives in [`src/data/site.ts`](src/data/site.ts): profile, projects, metrics, experience and skills. The home page, case studies and résumé all read from it, so a change there updates every page.

To add a case study, add an entry to `projects` and `architecture`. Then add its phone screen in `src/components/Screen.astro` and its icon in `src/components/AppGlyph.astro`.

## Structure

```
src/
  data/site.ts          content
  components/           Phone frame, app screens, app icons
  layouts/Base.astro    header, footer, SEO and theme
  pages/                home, work/[slug], résumé, 404
  styles/global.css     tokens and base styles
tests/                  Playwright specs
```

## Quality

- Lays out from 320px up with no horizontal scroll
- Keyboard focus is visible, with a skip link and semantic landmarks
- Respects `prefers-reduced-motion` and `prefers-color-scheme`
- Open Graph image, sitemap, canonical URLs and robots.txt
- Résumé page prints to a single clean page (use "Save as PDF")
