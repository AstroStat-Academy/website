import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseURL = process.env.TEST_BASE_URL || 'http://localhost:4321';
const routes = ['/', '/schools/', '/hackathons/', '/consulting/', '/people/', '/gallery/', '/acknowledge/'];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    let baseline;
    for (const route of routes) {
      await page.goto(baseURL + route);
      await page.locator('.as-nl a').first().waitFor();
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
  console.log('Navigation positions and selected boxes match across all seven pages at five viewport sizes.');
} finally {
  await browser.close();
}
