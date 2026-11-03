// Phones: no focus zoom on iOS, the panel stays above the on-screen keyboard.
import { test, expect, devices } from "@playwright/test";

const { defaultBrowserType, ...iPhone } = devices["iPhone 13"];
test.use({ ...iPhone });

const field = (page, id) => page.locator(`#${id} [data-gridselect-field]`);
const panel = (page, id) => page.locator(`#${id} [data-gridselect-panel]`);
const fontSize = (loc) => loc.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

// iOS zooms the page when an input under 16 px gets focus, and the zoomed page no longer fits.
for (const path of ["/playground/", "/demo/"]) {
  test(`touch screen: the search input is at least 16 px, so iOS does not zoom (${path})`, async ({ page }) => {
    await page.goto(path);
    await field(page, "filter").tap();
    expect(await fontSize(page.locator("#filter [data-gridselect-search]"))).toBeGreaterThanOrEqual(16);
  });
}

test("touch screen: every theme keeps the search input at 16 px", async ({ page }) => {
  await page.goto("/demo/");
  for (const name of ["Default", "Compact", "High contrast", "Showcase"]) {
    await page.locator("#theme-picker label", { hasText: name }).tap();
    await field(page, "filter").scrollIntoViewIfNeeded();
    await field(page, "filter").tap();
    expect(await fontSize(page.locator("#filter [data-gridselect-search]")), name).toBeGreaterThanOrEqual(16);
    await page.keyboard.press("Escape");
  }
});

test("keyboard open: the panel fits into the visible part above the keyboard", async ({ page }) => {
  await page.goto("/playground/");
  await field(page, "filter").evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 60));
  await field(page, "filter").tap();
  // Simulate the on-screen keyboard: the visual viewport shrinks, the layout viewport does not.
  const visible = await page.evaluate(() => {
    const vv = window.visualViewport;
    const height = Math.round(vv.height * 0.55);
    Object.defineProperty(vv, "height", { configurable: true, get: () => height });
    vv.dispatchEvent(new Event("resize"));
    return height;
  });
  await expect.poll(async () => (await panel(page, "filter").evaluate((el) => el.getBoundingClientRect().bottom))).toBeLessThanOrEqual(visible);
  // The list still scrolls inside the panel.
  expect(await page.locator("#filter [data-gridselect-scroller]").evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
});

test("phone width: no horizontal scrolling with the panel open, on the demo and in the docs", async ({ page }) => {
  for (const [url, loc] of [["/demo/", "#filter"], ["http://localhost:5174/docs/guide/panel.html", ".gs-example"]]) {
    await page.goto(url);
    const f = page.locator(`${loc} [data-gridselect-field]`).first();
    await f.scrollIntoViewIfNeeded();
    await f.tap();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), url).toBe(true);
    const p = await page.locator(`${loc} [data-gridselect-panel]`).first().evaluate((el) => el.getBoundingClientRect().toJSON());
    expect(p.right, url).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
  }
});
