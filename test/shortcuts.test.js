// @vitest-environment jsdom
// F4: digit shortcuts. See docs/features/F4-ziffernwahl/spec.md.
import { describe, it, expect, beforeEach } from "vitest";
import { gridselect } from "gridselect";

/** Flat group of n inputs (radio or checkbox), labels "L0".."Ln-1". */
function flat(n, { type = "radio", options, labelHtml = () => "", noLabel = [], wrapperAttrs = "" } = {}) {
  const rows = Array.from({ length: n }, (_, i) => noLabel.includes(i)
    ? `<input type="${type}" name="g" value="v${i}">`
    : `<label>${labelHtml(i)}<input type="${type}" name="g" value="v${i}"> L${i}</label>`).join("");
  document.body.innerHTML = `<fieldset id="w" ${wrapperAttrs}><legend>X</legend>${rows}</fieldset><button id="out">o</button>`;
  const w = document.getElementById("w");
  return { w, gs: gridselect(w, { threshold: 100, ...options }) };
}
const inputs = (w) => [...w.querySelectorAll("input")];
const keyOf = (input) => input.labels[0]?.querySelector("[data-gridselect-key]");

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("digit elements below the threshold", () => {
  it("adds a hidden-from-AT key element to each label and aria-keyshortcuts to each input", () => {
    const { w } = flat(32);
    const ins = inputs(w);
    const k = keyOf(ins[0]);
    expect(k.parentElement.firstChild).toBe(k);
    expect(k.tagName).toBe("SPAN");
    expect(k.classList.contains("gridselect__key")).toBe(true);
    expect(k.getAttribute("aria-hidden")).toBe("true");
    expect([0, 8, 9, 10, 19, 20, 29].map((i) => keyOf(ins[i]).textContent)).toEqual(["1", "9", "0", "1", "0", "1", "0"]);
    expect([0, 10, 20].map((i) => keyOf(ins[i]).dataset.modifiers)).toEqual(["", "Shift", "Alt"]);
    expect([0, 9, 10, 29].map((i) => ins[i].getAttribute("aria-keyshortcuts"))).toEqual(["1", "0", "Shift+1", "Alt+0"]);
    expect(keyOf(ins[30])).toBeNull();
    expect(ins[30].hasAttribute("aria-keyshortcuts")).toBe(false);
  });

  it("uses an existing key element: fills it when empty, keeps its content otherwise", () => {
    const { w } = flat(3, { labelHtml: (i) => (i === 0 ? "<b data-gridselect-key></b>" : i === 1 ? "<b data-gridselect-key>⇧A</b>" : "") });
    const ins = inputs(w);
    expect(ins[0].labels[0].querySelectorAll("[data-gridselect-key]")).toHaveLength(1);
    expect(keyOf(ins[0]).textContent).toBe("1");
    expect(keyOf(ins[1]).textContent).toBe("⇧A");
    expect(keyOf(ins[1]).dataset.modifiers).toBe("");
    expect(ins[1].getAttribute("aria-keyshortcuts")).toBe("2");
    expect(keyOf(ins[2]).tagName).toBe("SPAN");
  });

  it("gives an input without label aria-keyshortcuts but no key element", () => {
    const { w } = flat(3, { noLabel: [1] });
    expect(w.querySelectorAll("[data-gridselect-key]")).toHaveLength(2);
    expect(inputs(w)[1].getAttribute("aria-keyshortcuts")).toBe("2");
  });

  it("restores the markup on destroy, including emptied own key elements", () => {
    const rows = Array.from({ length: 12 }, (_, i) =>
      `<label>${i === 0 ? "<b data-gridselect-key></b>" : i === 1 ? "<b data-gridselect-key>x</b>" : ""}<input type="radio" name="g" value="v${i}"> L${i}</label>`).join("");
    document.body.innerHTML = `<fieldset id="w"><legend>X</legend>${rows}</fieldset>`;
    const w = document.getElementById("w");
    const before = w.outerHTML;
    const gs = gridselect(w, { threshold: 100 });
    expect(w.outerHTML).not.toBe(before);
    gs.destroy();
    expect(w.outerHTML).toBe(before);
  });

  it("adds nothing with shortcuts: false, data-shortcuts=off or an empty list", () => {
    for (const cfg of [{ options: { shortcuts: false } }, { wrapperAttrs: 'data-shortcuts="off"' }, { options: { shortcuts: [] } }]) {
      const { w } = flat(3, cfg);
      expect(w.querySelectorAll("[data-gridselect-key]")).toHaveLength(0);
      expect(w.querySelectorAll("[aria-keyshortcuts]")).toHaveLength(0);
    }
  });

  it("uses custom tiers, normalising the order inside a combination", () => {
    const { w } = flat(12, { options: { shortcuts: ["Alt", "Shift+Control"] } });
    const ins = inputs(w);
    expect(ins[0].getAttribute("aria-keyshortcuts")).toBe("Alt+1");
    expect(ins[10].getAttribute("aria-keyshortcuts")).toBe("Control+Shift+1");
    expect(keyOf(ins[10]).dataset.modifiers).toBe("Shift+Control");
  });

  it("throws for unknown modifier names and falls back to the default for non-arrays", () => {
    expect(() => flat(3, { options: { shortcuts: ["Ctrl"] } })).toThrow(/^gridselect:.*Ctrl/);
    const { w } = flat(12, { options: { shortcuts: "Shift" } });
    expect(inputs(w)[10].getAttribute("aria-keyshortcuts")).toBe("Shift+1");
  });
});

/** Dispatches a digit keydown on `el`. `code` like "Digit3", modifiers as KeyboardEvent init. */
function digit(el, code, init = {}) {
  const e = new KeyboardEvent("keydown", { code, key: code.slice(-1), bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(e);
  return e;
}
function events(w) {
  const log = [];
  for (const t of ["input", "change"]) w.addEventListener(t, (e) => log.push(`${t}:${e.target.value}`));
  return log;
}

describe("digit keys below the threshold", () => {
  it("checks and focuses the radio, fires input and change, prevents the default", () => {
    const { w, gs } = flat(5);
    const log = events(w);
    inputs(w)[0].focus();
    const e = digit(inputs(w)[0], "Digit3");
    expect(e.defaultPrevented).toBe(true);
    expect(gs.value).toBe("v2");
    expect(document.activeElement).toBe(inputs(w)[2]);
    expect(log).toEqual(["input:v2", "change:v2"]);
    digit(inputs(w)[2], "Digit3");
    expect(log).toHaveLength(2);
  });

  it("toggles a checkbox and leaves the focus alone", () => {
    const { w, gs } = flat(4, { type: "checkbox" });
    const log = events(w);
    inputs(w)[0].focus();
    digit(inputs(w)[0], "Digit3");
    expect(gs.value).toEqual(["v2"]);
    expect(document.activeElement).toBe(inputs(w)[0]);
    digit(inputs(w)[0], "Digit3");
    expect(gs.value).toEqual([]);
    expect(log).toEqual(["input:v2", "change:v2", "input:v2", "change:v2"]);
  });

  it("maps tiers, 0 to the tenth item, numpad digits too", () => {
    const { w, gs } = flat(25);
    digit(inputs(w)[0], "Digit0");
    expect(gs.value).toBe("v9");
    digit(inputs(w)[0], "Numpad2", { shiftKey: true });
    expect(gs.value).toBe("v11");
    digit(inputs(w)[0], "Digit5", { altKey: true });
    expect(gs.value).toBe("v24");
  });

  it("needs exact modifiers and reads event.code, not event.key", () => {
    const { w, gs } = flat(15);
    const e = digit(inputs(w)[0], "Digit1", { shiftKey: true, ctrlKey: true });
    expect(e.defaultPrevented).toBe(false);
    expect(gs.value).toBeNull();
    inputs(w)[0].dispatchEvent(new KeyboardEvent("keydown", { code: "Digit1", key: "!", shiftKey: true, bubbles: true, cancelable: true }));
    expect(gs.value).toBe("v10");
  });

  it("honours custom tiers and leaves plain digits alone then", () => {
    const { w, gs } = flat(15, { options: { shortcuts: ["Alt", "Control+Shift"] } });
    expect(digit(inputs(w)[0], "Digit1").defaultPrevented).toBe(false);
    digit(inputs(w)[0], "Digit2", { ctrlKey: true, shiftKey: true });
    expect(gs.value).toBe("v11");
  });

  it("ignores digits when the focus is outside the group", () => {
    const { w, gs } = flat(5);
    expect(digit(document.getElementById("out"), "Digit1").defaultPrevented).toBe(false);
    expect(gs.value).toBeNull();
    expect(w).toBeDefined();
  });

  it("changes nothing for disabled or missing targets but still prevents tier digits", () => {
    const { w, gs } = flat(5);
    inputs(w)[1].disabled = true;
    expect(digit(inputs(w)[0], "Digit2").defaultPrevented).toBe(true);
    expect(digit(inputs(w)[0], "Digit9").defaultPrevented).toBe(true);
    expect(gs.value).toBeNull();
  });

  it("ignores digits during IME composition and after destroy", () => {
    const { w, gs } = flat(5);
    expect(digit(inputs(w)[0], "Digit1", { isComposing: true }).defaultPrevented).toBe(false);
    gs.destroy();
    expect(digit(inputs(w)[0], "Digit1").defaultPrevented).toBe(false);
    expect(gs.value).toBeNull();
  });
});

/** Panel group of n radios with labels "L0".."Ln-1"; own key elements via labelHtml. */
function panelGroup(n, { options, labelHtml = () => "" } = {}) {
  const rows = Array.from({ length: n }, (_, i) =>
    `<label>${labelHtml(i)}<input type="radio" name="g" value="v${i}"> L${i}</label>`).join("");
  document.body.innerHTML = `<fieldset id="w"><legend>X</legend>${rows}</fieldset>`;
  const w = document.getElementById("w");
  const gs = gridselect(w, options);
  w.querySelector("[data-gridselect-field]").click();
  return { w, gs, search: w.querySelector("[data-gridselect-search]") };
}
const panelItems = (w) => [...w.querySelectorAll("[data-gridselect-item]")];
const keyText = (item) => item.querySelector("[data-gridselect-key]").textContent;
function typeInto(search, text) {
  search.value = text;
  search.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("digits in the panel", () => {
  it("gives each item a key element and a label element, and aria-keyshortcuts", () => {
    const { w } = panelGroup(32);
    const items = panelItems(w);
    const [key, label] = items[10].children;
    expect(key.matches("span[data-gridselect-key].gridselect__key[aria-hidden=true]")).toBe(true);
    expect(key.textContent).toBe("1");
    expect(key.dataset.modifiers).toBe("Shift");
    expect(label.matches("span[data-gridselect-label].gridselect__label")).toBe(true);
    expect(label.textContent).toBe("L10");
    expect(items[10].getAttribute("aria-keyshortcuts")).toBe("Shift+1");
    expect(keyText(items[30])).toBe("");
    expect(items[30].hasAttribute("aria-keyshortcuts")).toBe(false);
    expect(w.querySelectorAll("label [data-gridselect-key]")).toHaveLength(0);
  });

  it("picks the item of a digit like Enter, without typing the digit", () => {
    const { w, gs, search } = panelGroup(12);
    const e = digit(search, "Digit3");
    expect(e.defaultPrevented).toBe(true);
    expect(gs.value).toBe("v2");
    expect(search.value).toBe("");
    expect(w.querySelector("[data-gridselect-panel]").hidden).toBe(true);
  });

  it("swallows a tier digit without an item", () => {
    const { gs, search } = panelGroup(12);
    expect(digit(search, "Digit5", { shiftKey: true }).defaultPrevented).toBe(true);
    expect(gs.value).toBeNull();
  });

  it("renumbers the visible items in filter mode", () => {
    const { w, gs, search } = panelGroup(12);
    typeInto(search, "l1");
    const items = panelItems(w);
    const visible = items.filter((i) => !i.hidden);
    expect(visible.map((i) => keyText(i))).toEqual(["1", "2", "3"]);
    expect(items.filter((i) => i.hidden).every((i) => keyText(i) === "" && !i.hasAttribute("aria-keyshortcuts"))).toBe(true);
    digit(search, "Digit2");
    expect(gs.value).toBe("v10");
  });

  it("keeps fixed numbers in highlight mode", () => {
    const { w, gs, search } = panelGroup(12, { options: { search: "highlight" } });
    typeInto(search, "l1");
    expect(panelItems(w).map((i) => keyText(i)).slice(0, 3)).toEqual(["1", "2", "3"]);
    digit(search, "Digit2");
    expect(gs.value).toBe("v1");
  });

  it("types digits into the search with shortcuts off", () => {
    const { w, search } = panelGroup(12, { options: { shortcuts: false } });
    expect(digit(search, "Digit1").defaultPrevented).toBe(false);
    expect(w.querySelectorAll("[data-gridselect-key]")).toHaveLength(0);
  });

  it("leaves the content of own key elements out of the label text", () => {
    const { w, search } = panelGroup(12, { labelHtml: (i) => (i === 0 ? "<b data-gridselect-key>⇧A</b>" : "") });
    expect(w.querySelector("[data-gridselect-label]").textContent).toBe("L0");
    typeInto(search, "a");
    expect(panelItems(w).filter((i) => !i.hidden)).toHaveLength(0);
    search.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    gridselect(w).value = "v0";
    expect(w.querySelector("[data-gridselect-field]").textContent).toBe("L0");
  });
});

describe("QA F4 fixes", () => {
  it("leaves numpad keys alone when NumLock is off (key is not a digit)", () => {
    const { w, gs } = flat(5);
    expect(digit(inputs(w)[0], "Numpad2", { key: "ArrowDown" }).defaultPrevented).toBe(false);
    expect(gs.value).toBeNull();
    const p = panelGroup(12);
    expect(digit(p.search, "Numpad2", { key: "ArrowDown" }).defaultPrevented).toBe(true); // arrow navigation
    expect(p.gs.value).toBeNull();
    expect(p.w.querySelector("[data-cursor] [data-gridselect-label]").textContent).toBe("L1");
  });

  it("accepts spaces around + in tier names", () => {
    const { w } = flat(12, { options: { shortcuts: [" Alt ", "Shift + Control"] } });
    expect(inputs(w)[0].getAttribute("aria-keyshortcuts")).toBe("Alt+1");
    expect(inputs(w)[10].getAttribute("aria-keyshortcuts")).toBe("Control+Shift+1");
  });
});

describe("modifier letters (F4 amendment)", () => {
  it("puts the modifier abbreviation into data-prefix, in canonical order", () => {
    const { w } = flat(32, { options: { shortcuts: ["", "Shift", "Shift+Control"] } });
    const ins = inputs(w);
    expect(keyOf(ins[0]).hasAttribute("data-prefix")).toBe(false);
    expect(keyOf(ins[10]).dataset.prefix).toBe("S");
    expect(keyOf(ins[20]).dataset.prefix).toBe("CS");
  });

  it("uses A, C, M, S in panel items too and clears it for unnumbered items", () => {
    const { w, search } = panelGroup(32, { options: { shortcuts: ["Meta", "Alt"] } });
    const items = panelItems(w);
    expect(items[0].querySelector("[data-gridselect-key]").dataset.prefix).toBe("M");
    expect(items[10].querySelector("[data-gridselect-key]").dataset.prefix).toBe("A");
    expect(items[25].querySelector("[data-gridselect-key]").hasAttribute("data-prefix")).toBe(false);
    typeInto(search, "l31");
    expect(items[31].querySelector("[data-gridselect-key]").dataset.prefix).toBe("M");
  });

  it("removes data-prefix on destroy", () => {
    const rows = Array.from({ length: 12 }, (_, i) => `<label><b data-gridselect-key></b><input type="radio" name="g" value="v${i}"> L${i}</label>`).join("");
    document.body.innerHTML = `<fieldset id="w">${rows}</fieldset>`;
    const w = document.getElementById("w");
    const before = w.outerHTML;
    gridselect(w, { threshold: 100 }).destroy();
    expect(w.outerHTML).toBe(before);
  });
});
