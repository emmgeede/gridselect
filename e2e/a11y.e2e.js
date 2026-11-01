// F7: automated accessibility check (axe-core, WCAG 2.0/2.1/2.2 A and AA) in every state.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function check(page, state) {
  const { violations } = await new AxeBuilder({ page }).include("main").withTags(TAGS).analyze();
  const summary = violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(summary, `axe violations (${state})`).toEqual([]);
}

const field = (page, id) => page.locator(`#${id} [data-gridselect-field]`);

for (const scheme of ["light", "dark"]) {
  test.describe(`${scheme} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/playground/");
    });

    test("everything closed", async ({ page }) => {
      await check(page, "closed");
    });

    test("panel open", async ({ page }) => {
      await field(page, "filter").click();
      await check(page, "open");
    });

    test("filtered and without matches", async ({ page }) => {
      await field(page, "filter").click();
      await page.locator("#filter [data-gridselect-search]").fill("dollar");
      await check(page, "filtered");
      await page.locator("#filter [data-gridselect-search]").fill("xyz");
      await check(page, "no matches");
    });

    test("highlighted", async ({ page }) => {
      await field(page, "highlight").click();
      await page.locator("#highlight [data-gridselect-search]").fill("dollar");
      await check(page, "highlight");
    });

    test("list layout and select panel open", async ({ page }) => {
      await field(page, "list").click();
      await check(page, "list");
      await page.keyboard.press("Escape");
      await field(page, "select-long").click();
      await check(page, "select");
    });

    test("multiple choice panel with selections", async ({ page }) => {
      await field(page, "checks-long").click();
      await page.keyboard.press("Enter");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Enter");
      await check(page, "multiple");
      await page.keyboard.press("Escape");
      await field(page, "select-multi").click();
      await check(page, "select multiple");
    });

    test("entries from JS, short and long", async ({ page }) => {
      await check(page, "items short");
      await page.locator("#items-long").click();
      await field(page, "from-items").click();
      await check(page, "items long, panel open");
    });

    test("custom elements closed, open and invalid", async ({ page }) => {
      await check(page, "elements closed");
      await field(page, "el-long").click();
      await check(page, "element panel open");
      await page.keyboard.press("Escape");
      await field(page, "el-multi").click();
      await page.keyboard.press("Enter");
      await check(page, "element multiple");
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Submit element form" }).click();
      await check(page, "element invalid");
    });

    test("invalid required field", async ({ page }) => {
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await check(page, "invalid");
    });
  });
}
