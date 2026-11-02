// F23: the panel uses the full window width (10 px margins), short lists stay narrow.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const MARGIN = 10;
const field = (page, id) => page.locator(`#${id} [data-gridselect-field]`);
const panelBox = (page, id) => page.locator(`#${id} [data-gridselect-panel]`).evaluate((el) => el.getBoundingClientRect().toJSON());
const viewWidth = (page) => page.evaluate(() => document.documentElement.clientWidth);

/** Adds a wrapper with `count` short entries above the threshold, built from items. */
async function shortList(page, count) {
  await page.evaluate(async (count) => {
    const { gridselect } = await import("/src/gridselect.js");
    const w = document.createElement("fieldset");
    w.id = "few";
    w.innerHTML = "<legend>Few</legend>";
    document.querySelector("main").prepend(w);
    gridselect(w, { threshold: 2, items: Array.from({ length: count }, (_, i) => `E${i}`) });
  }, count);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/playground/");
});

for (const dir of ["ltr", "rtl"]) {
  test(`full width by default, 10 px from both edges (${dir})`, async ({ page }) => {
    await page.evaluate((dir) => (document.documentElement.dir = dir), dir);
    await field(page, "filter").click();
    const p = await panelBox(page, "filter");
    const vw = await viewWidth(page);
    expect(Math.abs(p.left - MARGIN)).toBeLessThan(1.5);
    expect(Math.abs(p.right - (vw - MARGIN))).toBeLessThan(1.5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}

test("a list that fits one row stays as narrow as needed, under the field", async ({ page }) => {
  await shortList(page, 3);
  await field(page, "few").click();
  const p = await panelBox(page, "few");
  const f = await field(page, "few").evaluate((el) => el.getBoundingClientRect().toJSON());
  expect(p.width).toBeLessThan(700);
  expect(Math.abs(p.left - Math.max(f.left, MARGIN))).toBeLessThan(1.5);
});

test("--gs-panel-max-width caps it; resizing places it again", async ({ page }) => {
  await page.locator("#filter").evaluate((el) => el.style.setProperty("--gs-panel-max-width", "600px"));
  await field(page, "filter").click();
  expect(Math.round((await panelBox(page, "filter")).width)).toBe(600);
  await page.locator("#filter").evaluate((el) => el.style.removeProperty("--gs-panel-max-width"));
  await page.setViewportSize({ width: 1000, height: 900 });
  await expect.poll(async () => Math.round((await panelBox(page, "filter")).right)).toBe((await viewWidth(page)) - MARGIN);
});

test("320 px window: full width, no horizontal scrolling, axe clean", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await field(page, "filter").click();
  const p = await panelBox(page, "filter");
  expect(Math.abs(p.left - MARGIN)).toBeLessThan(1.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const { violations } = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(violations).toEqual([]);
});

test("panelWidth fixed: --gs-panel-width from the field edge, no inline width", async ({ page }) => {
  await page.locator("#filter").evaluate((el) => el.setAttribute("data-panel-width", "fixed"));
  await field(page, "filter").click();
  const panel = page.locator("#filter [data-gridselect-panel]");
  expect(await panel.evaluate((el) => el.style.width + el.style.left)).toBe("");
  const p = await panelBox(page, "filter");
  const f = await field(page, "filter").evaluate((el) => el.getBoundingClientRect().toJSON());
  expect(Math.abs(p.left - f.left)).toBeLessThan(1.5);
  expect(p.width).toBeLessThanOrEqual(640 + 1);
});
