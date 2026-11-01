// Regenerates the README screenshots in assets/ from the demo page: npm run screenshots
import { test } from "@playwright/test";

const shots = [
  { name: "short", run: async (page) => page.locator("#short").screenshot() },
  {
    name: "filter",
    run: async (page) => {
      await page.locator("#filter [data-gridselect-field]").click();
      await page.locator("#filter [data-gridselect-search]").fill("dollar");
      const box = await page.locator("#filter").boundingBox();
      const panel = await page.locator("#filter [data-gridselect-panel]").boundingBox();
      return page.screenshot({ clip: { x: box.x - 8, y: box.y - 8, width: panel.width + 16, height: panel.y + panel.height - box.y + 16 } });
    },
  },
  {
    name: "highlight",
    run: async (page) => {
      await page.locator("#highlight [data-gridselect-field]").click();
      await page.locator("#highlight [data-gridselect-search]").fill("krone");
      await page.keyboard.press("ArrowRight");
      const box = await page.locator("#highlight").boundingBox();
      const panel = await page.locator("#highlight [data-gridselect-panel]").boundingBox();
      return page.screenshot({ clip: { x: box.x - 8, y: box.y - 8, width: panel.width + 16, height: panel.y + panel.height - box.y + 16 } });
    },
  },
];

for (const scheme of ["light", "dark"]) {
  for (const shot of shots) {
    test(`${shot.name} ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.setViewportSize({ width: 1000, height: 3200 });
      await page.goto("/demo/");
      const png = await shot.run(page);
      const { writeFileSync } = await import("node:fs");
      writeFileSync(`assets/${shot.name}-${scheme}.png`, png);
    });
  }
}
