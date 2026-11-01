// @vitest-environment jsdom
// F15: auto column width and the flow layout. Geometry itself is checked in e2e/layouts.e2e.js.
import { describe, it, expect, beforeEach } from "vitest";
import { gridselect } from "@emmgeede/gridselect";

function setup(options, attrs = "") {
  document.body.innerHTML = `<fieldset id="w" ${attrs}><legend>X</legend>${Array.from({ length: 12 }, (_, i) =>
    `<label><input type="radio" name="c" value="v${i}"> L${i}</label>`).join("")}</fieldset>`;
  const w = document.getElementById("w");
  gridselect(w, options);
  w.querySelector("[data-gridselect-field]").click();
  return w;
}
const list = (w) => w.querySelector("[data-gridselect-items]");
const cursor = (w) => w.querySelector("[data-cursor] [data-gridselect-label]").textContent;
const press = (w, key) => {
  const e = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  w.querySelector("[data-gridselect-search]").dispatchEvent(e);
  return e;
};

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("auto column width", () => {
  it("sets --gs-auto-width on open in the grid layout only", () => {
    expect(list(setup()).style.getPropertyValue("--gs-auto-width")).toMatch(/^\d+(\.\d+)?px$/);
    expect(list(setup({ layout: "list" })).style.getPropertyValue("--gs-auto-width")).toBe("");
    expect(list(setup({ layout: "flow" })).style.getPropertyValue("--gs-auto-width")).toBe("");
  });

  it("leaves no measuring styles on the items", () => {
    const w = setup();
    expect([...w.querySelectorAll("[data-gridselect-item]")].every((i) => !i.style.width && !i.style.whiteSpace)).toBe(true);
  });
});

describe("flow layout", () => {
  it("is set by option and data-layout and marks the list", () => {
    expect(list(setup({ layout: "flow" })).classList.contains("gridselect__items--flow")).toBe(true);
    expect(list(setup(undefined, 'data-layout="flow"')).classList.contains("gridselect__items--flow")).toBe(true);
  });

  it("moves ±1 with left/right and falls back to ±1 for up/down without layout", () => {
    const w = setup({ layout: "flow" });
    expect(cursor(w)).toBe("L0");
    expect(press(w, "ArrowRight").defaultPrevented).toBe(true);
    expect(cursor(w)).toBe("L1");
    press(w, "ArrowDown");
    expect(cursor(w)).toBe("L2");
    press(w, "ArrowUp");
    press(w, "ArrowUp");
    expect(cursor(w)).toBe("L0");
  });
});
