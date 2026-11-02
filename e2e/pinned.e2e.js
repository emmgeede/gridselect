// F16: pinned and recent entries, with real layout and keyboard.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto("/playground/");
  await page.evaluate(() => localStorage.clear());
});

const field = (page) => page.locator("#pinned [data-gridselect-field]");
const heads = (page) => page.locator("#pinned [data-gridselect-group-label]:visible");

test("pinned on top, a pick shows up under Recent after reopening, also after a reload", async ({ page }) => {
  await field(page).click();
  await expect(heads(page)).toHaveText(["Pinned"]);
  await page.locator("#pinned [data-gridselect-search]").fill("yen");
  await expect(heads(page)).toHaveCount(0);
  await page.keyboard.press("Enter");
  await page.reload();
  await field(page).click();
  await expect(heads(page)).toHaveText(["Pinned", "Recent"]);
  await expect(page.locator("#pinned [data-gridselect-group]").nth(1).locator("[data-gridselect-item]:visible")).toHaveText([/Japanese yen/]);
});

test("the list starts on a new row below the top groups, arrow down crosses into it", async ({ page }) => {
  await field(page).click();
  const pinned = page.locator("#pinned [data-gridselect-group] [data-gridselect-item]:visible");
  const firstList = page.locator("#pinned [data-gridselect-section] [data-gridselect-item]").first();
  const bottom = Math.max(...(await pinned.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().bottom))));
  expect((await firstList.boundingBox()).y).toBeGreaterThanOrEqual(bottom - 1);
  await page.keyboard.press("ArrowLeft"); // cursor starts on the chosen entry or the first one
  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowUp");
  await expect(page.locator("#pinned [data-cursor]")).toHaveCount(1);
  expect(await page.locator("#pinned [data-cursor]").evaluate((el) => !!el.closest("[data-gridselect-group]"))).toBe(true);
  await page.keyboard.press("ArrowDown");
  expect(await page.locator("#pinned [data-cursor]").evaluate((el) => !!el.closest("[data-gridselect-group]"))).toBe(false);
});

for (const scheme of ["light", "dark"]) {
  test(`no axe violations with pinned and recent open (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.evaluate(() => localStorage.setItem("gridselect-recent:playground-currency", JSON.stringify(["USD", "GBP"])));
    await field(page).click();
    await expect(heads(page)).toHaveText(["Pinned", "Recent"]);
    const { violations } = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}
