// F10: <grid-select> in a real browser.
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/playground/");
});

const field = (page, id) => page.locator(`#${id} [data-gridselect-field]`);

test("short element: native radios, arrow keys and digits, options stay invisible", async ({ page }) => {
  const el = page.locator("#el-short");
  await expect(el.locator(":scope > option").first()).toBeHidden();
  await expect(el.locator('input[value="aisle"]')).toBeChecked();
  await el.locator('input[value="aisle"]').focus();
  await page.keyboard.press("1");
  await expect(el.locator('input[value="window"]')).toBeChecked();
  await expect(page.locator("#log")).toContainText('#el-short  change  target=window  el.value="window"');
});

test("long element: panel, search, form data and a required check", async ({ page }) => {
  await page.getByRole("button", { name: "Submit element form" }).click();
  await expect(field(page, "el-long")).toBeFocused();
  await expect(field(page, "el-long")).toHaveAttribute("aria-invalid", "true");
  await expect(field(page, "el-long")).toHaveText("Choose a destination…");
  await field(page, "el-long").click();
  await page.locator("#el-long [data-gridselect-search]").fill("osl");
  await page.keyboard.press("Enter");
  await expect(field(page, "el-long")).toHaveText("Oslo (OSL)");
  await page.getByRole("button", { name: "Submit element form" }).click();
  await expect(page.locator("#log")).toContainText('"destination":"OSL"');
  await expect(page.locator("#log")).toContainText('"seat":"aisle"');
  await expect(page.locator("#log")).toContainText('"meals":"veg"');
});

test("element rebuilds on option and attribute changes, keeping the choice", async ({ page }) => {
  await field(page, "el-long").click();
  await page.locator("#el-long [data-gridselect-search]").fill("rome");
  await page.keyboard.press("Enter");
  await page.locator("#el-add").click();
  await field(page, "el-long").click();
  await page.locator("#el-long [data-gridselect-search]").fill("lis");
  await expect(page.locator("#el-long [data-gridselect-item]:visible")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(field(page, "el-long")).toHaveText("Rome (FCO)");
  await page.locator("#el-highlight").click();
  await field(page, "el-long").click();
  await page.locator("#el-long [data-gridselect-search]").fill("lis");
  await expect(page.locator("#el-long [data-gridselect-item][data-match]")).toHaveCount(1);
  await expect(page.locator("#el-long [data-gridselect-item]:visible")).toHaveCount(15);
});

test("multiple element toggles and keeps the panel open", async ({ page }) => {
  await field(page, "el-multi").click();
  await page.locator("#el-multi [data-gridselect-search]").fill("free");
  await page.keyboard.press("Enter");
  await expect(page.locator("#el-multi [data-gridselect-panel]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(field(page, "el-multi")).toHaveText("Vegetarian, Gluten-free");
});
