import { test, expect, type Page } from '@playwright/test';

const pages = [
  '/',
  '/resume',
  '/work/tidewell',
  '/work/kilo',
  '/work/dose',
  '/work/ledger',
  '/work/dispatch',
  '/work/loom',
];

async function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

for (const path of pages) {
  test(`${path} renders without errors or horizontal scroll`, async ({ page }) => {
    const errors = await collectErrors(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test('every internal link resolves', async ({ page, request }) => {
  const seen = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    const hrefs = await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href')!));
    hrefs.forEach((h) => seen.add(h.split('#')[0] || '/'));
  }
  for (const href of seen) {
    const res = await request.get(href);
    expect(res.status(), href).toBe(200);
  }
});

test('unknown pages show the 404 page', async ({ page }) => {
  const res = await page.goto('/does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'This page isn’t here.' })).toBeVisible();
});

test('navigation fits a 320px screen and keeps its links accessible', async ({ page, isMobile }) => {
  test.skip(isMobile, 'This test explicitly sets its own narrow viewport.');
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of ['/', '/work/dispatch', '/work/loom', '/resume']) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Work', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Résumé', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Contact', exact: true })).toBeVisible();
  }
});

test('sticky phone opens each app as its case study scrolls into view', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The sticky phone is desktop only; mobile shows one phone per project.');
  await page.goto('/');
  await expect(page.locator('.stage [data-layer="home"]')).toHaveClass(/on/);
  for (const slug of ['tidewell', 'kilo', 'dose', 'ledger']) {
    await page.locator(`#${slug}`).scrollIntoViewIfNeeded();
    await page.evaluate((s) => document.getElementById(s)!.scrollIntoView({ block: 'center' }), slug);
    await expect(page.locator(`.stage [data-layer="${slug}"]`)).toHaveClass(/on/);
  }
});

test('theme toggle switches and remembers the colour scheme', async ({ page }) => {
  await page.goto('/'); // dark is the default
  await page.getByRole('button', { name: 'Switch colour theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('page has the metadata recruiters’ link previews need', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og\.png$/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{60,}/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('with reduced motion, content is shown in its final state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const word = page.locator('h1 .w > span').first();
  await expect(word).toHaveCSS('transform', 'none');
  await expect(page.locator('.intro')).toHaveCSS('opacity', '1');
  // Metrics keep their real values instead of counting up.
  await page.locator('#tidewell').scrollIntoViewIfNeeded();
  await expect(page.locator('#tidewell [data-count]').first()).toHaveText('11,400');
});

test('metrics count up to their exact final values', async ({ page }) => {
  await page.goto('/');
  for (const [slug, value] of [['tidewell', '11,400'], ['kilo', '1.8s'], ['loom', '1.2s']]) {
    const cells = page.locator(`#${slug} [data-count]`);
    await cells.first().scrollIntoViewIfNeeded();
    await expect(cells.filter({ hasText: value })).toHaveCount(1, { timeout: 4000 });
  }
});

test('websites render inside browser frames with their domains', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#dispatch .browser')).toContainText('kilo-dispatch-demo.vercel.app');
  await expect(page.locator('#loom .browser')).toContainText('loom-and-field-demo.vercel.app');
});

test('each website links to its live demo in a new tab', async ({ page }) => {
  await page.goto('/');
  for (const [slug, host] of [['dispatch', 'kilo-dispatch-demo'], ['loom', 'loom-and-field-demo']]) {
    const frame = page.locator(`#${slug} a.site-frame`);
    await expect(frame).toHaveAttribute('href', `https://${host}.vercel.app`);
    await expect(frame).toHaveAttribute('target', '_blank');
    await expect(frame).toHaveAttribute('rel', /noopener/);
  }
});

test('the development section lists the NexoHypic app, website and API with honest status', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#development');
  await expect(section.getByRole('heading', { name: 'In development' })).toBeVisible();
  for (const slug of ['nexohypic-app', 'nexohypic-web', 'nexohypic-api']) await expect(section.locator(`#${slug}`)).toBeVisible();
  const site = section.locator('#nexohypic-web a', { hasText: 'Open the website' });
  await expect(site).toHaveAttribute('href', 'https://nexohypic-web.vercel.app');
  await expect(site).toHaveAttribute('rel', /noopener/);
  await expect(section.locator('#nexohypic-app')).toContainText('Test build');
});

test('the 3D backdrop starts, and the page works without WebGL', async ({ page, browser }) => {
  await page.goto('/');
  await expect(page.locator('canvas.scene.ready')).toHaveCount(1, { timeout: 8000 });
  const ctx = await browser.newContext();
  const bare = await ctx.newPage();
  await bare.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return /webgl/.test(type) ? null : original.call(this, type as '2d', ...(rest as []));
    } as typeof original;
  });
  const errors: string[] = [];
  bare.on('pageerror', (e) => errors.push(e.message));
  await bare.goto('/');
  await expect(bare.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(bare.locator('canvas.scene.ready')).toHaveCount(0);
  expect(errors).toEqual([]);
  await ctx.close();
});
