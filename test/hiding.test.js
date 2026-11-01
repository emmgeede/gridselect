// @vitest-environment jsdom
// Hiding must survive page CSS that sets `display` (found in the playground after F3).
import { describe, it, expect, beforeEach } from "vitest";
import { gridselect } from "@emmgeede/gridselect";

const css = `<style>
  label { display: inline-flex; }
  input { display: inline-block; }
  .gridselect__item { display: flex; }
  .gridselect__panel { display: block; }
  .gridselect__empty { display: block; }
</style>`;
// jsdom has no real cascade, so check the mechanism that beats page CSS in browsers:
// every element GridSelect hides also carries an inline display: none.
const shown = (el) => !el.hidden && el.style.display !== "none";
const hiddenHard = (el) => el.hidden && el.style.display === "none";

function setup(n = 12) {
  const rows = Array.from({ length: n }, (_, i) =>
    `<label${i === 0 ? ' style="color: red"' : ""}><input type="radio" name="c" value="v${i}"> L${i}</label>`).join("");
  document.body.innerHTML = `${css}<fieldset id="w"><legend>X</legend>${rows}</fieldset>`;
  const w = document.getElementById("w");
  return { w, gs: gridselect(w, { shortcuts: false }) };
}
function type(w, text) {
  const s = w.querySelector("[data-gridselect-search]");
  s.value = text;
  s.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("hiding against page CSS", () => {
  it("hides the native labels and inputs even when the page styles their display", () => {
    const { w } = setup();
    expect([...w.querySelectorAll("label, input[type=radio]")].every(hiddenHard)).toBe(true);
  });

  it("keeps the closed panel, filtered items and the empty hint hidden", () => {
    const { w } = setup();
    const panel = w.querySelector("[data-gridselect-panel]");
    expect(hiddenHard(panel)).toBe(true);
    w.querySelector("[data-gridselect-field]").click();
    expect(shown(panel)).toBe(true);
    expect(hiddenHard(w.querySelector("[data-gridselect-empty]"))).toBe(true);
    type(w, "l1");
    const items = [...w.querySelectorAll("[data-gridselect-item]")];
    expect(items.filter(shown).map((i) => i.textContent)).toEqual(["L1", "L10", "L11"]);
    expect(items.filter((i) => !shown(i)).every(hiddenHard)).toBe(true);
    type(w, "zzz");
    expect(shown(w.querySelector("[data-gridselect-empty]"))).toBe(true);
  });

  it("restores the original inline styles on destroy", () => {
    const { w, gs } = setup();
    gs.destroy();
    const labels = [...w.querySelectorAll("label")];
    expect(labels[0].style.cssText).toBe("color: red;");
    expect(labels.slice(1).every((l) => !l.hasAttribute("style"))).toBe(true);
    expect([...w.querySelectorAll("input")].every((i) => !i.hasAttribute("style"))).toBe(true);
    expect(labels.every(shown)).toBe(true);
  });
});
