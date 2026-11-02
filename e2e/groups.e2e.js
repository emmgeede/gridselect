// F14: group headings in the panel, with real layout, scrolling and keyboard.
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto("/playground/");
});

/** Boxes of headings and items per group in the open panel of `id`. */
const layoutOf = (page, id) =>
  page.locator(`#${id} [data-gridselect-group]`).evaluateAll((groups) => groups.map((g) => ({
    head: g.querySelector("[data-gridselect-group-label]").getBoundingClientRect().toJSON(),
    items: [...g.querySelectorAll("[data-gridselect-item]")].map((i) => i.getBoundingClientRect().toJSON()),
  })));

for (const id of ["grouped", "grouped-flow", "grouped-list"]) {
  test(`${id}: heading above its group, every group starts a new row at the left edge`, async ({ page }) => {
    await page.locator(`#${id} [data-gridselect-field]`).click();
    const groups = await layoutOf(page, id);
    expect(groups.length).toBe(4);
    const left = groups[0].items[0].left;
    for (const [n, g] of groups.entries()) {
      expect(Math.abs(g.head.left - left)).toBeLessThan(6);
      expect(g.head.bottom).toBeLessThanOrEqual(g.items[0].top + 1);
      expect(Math.abs(g.items[0].left - left)).toBeLessThan(1);
      if (n > 0) expect(g.head.top).toBeGreaterThanOrEqual(Math.max(...groups[n - 1].items.map((b) => b.bottom)) - 1);
    }
  });
}

test("the heading stays at the top while its group scrolls by", async ({ page }) => {
  await page.locator("#grouped [data-gridselect-field]").click();
  const scroller = page.locator("#grouped [data-gridselect-scroller]");
  await scroller.evaluate((el) => {
    el.style.maxHeight = "8rem";
    const europe = el.querySelectorAll("[data-gridselect-group]")[0];
    el.scrollTop = europe.querySelectorAll("[data-gridselect-item]")[8].offsetTop - 10;
  });
  const { head, top, scrolled } = await scroller.evaluate((el) => ({
    head: el.querySelector("[data-gridselect-group-label]").getBoundingClientRect().top,
    top: el.getBoundingClientRect().top + el.clientTop,
    scrolled: el.scrollTop,
  }));
  expect(scrolled).toBeGreaterThan(0);
  expect(Math.abs(head - top)).toBeLessThan(2);
});

test("arrow down jumps from the last row of a group to the nearest item of the next group", async ({ page }) => {
  await page.locator("#grouped [data-gridselect-field]").click();
  for (let i = 0; i < 15; i++) await page.keyboard.press("ArrowRight");
  const cursor = () => page.locator("#grouped [data-cursor]").getAttribute("data-value");
  expect(await cursor()).toBe("GEL");
  const expected = await page.locator("#grouped").evaluate((w) => {
    const centre = (el) => { const r = el.getBoundingClientRect(); return r.left + r.width / 2; };
    const from = centre(w.querySelector("[data-cursor]"));
    const next = [...w.querySelectorAll("[data-gridselect-group]")[1].querySelectorAll("[data-gridselect-item]")];
    const top = next[0].getBoundingClientRect().top;
    return next.filter((i) => Math.abs(i.getBoundingClientRect().top - top) < 2)
      .reduce((a, b) => (Math.abs(centre(b) - from) < Math.abs(centre(a) - from) ? b : a)).dataset.value;
  });
  await page.keyboard.press("ArrowDown");
  expect(await cursor()).toBe(expected);
  await page.keyboard.press("ArrowUp");
  expect(await cursor()).toBe("GEL");
});
