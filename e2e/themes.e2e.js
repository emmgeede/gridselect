// F12: every file in themes/ passes the same accessibility gate, without editing this test.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { contrast } from "./contrast.js";
import { themeList } from "../scripts/themes.js";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const field = (page, id) => page.locator(`#${id} [data-gridselect-field]`);

/** Playground with only gridselect.css plus the theme `file` (or no theme). */
async function withTheme(page, scheme, file) {
  await page.emulateMedia({ colorScheme: scheme });
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto("/playground/");
  await page.evaluate(() => (document.getElementById("showcase").disabled = true));
  if (file) await page.addStyleTag({ url: `/themes/${file}` });
}

for (const theme of themeList("themes")) {
  const source = readFileSync(`themes/${theme.file}`, "utf8");
  const base = theme.file.replace(/\.css$/, "");
  const minText = /@contrast\s+AAA/.test(source) ? 7 : 4.5;

  test(`${theme.file}: header and own layer`, async ({ page }) => {
    expect(theme.name, "@name").not.toBe(base);
    expect(theme.description, "@description").not.toBe("");
    expect(theme.author, "@author").not.toBe("");
    await withTheme(page, "light", theme.file);
    const layers = await page.evaluate((file) => {
      const sheet = [...document.styleSheets].find((s) => s.href?.endsWith(`/themes/${file}`));
      return [...sheet.cssRules].map((r) => (r instanceof CSSLayerBlockRule ? r.name : r.cssText.slice(0, 40)));
    }, theme.file);
    expect(layers).toEqual([`gridselect-${base}`]);
  });

  test(`${theme.file}: light and dark differ`, async ({ page }) => {
    const bg = async (scheme) => {
      await withTheme(page, scheme, theme.file);
      await field(page, "filter").click();
      return page.locator("#filter [data-gridselect-panel]").evaluate((el) => getComputedStyle(el).backgroundColor);
    };
    expect(await bg("light")).not.toBe(await bg("dark"));
  });

  for (const scheme of ["light", "dark"]) {
    test(`${theme.file}: contrast and axe (${scheme})`, async ({ page }) => {
      await withTheme(page, scheme, theme.file);
      const text = [["field", field(page, "filter")]];
      const lines = [["chevron", field(page, "filter"), "chevron"]];
      await field(page, "highlight").click();
      await page.locator("#highlight [data-gridselect-search]").fill("dollar");
      text.push(["search", page.locator("#highlight [data-gridselect-search]")]);
      text.push(["match", page.locator("#highlight [data-match]").first().locator("[data-gridselect-label]")]);
      text.push(["dimmed", page.locator("#highlight [data-dimmed]").first().locator("[data-gridselect-label]")]);
      text.push(["badge", page.locator("#highlight [data-dimmed]").first().locator("[data-gridselect-key]")]);
      lines.push(["search border", page.locator("#highlight [data-gridselect-search]"), "border"]);
      lines.push(["cursor", page.locator("#highlight [data-cursor]"), "indicator"]);
      if (minText > 4.5) {
        lines.push(["panel border", page.locator("#highlight [data-gridselect-panel]"), "border"]);
        lines.push(["item border", page.locator("#highlight [data-dimmed]").first(), "border"]);
        lines.push(["field border", field(page, "filter"), "border"]);
      }
      for (const [name, loc] of text) expect.soft(await contrast(loc), `${name} text`).toBeGreaterThanOrEqual(minText);
      for (const [name, loc, kind] of lines) expect.soft(await contrast(loc, kind), name).toBeGreaterThanOrEqual(3);
      await check(page, "highlight open");
      await page.keyboard.press("Escape");

      await field(page, "filter").click();
      expect.soft(await contrast(page.locator('#filter [aria-selected="true"] [data-gridselect-label]')), "selected text").toBeGreaterThanOrEqual(minText);
      expect.soft(await contrast(page.locator('#filter [aria-selected="true"] [data-gridselect-key]')), "selected badge").toBeGreaterThanOrEqual(minText);
      await page.keyboard.press("Escape");

      await field(page, "described").click();
      expect.soft(await contrast(page.locator("#described [data-gridselect-description]").first()), "description").toBeGreaterThanOrEqual(minText);
      await page.keyboard.press("Escape");

      await field(page, "grouped").click();
      expect.soft(await contrast(page.locator("#grouped [data-gridselect-group-label]").first()), "group heading").toBeGreaterThanOrEqual(minText);
      await check(page, "grouped open");
    });
  }
}

async function check(page, state) {
  const { violations } = await new AxeBuilder({ page }).include("main").withTags(TAGS).analyze();
  expect.soft(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), `axe (${state})`).toEqual([]);
}

test("compact: panel items at least 24 px and lower than with the default stylesheet", async ({ page }) => {
  const height = async (file) => {
    await withTheme(page, "light", file);
    await field(page, "filter").click();
    return page.locator("#filter [data-gridselect-item]").first().evaluate((el) => el.getBoundingClientRect().height);
  };
  const plain = await height(null);
  const compact = await height("compact.css");
  expect(compact).toBeGreaterThanOrEqual(24);
  expect(compact).toBeLessThan(plain);
});
