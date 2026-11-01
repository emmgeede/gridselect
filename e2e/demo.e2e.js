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

for (const scheme of ["light", "dark"]) {
  test(`showcase theme keeps 3:1 for chevron and focus, and marks the selection without colour (${scheme})`, async ({ page }) => {
    const { contrast } = await import("./contrast.js");
    await page.emulateMedia({ colorScheme: scheme });
    const field = page.locator("#filter [data-gridselect-field]");
    const chevron = await field.evaluate((el) => {
      const s = getComputedStyle(el, "::after");
      return { color: s.borderRightColor, bg: getComputedStyle(el).backgroundColor };
    });
    expect(await page.evaluate(({ color, bg }) => {
      const p = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number);
      const l = (c) => { const [r, g, b] = p(c).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const [a, b] = [l(color), l(bg)];
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }, chevron), "chevron").toBeGreaterThanOrEqual(3);
    await field.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    expect(await contrast(field, "border"), "focused field border").toBeGreaterThanOrEqual(3);
    await field.click();
    expect(await contrast(page.locator("#filter [data-gridselect-search]"), "border"), "focused search border").toBeGreaterThanOrEqual(3);
    const cursor = await page.locator("#filter [data-cursor]").evaluate((el) => getComputedStyle(el).boxShadow);
    expect(cursor).toContain("inset");
    const check = await page.locator('#filter [aria-selected="true"]').evaluate((el) => getComputedStyle(el, "::after").borderRightStyle);
    expect(check).toBe("solid");
    const layered = await page.evaluate(() => [...document.styleSheets].some((s) => s.href?.endsWith("/themes/showcase.css") &&
      [...s.cssRules].every((r) => r instanceof CSSLayerBlockRule && r.name === "gridselect-showcase")));
    expect(layered).toBe(true);
  });
}
