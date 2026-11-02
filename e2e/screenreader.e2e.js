// F7 screen reader checklist (docs, steps 1-21), automated against the accessibility tree:
// role, accessible name, states and live announcements that NVDA, VoiceOver and Orca read out.
// It cannot replace listening to a real screen reader; it proves the information is there.
import { test, expect } from "@playwright/test";

const focused = (page) => page.locator(":focus");
/** The option the combobox points at with aria-activedescendant. */
async function active(page) {
  const id = await focused(page).getAttribute("aria-activedescendant");
  expect(id, "aria-activedescendant").toBeTruthy();
  return page.locator(`[id="${id}"]`);
}
const status = (page, id) => page.locator(`#${id} [role="status"]`);
/** No digit or modifier letters in a name ("1 Euro", "S1 Euro"). */
const noBadge = /^(?![A-Z]{0,2}\d\s)/;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto("/demo/");
});

test("steps 1-4: short radio and checkbox groups", async ({ page }) => {
  // 1: group name, role, state, position
  await page.locator("#short input:checked").focus();
  await expect(focused(page)).toHaveRole("radio");
  await expect(focused(page)).toHaveAccessibleName("Standard");
  await expect(focused(page)).toBeChecked();
  await expect(page.locator("#short")).toHaveRole("group");
  await expect(page.locator("#short")).toHaveAccessibleName("Shipping");
  expect(await page.locator(`#short input[name="${await focused(page).getAttribute("name")}"]`).count(), "1 of 4").toBe(4);
  // 2: arrow right selects the next one, no digit in the name
  await page.keyboard.press("ArrowRight");
  await expect(focused(page)).toHaveAccessibleName("Express");
  await expect(focused(page)).toBeChecked();
  // 3: digit 3
  await page.keyboard.press("3");
  await expect(focused(page)).toHaveAccessibleName("Next day");
  await expect(focused(page)).toBeChecked();
  // 4: checkbox state
  await page.locator("#checks input").first().focus();
  await expect(focused(page)).toHaveRole("checkbox");
  await expect(focused(page)).not.toBeChecked();
  await page.keyboard.press("Space");
  await expect(focused(page)).toBeChecked();
  await expect(page.locator("#checks")).toHaveAccessibleName("Extras");
});

test("steps 5-11: long list with filter", async ({ page }) => {
  const field = page.locator("#filter [data-gridselect-field]");
  // 5: name, value, popup
  await field.focus();
  await expect(focused(page)).toHaveRole("button");
  await expect(focused(page)).toHaveAccessibleName("Currency Swiss franc (CHF)");
  await expect(focused(page)).toHaveAttribute("aria-haspopup", "listbox");
  await expect(focused(page)).toHaveAttribute("aria-expanded", "false");
  // 6: Enter opens, focus in the search, expanded, current entry
  await page.keyboard.press("Enter");
  await expect(focused(page)).toHaveRole("combobox");
  await expect(focused(page)).toHaveAccessibleName("Currency");
  await expect(focused(page)).toHaveAttribute("aria-expanded", "true");
  await expect(await active(page)).toHaveAccessibleName("Swiss franc (CHF)");
  await expect(await active(page)).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(`[id="${await focused(page).getAttribute("aria-controls")}"]`)).toHaveRole("listbox");
  // 7: result count
  await page.keyboard.type("dollar");
  await expect(status(page, "filter")).toHaveText("6 results");
  // 8: the entry under the cursor, without its digit
  await page.keyboard.press("ArrowRight");
  await expect(await active(page)).toHaveAccessibleName("Canadian dollar (CAD)");
  await page.keyboard.press("ArrowDown");
  await expect(await active(page)).toHaveAccessibleName(noBadge);
  await expect(await active(page)).toHaveRole("option");
  // 9: no matches
  await page.keyboard.press("Control+a");
  await page.keyboard.type("xyz");
  await expect(status(page, "filter")).toHaveText("No matches");
  // 10: clear, Enter picks, focus back on the field with the new value
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("ArrowLeft");
  const picked = await (await active(page)).textContent();
  await page.keyboard.press("Enter");
  await expect(focused(page)).toHaveRole("button");
  await expect(focused(page)).toHaveAttribute("aria-expanded", "false");
  await expect(focused(page)).toHaveAccessibleName(new RegExp(`Currency ${picked.replace(/^\d/, "").trim().replace(/[()]/g, "\\$&")}`));
  // 11: Escape keeps the value
  const before = await focused(page).textContent();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(focused(page)).toHaveRole("button");
  await expect(focused(page)).toHaveText(before);
});

test("steps 12-13: highlight count and Shift tier", async ({ page }) => {
  await page.locator("#highlight [data-gridselect-field]").focus();
  await page.keyboard.press("Enter");
  await page.keyboard.type("krone");
  await expect(status(page, "highlight")).toHaveText("2 results");
  await expect(await active(page)).toHaveAccessibleName("Danish krone (DKK)");
  await page.keyboard.press("Escape");
  // 13: Shift+1 picks entry 11
  await page.locator("#filter [data-gridselect-field]").focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Shift+Digit1");
  await expect(focused(page)).toHaveAccessibleName("Currency Hungarian forint (HUF)");
  await expect(page.locator("#filter [data-gridselect-item]").nth(10)).toHaveAttribute("aria-keyshortcuts", "Shift+1");
});

test("step 14: long texts are read in full", async ({ page }) => {
  await page.locator("#list [data-gridselect-field]").focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  const name = await (await active(page)).evaluate((el) => el.querySelector("[data-gridselect-label]").textContent);
  expect(name.length).toBeGreaterThan(60);
  await expect(await active(page)).toHaveAccessibleName(name);
});

test("step 15: a select's field takes the select's label and placeholder", async ({ page }) => {
  await page.locator("#select [data-gridselect-field]").focus();
  await expect(focused(page)).toHaveAccessibleName("Country Choose a country…");
});

test("step 16: an empty required field takes focus and is marked invalid on submit", async ({ page }) => {
  await page.goto("/playground/");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(focused(page)).toHaveAccessibleName(/^Country \(required\)/);
  await expect(focused(page)).toHaveAttribute("aria-invalid", "true");
});

test("step 17: no badge text in any name, digits only as aria-keyshortcuts", async ({ page }) => {
  for (const id of ["filter", "highlight", "watch", "layout-flow"]) {
    await page.locator(`#${id} [data-gridselect-field]`).focus();
    await page.keyboard.press("Enter");
    const items = page.locator(`#${id} [data-gridselect-item]`);
    for (let i = 0; i < 12; i++) await expect(items.nth(i)).toHaveAccessibleName(noBadge);
    await expect(items.nth(0)).toHaveAttribute("aria-keyshortcuts", "1");
    await page.keyboard.press("Escape");
  }
  for (const id of ["short", "checks"]) {
    const inputs = page.locator(`#${id} input`);
    for (let i = 0; i < await inputs.count(); i++) await expect(inputs.nth(i)).toHaveAccessibleName(noBadge);
  }
});

test("steps 18-19: multiple choice in the panel", async ({ page }) => {
  await page.locator("#watch [data-gridselect-field]").focus();
  await page.keyboard.press("Enter");
  const listbox = page.locator(`[id="${await focused(page).getAttribute("aria-controls")}"]`);
  await expect(listbox).toHaveAttribute("aria-multiselectable", "true");
  await page.keyboard.type("dollar");
  await page.keyboard.press("Enter");
  await expect(await active(page)).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await expect(await active(page)).toHaveAttribute("aria-selected", "false");
  await page.keyboard.press("Enter");
  await expect(await active(page)).toHaveAttribute("aria-selected", "true");
  await expect(focused(page)).toHaveRole("combobox"); // the panel stays open
  await page.keyboard.press("Escape");
  await expect(focused(page)).toHaveAccessibleName("Watchlist US dollar (USD), Canadian dollar (CAD)");
});

test("step 20: <grid-select> behaves the same", async ({ page }) => {
  await page.locator("#el-demo [data-gridselect-field]").focus();
  await expect(focused(page)).toHaveRole("button");
  await expect(focused(page)).toHaveAccessibleName(/^Destination /);
  await page.keyboard.press("Enter");
  await expect(focused(page)).toHaveRole("combobox");
  await expect(focused(page)).toHaveAccessibleName("Destination");
  await page.keyboard.press("ArrowRight");
  await expect(await active(page)).toHaveRole("option");
  await page.keyboard.press("Escape");
  await expect(focused(page)).toHaveRole("button");
});

test("step 21: flow layout announces the entry under the cursor", async ({ page }) => {
  await page.locator("#layout-flow [data-gridselect-field]").focus();
  await page.keyboard.press("Enter");
  const first = await (await active(page)).getAttribute("id");
  await page.keyboard.press("ArrowDown");
  const down = await active(page);
  expect(await down.getAttribute("id")).not.toBe(first);
  await expect(down).toHaveRole("option");
  await page.keyboard.press("ArrowUp");
  expect(await (await active(page)).getAttribute("id")).toBe(first);
});
