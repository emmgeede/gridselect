// @vitest-environment jsdom
// F17: maximum number of choices. See docs/features/F17-hoechstzahl/spec.md.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { gridselect } from "@emmgeede/gridselect";
import "@emmgeede/gridselect/element";

const CODES = ["EUR", "CHF", "USD", "GBP", "JPY", "DKK", "NOK", "SEK", "PLN", "CZK", "HUF", "TRY"];
function mount(n, attrs = "", opts = {}) {
  document.body.innerHTML = `<form id="f"><fieldset id="w" ${attrs}><legend>Pick</legend></fieldset></form>`;
  const w = document.getElementById("w");
  return [w, gridselect(w, { items: CODES.slice(0, n), multiple: true, ...opts })];
}
const input = (w, v) => w.querySelector(`input[value="${v}"]`);
const status = (w) => w.querySelector('[role="status"]');
const item = (w, v) => w.querySelector(`[data-gridselect-item][data-value="${v}"]`);

beforeEach(() => (document.body.innerHTML = ""));

describe("below the threshold", () => {
  it("locks the rest at the limit; click, space and digits cannot tick them", () => {
    const [w, gs] = mount(5, "", { max: 2 });
    const events = vi.fn();
    w.addEventListener("change", events);
    input(w, "EUR").click();
    input(w, "CHF").click();
    expect(gs.value).toEqual(["EUR", "CHF"]);
    expect(input(w, "USD").getAttribute("aria-disabled")).toBe("true");
    expect(input(w, "USD").labels[0].hasAttribute("data-limit")).toBe(true);
    expect(input(w, "EUR").hasAttribute("aria-disabled")).toBe(false);
    expect(status(w).textContent).toContain("Maximum of 2 reached");
    events.mockClear();
    input(w, "USD").click();
    input(w, "USD").labels[0].click();
    input(w, "EUR").focus();
    input(w, "EUR").dispatchEvent(new KeyboardEvent("keydown", { key: "3", code: "Digit3", bubbles: true, cancelable: true }));
    expect(gs.value).toEqual(["EUR", "CHF"]);
    expect(events).not.toHaveBeenCalled();
    input(w, "CHF").click();
    expect(input(w, "USD").hasAttribute("aria-disabled")).toBe(false);
    input(w, "USD").click();
    expect(gs.value).toEqual(["EUR", "USD"]);
  });

  it("announces a second blocked attempt again", () => {
    const [w] = mount(4, 'data-max="1"');
    input(w, "EUR").click();
    input(w, "CHF").click();
    const first = status(w).textContent;
    input(w, "USD").click();
    expect(status(w).textContent).not.toBe(first);
    expect(status(w).textContent.trim()).toBe("Maximum of 1 reached");
  });

  it("ignores max for radios, 0 and invalid values", () => {
    let [w] = mount(4, 'data-max="0"');
    for (const v of ["EUR", "CHF", "USD"]) input(w, v).click();
    expect(w.querySelector("[aria-disabled]")).toBeNull();
    [w] = mount(4, 'data-max="x"');
    for (const v of ["EUR", "CHF", "USD"]) input(w, v).click();
    expect(w.querySelector("[aria-disabled]")).toBeNull();
    document.body.innerHTML = `<fieldset id="w"><legend>x</legend></fieldset>`;
    w = document.getElementById("w");
    gridselect(w, { items: ["a", "b"], max: 1 });
    expect(w.querySelector('[role="status"]')).toBeNull();
  });

  it("keeps a too large start value, locks the rest, and fixes the lock after reset and value", async () => {
    const [w, gs] = mount(5, "", { max: 2, value: ["EUR", "CHF", "USD"] });
    expect(gs.value).toEqual(["EUR", "CHF", "USD"]);
    expect(input(w, "GBP").getAttribute("aria-disabled")).toBe("true");
    gs.value = ["EUR"];
    expect(input(w, "GBP").hasAttribute("aria-disabled")).toBe(false);
    input(w, "GBP").click();
    expect(input(w, "JPY").getAttribute("aria-disabled")).toBe("true");
    document.getElementById("f").reset();
    await new Promise((r) => setTimeout(r, 0));
    const locked = gs.value.length >= 2;
    expect(input(w, "JPY").hasAttribute("aria-disabled")).toBe(locked && !gs.value.includes("JPY"));
  });
});

describe("in the panel", () => {
  it("locks unchosen items, keeps the panel open and announces", () => {
    const [w, gs] = mount(12, "", { max: 2, maxText: (n) => `Höchstens ${n}` });
    w.querySelector("[data-gridselect-field]").click();
    item(w, "EUR").click();
    item(w, "CHF").click();
    expect(item(w, "USD").getAttribute("aria-disabled")).toBe("true");
    expect(item(w, "USD").hasAttribute("data-limit")).toBe(true);
    expect(status(w).textContent.trim()).toBe("Höchstens 2");
    item(w, "USD").click();
    const search = w.querySelector("[data-gridselect-search]");
    search.dispatchEvent(new KeyboardEvent("keydown", { key: "4", code: "Digit4", bubbles: true, cancelable: true }));
    expect(gs.value).toEqual(["EUR", "CHF"]);
    expect(w.querySelector("[data-gridselect-panel]").hidden).toBe(false);
    item(w, "EUR").click();
    expect(item(w, "USD").hasAttribute("aria-disabled")).toBe(false);
  });

  it("works for <select multiple> and pinned copies", () => {
    document.body.innerHTML = `<div id="w" data-max="1" data-pinned="b"><label for="s">L</label><select id="s" multiple>${CODES.map((c) => `<option>${c}</option>`).join("")}<option>b</option></select></div>`;
    const w = document.getElementById("w");
    const gs = gridselect(w);
    w.querySelector("[data-gridselect-field]").click();
    item(w, "EUR").click();
    expect(gs.value).toEqual(["EUR"]);
    const copy = w.querySelector('[data-gridselect-top] [data-value="b"]');
    expect(copy.getAttribute("aria-disabled")).toBe("true");
    copy.click();
    expect(gs.value).toEqual(["EUR"]);
  });

  it("<grid-select max> sets the limit", () => {
    document.body.innerHTML = `<grid-select label="x" multiple max="1"><option>a</option><option>b</option></grid-select>`;
    const el = document.querySelector("grid-select");
    el.querySelector('input[value="a"]').click();
    el.querySelector('input[value="b"]').click();
    expect(el.value).toEqual(["a"]);
  });
});
