// F15: auto column width and flow layout, with real geometry.
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto("/playground/");
  await page.locator("#style").click(); // showcase theme
});

const columns = (page, id) => page.locator(`#${id} [data-gridselect-items]`).evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
const wrapped = (page, id) => page.locator(`#${id} [data-gridselect-label]`).evaluateAll((els) =>
  els.filter((e) => e.offsetParent && e.getClientRects().length > 1).map((e) => e.textContent));

test("short labels get as many columns as fit (countries: at least 4)", async ({ page }) => {
  await page.locator("#required [data-gridselect-field]").click();
  expect(await columns(page, "required")).toBeGreaterThanOrEqual(4);
  expect(await wrapped(page, "required")).toEqual([]);
});

test("long labels fit on one line when there is room (currencies: at least 2 columns)", async ({ page }) => {
  await page.locator("#filter [data-gridselect-field]").click();
  expect(await columns(page, "filter")).toBeGreaterThanOrEqual(2);
  expect(await wrapped(page, "filter")).toEqual([]);
});

test("a narrow panel keeps two columns and lets only long labels wrap", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 1000 });
  await page.locator("#filter [data-gridselect-field]").click();
  expect(await columns(page, "filter")).toBe(2);
  const heights = await page.locator("#filter [data-gridselect-item]").evaluateAll((els) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().height))).size);
  expect(heights).toBe(1);
});

test("flow layout packs items and arrow down goes to the nearest item below", async ({ page }) => {
  await page.locator("#flow [data-gridselect-field]").click();
  const items = page.locator("#flow [data-gridselect-item]");
  const boxes = await items.evaluateAll((els) => els.slice(0, 12).map((e) => e.getBoundingClientRect().toJSON()));
  const rows = new Set(boxes.map((b) => Math.round(b.top)));
  expect(rows.size).toBeLessThan(boxes.length); // several items share a row
  const widths = new Set(boxes.map((b) => Math.round(b.width)));
  expect(widths.size).toBeGreaterThan(1); // width follows the content
  // Positions relative to the list, measured in one go: the page may scroll to keep the cursor visible.
  const where = () => page.locator("#flow").evaluate((w) => {
    const list = w.querySelector("[data-gridselect-items]").getBoundingClientRect();
    const rel = (e) => { const r = e.getBoundingClientRect(); return { top: r.top - list.top, centre: r.left + r.width / 2 - list.left, height: r.height }; };
    const cur = rel(w.querySelector("[data-cursor]"));
    const others = [...w.querySelectorAll("[data-gridselect-item]")].map(rel);
    return { cur, others };
  });
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const before = (await where()).cur;
  await page.keyboard.press("ArrowDown");
  const { cur: after, others } = await where();
  const nextTop = Math.min(...others.filter((o) => o.top >= before.top + before.height - 1).map((o) => o.top));
  expect(after.top).toBeCloseTo(nextTop, 0);
  const nearest = Math.min(...others.filter((o) => Math.abs(o.top - nextTop) < 2).map((o) => Math.abs(o.centre - before.centre)));
  expect(Math.abs(after.centre - before.centre)).toBeCloseTo(nearest, 0);
  await page.keyboard.press("ArrowUp");
  expect((await where()).cur.top).toBeCloseTo(before.top, 0);
});
