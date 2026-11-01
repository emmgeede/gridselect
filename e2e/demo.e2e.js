// F7: the public demo page.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/demo/");
});

test("shows every variant with the real stylesheet and no test tools", async ({ page }) => {
  for (const id of ["short", "checks", "filter", "highlight", "list", "select"]) await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.locator("#filter [data-gridselect-field]")).toBeVisible();
  await expect(page.locator("#select [data-gridselect-field]")).toHaveText("Choose a country…");
  await expect(page.locator("#log")).toHaveCount(0);
  await expect(page.locator("pre code").first()).toBeVisible();
});

test("the theme button cycles auto, light and dark", async ({ page }) => {
  const button = page.locator("#theme");
  await button.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await button.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await button.click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
});

for (const scheme of ["light", "dark"]) {
  test(`no axe violations on the demo (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.locator("#filter [data-gridselect-field]").click();
    await page.locator("#filter [data-gridselect-search]").fill("dollar");
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}
