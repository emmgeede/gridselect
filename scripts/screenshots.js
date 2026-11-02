// Regenerates the README screenshots and animations in assets/ from the demo page: npm run screenshots
// Each shot moves one GridSelect onto a transparent "stage" with a rounded, shadowed card and
// captures it with a transparent page background, so only the card is opaque in the PNG.
// Animations are a list of steps, one frame each, joined into an animated WebP by ImageMagick.
import { test } from "@playwright/test";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { themeList } from "./themes.js";

// Transparent around the card, so the image sits on GitHub's own light or dark background.
const STAGE = { light: "transparent", dark: "transparent" };

/**
 * Puts the wrapper `id` on a stage at the top of the page, runs `act`, then returns a PNG.
 * @param {import("@playwright/test").Page} page
 */
async function stage(page, scheme, id) {
  await page.evaluate(({ id, background }) => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    // Nothing of the page may shine through the round corners.
    for (const el of document.body.children) el.style.visibility = "hidden";
    const stage = document.createElement("div");
    stage.id = "shot-stage";
    Object.assign(stage.style, {
      position: "absolute", top: "40px", left: "40px", width: "1000px", boxSizing: "border-box",
      padding: "24px 32px 40px", background, fontSize: "16px", zIndex: "1000",
    });
    const card = document.createElement("div");
    Object.assign(card.style, {
      background: "var(--page-card)", borderRadius: "18px", padding: "28px 32px",
      boxShadow: "0 1px 2px rgb(0 0 0 / .06), 0 20px 50px -20px rgb(0 0 0 / .35)",
    });
    card.append(document.getElementById(id));
    // Shows the key of the current animation step in the bottom right corner.
    const key = document.createElement("kbd");
    key.id = "shot-key";
    Object.assign(key.style, {
      // Red with white text (4.8:1), so the pressed key stands out from the teal or blue component.
      position: "absolute", bottom: "20px", right: "24px", padding: "8px 18px", borderRadius: "10px",
      font: "700 22px/1.3 system-ui, sans-serif", minWidth: "1.4em", textAlign: "center", color: "#ffffff",
      background: "#dc2626", boxShadow: "0 4px 14px -4px rgb(220 38 38 / .6)", visibility: "hidden",
    });
    card.style.position = "relative";
    card.append(key);
    stage.append(card);
    document.body.append(stage);
  }, { id, background: STAGE[scheme] });
}

/** Makes long panels scroll after a few rows, so images stay compact. */
const compact = (page, id) =>
  page.locator(`#${id} [data-gridselect-scroller]`).evaluate((el) => (el.style.maxHeight = "15.5rem"));

async function shoot(page, scheme, id, act = async () => {}) {
  await stage(page, scheme, id);
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

/** Height the card needs so the open panel (absolutely positioned) stays inside it. */
const neededHeight = (page) =>
  page.evaluate(() => {
    const card = document.querySelector("#shot-stage > div");
    const box = card.getBoundingClientRect();
    const panel = card.querySelector("[data-gridselect-panel]:not([hidden])");
    return Math.ceil(Math.max(box.height, panel ? panel.getBoundingClientRect().bottom - box.top + 28 : 0));
  });

/**
 * Plays `steps` twice: once to find the tallest frame, then with a fixed card height to capture.
 * A step is { key: shown label, run: action, hold: ms, poster: also save as still }.
 * Writes assets/<name>-<scheme>.webp and the poster frame as assets/<name>-<scheme>.png,
 * the still for people who prefer reduced motion.
 */
async function animate(page, scheme, name, id, steps) {
  let height = 0;
  for (const pass of ["measure", "capture"]) {
    await page.goto("/demo/");
    await stage(page, scheme, id);
    await compact(page, id);
    if (pass === "capture")
      await page.evaluate((h) => Object.assign(document.querySelector("#shot-stage > div").style,
        { boxSizing: "border-box", minHeight: `${h}px` }), height);
    const dir = mkdtempSync(join(tmpdir(), "gs-frames-"));
    const args = ["-dispose", "Background"];
    for (const [i, step] of steps.entries()) {
      await step.run?.();
      if (pass === "measure") {
        height = Math.max(height, await neededHeight(page));
        continue;
      }
      await page.evaluate((label) => {
        const key = document.getElementById("shot-key");
        key.textContent = label ?? "";
        // Arrow glyphs are small in most fonts; give single characters a bigger size.
        key.style.fontSize = label && [...label].length === 1 ? "34px" : "22px";
        key.style.lineHeight = label && [...label].length === 1 ? "1" : "1.3";
        key.style.visibility = label ? "visible" : "hidden";
      }, step.key);
      const png = await page.locator("#shot-stage").screenshot({ omitBackground: true, animations: "disabled" });
      const file = join(dir, `${String(i).padStart(3, "0")}.png`);
      writeFileSync(file, png);
      if (step.poster) writeFileSync(`assets/${name}-${scheme}.png`, png);
      args.push("-delay", String(Math.round(step.hold / 10)), file);
    }
    if (pass === "capture")
      execFileSync("magick", [...args, "-loop", "0", "-define", "webp:lossless=true", "-quality", "100", `assets/${name}-${scheme}.webp`]);
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Animations: each is (page) => steps, built on the demo page. */
const animations = {
  keyboard: ["filter", (page) => [
    { run: () => page.locator("#filter [data-gridselect-field]").focus(), hold: 900 },
    { key: "Enter", run: () => page.keyboard.press("Enter"), hold: 1100, poster: true },
    { key: "→", run: () => page.keyboard.press("ArrowRight"), hold: 700 },
    { key: "→", run: () => page.keyboard.press("ArrowRight"), hold: 700 },
    { key: "↓", run: () => page.keyboard.press("ArrowDown"), hold: 700 },
    { key: "↓", run: () => page.keyboard.press("ArrowDown"), hold: 700 },
    { key: "←", run: () => page.keyboard.press("ArrowLeft"), hold: 700 },
    { key: "Enter", run: () => page.keyboard.press("Enter"), hold: 2000 },
  ]],
  search: ["filter", (page) => [
    { run: () => page.locator("#filter [data-gridselect-field]").focus(), hold: 700 },
    { key: "Enter", run: () => page.keyboard.press("Enter"), hold: 1000 },
    ..."dollar".split("").map((c, i, all) => ({
      key: all.slice(0, i + 1).join(""), run: () => page.keyboard.type(c), hold: i === all.length - 1 ? 2200 : 350,
      poster: i === all.length - 1,
    })),
  ]],
  digits: ["highlight", (page) => [
    { run: () => page.locator("#highlight [data-gridselect-field]").focus(), hold: 700 },
    { key: "Enter", run: () => page.keyboard.press("Enter"), hold: 1400, poster: true },
    { key: "4", run: () => page.keyboard.press("Digit4"), hold: 1600 },
    { key: "Enter", run: () => page.keyboard.press("Enter"), hold: 1400 },
    { key: "Shift + 3", run: () => page.keyboard.press("Shift+Digit3"), hold: 2000 },
  ]],
  multiple: ["watch", (page) => [
    { run: () => page.locator("#watch [data-gridselect-field]").focus(), hold: 700 },
    { key: "Enter", run: () => page.keyboard.press("Enter"), hold: 1000 },
    { key: "dollar", run: () => page.keyboard.type("dollar"), hold: 1000 },
    { key: "Enter", run: () => page.keyboard.press("Enter"), hold: 900 },
    { key: "→", run: () => page.keyboard.press("ArrowRight"), hold: 600 },
    { key: "Enter", run: () => page.keyboard.press("Enter"), hold: 900 },
    { key: "4", run: () => page.keyboard.press("Digit4"), hold: 1300, poster: true },
    { key: "Escape", run: () => page.keyboard.press("Escape"), hold: 2000 },
  ]],
};

/** One still per theme (and Default): the currency panel filtered for "dollar". */
const themeShots = Object.fromEntries(["default", ...themeList("themes").map((t) => t.file.replace(/\.css$/, ""))].map((value) => [
  `theme-${value}`,
  async (page, scheme) => {
    await page.locator(`#theme-picker input[value="${value}"]`).evaluate((i) => i.closest("label").click());
    return shoot(page, scheme, "filter", async () => {
      await page.locator("#filter [data-gridselect-field]").click();
      await page.locator("#filter [data-gridselect-search]").fill("dollar");
    });
  },
]));

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
      await compact(page, "highlight");
    }),
  "layout-grid": (page, scheme) =>
    shoot(page, scheme, "layout-grid", async () => {
      await page.locator("#layout-grid [data-gridselect-field]").click();
      await compact(page, "layout-grid");
    }),
  pinned: (page, scheme) =>
    shoot(page, scheme, "pinned", async () => {
      await page.evaluate(() => localStorage.setItem("gridselect-recent:demo-currency", JSON.stringify(["JPY", "CHF"])));
      await page.locator("#pinned [data-gridselect-field]").click();
      await page.locator("#pinned [data-gridselect-scroller]").evaluate((el) => (el.style.maxHeight = "19rem"));
    }),
  described: (page, scheme) =>
    shoot(page, scheme, "described", async () => {
      await page.locator("#described [data-gridselect-field]").click();
      await page.locator("#described [data-gridselect-scroller]").evaluate((el) => (el.style.maxHeight = "15rem"));
    }),
  groups: (page, scheme) =>
    shoot(page, scheme, "grouped", async () => {
      await page.locator("#grouped [data-gridselect-field]").click();
      await page.locator("#grouped [data-gridselect-scroller]").evaluate((el) => (el.style.maxHeight = "21rem"));
    }),
  "layout-flow": (page, scheme) =>
    shoot(page, scheme, "layout-flow", async () => {
      await page.locator("#layout-flow [data-gridselect-field]").click();
      await compact(page, "layout-flow");
    }),
};

for (const scheme of ["light", "dark"]) {
  for (const [name, take] of Object.entries({ ...shots, ...themeShots })) {
    test(`${name} ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.setViewportSize({ width: 1100, height: 1200 });
      await page.goto("/demo/");
      writeFileSync(`assets/${name}-${scheme}.png`, await take(page, scheme));
    });
  }
  for (const [name, [id, steps]] of Object.entries(animations)) {
    test(`${name} animation ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.setViewportSize({ width: 1100, height: 1200 });
      await animate(page, scheme, name, id, steps(page));
    });
  }
}
