// The assembled Pages site (npm run site), exactly as deployed: no script errors, every example built.
import { test, expect } from "@playwright/test";

test("the published demo loads without errors and builds every example", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto("/_site/");
  await expect(page).toHaveURL(/\/_site\/demo\/$/);
  for (const id of ["short", "checks", "watch", "list"]) await expect(page.locator(`#${id} label[data-gridselect-generated], #${id} [data-gridselect-field], #${id} [data-gridselect-key]`).first()).toBeVisible();
  await expect(page.locator("#filter [data-gridselect-field]")).toBeVisible();
  await expect(page.locator("#langs [data-gridselect-field]")).toBeVisible();
  await expect(page.locator("#el-demo [data-gridselect-field]")).toHaveText("Choose a destination…");
  await expect(page.locator("#el-demo > option").first()).toBeHidden();
  expect(errors).toEqual([]);
});
