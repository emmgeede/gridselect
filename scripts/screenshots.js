// Regenerates the README screenshots in assets/ from the demo page: npm run screenshots
// Each shot moves one GridSelect onto a "stage" (gradient, padding, rounded corners) and
// captures it with a transparent page background, so the corners stay round in the PNG.
import { test } from "@playwright/test";
import { writeFileSync } from "node:fs";

// Light, neutral backdrops in both modes, so the component (light or dark) stands out.
const STAGE = {
  light: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 55%, #e6f4f4 100%)",
  dark: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 55%, #d5e6e7 100%)",
};

/**
 * Puts the wrapper `id` on a stage at the top of the page, runs `act`, then returns a PNG.
 * @param {import("@playwright/test").Page} page
 */
async function shoot(page, scheme, id, act = async () => {}) {
  await page.evaluate(({ id, background }) => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.querySelector("main").style.visibility = "hidden"; // nothing may shine through the round corners
    const stage = document.createElement("div");
    stage.id = "shot-stage";
    Object.assign(stage.style, {
      position: "absolute", top: "40px", left: "40px", width: "760px", boxSizing: "border-box",
      padding: "48px 56px", borderRadius: "28px", background, fontSize: "16px", zIndex: "1000",
    });
    const card = document.createElement("div");
    Object.assign(card.style, {
      background: "var(--page-card)", borderRadius: "18px", padding: "28px 32px",
      boxShadow: "0 1px 2px rgb(0 0 0 / .06), 0 20px 50px -20px rgb(0 0 0 / .35)",
    });
    card.append(document.getElementById(id));
    stage.append(card);
    document.body.append(stage);
  }, { id, background: STAGE[scheme] });
  await act();
  // Grow the card so an open panel (absolutely positioned) stays inside the frame.
  await page.evaluate(() => {
    const card = document.querySelector("#shot-stage > div");
    const panel = card.querySelector("[data-gridselect-panel]:not([hidden])");
    if (!panel) return;
    const gap = panel.getBoundingClientRect().bottom - card.getBoundingClientRect().bottom;
    if (gap > -28) card.style.paddingBottom = `${28 + gap + 28}px`;
  });
  return page.locator("#shot-stage").screenshot({ omitBackground: true, animations: "disabled" });
}

const shots = {
  short: (page, scheme) => shoot(page, scheme, "short"),
  filter: (page, scheme) =>
    shoot(page, scheme, "filter", async () => {
      await page.locator("#filter [data-gridselect-field]").click();
      await page.locator("#filter [data-gridselect-search]").fill("dollar");
    }),
  highlight: (page, scheme) =>
    shoot(page, scheme, "highlight", async () => {
      await page.locator("#highlight [data-gridselect-field]").click();
      await page.locator("#highlight [data-gridselect-search]").fill("krone");
      await page.keyboard.press("ArrowRight");
      await page.locator("#highlight [data-gridselect-scroller]").evaluate((el) => (el.style.maxHeight = "15.5rem"));
    }),
};

for (const scheme of ["light", "dark"]) {
  for (const [name, take] of Object.entries(shots)) {
    test(`${name} ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.setViewportSize({ width: 860, height: 1200 });
      await page.goto("/demo/");
      writeFileSync(`assets/${name}-${scheme}.png`, await take(page, scheme));
    });
  }
}
