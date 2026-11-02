// @vitest-environment jsdom
// F18: a second line per entry. See docs/features/F18-beschreibung/spec.md.
import { describe, it, expect, beforeEach } from "vitest";
import { gridselect } from "@emmgeede/gridselect";
import "@emmgeede/gridselect/element";

const CUR = [
  { value: "EUR", label: "Euro", description: "Eurozone, 20 countries" },
  { value: "CHF", label: "Swiss franc", description: "Switzerland, Liechtenstein" },
  { value: "USD", label: "US dollar", description: "United States, Ecuador" },
  ...["GBP", "JPY", "DKK", "NOK", "SEK", "PLN", "CZK", "HUF", "TRY"].map((v) => ({ value: v, label: v })),
];
function mount(items = CUR, opts = {}, attrs = "") {
  document.body.innerHTML = `<fieldset id="w" ${attrs}><legend>Currency</legend></fieldset>`;
  const w = document.getElementById("w");
  return [w, gridselect(w, { items, ...opts })];
}
const field = (w) => w.querySelector("[data-gridselect-field]");
const item = (w, v) => w.querySelector(`[data-gridselect-item][data-value="${v}"]`);
const desc = (el) => el.querySelector("[data-gridselect-description]");
const describedText = (el) => (el.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean)
  .map((id) => document.getElementById(id)?.textContent).join(" ");
function type(w, text) {
  const s = w.querySelector("[data-gridselect-search]");
  s.value = text;
  s.dispatchEvent(new Event("input", { bubbles: true }));
}
const visible = (w) => [...w.querySelectorAll("[data-gridselect-item]")].filter((i) => !i.hidden).map((i) => i.dataset.value);

beforeEach(() => (document.body.innerHTML = ""));

describe("sources", () => {
  it("items: a description element as text, described input, not part of the field text", () => {
    const [w, gs] = mount(CUR.slice(0, 3).concat([{ value: "x", label: "<b>X</b>", description: "<img src=x>" }]), { value: "EUR" });
    const input = w.querySelector('input[value="EUR"]');
    expect(desc(input.labels[0]).textContent).toBe("Eurozone, 20 countries");
    expect(describedText(input)).toBe("Eurozone, 20 countries");
    expect(desc(input.labels[0]).getAttribute("aria-hidden")).toBe("true");
    expect(w.querySelector("img")).toBeNull();
    expect(gs.value).toBe("EUR");
  });

  it("<option data-description> in a select and in <grid-select>", () => {
    const opts = CUR.map((c) => `<option value="${c.value}"${c.description ? ` data-description="${c.description}"` : ""}>${c.label}</option>`).join("");
    document.body.innerHTML = `<div id="w"><label for="s">Currency</label><select id="s">${opts}</select></div><grid-select label="x">${opts}</grid-select>`;
    const w = document.getElementById("w");
    gridselect(w);
    field(w).click();
    expect(desc(item(w, "CHF")).textContent).toBe("Switzerland, Liechtenstein");
    const el = document.querySelector("grid-select");
    field(el).click();
    expect(desc(item(el, "USD")).textContent).toBe("United States, Ecuador");
  });

  it("own markup: an element with data-gridselect-description, attributes removed on destroy", () => {
    document.body.innerHTML = `<fieldset id="w"><legend>x</legend><label><input type="radio" name="r" value="a"> Alpha <small data-gridselect-description>First letter</small></label><label><input type="radio" name="r" value="b"> Beta</label></fieldset>`;
    const w = document.getElementById("w");
    const before = w.outerHTML;
    const gs = gridselect(w);
    const a = w.querySelector('input[value="a"]');
    expect(describedText(a)).toBe("First letter");
    expect(w.querySelector('input[value="b"]').hasAttribute("aria-describedby")).toBe(false);
    gs.destroy();
    expect(w.outerHTML).toBe(before);
  });
});

describe("panel", () => {
  it("shows the description in items and copies, describes the option, keeps the field short", () => {
    const [w] = mount(CUR, { value: "CHF", pinned: ["EUR"] });
    expect(field(w).textContent).toBe("Swiss franc");
    field(w).click();
    const chf = item(w, "CHF");
    expect(desc(chf).textContent).toBe("Switzerland, Liechtenstein");
    expect(describedText(chf)).toBe("Switzerland, Liechtenstein");
    expect(chf.querySelector("[data-gridselect-label]").firstChild.textContent).toBe("Swiss franc");
    const copy = w.querySelector('[data-gridselect-top] [data-value="EUR"]');
    expect(describedText(copy)).toBe("Eurozone, 20 countries");
    expect(item(w, "GBP").hasAttribute("aria-describedby")).toBe(false);
  });

  it("does not search descriptions by default", () => {
    const [w] = mount();
    field(w).click();
    type(w, "liechtenstein");
    expect(visible(w)).toEqual([]);
  });

  it("searchDescription finds them, label matches first (substring and fuzzy)", () => {
    const items = [{ value: "a", label: "Alpha", description: "dollar area" }, ...CUR];
    let [w] = mount(items, { searchDescription: true });
    field(w).click();
    type(w, "united");
    expect(visible(w)).toEqual(["USD"]);
    type(w, "dol");
    expect(visible(w)).toEqual(["USD", "a"]); // label "US dollar" before the description "dollar area" of Alpha
    [w] = mount(items, {}, 'data-search-description data-match-mode="fuzzy"');
    field(w).click();
    type(w, "ecdr");
    expect(visible(w)).toEqual(["USD"]);
  });
});

describe("element and wrappers", () => {
  it("<grid-select search-description> searches descriptions", () => {
    document.body.innerHTML = `<grid-select label="x" search-description>${CUR.map((c) => `<option value="${c.value}" data-description="${c.description ?? ""}">${c.label}</option>`).join("")}</grid-select>`;
    const el = document.querySelector("grid-select");
    field(el).click();
    type(el, "ecuador");
    expect(visible(el)).toEqual(["USD"]);
    expect(item(el, "GBP").hasAttribute("aria-describedby")).toBe(false); // empty description: none
  });
});
