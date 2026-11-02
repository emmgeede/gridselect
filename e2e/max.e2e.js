// F17: limit of a multiple choice, as people see and hear it.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { contrast } from "./contrast.js";

for (const scheme of ["light", "dark"]) {
  test(`locked entries are muted, not struck through, readable and axe-clean (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/playground/");
    const flat = page.locator("#limited > label");
    await flat.nth(0).click();
    await flat.nth(1).click();
    const locked = flat.nth(2);
    await expect(locked).toHaveAttribute("data-limit", "");
    await expect(locked).toHaveCSS("cursor", "not-allowed");
    expect(await locked.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe("none");
    expect(await contrast(locked)).toBeGreaterThanOrEqual(4.5);
    await locked.click({ force: true }); // aria-disabled: Playwright would refuse, a person can still click
    await expect(locked.locator("input")).not.toBeChecked();
    await expect(page.locator('#limited [role="status"]')).toHaveText(/Maximum of 2 reached/);

    await page.locator("#limited-long [data-gridselect-field]").click();
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Enter");
      await page.keyboard.press("ArrowRight");
    }
    const item = page.locator("#limited-long [data-cursor]");
    await expect(item).toHaveAttribute("data-limit", "");
    expect(await item.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe("none");
    expect(await contrast(item.locator("[data-gridselect-label]"))).toBeGreaterThanOrEqual(4.5);
    await page.keyboard.press("Enter");
    await expect(item).toHaveAttribute("aria-selected", "false");
    await expect(page.locator('#limited-long [role="status"]')).toHaveText(/Maximum of 3 reached/);
    const { violations } = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}
