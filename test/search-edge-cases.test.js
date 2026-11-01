// @vitest-environment jsdom
// F3 edge cases, added during saas-qa F3.
import { describe, it, expect, beforeEach } from "vitest";
import { gridselect } from "gridselect";

function setup(labels, { options, checked = -1, disabled = [] } = {}) {
  const rows = labels.map((l, i) =>
    `<label><input type="radio" name="c" value="v${i}"${i === checked ? " checked" : ""}${disabled.includes(i) ? " disabled" : ""}> ${l}</label>`).join("");
  document.body.innerHTML = `<fieldset id="w"><legend>X</legend>${rows}</fieldset>`;
  const w = document.getElementById("w");
  const gs = gridselect(w, options);
  w.querySelector("[data-gridselect-field]").click();
  return { w, gs };
}
const many = (n) => Array.from({ length: n }, (_, i) => `Item ${i}`);
const search = (w) => w.querySelector("[data-gridselect-search]");
const visible = (w) => [...w.querySelectorAll("[data-gridselect-item]")].filter((i) => !i.hidden).map((i) => i.querySelector("[data-gridselect-label]").textContent);
function type(w, text) {
  search(w).value = text;
  search(w).dispatchEvent(new Event("input", { bubbles: true }));
}
function press(w, key) {
  search(w).dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("F3 edge cases", () => {
  it("matches decomposed and precomposed accents alike", () => {
    const { w } = setup([...many(10), "Café Noir", "Café Blanc"]);
    type(w, "café");
    expect(visible(w)).toEqual(["Café Noir", "Café Blanc"]);
  });

  it("shows duplicate labels both, in original order", () => {
    const { w } = setup([...many(9), "Lima", "Paris", "Lima"]);
    type(w, "lima");
    expect(visible(w)).toEqual(["Lima", "Lima"]);
  });

  it("filters disabled items like others, but Enter does not pick them", () => {
    const { w, gs } = setup([...many(10), "Oslo", "Bern"], { disabled: [10] });
    type(w, "oslo");
    expect(visible(w)).toEqual(["Oslo"]);
    press(w, "Enter");
    expect(gs.value).toBeNull();
  });

  it("keeps a selection that is filtered out when closing with Escape", () => {
    const { w, gs } = setup(many(12), { checked: 3 });
    type(w, "item 1");
    expect(visible(w)).not.toContain("Item 3");
    press(w, "Escape");
    expect(gs.value).toBe("v3");
  });

  it("filters 200 items per keystroke in well under a frame budget", () => {
    const { w } = setup(many(200));
    const t = performance.now();
    for (const q of ["i", "it", "ite", "item", "item 1", "item 19", "item 199"]) type(w, q);
    expect((performance.now() - t) / 7).toBeLessThan(16);
    expect(visible(w)).toEqual(["Item 199"]);
  });
});

describe("QA F3 fixes", () => {
  it("still filters when a custom resultsText throws", () => {
    const errors = [];
    const onError = (e) => { errors.push(e); e.preventDefault(); };
    window.addEventListener("error", onError);
    const { w } = setup(many(12), { options: { resultsText: () => { throw new Error("boom"); } } });
    type(w, "item 1");
    window.removeEventListener("error", onError);
    expect(visible(w)).toEqual(["Item 1", "Item 10", "Item 11"]);
  });
});
