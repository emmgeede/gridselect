// @vitest-environment jsdom
// F8: multiple choice in the panel and <select multiple>. See docs/features/F8-mehrfachauswahl/spec.md.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { gridselect } from "@emmgeede/gridselect";

const label = (i) => `L${i}`;
function boxes(n, { checked = [], disabled = [], options } = {}) {
  const rows = Array.from({ length: n }, (_, i) =>
    `<label><input type="checkbox" name="c" value="v${i}"${checked.includes(i) ? " checked" : ""}${disabled.includes(i) ? " disabled" : ""}> ${label(i)}</label>`).join("");
  document.body.innerHTML = `<form id="f"><fieldset id="w"><legend>Extras</legend>${rows}</fieldset></form>`;
  const w = document.getElementById("w");
  return { w, gs: gridselect(w, options) };
}
function multiSelect(n, { selected = [], attrs = "", placeholder = false } = {}) {
  const opts = Array.from({ length: n }, (_, i) => `<option value="v${i}"${selected.includes(i) ? " selected" : ""}>${label(i)}</option>`).join("");
  document.body.innerHTML = `<form id="f"><div id="w"><label for="s">Pick</label><select id="s" name="m" multiple ${attrs}>${placeholder ? '<option value="">Choose…</option>' : ""}${opts}</select></div></form>`;
  const w = document.getElementById("w");
  return { w, select: document.getElementById("s"), gs: gridselect(w) };
}
const field = (w) => w.querySelector("[data-gridselect-field]");
const search = (w) => w.querySelector("[data-gridselect-search]");
const items = (w) => [...w.querySelectorAll("[data-gridselect-item]")];
const panelOpen = (w) => !w.querySelector("[data-gridselect-panel]").hidden;
const cursorText = (w) => w.querySelector("[data-cursor] [data-gridselect-label]")?.textContent;
function key(w, k, init = {}) {
  const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init });
  search(w).dispatchEvent(e);
  return e;
}
function type(w, text) {
  search(w).value = text;
  search(w).dispatchEvent(new Event("input", { bubbles: true }));
}
function events(w) {
  const log = [];
  for (const t of ["input", "change"]) w.addEventListener(t, (e) => log.push(`${t}:${e.target.tagName}:${e.target.value}`));
  return log;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("checkbox groups above the threshold", () => {
  it("get the panel with a multiselectable listbox", () => {
    const { w } = boxes(11);
    expect(field(w)).not.toBeNull();
    expect(w.querySelector("[data-gridselect-items]").getAttribute("aria-multiselectable")).toBe("true");
    expect([...w.querySelectorAll("input[type=checkbox]")].every((c) => c.hidden && c.labels[0].hidden)).toBe(true);
  });

  it("toggle per click, Enter and digit, stay open and keep the query", () => {
    const { w, gs } = boxes(12, { options: { shortcuts: ["", "Shift"] } });
    const log = events(w);
    field(w).click();
    type(w, "l1");
    items(w).find((i) => i.textContent.endsWith("L10")).click();
    expect(gs.value).toEqual(["v10"]);
    expect(panelOpen(w)).toBe(true);
    expect(document.activeElement).toBe(search(w));
    expect(search(w).value).toBe("l1");
    key(w, "Enter"); // cursor on first match L1
    expect(gs.value).toEqual(["v1", "v10"]);
    expect(key(w, "3", { code: "Digit3" }).defaultPrevented).toBe(true); // third match L11
    expect(gs.value).toEqual(["v1", "v10", "v11"]);
    items(w).find((i) => i.textContent.endsWith("L10")).click();
    expect(gs.value).toEqual(["v1", "v11"]);
    const byLabel = (t) => items(w).find((i) => i.querySelector("[data-gridselect-label]").textContent === t);
    expect(byLabel("L10").getAttribute("aria-selected")).toBe("false");
    expect(byLabel("L1").getAttribute("aria-selected")).toBe("true");
    expect(log).toEqual(["input:INPUT:v10", "change:INPUT:v10", "input:INPUT:v1", "change:INPUT:v1",
      "input:INPUT:v11", "change:INPUT:v11", "input:INPUT:v10", "change:INPUT:v10"]);
  });

  it("opens with the cursor on the first selected item", () => {
    const { w } = boxes(12, { checked: [4, 7] });
    field(w).click();
    expect(cursorText(w)).toBe("L4");
  });

  it("summarises the selection in the field", () => {
    let { w, gs } = boxes(12);
    expect(field(w).textContent).toBe("Select…");
    gs.value = ["v2"];
    expect(field(w).textContent).toBe("L2");
    gs.value = ["v5", "v2"];
    expect(field(w).textContent).toBe("L2, L5");
    gs.value = ["v1", "v2", "v3"];
    expect(field(w).textContent).toBe("3 selected");
    ({ w } = boxes(12, { checked: [1, 2, 3], options: { selectedText: (n) => `${n} gewählt` } }));
    expect(field(w).textContent).toBe("3 gewählt");
    ({ w } = boxes(12, { checked: [1, 2, 3], options: { selectedText: "x" } }));
    expect(field(w).textContent).toBe("3 selected");
  });

  it("cannot toggle a disabled item", () => {
    const { w, gs } = boxes(12, { disabled: [0] });
    field(w).click();
    items(w)[0].click();
    expect(gs.value).toEqual([]);
  });

  it("syncs field and items on value set, without events", () => {
    const { w, gs } = boxes(12);
    const log = events(w);
    gs.value = ["v1", "v3"];
    expect(field(w).textContent).toBe("L1, L3");
    field(w).click();
    expect(items(w).filter((i) => i.getAttribute("aria-selected") === "true").length).toBe(2);
    expect(log).toEqual([]);
  });
});

describe("<select multiple>", () => {
  it("builds generated checkboxes, hides the select, no warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { w, select } = multiSelect(4, { placeholder: true });
    const gen = [...w.querySelectorAll("label[data-gridselect-generated] input")];
    expect(gen.map((c) => c.type)).toEqual(["checkbox", "checkbox", "checkbox", "checkbox"]);
    expect(gen.every((c) => c.form === null && !c.hidden)).toBe(true);
    expect(select.hidden).toBe(true);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("shows the panel with multiple choice above the threshold", () => {
    const { w } = multiSelect(12);
    expect(field(w)).not.toBeNull();
    expect(w.querySelector("[data-gridselect-items]").getAttribute("aria-multiselectable")).toBe("true");
  });

  it("updates the options, fires select events only, submits all values", () => {
    let { w, select } = multiSelect(4);
    const log = events(w);
    const gen = [...w.querySelectorAll("label[data-gridselect-generated] input")];
    gen[1].click();
    gen[3].click();
    expect([...select.selectedOptions].map((o) => o.value)).toEqual(["v1", "v3"]);
    expect(log).toEqual(["input:SELECT:v1", "change:SELECT:v1", "input:SELECT:v1", "change:SELECT:v1"]);
    expect(new FormData(document.getElementById("f")).getAll("m")).toEqual(["v1", "v3"]);

    ({ w, select } = multiSelect(12));
    field(w).click();
    items(w)[5].click();
    items(w)[6].click();
    expect(panelOpen(w)).toBe(true);
    expect([...select.selectedOptions].map((o) => o.value)).toEqual(["v5", "v6"]);
  });

  it("reads and writes value as an array, without events, and rejects non-arrays", () => {
    const { w, select, gs } = multiSelect(12, { selected: [2] });
    const log = events(w);
    expect(gs.value).toEqual(["v2"]);
    gs.value = ["v7", "v1"];
    expect([...select.selectedOptions].map((o) => o.value)).toEqual(["v1", "v7"]);
    expect(gs.value).toEqual(["v1", "v7"]);
    expect(field(w).textContent).toBe("L1, L7");
    expect(log).toEqual([]);
    expect(() => { gs.value = "v1"; }).toThrow(/^gridselect:/);
  });

  it("follows outside changes with an event, a reset, and changes without event on open", async () => {
    const { w, select } = multiSelect(12, { selected: [0] });
    select.options[3].selected = true;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(field(w).textContent).toBe("L0, L3");
    document.getElementById("f").reset();
    await new Promise((r) => setTimeout(r, 0));
    expect(field(w).textContent).toBe("L0");
    select.options[9].selected = true;
    field(w).click();
    expect(items(w)[9].getAttribute("aria-selected")).toBe("true");
  });

  it("flags and focuses the field when required and empty", () => {
    const { w } = multiSelect(12, { attrs: "required" });
    document.getElementById("f").requestSubmit();
    expect(document.activeElement).toBe(field(w));
    expect(field(w).getAttribute("aria-invalid")).toBe("true");
  });
});
