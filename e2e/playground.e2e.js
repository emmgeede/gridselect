// Runs against playground/index.html, whose CSS styles labels and items with explicit `display`.
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/playground/");
});

const field = (page, id) => page.locator(`#${id} [data-gridselect-field]`);
const search = (page, id) => page.locator(`#${id} [data-gridselect-search]`);
const visibleItems = (page, id) => page.locator(`#${id} [data-gridselect-item]:visible`);

test("above the threshold only the field is visible, not the native labels", async ({ page }) => {
  await expect(field(page, "filter")).toBeVisible();
  await expect(page.locator("#filter > label").first()).toBeHidden();
  expect(await page.locator("#filter > label:visible").count()).toBe(0);
  await expect(page.locator("#filter [data-gridselect-panel]")).toBeHidden();
});

test("below the threshold the native labels stay visible", async ({ page }) => {
  expect(await page.locator("#short > label:visible").count()).toBe(5);
  await expect(page.locator("#short [data-gridselect-field]")).toHaveCount(0);
});

test("filter mode visibly hides non-matches", async ({ page }) => {
  await field(page, "filter").click();
  await expect(search(page, "filter")).toBeFocused();
  expect(await visibleItems(page, "filter").count()).toBe(40);
  await search(page, "filter").fill("dollar");
  await expect(visibleItems(page, "filter")).toHaveCount(6);
  await search(page, "filter").fill("xyz");
  await expect(visibleItems(page, "filter")).toHaveCount(0);
  await expect(page.locator("#filter [data-gridselect-empty]")).toBeVisible();
});

test("highlight mode keeps every item visible", async ({ page }) => {
  await field(page, "highlight").click();
  await search(page, "highlight").fill("dollar");
  await expect(visibleItems(page, "highlight")).toHaveCount(40);
  await expect(page.locator("#highlight [data-gridselect-item][data-match]")).toHaveCount(6);
});

test("arrow down moves exactly one visual row in the real grid", async ({ page }) => {
  await field(page, "highlight").click();
  const cursor = page.locator("#highlight [data-cursor]");
  const before = await cursor.boundingBox();
  await page.keyboard.press("ArrowDown");
  const after = await cursor.boundingBox();
  expect(Math.round(after.x)).toBe(Math.round(before.x));
  expect(after.y).toBeGreaterThan(before.y);
  const rowGap = after.y - before.y;
  expect(rowGap).toBeLessThan(before.height * 2);
});

test("picking an item updates the field, closes the panel and logs one change", async ({ page }) => {
  await field(page, "filter").click();
  await search(page, "filter").fill("yen");
  await page.keyboard.press("Enter");
  await expect(field(page, "filter")).toHaveText("Japanese yen (JPY)");
  await expect(field(page, "filter")).toBeFocused();
  await expect(page.locator("#filter [data-gridselect-panel]")).toBeHidden();
  await expect(page.locator("#log")).toContainText('#filter  change  target=JPY  gs.value="JPY"');
});

test("Escape and outside clicks close without a change", async ({ page }) => {
  await field(page, "filter").click();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(page.locator("#filter [data-gridselect-panel]")).toBeHidden();
  await expect(field(page, "filter")).toHaveText("Swiss franc (CHF)");
  await field(page, "filter").click();
  await page.locator("h1").click();
  await expect(page.locator("#filter [data-gridselect-panel]")).toBeHidden();
});

test("a required group flags and focuses the field on submit", async ({ page }) => {
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(field(page, "required")).toBeFocused();
  await expect(field(page, "required")).toHaveAttribute("aria-invalid", "true");
});

test("destroy shows the native labels again", async ({ page }) => {
  await page.getByRole("button", { name: "destroy() / re-init" }).click();
  expect(await page.locator("#required > label:visible").count()).toBe(21);
});
