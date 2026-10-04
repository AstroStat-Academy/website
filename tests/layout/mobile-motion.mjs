import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const baseURL = process.env.TEST_BASE_URL || 'http://localhost:4321';
const browser = await chromium.launch();
try {
  for (const profile of [
    { cores: 8, memory: 8, expected: 'animated' },
    { cores: 4, memory: 8, expected: 'animated' },
    { cores: 8, memory: 4, expected: 'animated' },
    { cores: 2, memory: 8, expected: 'static' },
    { cores: 8, memory: 2, expected: 'static' },
    { cores: 8, memory: 8, viewport: 390, expected: 'static' },
    { cores: 8, memory: undefined, touch: true, viewport: 390, expected: 'static' },
    { cores: 8, memory: 8, saveData: true, expected: 'static' },
    { cores: 8, memory: 8, reduced: true, expected: 'static' },
  ]) {
    const context = await browser.newContext({ hasTouch: !!profile.touch, viewport: { width: profile.viewport || 1280, height: 900 }, reducedMotion: profile.reduced ? 'reduce' : 'no-preference' });
    await context.addInitScript(p => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => p.cores });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => p.memory });
      Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: !!p.saveData }) });
    }, profile);
    const page = await context.newPage();
    await page.goto(baseURL);
    await page.locator('.ps-range').first().waitFor();
    assert.equal(await page.locator('html').getAttribute('data-motion'), profile.expected);
    if (profile.cores === 8 && profile.memory === 8 && !profile.viewport && !profile.touch && !profile.saveData && !profile.reduced) {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.waitForFunction(() => document.documentElement.dataset.motion === 'static');
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.waitForFunction(() => document.documentElement.dataset.motion === 'animated');
    }
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
    const spin = page.getByRole('group', { name: 'Rotation speed' });
    const globe = page.locator('.sk-sky-fig > svg');
    assert.equal(await spin.getByRole('button', { name: 'Off', exact: true }).getAttribute('aria-pressed'), 'true');
    const still = await globe.innerHTML();
    await page.waitForTimeout(150);
    assert.equal(await globe.innerHTML(), still);
    for (const speed of ['Slow', 'Fast']) {
      await spin.getByRole('button', { name: speed, exact: true }).click();
      const running = await globe.innerHTML();
      await page.waitForTimeout(150);
      assert.notEqual(await globe.innerHTML(), running, `${speed} must activate the globe`);
    }
    await spin.getByRole('button', { name: 'Off', exact: true }).click();
    await spin.getByRole('button', { name: 'Off', exact: true }).waitFor();
    await page.waitForTimeout(50);
    const paused = await globe.innerHTML();
    await page.waitForTimeout(150);
    assert.equal(await globe.innerHTML(), paused);
    await spin.getByRole('button', { name: 'Slow', exact: true }).click();
    await page.reload();
    assert.equal(await spin.getByRole('button', { name: 'Off', exact: true }).getAttribute('aria-pressed'), 'true', 'Saved speed must not autoplay on a constrained device');
    await context.close();
  }
  const resizeContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
  await resizeContext.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
  });
  const resizePage = await resizeContext.newPage();
  await resizePage.goto(baseURL + '/schools/');
  const resizeSpin = resizePage.getByRole('group', { name: 'Rotation speed' });
  await resizePage.waitForFunction(() => document.documentElement.dataset.motion === 'animated');
  assert.equal(await resizeSpin.getByRole('button', { name: 'Off', exact: true }).getAttribute('aria-pressed'), 'false');
  await resizePage.setViewportSize({ width: 390, height: 900 });
  await resizePage.waitForFunction(() => document.documentElement.dataset.motion === 'static');
  await resizePage.waitForFunction(() => document.querySelector('[aria-label="Rotation speed"] [aria-label="Off"]').getAttribute('aria-pressed') === 'true');
  await resizeSpin.getByRole('button', { name: 'Slow', exact: true }).click();
  assert.equal(await resizeSpin.getByRole('button', { name: 'Slow', exact: true }).getAttribute('aria-pressed'), 'true');
  await resizePage.setViewportSize({ width: 1280, height: 900 });
  await resizePage.waitForFunction(() => document.documentElement.dataset.motion === 'animated');
  await resizePage.setViewportSize({ width: 390, height: 900 });
  await resizePage.waitForFunction(() => document.documentElement.dataset.motion === 'static');
  await resizePage.waitForFunction(() => document.querySelector('[aria-label="Rotation speed"] [aria-label="Off"]').getAttribute('aria-pressed') === 'true');
  await resizeContext.close();
  const page = await browser.newPage();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['', 'schools/', 'people/', 'gallery/', 'hackathons/', 'consulting/', 'acknowledge/']) {
      await page.goto(baseURL + '/' + route);
      await page.locator('.as-nl').waitFor({ state: 'attached' });
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}: ${route} overflow`);
    }
  }
} finally { await browser.close(); }
console.log('Motion profiles, live preferences, static chart controls, preview playback and responsive widths passed.');
