import { test, expect } from "@playwright/test";

test("the minified IIFE works on a page without a bundler", async ({ page }) => {
  await page.goto("/playground/iife.html");
  await expect(page.locator("#iife [data-gridselect-key]").first()).toHaveText("1");
  await page.locator("#iife input").first().focus();
  await page.keyboard.press("3");
  await expect(page.locator("#out")).toHaveText("l");
});
