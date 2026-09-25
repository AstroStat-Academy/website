import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const baseURL = process.env.TEST_BASE_URL || 'http://localhost:4321';
const browser = await chromium.launch();
try {
  for (const profile of [
    { cores: 8, memory: 8, expected: 'animated' },
    { cores: 4, memory: 8, expected: 'static' },
    { cores: 8, memory: 4, expected: 'static' },
    { cores: 8, memory: undefined, touch: true, expected: 'static' },
    { cores: 8, memory: 8, saveData: true, expected: 'static' },
    { cores: 8, memory: 8, reduced: true, expected: 'static' },
  ]) {
    const context = await browser.newContext({ hasTouch: !!profile.touch, reducedMotion: profile.reduced ? 'reduce' : 'no-preference' });
    await context.addInitScript(p => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => p.cores });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => p.memory });
      Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: !!p.saveData }) });
    }, profile);
    const page = await context.newPage();
    await page.goto(baseURL);
    await page.locator('.ps-range').first().waitFor();
    assert.equal(await page.locator('html').getAttribute('data-motion'), profile.expected);
    if (profile.expected === 'static') {
      const canvas = page.locator('.as-home-figure canvas');
      const before = await canvas.evaluate(el => el.toDataURL());
      await page.waitForTimeout(250);
      assert.equal(await canvas.evaluate(el => el.toDataURL()), before, 'Chart must stay frozen');
      await page.getByRole('button', { name: 'Distribution', exact: true }).click();
      const histogram = await canvas.evaluate(el => el.toDataURL());
      await page.getByRole('slider', { name: 'α', exact: true }).focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50);
      assert.notEqual(await canvas.evaluate(el => el.toDataURL()), histogram, 'Frozen chart must respond to input');
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(50);
    assert.equal(await page.locator('html').getAttribute('data-motion'), 'static');
    await page.goto(baseURL + '/schools/');
    await page.locator('.sk-book-preview video').waitFor();
    await page.locator('.sk-book-preview').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.sk-book-preview video').evaluate(el => el.paused), true);
    await context.close();
  }
  const page = await browser.newPage();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['', 'schools/', 'people/', 'gallery/', 'hackathons/', 'consulting/', 'acknowledge/']) {
      await page.goto(baseURL + '/' + route);
      await page.locator('.as-nl').waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}: ${route} overflow`);
    }
  }
} finally { await browser.close(); }
console.log('Motion profiles, live preferences, static chart controls, preview playback and responsive widths passed.');
