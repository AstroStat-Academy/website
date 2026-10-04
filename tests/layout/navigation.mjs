import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseURL = process.env.TEST_BASE_URL || 'http://localhost:4321';
const routes = ['/', '/schools/', '/hackathons/', '/consulting/', '/people/', '/gallery/', '/acknowledge/'];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  for (const width of [1440, 1280, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    let baseline;
    for (const route of routes) {
      await page.goto(baseURL + route);
      const menu = page.locator('nav.as-nl');
      if (width <= 768) {
        const toggle = page.locator('.as-menu-toggle');
        await toggle.waitFor();
        assert.equal(await toggle.getAttribute('aria-label'), 'Open menu');
        assert.equal(await menu.isVisible(), false);
        assert.equal(await toggle.getAttribute('aria-controls'), await menu.getAttribute('id'));
        const toggleBox = await toggle.boundingBox();
        assert.ok(toggleBox.width >= 44 && toggleBox.height >= 44);
        await toggle.click();
        assert.equal(await menu.isVisible(), true);
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        assert.equal(await toggle.getAttribute('aria-label'), 'Close menu');
        await menu.getByRole('link', { name: 'Home', exact: true }).focus();
        await page.keyboard.press('Escape');
        assert.equal(await menu.isVisible(), false);
        assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        await page.keyboard.press('Enter');
        assert.equal(await menu.isVisible(), true);
      } else {
        assert.equal(await page.locator('.as-menu-toggle').isVisible(), false);
      }
      await menu.getByRole('link', { name: 'Home', exact: true }).waitFor();
      assert.equal(await menu.getByRole('link', { name: 'Home', exact: true }).locator('svg').count(), 1);
      await page.evaluate(() => document.fonts.ready);
      const links = await page.locator('.as-nl a').evaluateAll(elements => elements.map(element => {
        const box = element.getBoundingClientRect();
        const css = getComputedStyle(element);
        return { href: element.getAttribute('href'), current: element.getAttribute('aria-current'),
          x: box.x, y: box.y, width: box.width, height: box.height,
          color: css.color, border: css.borderTopColor, borderWidth: css.borderTopWidth };
      }));
      assert.equal(links.filter(link => link.current === 'page').length, 1);
      assert.equal(links.find(link => link.current === 'page').href, route);
      for (const link of links) {
        assert.equal(link.color, links[0].color, 'Selection must not change text colour');
        assert.equal(link.borderWidth, '1px', 'All links reserve identical border space');
        if (link.current === 'page') assert.notEqual(link.border, 'rgba(0, 0, 0, 0)');
      }
      if (!baseline) baseline = links;
      links.forEach((link, i) => {
        for (const key of ['x', 'y', 'width', 'height']) {
          assert.ok(Math.abs(link[key] - baseline[i][key]) < 1, `${width}px ${route}: ${link.href} changed ${key}`);
        }
      });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
    }
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(baseURL + '/');
  const mobileToggle = page.locator('.as-menu-toggle');
  const mobileMenu = page.locator('nav.as-nl');
  await mobileToggle.focus();
  await page.keyboard.press('Space');
  assert.equal(await mobileMenu.isVisible(), true);
  await mobileMenu.getByRole('link', { name: 'Schools' }).click();
  assert.equal(new URL(page.url()).pathname, '/schools/');
  assert.equal(await page.locator('nav.as-nl').isVisible(), false);
  await page.locator('.as-menu-toggle').click();
  await page.setViewportSize({ width: 1024, height: 900 });
  assert.equal(await page.locator('.as-menu-toggle').isVisible(), false);
  assert.equal(await page.locator('.as-menu-toggle').getAttribute('aria-expanded'), 'false');
  console.log('Navigation positions, mobile disclosure, keyboard controls, link selection, and breakpoint reset passed.');
} finally {
  await browser.close();
}
