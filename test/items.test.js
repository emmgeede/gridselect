// @vitest-environment jsdom
// F9: entries from a JS array. See docs/features/F9-array-quelle/spec.md.
import { describe, it, expect, beforeEach } from "vitest";
import { gridselect } from "@emmgeede/gridselect";

const many = (n, from = 0) => Array.from({ length: n }, (_, i) => ({ value: `v${i + from}`, label: `L${i + from}` }));
function mount(html = "<legend>Currency</legend>") {
  document.body.innerHTML = `<form id="f"><fieldset id="w">${html}</fieldset></form>`;
  return document.getElementById("w");
}
const inputs = (w) => [...w.querySelectorAll("label[data-gridselect-generated] input")];
const field = (w) => w.querySelector("[data-gridselect-field]");

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("building from items", () => {
  it("creates labelled radios with name, values, labels and disabled state", () => {
    const w = mount();
    gridselect(w, { name: "cur", items: ["EUR", { value: "CHF", label: "Swiss franc" }, { value: "USD", label: "US dollar", disabled: true }] });
    const r = inputs(w);
    expect(r.map((i) => [i.type, i.name, i.value, i.disabled])).toEqual([
      ["radio", "cur", "EUR", false], ["radio", "cur", "CHF", false], ["radio", "cur", "USD", true]]);
    expect(r.map((i) => i.labels[0].textContent.replace(/^\d/, "").trim())).toEqual(["EUR", "Swiss franc", "US dollar"]);
  });

  it("creates checkboxes with multiple and checks the initial value", () => {
    let w = mount();
    let gs = gridselect(w, { items: ["a", "b", "c"], multiple: true, value: ["a", "c"] });
    expect(inputs(w).map((i) => i.type)).toEqual(["checkbox", "checkbox", "checkbox"]);
    expect(gs.value).toEqual(["a", "c"]);
    w = mount();
    gs = gridselect(w, { items: ["a", "b"], value: "b" });
    expect(gs.value).toBe("b");
    w = mount();
    gs = gridselect(w, { items: ["a", "b"] });
    expect(gs.value).toBeNull();
  });

  it("submits under the name, or forms an unsubmitted group without one", () => {
    let w = mount();
    gridselect(w, { name: "cur", items: ["a", "b"], value: "b" });
    expect(new FormData(document.getElementById("f")).get("cur")).toBe("b");
    w = mount();
    gridselect(w, { items: ["a", "b"], value: "b" });
    const r = inputs(w);
    expect(r[0].name).toBe(r[1].name);
    expect(r[0].name).not.toBe("");
    expect(r[0].form).toBeNull();
    expect([...new FormData(document.getElementById("f")).keys()]).toEqual([]);
  });

  it("gets the panel above the threshold, with events from the generated inputs", () => {
    const w = mount();
    const gs = gridselect(w, { name: "x", items: many(12) });
    const log = [];
    w.addEventListener("change", (e) => log.push(e.target.value));
    field(w).click();
    w.querySelectorAll("[data-gridselect-item]")[4].click();
    expect(gs.value).toBe("v4");
    expect(log).toEqual(["v4"]);
  });

  it("puts labels in as text", () => {
    const w = mount();
    gridselect(w, { items: [{ value: "x", label: "<img src=x onerror=alert(1)>" }] });
    expect(w.querySelector("img")).toBeNull();
    expect(w.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("turns numbers into strings and accepts an empty list", () => {
    let w = mount();
    let gs = gridselect(w, { items: [1, { value: 2, label: "Two" }], value: 2 });
    expect(inputs(w).map((i) => i.value)).toEqual(["1", "2"]);
    expect(gs.value).toBe("2");
    w = mount();
    gs = gridselect(w, { items: [] });
    expect(gs.value).toBeNull();
  });
});

describe("setItems", () => {
  it("replaces the entries, keeps the instance and surviving choices, fires no event", () => {
    const w = mount();
    const gs = gridselect(w, { name: "c", items: ["a", "b", "c"], multiple: true, value: ["a", "c"] });
    const log = [];
    w.addEventListener("change", () => log.push(1));
    w.addEventListener("input", () => log.push(1));
    gs.setItems(["c", "d"]);
    expect(gridselect(w)).toBe(gs);
    expect(inputs(w).map((i) => i.value)).toEqual(["c", "d"]);
    expect(gs.value).toEqual(["c"]);
    expect(log).toEqual([]);
  });

  it("switches between flat items and the panel when crossing the threshold", () => {
    const w = mount();
    const gs = gridselect(w, { name: "c", items: many(3), value: "v1" });
    expect(field(w)).toBeNull();
    gs.setItems(many(15));
    expect(field(w)).not.toBeNull();
    expect(field(w).textContent).toBe("L1");
    expect(w.querySelectorAll("[data-gridselect-panel]")).toHaveLength(1);
    gs.setItems(many(4));
    expect(field(w)).toBeNull();
    expect(w.querySelector("[data-gridselect-panel]")).toBeNull();
    expect(inputs(w).every((i) => !i.hidden)).toBe(true);
    expect(gs.value).toBe("v1");
  });

  it("closes an open panel before rebuilding", () => {
    const w = mount();
    const gs = gridselect(w, { items: many(12) });
    field(w).click();
    gs.setItems(many(13));
    expect(w.querySelector("[data-gridselect-panel]").hidden).toBe(true);
  });

  it("throws for instances from markup or select", () => {
    let w = mount('<label><input type="radio" name="a" value="1"> One</label>');
    expect(() => gridselect(w).setItems(["x"])).toThrow(/^gridselect:/);
    w = mount('<select><option value="1">One</option></select>');
    expect(() => gridselect(w).setItems(["x"])).toThrow(TypeError);
  });
});

describe("invalid input", () => {
  it("rejects items on a wrapper that already holds inputs or a select", () => {
    let w = mount('<label><input type="radio" name="a" value="1"> One</label>');
    expect(() => gridselect(w, { items: ["x"] })).toThrow(/^gridselect:/);
    w = mount('<select><option value="1">One</option></select>');
    expect(() => gridselect(w, { items: ["x"] })).toThrow(TypeError);
  });

  it("names the position of an invalid entry and leaves the old entries on a bad setItems", () => {
    let w = mount();
    expect(() => gridselect(w, { items: ["a", true] })).toThrow(/^gridselect:.*\b1\b/);
    w = mount();
    expect(() => gridselect(w, { items: [{ label: "no value" }] })).toThrow(/\b0\b/);
    w = mount();
    const gs = gridselect(w, { items: ["a", "b"], value: "a" });
    expect(() => gs.setItems(["c", null])).toThrow(TypeError);
    expect(inputs(w).map((i) => i.value)).toEqual(["a", "b"]);
    expect(gs.value).toBe("a");
  });

  it("restores the original markup on destroy", () => {
    const w = mount();
    const before = w.outerHTML;
    const gs = gridselect(w, { items: many(14) });
    field(w).click();
    gs.destroy();
    expect(w.outerHTML).toBe(before);
  });
});

describe("QA F9 fixes", () => {
  it("keeps the focus in the group when setItems rebuilds it", () => {
    let w = mount();
    let gs = gridselect(w, { items: many(12) });
    field(w).focus();
    gs.setItems(many(13));
    expect(document.activeElement).toBe(field(w));

    w = mount();
    gs = gridselect(w, { items: many(4), value: "v2" });
    inputs(w)[2].focus();
    gs.setItems(many(5));
    expect(document.activeElement).toBe(inputs(w)[2]);

    gs.setItems(many(12)); // focus was on a radio, now there is a field
    expect(document.activeElement).toBe(field(w));
  });

  it("leaves the focus alone when it was outside the group", () => {
    const w = mount();
    document.body.insertAdjacentHTML("beforeend", '<button id="out">o</button>');
    const gs = gridselect(w, { items: many(4) });
    document.getElementById("out").focus();
    gs.setItems(many(12));
    expect(document.activeElement.id).toBe("out");
  });

  it("refuses setItems after destroy", () => {
    const w = mount();
    const gs = gridselect(w, { items: many(3) });
    gs.destroy();
    expect(() => gs.setItems(many(2))).toThrow(/^gridselect:/);
    expect(w.querySelectorAll("input")).toHaveLength(0);
  });
});
