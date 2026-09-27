import { chromium, expect } from '../../../node_modules/@playwright/test/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function run() {
  const output = fileURLToPath(new URL('../.shots', import.meta.url));
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const results = [];
  for (const [label, width, height] of [['desktop', 1440, 1000], ['mobile', 360, 800]]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    async function capture(name, url) {
      await page.goto(`http://localhost:3102${url}`);
      await expect(page.locator('h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(output, `${label}-${name}.png`), fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await capture('home', '/');
    await capture('shop', '/shop');
    await page.getByRole('navigation', { name: 'Filter by type' }).getByRole('link', { name: /^Runners/ }).click();
    await expect(page.getByRole('heading', { name: 'Runners', exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('5 pieces');
    await page.getByLabel('Sort', { exact: true }).selectOption('price-asc');
    await expect(page).toHaveURL(/type=runner&sort=price-asc/);
    await page.getByRole('navigation', { name: 'Filter by type' }).getByRole('link', { name: /^Throws/ }).click();
    await expect(page).toHaveURL(/type=throw&sort=price-asc/);
    await expect(page.getByRole('heading', { name: 'Throws', exact: true })).toBeVisible();
    await capture('product', '/products/multan-kilim-rust');
    await page.getByRole('button', { name: /^Add to bag/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Added to your bag' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('button', { name: /^Add to bag/ })).toBeFocused();
    await capture('bag', '/bag');
    await expect(page.getByRole('heading', { name: 'Multan kilim, rust', exact: true })).toBeVisible();
    await page.getByRole('button', { name: /^Increase quantity/ }).click();
    await expect(page.getByRole('button', { name: 'Bag, 2 items' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Bag, 2 items' })).toBeVisible();
    await page.getByRole('link', { name: 'Checkout', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Thank you for exploring.' })).toBeVisible();
    expect(await page.locator('input').count()).toBe(0);
    await page.getByRole('link', { name: 'Return to your bag' }).click();
    await page.screenshot({ path: path.join(output, `${label}-checkout-return.png`), fullPage: true });
    await page.getByRole('button', { name: /^Remove / }).click();
    await expect(page.getByText('Your bag is empty.', { exact: true }).first()).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Bag, 0 items' })).toBeVisible();
    await capture('journal', '/journal/six-weeks-on-one-loom');
    expect(errors).toEqual([]);
    const response = await page.goto('http://localhost:3102/missing-page');
    expect(response.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'A loose thread.' })).toBeVisible();
    results.push({ viewport: label, filters: 'passed', bag: 'add, increase, reload persistence, remove passed', dialog: 'Escape and focus return passed', overflow: 'none', errors: errors.filter(e => !e.includes('404 (Not Found)')) });
    await context.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
run().catch(e => { console.error(e); process.exit(1); });
