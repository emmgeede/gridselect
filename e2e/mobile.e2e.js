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

// F25: phones get a full-screen sheet, touch screens a close button and no digit badges.
import AxeBuilder from "@axe-core/playwright";

test("phone: the sheet covers the screen, title and close button on top, no keyboard, axe clean", async ({ page }) => {
  await page.goto("/playground/");
  await field(page, "filter").scrollIntoViewIfNeeded();
  await field(page, "filter").tap();
  const p = await panel(page, "filter").evaluate((el) => el.getBoundingClientRect().toJSON());
  const vp = page.viewportSize();
  expect([Math.round(p.left), Math.round(p.top), Math.round(p.width), Math.round(p.height)]).toEqual([0, 0, vp.width, vp.height]);
  await expect(page.locator("#filter [data-gridselect-title]")).toHaveText("Currency");
  await expect(page.locator("#filter [data-gridselect-close]")).toBeVisible();
  await expect(page.locator("#filter [data-gridselect-search]")).not.toBeFocused();
  await expect(page.locator("#filter [data-gridselect-key]").first()).toBeHidden();
  const { violations } = await new AxeBuilder({ page }).include("#filter").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(violations).toEqual([]);
  // The list scrolls inside the sheet; tapping close returns to the page.
  expect(await page.locator("#filter [data-gridselect-scroller]").evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await page.locator("#filter [data-gridselect-close]").tap();
  await expect(panel(page, "filter")).toBeHidden();
  await expect(field(page, "filter")).toBeFocused();
});

test("phone: tapping into the search and picking works in the sheet", async ({ page }) => {
  await page.goto("/playground/");
  await field(page, "filter").tap();
  await page.locator("#filter [data-gridselect-search]").tap();
  await page.locator("#filter [data-gridselect-search]").fill("yen");
  await page.locator("#filter [data-gridselect-item]:visible").first().tap();
  await expect(field(page, "filter")).toHaveText("Japanese yen (JPY)");
});

test.describe("tablet", () => {
  const { defaultBrowserType: _, ...iPad } = devices["iPad (gen 7)"];
  test.use({ ...iPad });
  test("normal panel with a close button, digits hidden", async ({ page }) => {
    await page.goto("/playground/");
    await field(page, "filter").tap();
    await expect(panel(page, "filter")).not.toHaveAttribute("data-sheet", "");
    await expect(page.locator("#filter [data-gridselect-close]")).toBeVisible();
    await expect(page.locator("#filter [data-gridselect-title]")).toBeHidden();
    await expect(page.locator("#filter [data-gridselect-key]").first()).toBeHidden();
  });
});

test.describe("desktop", () => {
  test.use({ isMobile: false, hasTouch: false, viewport: { width: 1280, height: 800 } });
  test("unchanged: no head, search focused, digits shown", async ({ page }) => {
    await page.goto("/playground/");
    await field(page, "filter").click();
    await expect(page.locator("#filter [data-gridselect-head]")).toBeHidden();
    await expect(page.locator("#filter [data-gridselect-search]")).toBeFocused();
    await expect(page.locator("#filter [data-gridselect-key]").first()).toBeVisible();
  });
});

test("phone: the sheet keeps square edges in the showcase theme too", async ({ page }) => {
  await page.goto("/demo/");
  await field(page, "filter").tap();
  expect(await panel(page, "filter").evaluate((el) => [getComputedStyle(el).borderTopLeftRadius, getComputedStyle(el).borderTopWidth])).toEqual(["0px", "0px"]);
});
