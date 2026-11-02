// F21: the VuePress documentation as deployed under /docs/: every page loads, links and anchors
// resolve, axe finds nothing, and the live examples run.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROOT = "http://localhost:5174";

/** All documentation pages, found by following the links from the start page. */
async function crawl(page) {
  const seen = new Set(["/docs/"]);
  const queue = ["/docs/"];
  /** @type {{ from: string, href: string }[]} */
  const links = [];
  while (queue.length) {
    const path = queue.shift();
    await page.goto(ROOT + path);
    const hrefs = await page.locator("a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    for (const href of hrefs) {
      const url = new URL(href, ROOT + path);
      if (url.origin !== ROOT || !url.pathname.startsWith("/docs/")) continue;
      links.push({ from: path, href: url.pathname + url.hash });
      if (!seen.has(url.pathname)) {
        seen.add(url.pathname);
        queue.push(url.pathname);
      }
    }
  }
  return { pages: [...seen], links };
}

for (const scheme of ["light", "dark"]) test(`every page loads, every internal link and anchor resolves, axe finds nothing (${scheme})`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.emulateMedia({ colorScheme: scheme });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  const { pages, links } = await crawl(page);
  expect(pages.length).toBeGreaterThanOrEqual(20);
  for (const path of pages) {
    await page.goto(ROOT + path);
    await expect(page.locator("main, .vp-page, .vp-home").first()).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect.soft(violations.map((v) => `${path} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  }
  for (const { from, href } of links.filter((l) => l.href.includes("#"))) {
    const [path, hash] = href.split("#");
    await page.goto(ROOT + path);
    expect.soft(await page.locator(`[id="${decodeURIComponent(hash)}"]`).count(), `${from} → ${href}`).toBe(1);
  }
  expect(errors).toEqual([]);
});

test("the live examples run, styled by the showcase theme", async ({ page }) => {
  await page.goto(`${ROOT}/docs/guide/search.html`);
  expect(await page.evaluate(() => [...document.styleSheets].some((s) => {
    try { return [...s.cssRules].some((r) => r instanceof CSSLayerBlockRule && r.name === "gridselect-showcase"); } catch { return false; }
  }))).toBe(true);
  const examples = page.locator(".gs-example");
  await expect(examples).toHaveCount(2);
  await examples.first().locator("[data-gridselect-field]").click();
  await page.keyboard.type("dollar");
  await expect(examples.first().locator('[role="status"]')).toHaveText("6 results");
  await page.goto(`${ROOT}/docs/guide/server.html`);
  await page.locator(".gs-example [data-gridselect-field]").click();
  await expect(page.locator(".gs-example [data-gridselect-item]:visible")).toHaveCount(25);
  await page.goto(`${ROOT}/docs/guide/forms.html`);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.locator(".gs-example output")).toHaveText("");
  await page.locator(".gs-example grid-select label", { hasText: "Oslo" }).click();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.locator(".gs-example output")).toHaveText('[["destination","OSL"]]');
});
