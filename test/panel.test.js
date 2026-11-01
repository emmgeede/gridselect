// @vitest-environment jsdom
// F2: grid panel above the threshold. See docs/features/F2-grid-panel/spec.md.
import { describe, it, expect, beforeEach } from "vitest";
import { gridselect } from "gridselect";

const names = ["Euro", "Franc", "Dollar", "Pound", "Yen", "Krone", "Zloty", "Forint", "Lira", "Real", "Rand", "Peso"];

/** Radio group with n entries, values v0..v(n-1), labels from `names`. */
function radios(n, { checked = -1, legend = "Currency", attrs = "", wrapperAttrs = "" } = {}) {
  const items = Array.from({ length: n }, (_, i) =>
    `<label><input type="radio" name="cur" value="v${i}"${i === checked ? " checked" : ""}${attrs}> ${names[i]} </label>`).join("");
  document.body.innerHTML = `<form><fieldset data-gridselect ${wrapperAttrs}>${legend ? `<legend>${legend}</legend>` : ""}${items}</fieldset></form><button id="outside">x</button>`;
  return document.querySelector("[data-gridselect]");
}

const field = (w) => w.querySelector("[data-gridselect-field]");
const panel = (w) => w.querySelector("[data-gridselect-panel]");

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("threshold and setup", () => {
  it("keeps 10 radios flat and untouched", () => {
    const w = radios(10);
    const before = w.outerHTML;
    gridselect(w);
    expect(field(w)).toBeNull();
    expect(w.outerHTML).toBe(before);
  });

  it("builds a closed field and a hidden panel for 11 radios", () => {
    const w = radios(11);
    gridselect(w);
    const f = field(w);
    expect(f.tagName).toBe("BUTTON");
    expect(f.type).toBe("button");
    expect(f.classList.contains("gridselect__field")).toBe(true);
    expect(f.getAttribute("aria-haspopup")).toBe("listbox");
    expect(f.getAttribute("aria-expanded")).toBe("false");
    expect(panel(w).classList.contains("gridselect__panel")).toBe(true);
    expect(panel(w).hidden).toBe(true);
  });

  it("hides the native radios and labels but keeps them for the form", () => {
    const w = radios(11, { checked: 3 });
    gridselect(w);
    for (const r of w.querySelectorAll("input[type=radio]")) {
      expect(r.hidden).toBe(true);
      expect(r.labels[0].hidden).toBe(true);
    }
    expect(new FormData(document.querySelector("form")).get("cur")).toBe("v3");
  });

  it("reads the threshold from options and data-threshold, options win", () => {
    let w = radios(11);
    gridselect(w, { threshold: 20 });
    expect(field(w)).toBeNull();

    w = radios(6, { wrapperAttrs: 'data-threshold="5"' });
    gridselect(w);
    expect(field(w)).not.toBeNull();

    w = radios(6, { wrapperAttrs: 'data-threshold="5"' });
    gridselect(w, { threshold: 10 });
    expect(field(w)).toBeNull();
  });

  it.each([[0], ["x"], [{ threshold: "3" }], [{ threshold: -1 }], [{ threshold: 2.5 }]])(
    "ignores invalid options %j and falls back to 10", (options) => {
      const w = radios(10);
      expect(() => gridselect(w, options)).not.toThrow();
      expect(field(w)).toBeNull();
    });

  it("keeps checkbox groups flat at any size", () => {
    document.body.innerHTML = `<div id="w">${Array.from({ length: 11 }, (_, i) => `<input type="checkbox" value="${i}">`).join("")}</div>`;
    const w = document.getElementById("w");
    const before = w.outerHTML;
    gridselect(w);
    expect(w.outerHTML).toBe(before);
  });
});

const search = (w) => w.querySelector("[data-gridselect-search]");
const list = (w) => w.querySelector("[data-gridselect-items]");
const items = (w) => [...w.querySelectorAll("[data-gridselect-item]")];

describe("closed field text and name", () => {
  it("shows the trimmed label of the checked radio, else the placeholder", () => {
    let w = radios(11, { checked: 2 });
    gridselect(w);
    expect(field(w).textContent).toBe("Dollar");

    w = radios(11);
    gridselect(w);
    expect(field(w).textContent).toBe("Select…");

    w = radios(11);
    gridselect(w, { placeholder: "Wählen…" });
    expect(field(w).textContent).toBe("Wählen…");
  });

  it("is labelled by the legend plus itself, giving the legend an id if needed", () => {
    const w = radios(11);
    gridselect(w);
    const legend = w.querySelector("legend");
    expect(legend.id).not.toBe("");
    expect(field(w).getAttribute("aria-labelledby")).toBe(`${legend.id} ${field(w).id}`);
  });

  it("reuses the wrapper's aria-labelledby", () => {
    const w = radios(11, { legend: "", wrapperAttrs: 'aria-labelledby="h1 h2"' });
    gridselect(w);
    expect(field(w).getAttribute("aria-labelledby")).toBe(`h1 h2 ${field(w).id}`);
  });

  it("combines the wrapper's aria-label with the current text", () => {
    const w = radios(11, { legend: "", checked: 0, wrapperAttrs: 'aria-label="Currency"' });
    gridselect(w);
    expect(field(w).getAttribute("aria-label")).toBe("Currency, Euro");
    expect(field(w).hasAttribute("aria-labelledby")).toBe(false);
  });

  it("sets no name attributes without a group name", () => {
    const w = radios(11, { legend: "" });
    gridselect(w);
    expect(field(w).hasAttribute("aria-label")).toBe(false);
    expect(field(w).hasAttribute("aria-labelledby")).toBe(false);
  });
});

describe("panel structure", () => {
  it("has a combobox search input controlling a listbox", () => {
    const w = radios(11);
    gridselect(w, { searchPlaceholder: "Suchen…" });
    const s = search(w);
    expect(s.type).toBe("text");
    expect(s.classList.contains("gridselect__search")).toBe(true);
    expect(s.getAttribute("role")).toBe("combobox");
    expect(s.getAttribute("aria-autocomplete")).toBe("list");
    expect(s.getAttribute("aria-controls")).toBe(list(w).id);
    expect(s.placeholder).toBe("Suchen…");
    expect(list(w).getAttribute("role")).toBe("listbox");
    expect(list(w).classList.contains("gridselect__items")).toBe(true);
  });

  it("defaults the search placeholder to Search…", () => {
    const w = radios(11);
    gridselect(w);
    expect(search(w).placeholder).toBe("Search…");
  });

  it("has one option item per radio, in order, with unique ids", () => {
    const w = radios(11);
    gridselect(w);
    const c = items(w);
    expect(c.map((x) => x.textContent)).toEqual(names.slice(0, 11));
    expect(c.map((x) => x.dataset.value)).toEqual(Array.from({ length: 11 }, (_, i) => `v${i}`));
    expect(c.every((x) => x.getAttribute("role") === "option" && x.classList.contains("gridselect__item"))).toBe(true);
    expect(new Set(c.map((x) => x.id)).size).toBe(11);
    expect(document.querySelectorAll(`[id="${c[0].id}"]`)).toHaveLength(1);
  });

  it("uses the value when a radio has no label", () => {
    document.body.innerHTML = `<div id="w">${Array.from({ length: 11 }, (_, i) => `<input type="radio" name="a" value="x${i}">`).join("")}</div>`;
    const w = document.getElementById("w");
    gridselect(w);
    expect(items(w)[0].textContent).toBe("x0");
  });

  it("puts label text in as text, never as markup", () => {
    const w = radios(11);
    w.querySelector("label").append(document.createTextNode("<img src=x onerror=alert(1)>"));
    gridselect(w);
    expect(items(w)[0].textContent).toContain("<img src=x onerror=alert(1)>");
    expect(items(w)[0].querySelector("img")).toBeNull();
  });
});

const key = (el, k, init = {}) => {
  const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(e);
  return e;
};
const cursor = (w) => w.querySelector("[data-gridselect-item][data-cursor]");
const isOpen = (w) => !panel(w).hidden && field(w).getAttribute("aria-expanded") === "true";

describe("opening", () => {
  it("opens on click and focuses the search input", () => {
    const w = radios(11);
    gridselect(w);
    field(w).click();
    expect(isOpen(w)).toBe(true);
    expect(document.activeElement).toBe(search(w));
  });

  it.each(["Enter", " ", "ArrowDown"])("opens on %j and prevents the default action", (k) => {
    const w = radios(11);
    gridselect(w);
    field(w).focus();
    const e = key(field(w), k);
    expect(isOpen(w)).toBe(true);
    expect(e.defaultPrevented).toBe(true);
  });

  it("starts with an empty search and the cursor on the selected item", () => {
    const w = radios(11, { checked: 5 });
    gridselect(w);
    field(w).click();
    expect(search(w).value).toBe("");
    expect(cursor(w)).toBe(items(w)[5]);
    expect(search(w).getAttribute("aria-activedescendant")).toBe(items(w)[5].id);
    expect(w.querySelectorAll("[data-cursor]")).toHaveLength(1);
  });

  it("puts the cursor on the first item without a selection, and clears old search text on reopen", () => {
    const w = radios(11);
    gridselect(w);
    field(w).click();
    search(w).value = "abc";
    key(search(w), "Escape");
    field(w).click();
    expect(search(w).value).toBe("");
    expect(cursor(w)).toBe(items(w)[0]);
  });

  it("marks only the selected item with aria-selected", () => {
    const w = radios(11, { checked: 1 });
    gridselect(w);
    field(w).click();
    expect(items(w).map((c) => c.getAttribute("aria-selected"))).toEqual(
      Array.from({ length: 11 }, (_, i) => String(i === 1)));
  });
});

/** Opens a 12-radio panel with the cursor on item `start`, grid columns set as inline style. */
function openGrid(start, { columns = "1fr 1fr 1fr 1fr", options } = {}) {
  const w = radios(12, { checked: start });
  gridselect(w, options);
  if (columns) list(w).style.gridTemplateColumns = columns;
  field(w).click();
  return w;
}
const at = (w) => items(w).indexOf(cursor(w));

describe("arrow keys", () => {
  it("moves ±1 and ±measured columns, preventing the default", () => {
    const w = openGrid(5);
    const moves = [["ArrowRight", 6], ["ArrowDown", 10], ["ArrowLeft", 9], ["ArrowUp", 5]];
    for (const [k, expected] of moves) {
      const e = key(search(w), k);
      expect(at(w)).toBe(expected);
      expect(e.defaultPrevented).toBe(true);
    }
    expect(search(w).getAttribute("aria-activedescendant")).toBe(items(w)[5].id);
  });

  it("stops at the first and last item", () => {
    let w = openGrid(1);
    key(search(w), "ArrowUp");
    expect(at(w)).toBe(0);
    key(search(w), "ArrowLeft");
    expect(at(w)).toBe(0);

    w = openGrid(10);
    key(search(w), "ArrowDown");
    expect(at(w)).toBe(11);
    key(search(w), "ArrowRight");
    expect(at(w)).toBe(11);
  });

  it("counts one column when the grid has no usable column value", () => {
    const w = openGrid(2, { columns: "" });
    key(search(w), "ArrowDown");
    expect(at(w)).toBe(3);
  });

  it("moves ±1 with up/down in list layout and leaves left/right to the input", () => {
    for (const options of [{ layout: "list" }, undefined]) {
      const w = radios(12, { checked: 4, wrapperAttrs: options ? "" : 'data-layout="list"' });
      gridselect(w, options);
      list(w).style.gridTemplateColumns = "1fr 1fr 1fr";
      field(w).click();
      expect(list(w).classList.contains("gridselect__items--list")).toBe(true);
      key(search(w), "ArrowDown");
      expect(at(w)).toBe(5);
      key(search(w), "ArrowUp");
      expect(at(w)).toBe(4);
      expect(key(search(w), "ArrowRight").defaultPrevented).toBe(false);
      expect(at(w)).toBe(4);
    }
  });

  it("treats an unknown layout as grid", () => {
    const w = openGrid(0, { options: { layout: "table" } });
    expect(list(w).classList.contains("gridselect__items--list")).toBe(false);
    key(search(w), "ArrowDown");
    expect(at(w)).toBe(4);
  });

  it.each(["Home", "End", "a", " "])("does not intercept %j in the search input", (k) => {
    const w = openGrid(3);
    expect(key(search(w), k).defaultPrevented).toBe(false);
    expect(at(w)).toBe(3);
  });
});

/** Records input/change events reaching the wrapper. */
function listen(w) {
  const log = [];
  for (const type of ["input", "change"]) w.addEventListener(type, (e) => log.push(`${type}:${e.target.value}`));
  return log;
}

describe("selecting", () => {
  it("selects the cursor item on Enter, fires input and change on the radio, closes, focuses the field", () => {
    const w = openGrid(2);
    const log = listen(w);
    key(search(w), "ArrowRight");
    const e = key(search(w), "Enter");
    expect(e.defaultPrevented).toBe(true);
    expect(w.querySelector("[value=v3]").checked).toBe(true);
    expect(log).toEqual(["input:v3", "change:v3"]);
    expect(isOpen(w)).toBe(false);
    expect(document.activeElement).toBe(field(w));
    expect(field(w).textContent).toBe("Pound");
    expect(gridselect(w).value).toBe("v3");
  });

  it("selects any clicked item regardless of the cursor", () => {
    const w = openGrid(0);
    const log = listen(w);
    items(w)[7].click();
    expect(gridselect(w).value).toBe("v7");
    expect(log).toEqual(["input:v7", "change:v7"]);
    expect(isOpen(w)).toBe(false);
  });

  it("closes without events when the selected item is picked again", () => {
    const w = openGrid(4);
    const log = listen(w);
    key(search(w), "Enter");
    expect(isOpen(w)).toBe(false);
    expect(log).toEqual([]);
  });

  it("cannot pick a disabled item, but the cursor can reach it", () => {
    const w = radios(11, { checked: 0 });
    w.querySelector("[value=v1]").disabled = true;
    gridselect(w);
    field(w).click();
    expect(items(w)[1].getAttribute("aria-disabled")).toBe("true");
    items(w)[1].click();
    expect(isOpen(w)).toBe(true);
    key(search(w), "ArrowRight");
    expect(at(w)).toBe(1);
    key(search(w), "Enter");
    expect(isOpen(w)).toBe(true);
    expect(gridselect(w).value).toBe("v0");
  });
});

describe("closing without a pick", () => {
  it("closes on Escape and on outside clicks, keeping the selection and focusing the field", () => {
    let w = openGrid(3);
    key(search(w), "ArrowRight");
    key(search(w), "Escape");
    expect(isOpen(w)).toBe(false);
    expect(gridselect(w).value).toBe("v3");
    expect(document.activeElement).toBe(field(w));

    w = openGrid(3);
    document.getElementById("outside").click();
    expect(isOpen(w)).toBe(false);
    expect(gridselect(w).value).toBe("v3");
    expect(document.activeElement).not.toBe(field(w));
  });

  it.each([[{}], [{ shiftKey: true }]])("closes on Tab %j without preventing it", (init) => {
    const w = openGrid(3);
    const e = key(search(w), "Tab", init);
    expect(e.defaultPrevented).toBe(false);
    expect(isOpen(w)).toBe(false);
    expect(gridselect(w).value).toBe("v3");
  });

  it("stays open on clicks inside the panel that miss an item", () => {
    const w = openGrid(3);
    search(w).click();
    expect(isOpen(w)).toBe(true);
  });
});

describe("value, form and cleanup", () => {
  it("syncs the field and items when value is set, without events", () => {
    const w = radios(11, { checked: 0 });
    const gs = gridselect(w);
    const log = listen(w);
    gs.value = "v2";
    expect(field(w).textContent).toBe("Dollar");
    field(w).click();
    expect(items(w)[2].getAttribute("aria-selected")).toBe("true");
    expect(log).toEqual([]);
    gs.value = null;
    expect(field(w).textContent).toBe("Select…");
  });

  it("shows the reset state after a form reset", async () => {
    const w = radios(11, { checked: 1 });
    const gs = gridselect(w);
    gs.value = "v5";
    document.querySelector("form").reset();
    await new Promise((r) => setTimeout(r, 0));
    expect(field(w).textContent).toBe("Franc");
  });

  it("focuses and flags the field when a required group is invalid, clears the flag after a pick", () => {
    const w = radios(11, { attrs: " required" });
    gridselect(w);
    document.querySelector("form").requestSubmit();
    expect(document.activeElement).toBe(field(w));
    expect(field(w).getAttribute("aria-invalid")).toBe("true");
    field(w).click();
    items(w)[0].click();
    expect(field(w).hasAttribute("aria-invalid")).toBe(false);
  });

  it("disables the field when every radio is disabled", () => {
    for (const how of ["each", "fieldset"]) {
      const w = radios(11, how === "each" ? { attrs: " disabled" } : { wrapperAttrs: "disabled" });
      gridselect(w);
      expect(field(w).disabled).toBe(true);
      field(w).click();
      expect(panel(w).hidden).toBe(true);
    }
  });

  it("restores the original markup on destroy, open or closed, and ignores later clicks", () => {
    for (const openFirst of [false, true]) {
      const w = radios(11, { checked: 2 });
      const before = w.outerHTML;
      const gs = gridselect(w);
      if (openFirst) field(w).click();
      gs.destroy();
      expect(w.outerHTML).toBe(before);
      expect(() => document.getElementById("outside").click()).not.toThrow();
    }
  });
});
