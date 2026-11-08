// Issues #2 and #3: a GridSelect inside a modal <dialog> that scrolls (overflow: auto).
import { test, expect } from "@playwright/test";

const field = (page) => page.locator("#in-dialog [data-gridselect-field]");
const panel = (page) => page.locator("#in-dialog [data-gridselect-panel]");
const box = (loc) => loc.evaluate((el) => el.getBoundingClientRect().toJSON());

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/playground/");
  await page.locator("#open-dialog").click();
});

test("#2: the panel stays within the scrolling dialog instead of being cut off", async ({ page }) => {
  const scrolled = () => page.locator("#dialog").evaluate((el) => el.scrollTop);
  const before = await scrolled();
  await field(page).click();
  // Field in the lower half of the dialog, lots of window room below: opens up within the dialog.
  await expect(panel(page)).toHaveAttribute("data-placement", "top");
  const d = await page.locator("#dialog").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top + el.clientTop, bottom: r.top + el.clientTop + el.clientHeight, left: r.left + el.clientLeft, right: r.left + el.clientLeft + el.clientWidth };
  });
  const p = await box(panel(page));
  expect(p.top).toBeGreaterThanOrEqual(d.top - 1);
  expect(p.bottom).toBeLessThanOrEqual(d.bottom + 1);
  expect(p.left).toBeGreaterThanOrEqual(d.left - 1);
  expect(p.right).toBeLessThanOrEqual(d.right + 1);
  // Uses the room: the whole list shows, or the panel reaches the dialog's top edge.
  const fits = await page.locator("#in-dialog [data-gridselect-scroller]").evaluate((el) => el.scrollHeight - el.clientHeight <= 1);
  expect(fits || p.top < d.top + 40).toBe(true);
  // Moving the cursor scrolls only the list, never the dialog around it.
  expect(await scrolled()).toBe(before);
  // The dialog itself gets no scrollbar from the panel.
  expect(await page.locator("#dialog").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test("#3: Escape closes only the panel, a second Escape closes the dialog", async ({ page }) => {
  await field(page).click();
  await expect(panel(page)).toBeVisible();
  await page.evaluate(() => {
    window.__keys = 0;
    document.getElementById("dialog").addEventListener("keydown", (e) => e.key === "Escape" && window.__keys++);
  });
  await page.keyboard.press("Escape");
  await expect(panel(page)).toBeHidden();
  await expect(page.locator("#dialog")).toHaveJSProperty("open", true);
  expect(await page.evaluate(() => window.__keys)).toBe(0);
  await expect(field(page)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#dialog")).toHaveJSProperty("open", false);
});
