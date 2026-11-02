// F7: the public demo page.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/demo/");
});

test("shows every variant with the real stylesheet and no test tools", async ({ page }) => {
  for (const id of ["short", "checks", "filter", "highlight", "layout-grid", "layout-flow", "width-full", "width-fixed", "grouped", "pinned", "described", "remote", "watch", "langs", "list", "select"]) await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.locator("#filter [data-gridselect-field]")).toBeVisible();
  await expect(page.locator("#select [data-gridselect-field]")).toHaveText("Choose a country…");
  await expect(page.locator("#log")).toHaveCount(0);
  await expect(page.locator("pre code").first()).toBeVisible();
});

test("the grouped select shows one heading per region", async ({ page }) => {
  await page.locator("#grouped [data-gridselect-field]").click();
  await expect(page.locator("#grouped [data-gridselect-group-label]")).toHaveText(["Europe", "Americas", "Asia-Pacific", "Middle East and Africa"]);
  await expect(page.locator("#grouped [data-gridselect-item]")).toHaveCount(39);
});

test("the mode button cycles auto, light and dark", async ({ page }) => {
  const button = page.locator("#theme");
  await expect(button).toHaveText("Mode: auto");
  await button.click();
  await expect(button).toHaveText("Mode: light");
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
    await page.keyboard.press("Escape");
    await page.locator("#watch [data-gridselect-field]").click();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    await page.locator("#grouped [data-gridselect-field]").click();
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

test("the layouts section shows a wide grid and a flowing list", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.locator("#layout-grid [data-gridselect-field]").click();
  const cols = await page.locator("#layout-grid [data-gridselect-items]").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(cols).toBeGreaterThanOrEqual(4);
  await page.keyboard.press("Escape");
  await page.locator("#layout-flow [data-gridselect-field]").click();
  await expect(page.locator("#layout-flow [data-gridselect-items]")).toHaveClass(/gridselect__items--flow/);
});

// F12: theme picker
const picker = (page) => page.locator("#theme-picker");
const themeSheet = (page) => page.locator("link#theme-css");

test("the theme picker offers Default plus every theme, showcase first chosen", async ({ page }) => {
  const list = await (await page.request.get("/themes/index.json")).json();
  await expect(picker(page).locator("label")).toHaveText(["Default", ...list.map((t) => t.name)].map((n) => new RegExp(n)));
  await expect(picker(page).locator("input:checked")).toHaveValue("showcase");
  await expect(themeSheet(page)).toHaveAttribute("href", "../themes/showcase.css");
  await expect(page.locator("#theme-description")).toHaveText(list.find((t) => t.file === "showcase.css").description);
});

test("picking a theme loads it at once and the choice survives a reload", async ({ page }) => {
  await page.evaluate(() => (window.marker = 1));
  await picker(page).getByText("High contrast").click();
  await expect(themeSheet(page)).toHaveAttribute("href", "../themes/high-contrast.css");
  await expect(page.locator("#theme-description")).toContainText("7:1");
  await expect(page.locator("#filter [data-gridselect-field]")).toHaveCSS("border-top-width", "2px");
  expect(await page.evaluate(() => window.marker)).toBe(1);
  await picker(page).getByText("Default").click();
  expect(await themeSheet(page).evaluate((l) => l.disabled)).toBe(true);
  await picker(page).getByText("Compact").click();
  await page.reload();
  await expect(picker(page).locator("input:checked")).toHaveValue("compact");
  await expect(themeSheet(page)).toHaveAttribute("href", "../themes/compact.css");
});

test("without localStorage, or with an unknown stored theme, the demo uses showcase", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } }));
  await page.goto("/demo/");
  await expect(picker(page).locator("input:checked")).toHaveValue("showcase");
  await picker(page).getByText("Compact").click();
  expect(errors).toEqual([]);

  const page2 = await page.context().newPage();
  await page2.addInitScript(() => localStorage.setItem("gridselect-demo-theme", "gone"));
  await page2.goto("/demo/");
  await expect(page2.locator("#theme-picker input:checked")).toHaveValue("showcase");
});

for (const scheme of ["light", "dark"]) {
  test(`every theme on the demo passes axe (${scheme})`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ colorScheme: scheme });
    const values = await picker(page).locator("input").evaluateAll((els) => els.map((e) => e.value));
    for (const [i, value] of values.entries()) {
      await picker(page).locator("label").nth(i).click();
      await expect(picker(page).locator("input:checked")).toHaveValue(value);
      await page.locator("#filter [data-gridselect-field]").click();
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect.soft(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), value).toEqual([]);
      await page.keyboard.press("Escape");
    }
  });
}

// QA F12 B1: the sidebar is always dark, so the picker's focus ring must stand out against it in every theme.
for (const scheme of ["light", "dark"]) {
  test(`the theme picker's focus indicator keeps 3:1 on the dark sidebar in every theme (${scheme})`, async ({ page }) => {
    const { contrast } = await import("./contrast.js");
    await page.emulateMedia({ colorScheme: scheme });
    const values = await picker(page).locator("input").evaluateAll((els) => els.map((e) => e.value));
    for (const [i, value] of values.entries()) {
      await picker(page).locator("label").nth(i).click();
      await picker(page).locator(`input[value="${value}"]`).focus();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowLeft");
      const label = picker(page).locator("label").nth(i);
      const ring = await label.evaluate((el) => (getComputedStyle(el).outlineStyle === "none" ? "border" : "outline"));
      expect.soft(await contrast(label, ring), `${value} focus`).toBeGreaterThanOrEqual(3);
    }
  });
}

test("the width section shows a full-width and a narrow panel", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  const width = async (id) => {
    await page.locator(`#${id} [data-gridselect-field]`).click();
    const w = await page.locator(`#${id} [data-gridselect-panel]`).evaluate((el) => el.getBoundingClientRect().width);
    await page.keyboard.press("Escape");
    return w;
  };
  const vw = await page.evaluate(() => document.documentElement.clientWidth);
  expect(Math.round(await width("width-full"))).toBe(vw - 20);
  expect(await width("width-fixed")).toBeLessThanOrEqual(42 * 16 + 1);
});
