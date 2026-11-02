// F22: the panel opens towards the room it needs and grows up to the window edge.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const MARGIN = 8;
const field = (page, id) => page.locator(`#${id} [data-gridselect-field]`);
const panel = (page, id) => page.locator(`#${id} [data-gridselect-panel]`);
/** Scrolls the page so the field's top sits `y` px below the window's top. */
const putFieldAt = (page, id, y) => field(page, id).evaluate((el, y) => window.scrollBy(0, el.getBoundingClientRect().top - y), y);
const box = (loc) => loc.evaluate((el) => el.getBoundingClientRect().toJSON());

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/playground/");
});

test("near the top: opens down, as tall as the content allows up to the window edge", async ({ page }) => {
  await putFieldAt(page, "filter", 40);
  await field(page, "filter").click();
  const p = await box(panel(page, "filter"));
  const f = await box(field(page, "filter"));
  expect(await panel(page, "filter").getAttribute("data-placement")).toBeNull();
  expect(p.top).toBeGreaterThanOrEqual(f.bottom);
  expect(p.bottom).toBeLessThanOrEqual(900 - MARGIN + 1);
  // Uses the room: either it reaches the window edge or the whole list shows without scrolling.
  const scroller = page.locator("#filter [data-gridselect-scroller]");
  const fits = await scroller.evaluate((el) => el.scrollHeight - el.clientHeight <= 1);
  expect(fits || p.bottom > 900 - MARGIN - 40).toBe(true);
});

test("near the bottom: opens up and stays inside the window", async ({ page }) => {
  await putFieldAt(page, "filter", 800);
  await field(page, "filter").click();
  await expect(panel(page, "filter")).toHaveAttribute("data-placement", "top");
  const p = await box(panel(page, "filter"));
  const f = await box(field(page, "filter"));
  expect(p.bottom).toBeLessThanOrEqual(f.top + 1);
  expect(p.top).toBeGreaterThanOrEqual(MARGIN - 1);
  const { violations } = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(violations).toEqual([]);
});

test("never taller than the content; when it all fits below it opens down", async ({ page }) => {
  await putFieldAt(page, "filter", 500);
  await field(page, "filter").click();
  await page.keyboard.type("krone");
  const scroller = page.locator("#filter [data-gridselect-scroller]");
  expect(await scroller.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
  await page.keyboard.press("Escape");
  await page.locator("#grouped [data-gridselect-field]").scrollIntoViewIfNeeded();
  await putFieldAt(page, "pinned", 450); // a long list: does not fit below 450 px → up (more room above)
  await field(page, "pinned").click();
  await expect(panel(page, "pinned")).toHaveAttribute("data-placement", "top");
});

test("follows scrolling and resizing while open, and stops after closing", async ({ page }) => {
  await putFieldAt(page, "filter", 40);
  await field(page, "filter").click();
  expect(await panel(page, "filter").getAttribute("data-placement")).toBeNull();
  await putFieldAt(page, "filter", 800);
  await expect(panel(page, "filter")).toHaveAttribute("data-placement", "top");
  await page.setViewportSize({ width: 1400, height: 2600 }); // now everything fits below
  await expect(panel(page, "filter")).not.toHaveAttribute("data-placement", "top");
  await page.keyboard.press("Escape");
  const before = await page.locator("#filter [data-gridselect-scroller]").evaluate((el) => el.style.maxHeight);
  await page.setViewportSize({ width: 1400, height: 500 });
  expect(await page.locator("#filter [data-gridselect-scroller]").evaluate((el) => el.style.maxHeight)).toBe(before);
});

test("too little room on both sides: opens down with 10rem", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 260 });
  await putFieldAt(page, "filter", 110);
  await field(page, "filter").click();
  expect(await panel(page, "filter").getAttribute("data-placement")).toBeNull();
  const h = await page.locator("#filter [data-gridselect-scroller]").evaluate((el) => el.getBoundingClientRect().height);
  expect(Math.round(h)).toBe(160);
});

test("panelHeight fixed: always down, CSS height, no inline styles", async ({ page }) => {
  await page.locator("#filter").evaluate((el) => el.setAttribute("data-panel-height", "fixed"));
  await putFieldAt(page, "filter", 800);
  await field(page, "filter").click();
  expect(await panel(page, "filter").getAttribute("data-placement")).toBeNull();
  const scroller = page.locator("#filter [data-gridselect-scroller]");
  expect(await scroller.evaluate((el) => el.style.maxHeight)).toBe("");
  expect(await scroller.evaluate((el) => getComputedStyle(el).maxHeight)).toBe("288px"); // 18rem
});
