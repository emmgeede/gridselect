// F19: <grid-select> as a real form control (ElementInternals).
import { test, expect } from "@playwright/test";

/** A page with a form around <grid-select> elements, loaded from the sources. */
async function setup(page, html) {
  await page.goto("/playground/");
  await page.setContent(`<!doctype html><link rel="stylesheet" href="/src/gridselect.css"><form id="f">${html}<button>Send</button></form>
    <script type="module">import "/src/element.js"; window.ready = true;</script>`);
  await page.waitForFunction(() => window.ready && customElements.get("grid-select"));
}
const opts = (vals, selected = []) => vals.map((v) => `<option value="${v}"${selected.includes(v) ? " selected" : ""}>${v}</option>`).join("");
const entries = (page) => page.evaluate(() => [...new FormData(document.getElementById("f"))]);

test("form, name, form.elements and only the element's value is submitted", async ({ page }) => {
  await setup(page, `<grid-select name="cur" label="Currency">${opts(["EUR", "CHF"], ["CHF"])}</grid-select>
    <grid-select name="many" label="Many" multiple>${opts(["a", "b", "c"], ["a", "c"])}</grid-select>
    <grid-select label="Unnamed">${opts(["x"], ["x"])}</grid-select>`);
  const info = await page.evaluate(() => {
    const el = document.querySelector("grid-select");
    return { form: el.form?.id, name: el.name, listed: [...el.form.elements].includes(el) };
  });
  expect(info).toEqual({ form: "f", name: "cur", listed: true });
  expect(await entries(page)).toEqual([["cur", "CHF"], ["many", "a"], ["many", "c"]]);
  await page.locator('grid-select[name="cur"] label', { hasText: "EUR" }).click();
  expect(await entries(page)).toEqual([["cur", "EUR"], ["many", "a"], ["many", "c"]]);
});

test("required: valueMissing, :invalid, browser message, blocked submit with focus and aria-invalid", async ({ page }) => {
  await setup(page, `<grid-select name="cur" label="Currency" required>${opts(["EUR", "CHF"])}</grid-select>`);
  const state = () => page.evaluate(() => {
    const el = document.querySelector("grid-select");
    return { missing: el.validity.valueMissing, ok: el.checkValidity(), invalid: el.matches(":invalid"), msg: el.validationMessage, will: el.willValidate };
  });
  const before = await state();
  expect(before).toMatchObject({ missing: true, ok: false, invalid: true, will: true });
  const native = await page.evaluate(() => { const s = document.createElement("select"); s.required = true; document.body.append(s); return s.validationMessage; });
  expect(before.msg).toBe(native);
  let submitted = false;
  page.on("request", (r) => r.method() !== "GET" || (r.url().includes("cur=") && (submitted = true)));
  await page.getByRole("button", { name: "Send" }).click();
  expect(submitted).toBe(false);
  await expect(page.locator("grid-select input:focus")).toHaveCount(1);
  await expect(page.locator("grid-select input").first()).toHaveAttribute("aria-invalid", "true");
  await page.locator("grid-select label", { hasText: "CHF" }).click();
  expect(await state()).toMatchObject({ missing: false, ok: true, invalid: false });
  await expect(page.locator("grid-select input").first()).not.toHaveAttribute("aria-invalid", "true");
});

test("setCustomValidity, reset to the start value, disabled fieldset", async ({ page }) => {
  await setup(page, `<fieldset id="fs"><grid-select name="cur" label="Currency" value="CHF">${opts(["EUR", "CHF", "USD"])}</grid-select></fieldset>`);
  const el = page.locator("grid-select");
  await el.evaluate((e) => e.setCustomValidity("Not today"));
  expect(await el.evaluate((e) => [e.checkValidity(), e.validationMessage])).toEqual([false, "Not today"]);
  await el.evaluate((e) => e.setCustomValidity(""));
  expect(await el.evaluate((e) => e.checkValidity())).toBe(true);
  await page.locator("grid-select label", { hasText: "USD" }).click();
  expect(await el.evaluate((e) => e.value)).toBe("USD");
  const events = await el.evaluate((e) => {
    let n = 0;
    e.addEventListener("change", () => n++);
    e.form.reset();
    return new Promise((r) => setTimeout(() => r(n), 50));
  });
  expect(events).toBe(0);
  expect(await el.evaluate((e) => e.value)).toBe("CHF");
  await page.locator("#fs").evaluate((f) => (f.disabled = true));
  expect(await entries(page)).toEqual([]);
  expect(await el.evaluate((e) => e.querySelector("fieldset").disabled)).toBe(true);
  await page.locator("#fs").evaluate((f) => (f.disabled = false));
  expect(await entries(page)).toEqual([["cur", "CHF"]]);
  expect(await el.evaluate((e) => e.querySelector("fieldset").disabled)).toBe(false);
});

test("restores its state on back/forward (formStateRestoreCallback)", async ({ page }) => {
  await setup(page, `<grid-select name="cur" label="Currency" multiple>${opts(["a", "b", "c"])}</grid-select>`);
  await page.locator("grid-select").evaluate((e) => e.formStateRestoreCallback(JSON.stringify(["b", "c"]), "restore"));
  expect(await page.locator("grid-select").evaluate((e) => e.value)).toEqual(["b", "c"]);
  expect(await entries(page)).toEqual([["cur", "b"], ["cur", "c"]]);
});
