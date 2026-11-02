// F6: the default stylesheet, checked in a real browser. See docs/features/F6-standard-css/spec.md.
import { test, expect } from "@playwright/test";
import { contrast } from "./contrast.js";

test.beforeEach(async ({ page }) => {
  await page.goto("/playground/");
});

const field = (page, id) => page.locator(`#${id} [data-gridselect-field]`);
const items = (page, id) => page.locator(`#${id} [data-gridselect-item]`);

test("the stylesheet sits in @layer gridselect and page rules win", async ({ page }) => {
  const layered = await page.evaluate(() => [...document.styleSheets].some((sheet) =>
    sheet.href?.endsWith("/src/gridselect.css") && [...sheet.cssRules].length > 0 &&
    [...sheet.cssRules].every((r) => r instanceof CSSLayerBlockRule && r.name === "gridselect")));
  expect(layered).toBe(true);
  await page.addStyleTag({ content: ".gridselect__item { background: rgb(255, 0, 0); }" });
  await field(page, "filter").click();
  await expect(items(page, "filter").nth(5)).toHaveCSS("background-color", "rgb(255, 0, 0)");
});

test("a --gs-accent override on the wrapper colours the selected item", async ({ page }) => {
  await page.locator("#filter").evaluate((el) => el.style.setProperty("--gs-accent", "rgb(200, 0, 0)"));
  await field(page, "filter").click();
  await expect(page.locator('#filter [aria-selected="true"]')).toHaveCSS("background-color", "rgb(200, 0, 0)");
});

test("light, dark and data-theme pick the right tokens", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await expect(field(page, "filter")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(field(page, "filter")).toHaveCSS("background-color", "rgb(23, 29, 40)");
  await page.evaluate(() => (document.documentElement.dataset.theme = "light"));
  await expect(field(page, "filter")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.emulateMedia({ colorScheme: "light" });
  await page.evaluate(() => (document.documentElement.dataset.theme = "dark"));
  await expect(field(page, "filter")).toHaveCSS("background-color", "rgb(23, 29, 40)");
});

for (const scheme of ["light", "dark"]) {
  test(`text and borders meet WCAG AA contrast in ${scheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    const text = [];
    const lines = [];
    text.push(["field", field(page, "filter")]);
    text.push(["flat item", page.locator("#short > label").nth(1)]);
    text.push(["flat selected", page.locator("#short > label").nth(0)]);
    text.push(["flat key", page.locator("#short > label").nth(1).locator("[data-gridselect-key]")]);
    text.push(["selected key", page.locator("#short > label").nth(0).locator("[data-gridselect-key]")]);
    lines.push(["field border", field(page, "filter"), "border"]);
    lines.push(["flat border", page.locator("#short > label").nth(1), "border"]);

    await field(page, "highlight").click();
    await page.locator("#highlight [data-gridselect-search]").fill("dollar");
    text.push(["search", page.locator("#highlight [data-gridselect-search]")]);
    text.push(["match", page.locator("#highlight [data-match]").first().locator("[data-gridselect-label]")]);
    text.push(["dimmed", page.locator("#highlight [data-dimmed]").first().locator("[data-gridselect-label]")]);
    text.push(["panel key", page.locator("#highlight [data-dimmed]").first().locator("[data-gridselect-key]")]);
    lines.push(["panel border", page.locator("#highlight [data-gridselect-panel]"), "border"]);
    lines.push(["item border", page.locator("#highlight [data-dimmed]").first(), "border"]);
    lines.push(["search border", page.locator("#highlight [data-gridselect-search]"), "border"]);
    lines.push(["cursor ring", page.locator("#highlight [data-cursor]"), "outline"]);

    for (const [name, loc] of text) expect.soft(await contrast(loc), `${name} text`).toBeGreaterThanOrEqual(4.5);
    for (const [name, loc, kind] of lines) expect.soft(await contrast(loc, kind), name).toBeGreaterThanOrEqual(3);

    await page.keyboard.press("Escape");
    await field(page, "filter").click();
    await page.keyboard.press("Enter");
    text.push(["selected item", page.locator('#filter [aria-selected="true"] [data-gridselect-label]')]);
    await field(page, "filter").click();
    expect.soft(await contrast(page.locator('#filter [aria-selected="true"] [data-gridselect-label]')), "selected item").toBeGreaterThanOrEqual(4.5);
    expect.soft(await contrast(page.locator('#filter [aria-selected="true"] [data-gridselect-key]')), "selected panel key").toBeGreaterThanOrEqual(4.5);

    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    expect.soft(await contrast(field(page, "required"), "border"), "invalid border").toBeGreaterThanOrEqual(3);
  });
}

test("flat labels look like items with a hidden but focusable input", async ({ page }) => {
  const label = page.locator("#short > label").nth(1);
  const input = label.locator("input");
  await expect(label).not.toHaveCSS("border-top-style", "none");
  expect(parseFloat(await label.evaluate((el) => getComputedStyle(el).borderTopLeftRadius))).toBeGreaterThan(0);
  await expect(input).toHaveCSS("opacity", "0");
  await expect(input).not.toHaveCSS("display", "none");
  const accent = await page.locator("#short").evaluate((el) => getComputedStyle(el).getPropertyValue("--gs-accent").trim());
  expect(accent).not.toBe("");
  await expect(page.locator("#short > label").nth(0)).not.toHaveCSS("background-color", await label.evaluate((el) => getComputedStyle(el).backgroundColor));
  await page.locator("#short > label").nth(0).click();
  await page.keyboard.press("ArrowRight");
  await expect(label).not.toHaveCSS("outline-style", "none");
});

test("the field has a caret, a red border when invalid and looks disabled when disabled", async ({ page }) => {
  const caret = await field(page, "filter").evaluate((el) => getComputedStyle(el, "::after").content);
  expect(caret).not.toBe("none");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  const invalid = await page.locator("#required").evaluate((el) => getComputedStyle(el).getPropertyValue("--gs-invalid").trim());
  expect(invalid).not.toBe("");
  await expect(field(page, "required")).not.toHaveCSS("border-top-color", await field(page, "filter").evaluate((el) => getComputedStyle(el).borderTopColor));
  await field(page, "filter").evaluate((el) => (el.disabled = true));
  expect(Number(await field(page, "filter").evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(1);
});

test("the panel sits under the field, is sized and scrolls (panelHeight and panelWidth fixed)", async ({ page }) => {
  await page.locator("#filter").evaluate((el) => {
    el.setAttribute("data-panel-height", "fixed");
    el.setAttribute("data-panel-width", "fixed");
  });
  await field(page, "filter").click();
  const panel = page.locator("#filter [data-gridselect-panel]");
  await expect(panel).toHaveCSS("position", "absolute");
  const f = await field(page, "filter").boundingBox();
  const p = await panel.boundingBox();
  expect(Math.abs(p.x - f.x)).toBeLessThan(2);
  expect(p.y).toBeGreaterThanOrEqual(f.y + f.height);
  expect(p.y - (f.y + f.height)).toBeLessThan(12);
  expect(p.width).toBeLessThanOrEqual(640 + 1);
  const scroller = page.locator("#filter [data-gridselect-scroller]");
  await expect(scroller).toHaveCSS("overflow-y", "auto");
  expect((await scroller.boundingBox()).height).toBeLessThanOrEqual(18 * 16 + 1);
});

test("grid layout has several columns, list layout exactly one", async ({ page }) => {
  await field(page, "filter").click();
  const grid = await page.locator("#filter [data-gridselect-items]").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(grid).toBeGreaterThan(1);
  await page.keyboard.press("Escape");
  await field(page, "list").click();
  const list = await page.locator("#list [data-gridselect-items]").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(list).toBe(1);
});

test("item states differ in more than colour", async ({ page }) => {
  await field(page, "required").click();
  const disabled = page.locator('#required [aria-disabled="true"] [data-gridselect-label]');
  expect(await disabled.evaluate((el) => getComputedStyle(el.parentElement).textDecorationLine)).toContain("line-through");
  await page.keyboard.press("Escape");
  await field(page, "highlight").click();
  await page.locator("#highlight [data-gridselect-search]").fill("dollar");
  const weight = (loc) => loc.evaluate((el) => Number(getComputedStyle(el).fontWeight));
  expect(await weight(page.locator("#highlight [data-match]").first())).toBeGreaterThanOrEqual(600);
  const dimmed = page.locator("#highlight [data-dimmed]").first();
  expect(await weight(dimmed)).toBeLessThanOrEqual(400);
  await expect(dimmed).toHaveCSS("opacity", "1");
  await expect(page.locator("#highlight [data-cursor]")).not.toHaveCSS("outline-style", "none");
  await page.keyboard.press("Escape");
  await field(page, "filter").click();
  expect(await weight(page.locator('#filter [aria-selected="true"]'))).toBeGreaterThanOrEqual(600);
});

test("digit badges: monospace, readable size, letters before the digit, hidden when empty", async ({ page }) => {
  await field(page, "filter").click();
  const key = items(page, "filter").nth(10).locator("[data-gridselect-key]");
  const s = await key.evaluate((el) => ({ font: getComputedStyle(el).fontFamily, size: parseFloat(getComputedStyle(el).fontSize),
    nums: getComputedStyle(el).fontVariantNumeric, before: getComputedStyle(el, "::before").content }));
  expect(s.font).toMatch(/mono/i);
  expect(s.size).toBeGreaterThanOrEqual(12);
  expect(s.nums).toContain("tabular-nums");
  expect(s.before).toBe('"S"');
  await page.locator("#filter [data-gridselect-search]").fill("dollar");
  await expect(items(page, "filter").nth(0).locator("[data-gridselect-key]")).toBeHidden();
});

test("increased text spacing clips nothing (WCAG 1.4.12)", async ({ page }) => {
  await page.addStyleTag({ content: "* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }" });
  await field(page, "filter").click();
  const clipped = await page.evaluate(() => [...document.querySelectorAll(
    "[data-gridselect-item]:not([hidden]), [data-gridselect-field], #short > label")]
    .filter((el) => el.offsetParent && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1))
    .map((el) => el.textContent.trim()));
  expect(clipped).toEqual([]);
});

test("no horizontal scrolling at 320 px with the panel open (WCAG 1.4.10)", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await field(page, "filter").click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("no transitions or animations, items at least 24 px and 32 px high", async ({ page }) => {
  await field(page, "filter").click();
  const moving = await page.evaluate(() => [...document.querySelectorAll("[data-gridselect], [data-gridselect] *")]
    .filter((el) => getComputedStyle(el).transitionDuration.split(",").some((d) => parseFloat(d) > 0) ||
      getComputedStyle(el).animationName !== "none").length);
  expect(moving).toBe(0);
  const box = await items(page, "filter").first().boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(32);
  expect(box.width).toBeGreaterThanOrEqual(24);
  const flat = await page.locator("#short > label").first().boundingBox();
  expect(flat.height).toBeGreaterThanOrEqual(32);
});

test("right-to-left: the panel opens under the field (QA F6, fixed width)", async ({ page }) => {
  await page.evaluate(() => (document.documentElement.dir = "rtl"));
  await page.locator("#filter").evaluate((el) => el.setAttribute("data-panel-width", "fixed"));
  await field(page, "filter").click();
  const f = await field(page, "filter").boundingBox();
  const p = await page.locator("#filter [data-gridselect-panel]").boundingBox();
  expect(Math.abs(p.x + p.width - (f.x + f.width))).toBeLessThan(2);
});

for (const style of ["default", "showcase"]) {
  test(`grid rows share one height and labels line up (${style})`, async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 900 });
    if (style === "showcase") await page.locator("#style").click();
    await field(page, "filter").click();
    const rows = await items(page, "filter").evaluateAll((els) => els.slice(0, 24).map((el) => {
      const r = el.getBoundingClientRect();
      const label = el.querySelector("[data-gridselect-label]").getBoundingClientRect();
      return { h: Math.round(r.height), labelOffset: Math.round(label.left - r.left) };
    }));
    expect(new Set(rows.map((r) => r.h)).size, "one item height").toBe(1);
    expect(new Set(rows.map((r) => r.labelOffset)).size, "labels start at the same offset").toBe(1);
    const gap = await page.evaluate(() => {
      const s = document.querySelector("#filter [data-gridselect-search]").getBoundingClientRect();
      const l = document.querySelector("#filter [data-gridselect-items]").getBoundingClientRect();
      return l.top - s.bottom;
    });
    expect(gap, "space between search and list").toBeGreaterThanOrEqual(style === "showcase" ? 10 : 8);
  });
}
