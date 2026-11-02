// @vitest-environment jsdom
// F14: group headings in the panel. See docs/features/F14-optgroups/spec.md.
import { describe, it, expect, beforeEach } from "vitest";
import { gridselect } from "@emmgeede/gridselect";
import "@emmgeede/gridselect/element";

const opts = (vals) => vals.map((v) => `<option value="${v}">${v} label</option>`).join("");
const bare = (vals) => vals.map((v) => `<option>${v}</option>`).join("");
const EU = ["EUR", "CHF", "GBP", "SEK", "NOK", "DKK"];
const AS = ["JPY", "CNY", "INR", "KRW", "SGD", "HKD"];

function selectWrapper(inner, attrs = "") {
  document.body.innerHTML = `<form><div id="w" ${attrs}><label for="s">Currency</label><select id="s" name="cur">${inner}</select></div></form>`;
  return document.getElementById("w");
}
const grouped = () => selectWrapper(`<optgroup label="Europe">${opts(EU)}</optgroup><optgroup label="Asia">${opts(AS)}</optgroup>`);
const field = (w) => w.querySelector("[data-gridselect-field]");
const search = (w) => w.querySelector("[data-gridselect-search]");
const groups = (w) => [...w.querySelectorAll("[data-gridselect-group]")];
const heading = (g) => g.querySelector("[data-gridselect-group-label]");
const valuesIn = (el) => [...el.querySelectorAll("[data-gridselect-item]")].filter((i) => !i.hidden).map((i) => i.dataset.value);
const cursor = (w) => w.querySelector("[data-cursor]")?.dataset.value;
const key = (w, k, init = {}) => search(w).dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
function type(w, text) {
  search(w).value = text;
  search(w).dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("sources", () => {
  it("shows a heading per optgroup of a select, with its items inside the group", () => {
    const w = grouped();
    gridselect(w);
    field(w).click();
    const g = groups(w);
    expect(g.map((x) => heading(x).textContent)).toEqual(["Europe", "Asia"]);
    expect(valuesIn(g[0])).toEqual(EU);
    expect(valuesIn(g[1])).toEqual(AS);
  });

  it("takes groups from items, keeps ungrouped entries in place without a heading", () => {
    document.body.innerHTML = `<fieldset id="w"><legend>Currency</legend></fieldset>`;
    const w = document.getElementById("w");
    const gs = gridselect(w, { items: ["USD", { label: "Europe", items: EU }, "MXN", { label: "Asia", items: [{ value: "JPY", label: "Yen" }, ...AS.slice(1)] }] });
    field(w).click();
    const all = [...w.querySelectorAll("[data-gridselect-item]")].map((i) => i.dataset.value);
    expect(all).toEqual(["USD", ...EU, "MXN", ...AS]);
    expect(groups(w).map((x) => heading(x).textContent)).toEqual(["Europe", "Asia"]);
    expect(valuesIn(groups(w)[1])[0]).toBe("JPY");
    expect(groups(w)[1].querySelector("[data-gridselect-item]").textContent).toContain("Yen");
    gs.setItems([{ label: "Asia", items: AS }, { label: "Europe", items: EU }]);
    field(w).click();
    expect(groups(w).map((x) => heading(x).textContent)).toEqual(["Asia", "Europe"]);
  });

  it("rejects nested groups and bad group objects with the position, and keeps old entries", () => {
    document.body.innerHTML = `<fieldset id="w"><legend>x</legend></fieldset>`;
    const w = document.getElementById("w");
    expect(() => gridselect(w, { items: ["a", { label: "G", items: [{ label: "H", items: [] }] }] })).toThrow(/gridselect:.*items\[1\]\.items\[0\]/);
    expect(() => gridselect(w, { items: [{ label: 1, items: [] }] })).toThrow(/gridselect:.*items\[0\]/);
    expect(() => gridselect(w, { items: [{ label: "G", items: "x" }] })).toThrow(/gridselect:.*items\[0\]/);
    const gs = gridselect(w, { items: ["a", "b"] });
    expect(() => gs.setItems([{ label: "G", items: [{ nope: 1 }] }])).toThrow(/items\[0\]\.items\[0\]/);
    expect(gs.value).toBeNull();
    expect([...w.querySelectorAll("input")].map((i) => i.value)).toEqual(["a", "b"]);
  });

  it("skips empty groups", () => {
    const w = selectWrapper(`<optgroup label="Empty"></optgroup><optgroup label="Europe">${opts(EU)}</optgroup><optgroup label="Asia">${opts(AS)}</optgroup>`);
    gridselect(w);
    field(w).click();
    expect(groups(w).map((x) => heading(x).textContent)).toEqual(["Europe", "Asia"]);
  });

  it("shows no headings at or below the threshold", () => {
    const w = selectWrapper(`<optgroup label="Europe">${opts(["EUR", "CHF"])}</optgroup><optgroup label="Asia">${opts(["JPY"])}</optgroup>`);
    gridselect(w);
    expect(w.querySelector("[data-gridselect-group-label]")).toBeNull();
    expect([...w.querySelectorAll("label[data-gridselect-generated] input")].map((i) => i.value)).toEqual(["EUR", "CHF", "JPY"]);
  });

  it("<grid-select> reads optgroup children, hides them and rebuilds on a label change", async () => {
    document.body.innerHTML = `<grid-select label="Currency"><option value="USD">US dollar</option><optgroup label="Europe">${opts(EU)}</optgroup><optgroup label="Asia">${opts(AS)}</optgroup></grid-select>`;
    const el = document.querySelector("grid-select");
    field(el).click();
    expect(groups(el).map((x) => heading(x).textContent)).toEqual(["Europe", "Asia"]);
    expect([...el.querySelectorAll(":scope > optgroup")].every((g) => g.hidden)).toBe(true);
    el.querySelector("optgroup").label = "Euro area";
    await Promise.resolve();
    await Promise.resolve();
    field(el).click();
    expect(heading(groups(el)[0]).textContent).toBe("Euro area");
  });
});

describe("panel behaviour", () => {
  it("numbers continuously across groups", () => {
    const w = grouped();
    gridselect(w);
    field(w).click();
    const digits = [...w.querySelectorAll("[data-gridselect-item] [data-gridselect-key]")].map((k) => (k.dataset.prefix ?? "") + k.textContent);
    expect(digits).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "S1", "S2"]);
  });

  it("arrow keys cross group borders and never land on a heading", () => {
    const w = grouped();
    gridselect(w);
    field(w).click();
    for (let i = 0; i < 6; i++) key(w, "ArrowRight");
    expect(cursor(w)).toBe("JPY");
    key(w, "ArrowLeft");
    expect(cursor(w)).toBe("DKK");
    key(w, "ArrowDown"); // jsdom has no layout: one step
    expect(cursor(w)).toBe("JPY");
  });

  it("filter mode sorts inside each group, keeps group order and hides groups without matches", () => {
    const w = selectWrapper(`<optgroup label="A">${bare(["xb", "bx", "cc", "dd", "ee", "ff"])}</optgroup><optgroup label="B">${bare(["by", "yb", "gg", "hh", "ii"])}</optgroup><optgroup label="C">${bare(["zz"])}</optgroup>`);
    gridselect(w);
    field(w).click();
    type(w, "b");
    const [a, b, c] = groups(w);
    expect(valuesIn(a)).toEqual(["bx", "xb"]);
    expect(valuesIn(b)).toEqual(["by", "yb"]);
    expect(c.hidden).toBe(true);
    expect(a.hidden || b.hidden).toBe(false);
    expect(cursor(w)).toBe("bx");
    expect(w.querySelector("[data-gridselect-status]").textContent).toBe("4 results");
    type(w, "");
    expect(groups(w).every((g) => !g.hidden)).toBe(true);
    expect(valuesIn(a)).toEqual(["xb", "bx", "cc", "dd", "ee", "ff"]);
  });

  it("highlight mode keeps every group, the group name is not searched", () => {
    const w = grouped();
    w.dataset.search = "highlight";
    gridselect(w);
    field(w).click();
    type(w, "jpy");
    expect(groups(w).length).toBe(2);
    expect(groups(w).every((g) => !g.hidden)).toBe(true);
    expect(w.querySelectorAll("[data-match]").length).toBe(1);
    type(w, "europe");
    expect(w.querySelectorAll("[data-match]").length).toBe(0);
  });

  it("filter mode finds nothing by group name", () => {
    const w = grouped();
    gridselect(w);
    field(w).click();
    type(w, "asia");
    expect(groups(w).length).toBe(2);
    expect(groups(w).every((g) => g.hidden)).toBe(true);
    expect(w.querySelector("[data-gridselect-empty]").hidden).toBe(false);
  });
});

describe("accessibility", () => {
  it("each group has role=group named by its heading, with the options inside", () => {
    const w = grouped();
    gridselect(w);
    field(w).click();
    expect(groups(w).length).toBe(2);
    for (const g of groups(w)) {
      expect(g.getAttribute("role")).toBe("group");
      const h = heading(g);
      expect(h.id).not.toBe("");
      expect(g.getAttribute("aria-labelledby")).toBe(h.id);
      expect(g.querySelectorAll("[role=option]").length).toBe(6);
    }
  });

  it("disables the entries of a disabled optgroup, the heading stays plain", () => {
    const w = selectWrapper(`<optgroup label="Europe" disabled>${opts(EU)}</optgroup><optgroup label="Asia">${opts(AS)}</optgroup>`);
    gridselect(w);
    field(w).click();
    const [eu] = groups(w);
    expect([...eu.querySelectorAll("[data-gridselect-item]")].every((i) => i.getAttribute("aria-disabled") === "true")).toBe(true);
    expect(heading(eu).hasAttribute("aria-disabled")).toBe(false);
  });

  it("treats group names as text and gives duplicate names their own ids", () => {
    document.body.innerHTML = `<fieldset id="w"><legend>x</legend></fieldset>`;
    const w = document.getElementById("w");
    gridselect(w, { items: [{ label: "<img src=x>", items: EU }, { label: "<img src=x>", items: AS }] });
    field(w).click();
    expect(w.querySelector("img")).toBeNull();
    const ids = groups(w).map((g) => heading(g).id);
    expect(new Set(ids).size).toBe(2);
  });

  it("destroy removes the groups again", () => {
    const w = grouped();
    const before = w.outerHTML;
    gridselect(w).destroy();
    expect(w.outerHTML).toBe(before);
  });
});
