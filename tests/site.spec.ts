import { test, expect, type Page } from '@playwright/test';

const pages = ['/', '/resume', '/work/tidewell', '/work/kilo', '/work/dose', '/work/ledger'];

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
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch colour theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('page has the metadata recruiters’ link previews need', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og\.png$/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{60,}/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
