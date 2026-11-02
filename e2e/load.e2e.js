// F20: entries from a server, with real keys and timing.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const axe = async (page) => (await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze()).violations;

for (const scheme of ["light", "dark"]) {
  test(`loading, typing, picking with the keyboard, axe (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/playground/");
    const field = page.locator("#remote [data-gridselect-field]");
    await field.focus();
    await page.keyboard.press("Enter");
    const message = page.locator("#remote [data-gridselect-empty]");
    await expect(message).toHaveText("Loading…");
    await expect(page.locator('#remote [role="status"]')).toHaveText("Loading…");
    expect(await axe(page)).toEqual([]);
    await expect(message).toBeHidden();
    await expect(page.locator("#remote [data-gridselect-item]:visible")).toHaveCount(40);
    await page.keyboard.type("dol");
    await expect(page.locator("#remote [data-gridselect-search]")).toBeFocused();
    await expect(page.locator("#remote [data-gridselect-item]:visible")).toHaveCount(6, { timeout: 3000 });
    await expect(page.locator('#remote [role="status"]')).toHaveText("6 results");
    await expect(page.locator("#remote [data-gridselect-search]")).toBeFocused();
    await expect(page.locator("#remote [data-gridselect-search]")).toHaveValue("dol");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(field).toBeFocused();
    await expect(field).toHaveText("Canadian dollar (CAD)");
    expect(await axe(page)).toEqual([]);
  });
}
