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
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(field(page, "required")).toBeFocused();
  await expect(field(page, "required")).toHaveAttribute("aria-invalid", "true");
});

test("destroy shows the native labels again", async ({ page }) => {
  await page.getByRole("button", { name: "destroy() / re-init" }).click();
  expect(await page.locator("#required > label:visible").count()).toBe(21);
});

test("digits pick below the threshold, with a visible badge per label", async ({ page }) => {
  await expect(page.locator("#short > label").nth(2).locator("[data-gridselect-key]")).toHaveText("3");
  await page.locator("#short input").first().focus();
  await page.keyboard.press("3");
  await expect(page.locator("#short input").nth(2)).toBeChecked();
  await expect(page.locator("#short input").nth(2)).toBeFocused();
  await expect(page.locator("#log")).toContainText("#short  change  target=USD");
});

test("Shift+digit uses the event code, not the shifted character", async ({ page }) => {
  await field(page, "filter").click();
  await page.keyboard.press("Shift+Digit2");
  await expect(field(page, "filter")).toHaveText("Turkish lira (TRY)");
});

test("digits pick in the filtered panel and are never typed", async ({ page }) => {
  await field(page, "filter").click();
  await search(page, "filter").fill("dollar");
  await page.keyboard.press("2");
  await expect(field(page, "filter")).toHaveText("Canadian dollar (CAD)");
});

test("digit badges are visible inside the panel items", async ({ page }) => {
  await field(page, "filter").click();
  await expect(page.locator("#filter [data-gridselect-item]").first().locator("[data-gridselect-key]")).toBeVisible();
});

test("tiers show readable modifier letters before the digit", async ({ page }) => {
  await field(page, "filter").click();
  const key = page.locator("#filter [data-gridselect-item]").nth(10).locator("[data-gridselect-key]");
  await expect(key).toHaveText("1");
  const before = await key.evaluate((el) => getComputedStyle(el, "::before").content);
  expect(before).toBe('"S"');
});

test("a short select shows generated items instead of the native select", async ({ page }) => {
  await expect(page.locator("#size")).toBeHidden();
  expect(await page.locator("#select-short > label[data-gridselect-generated]:visible").count()).toBe(4);
  await page.locator("#select-short label", { hasText: "Medium" }).click();
  await expect(page.locator("#log")).toContainText("#select-short  change  target=m");
});

test("a long select shows only the field, and a panel pick ends up in the form data", async ({ page }) => {
  await expect(page.locator("#country")).toBeHidden();
  await expect(field(page, "select-long")).toHaveText("Choose a country…");
  expect(await page.locator("#select-long > label:visible").count()).toBe(0);
  await field(page, "select-long").click();
  await search(page, "select-long").fill("swi");
  await page.keyboard.press("Enter");
  await expect(field(page, "select-long")).toHaveText("Switzerland");
  await page.getByRole("button", { name: "Submit selects" }).click();
  await expect(page.locator("#log")).toContainText('#selects  submit  FormData: {"size":"","country":"ch","languages":"en"}');
});

test("a required select flags the field on submit", async ({ page }) => {
  await page.getByRole("button", { name: "Submit selects" }).click();
  await expect(field(page, "select-long")).toBeFocused();
  await expect(field(page, "select-long")).toHaveAttribute("aria-invalid", "true");
});

test("generated radios form one native group: one Tab stop, arrows move and select", async ({ page }) => {
  await page.locator("#select-short label", { hasText: "Small" }).click();
  const radios = page.locator("#select-short input[type=radio]");
  await expect(radios.nth(0)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(radios.nth(1)).toBeChecked();
  await expect(radios.nth(1)).toBeFocused();
  await expect(page.locator("#size")).toHaveValue("m");
  await page.keyboard.press("Tab");
  await expect(radios.nth(2)).not.toBeFocused();
});

test("the style button switches to the showcase theme and back", async ({ page }) => {
  const item = page.locator("#short > label").nth(1);
  const plain = await item.evaluate((el) => getComputedStyle(el).borderTopColor);
  await page.locator("#style").click();
  await expect(page.locator("#style")).toHaveText("Style: showcase");
  await expect(item).not.toHaveCSS("border-top-color", plain);
  await page.locator("#style").click();
  await expect(item).toHaveCSS("border-top-color", plain);
});

test("long checkbox group and select multiple: toggling keeps the panel open, form data has all values", async ({ page }) => {
  await field(page, "checks-long").click();
  await search(page, "checks-long").fill("dollar");
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(page.locator("#checks-long [data-gridselect-panel]")).toBeVisible();
  await expect(search(page, "checks-long")).toHaveValue("dollar");
  await expect(field(page, "checks-long")).toHaveText("US dollar (USD), Canadian dollar (CAD)");
  await page.keyboard.press("Escape");

  await field(page, "select-multi").click();
  await search(page, "select-multi").fill("dan");
  await page.keyboard.press("Enter");
  await expect(page.locator("#select-multi [data-gridselect-panel]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(field(page, "select-multi")).toHaveText("English, Danish");
  await expect(page.locator("#log")).toContainText('#select-multi  change  target=en  gs.value=["en","da"]');
  expect(await page.locator("#languages").evaluate((el) => [...el.selectedOptions].map((o) => o.value))).toEqual(["en", "da"]);
});

test("items from JS: setItems switches between flat items and the panel and keeps the choice", async ({ page }) => {
  const wrapper = page.locator("#from-items");
  expect(await wrapper.locator("label:visible").count()).toBe(4);
  await expect(wrapper.locator('input[value="FRA"]')).toBeChecked();
  await page.locator("#items-long").click();
  await expect(field(page, "from-items")).toHaveText("Frankfurt (FRA)");
  expect(await wrapper.locator("label:visible").count()).toBe(0);
  await field(page, "from-items").click();
  await search(page, "from-items").fill("osl");
  await page.keyboard.press("Enter");
  await expect(field(page, "from-items")).toHaveText("Oslo (OSL)");
  await expect(page.locator("#log")).toContainText('#from-items  change  target=OSL  gs.value="OSL"');
  await page.locator("#items-short").click();
  expect(await wrapper.locator("label:visible").count()).toBe(4);
  await expect(page.locator("#log")).toContainText('#from-items  setItems(4)  gs.value=null');
});
