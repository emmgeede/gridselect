// F18: descriptions as people see and hear them.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { contrast } from "./contrast.js";

for (const scheme of ["light", "dark"]) {
  test(`name, description, contrast, equal rows and axe (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 1400, height: 1000 });
    await page.goto("/playground/");
    await page.locator("#described [data-gridselect-field]").focus();
    await page.keyboard.press("Enter");
    const id = await page.locator(":focus").getAttribute("aria-activedescendant");
    const option = page.locator(`[id="${id}"]`);
    await expect(option).toHaveAccessibleName("Austria");
    await expect(option).toHaveAccessibleDescription("Capital: Vienna");
    expect(await contrast(option.locator("[data-gridselect-description]"))).toBeGreaterThanOrEqual(4.5);
    const items = page.locator("#described [data-gridselect-item]");
    const heights = await items.evaluateAll((els) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().height))).size);
    expect(heights).toBe(1);
    const desc = await items.first().locator("[data-gridselect-description]").boundingBox();
    const label = await items.first().locator("[data-gridselect-label]").boundingBox();
    expect(desc.y).toBeGreaterThan(label.y); // under the label text
    await page.keyboard.type("paris");
    await expect(items.filter({ visible: true })).toHaveCount(1);
    await page.keyboard.press("Enter");
    await expect(page.locator("#described [data-gridselect-field]")).toHaveText("France");
    await page.locator("#described [data-gridselect-field]").click();
    expect(await contrast(page.locator('#described [aria-selected="true"] [data-gridselect-description]'))).toBeGreaterThanOrEqual(4.5);
    const { violations } = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}
