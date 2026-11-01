// @vitest-environment jsdom
// F3: search modes. See docs/features/F3-suchmodi/spec.md.
import { describe, it, expect, beforeEach } from "vitest";
import { gridselect } from "gridselect";

const labels = ["Euro", "Schweizer Franken", "US-Dollar", "Pfund", "Yen", "Dänische Krone",
  "Złoty", "Forint", "Lira", "Real", "Rand", "Kanadischer Dollar"];
const values = ["eur", "chf", "usd", "gbp", "jpy", "dkk", "pln", "huf", "try", "brl", "zar", "cad"];

function setup({ options, wrapperAttrs = "", checked = -1, columns = "1fr 1fr 1fr" } = {}) {
  const rows = labels.map((l, i) =>
    `<label><input type="radio" name="c" value="${values[i]}"${i === checked ? " checked" : ""}> ${l}</label>`).join("");
  document.body.innerHTML = `<fieldset id="w" ${wrapperAttrs}><legend>Currency</legend>${rows}</fieldset>`;
  const w = document.getElementById("w");
  const gs = gridselect(w, options);
  w.querySelector("[data-gridselect-items]").style.gridTemplateColumns = columns;
  w.querySelector("[data-gridselect-field]").click();
  return { w, gs };
}

const search = (w) => w.querySelector("[data-gridselect-search]");
const items = (w) => [...w.querySelectorAll("[data-gridselect-item]")];
const visible = (w) => items(w).filter((i) => !i.hidden).map((i) => i.textContent);
const cursor = (w) => w.querySelector("[data-cursor]")?.textContent;
const empty = (w) => w.querySelector("[data-gridselect-empty]");
const status = (w) => w.querySelector("[data-gridselect-status]");

function type(w, text) {
  const s = search(w);
  s.value = text;
  s.dispatchEvent(new Event("input", { bubbles: true }));
}
function press(w, key) {
  const e = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  search(w).dispatchEvent(e);
  return e;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("matching", () => {
  it("trims and ignores case and accents, compares labels only", () => {
    const { w } = setup();
    type(w, "  DOLLAR ");
    expect(visible(w)).toEqual(["US-Dollar", "Kanadischer Dollar"]);
    type(w, "danische");
    expect(visible(w)).toEqual(["Dänische Krone"]);
    type(w, "zl");
    expect(visible(w)).toEqual([]);
    type(w, "zł");
    expect(visible(w)).toEqual(["Złoty"]);
    type(w, "usd");
    expect(visible(w)).toEqual([]);
  });

  it("compares special characters literally without throwing", () => {
    const { w } = setup();
    expect(() => type(w, ".*[(\\")).not.toThrow();
    expect(visible(w)).toEqual([]);
  });
});

describe("filter mode", () => {
  it("is the default, also for unknown values, and data-search is read", () => {
    for (const cfg of [{}, { options: { search: "fuzzy" } }, { wrapperAttrs: 'data-search="highlight"', options: { search: "filter" } }]) {
      const { w } = setup(cfg);
      type(w, "dollar");
      expect(items(w).filter((i) => i.hidden)).toHaveLength(10);
    }
  });

  it("hides non-matches and lists label-start matches first, each in original order", () => {
    const { w } = setup();
    type(w, "r");
    expect(visible(w)).toEqual(["Real", "Rand", "Euro", "Schweizer Franken", "US-Dollar",
      "Dänische Krone", "Forint", "Lira", "Kanadischer Dollar"]);
    const domOrder = items(w).filter((i) => !i.hidden).map((i) => i.textContent);
    expect(domOrder).toEqual(visible(w));
  });

  it("puts the cursor on the first visible item and moves over visible items only", () => {
    const { w } = setup({ checked: 0 });
    type(w, "r");
    expect(cursor(w)).toBe("Real");
    press(w, "ArrowDown");
    expect(cursor(w)).toBe("Schweizer Franken");
    press(w, "ArrowRight");
    expect(cursor(w)).toBe("US-Dollar");
    for (let i = 0; i < 10; i++) press(w, "ArrowRight");
    expect(cursor(w)).toBe("Kanadischer Dollar");
  });

  it("picks the radio of the item under the cursor or clicked in the filtered view", () => {
    let { w, gs } = setup();
    type(w, "dollar");
    press(w, "ArrowRight");
    press(w, "Enter");
    expect(gs.value).toBe("cad");

    ({ w, gs } = setup());
    type(w, "r");
    items(w).find((i) => i.textContent === "Lira").click();
    expect(gs.value).toBe("try");
  });

  it("restores everything in original order when the query becomes empty", () => {
    const { w } = setup({ checked: 4 });
    type(w, "r");
    type(w, "   ");
    expect(visible(w)).toEqual(labels);
    expect(cursor(w)).toBe("Yen");
  });

  it("shows the no-results hint, ignores Enter and arrows, drops aria-activedescendant", () => {
    const { w, gs } = setup({ options: { noResultsText: "Nichts" } });
    const log = [];
    w.addEventListener("change", () => log.push("change"));
    type(w, "xyz");
    expect(empty(w).hidden).toBe(false);
    expect(empty(w).textContent).toBe("Nichts");
    expect(empty(w).classList.contains("gridselect__empty")).toBe(true);
    expect(search(w).hasAttribute("aria-activedescendant")).toBe(false);
    press(w, "ArrowDown");
    press(w, "Enter");
    expect(w.querySelector("[data-gridselect-panel]").hidden).toBe(false);
    expect(gs.value).toBeNull();
    expect(log).toEqual([]);
    type(w, "yen");
    expect(empty(w).hidden).toBe(true);
    expect(cursor(w)).toBe("Yen");
  });

  it("defaults the hint to No matches", () => {
    const { w } = setup();
    type(w, "xyz");
    expect(empty(w).textContent).toBe("No matches");
  });
});

describe("highlight mode", () => {
  const hl = (extra = {}) => setup({ options: { search: "highlight" }, ...extra });
  const marked = (w, attr) => items(w).filter((i) => i.hasAttribute(attr)).map((i) => i.textContent);

  it("keeps every item in place and marks matches and non-matches", () => {
    const { w } = hl();
    type(w, "dollar");
    expect(visible(w)).toEqual(labels);
    expect(marked(w, "data-match")).toEqual(["US-Dollar", "Kanadischer Dollar"]);
    expect(marked(w, "data-dimmed")).toHaveLength(10);
    expect(cursor(w)).toBe("US-Dollar");
  });

  it("walks over dimmed items too", () => {
    const { w } = hl();
    type(w, "dollar");
    press(w, "ArrowRight");
    expect(cursor(w)).toBe("Pfund");
    press(w, "ArrowDown");
    expect(cursor(w)).toBe("Złoty");
  });

  it("dims everything without a hint and keeps the cursor when nothing matches; Enter still picks", () => {
    const { w, gs } = hl({ checked: 3 });
    type(w, "xyz");
    expect(marked(w, "data-dimmed")).toHaveLength(12);
    expect(empty(w).hidden).toBe(true);
    expect(cursor(w)).toBe("Pfund");
    press(w, "ArrowRight");
    press(w, "Enter");
    expect(gs.value).toBe("jpy");
  });

  it("clears the marks when the query becomes empty", () => {
    const { w } = hl();
    type(w, "dollar");
    type(w, "");
    expect(marked(w, "data-match")).toEqual([]);
    expect(marked(w, "data-dimmed")).toEqual([]);
  });

  it("is selected by data-search too", () => {
    const { w } = setup({ wrapperAttrs: 'data-search="highlight"' });
    type(w, "yen");
    expect(visible(w)).toEqual(labels);
  });
});

describe("status and reopening", () => {
  it("has a visually hidden status region, not hidden from screen readers", () => {
    const { w } = setup();
    const st = status(w);
    expect(st.getAttribute("role")).toBe("status");
    expect(st.classList.contains("gridselect__status")).toBe(true);
    expect(st.hidden).toBe(false);
    expect(st.style.position).toBe("absolute");
    expect(st.style.width).toBe("1px");
    expect(st.style.overflow).toBe("hidden");
  });

  it.each(["filter", "highlight"])("announces the match count in %s mode", (mode) => {
    const { w } = setup({ options: { search: mode } });
    type(w, "dollar");
    expect(status(w).textContent).toBe("2 results");
    type(w, "yen");
    expect(status(w).textContent).toBe("1 result");
    type(w, "xyz");
    expect(status(w).textContent).toBe("No matches");
    type(w, "");
    expect(status(w).textContent).toBe("");
  });

  it("uses custom texts and ignores a non-function resultsText", () => {
    let { w } = setup({ options: { resultsText: (n) => `${n} Treffer`, noResultsText: "Nichts" } });
    type(w, "dollar");
    expect(status(w).textContent).toBe("2 Treffer");
    type(w, "xyz");
    expect(status(w).textContent).toBe("Nichts");

    ({ w } = setup({ options: { resultsText: "x" } }));
    type(w, "dollar");
    expect(status(w).textContent).toBe("2 results");
  });

  it.each(["filter", "highlight"])("starts clean when reopened after a search (%s)", (mode) => {
    const { w } = setup({ options: { search: mode } });
    type(w, "xyz");
    press(w, "Escape");
    w.querySelector("[data-gridselect-field]").click();
    expect(search(w).value).toBe("");
    expect(visible(w)).toEqual(labels);
    expect(items(w).some((i) => i.hasAttribute("data-match") || i.hasAttribute("data-dimmed"))).toBe(false);
    expect(empty(w).hidden).toBe(true);
    expect(status(w).textContent).toBe("");
  });
});
