// @vitest-environment jsdom
// F2 edge cases and QA checks, added during saas-qa F2.
import { describe, it, expect, beforeEach } from "vitest";
import { gridselect } from "@emmgeede/gridselect";

const rows = (n, name = "cur", extra = (i) => "") =>
  Array.from({ length: n }, (_, i) => `<label${extra(i)}><input type="radio" name="${name}" value="v${i}"> L${i}</label>`).join("");

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("F2 edge cases", () => {
  it("updates the aria-label name after a pick (AC-8)", () => {
    document.body.innerHTML = `<div id="w" aria-label="Currency">${rows(11)}</div>`;
    const w = document.getElementById("w");
    gridselect(w);
    const field = w.querySelector("[data-gridselect-field]");
    expect(field.getAttribute("aria-label")).toBe("Currency, Select…");
    field.click();
    w.querySelectorAll("[data-gridselect-item]")[4].click();
    expect(field.getAttribute("aria-label")).toBe("Currency, L4");
  });

  it("takes the item text from the first of several labels and hides all of them", () => {
    document.body.innerHTML = `<div id="w">${Array.from({ length: 11 }, (_, i) =>
      `<input type="radio" name="a" value="v${i}" id="r${i}"><label for="r${i}">First ${i}</label><label for="r${i}">Second ${i}</label>`).join("")}</div>`;
    const w = document.getElementById("w");
    gridselect(w);
    expect(w.querySelector("[data-gridselect-label]").textContent).toBe("First 0");
    expect([...w.querySelectorAll("label")].every((l) => l.hidden)).toBe(true);
  });

  it("keeps a label hidden on destroy if it was hidden before", () => {
    document.body.innerHTML = `<div id="w">${rows(11, "cur", (i) => (i === 0 ? " hidden" : ""))}</div>`;
    const w = document.getElementById("w");
    gridselect(w).destroy();
    expect(w.querySelector("label").hidden).toBe(true);
    expect(w.querySelectorAll("label")[1].hidden).toBe(false);
  });

  it("uses only the text of a label that also holds an icon", () => {
    document.body.innerHTML = `<div id="w">${rows(11)}</div>`;
    const w = document.getElementById("w");
    w.querySelector("label").insertAdjacentHTML("afterbegin", "<svg><title>flag</title></svg>");
    gridselect(w);
    expect(w.querySelector("[data-gridselect-item] svg")).toBeNull();
  });

  it("gives two instances distinct ids and closes one when the other is clicked", () => {
    document.body.innerHTML = `<div id="a">${rows(11, "a")}</div><div id="b">${rows(11, "b")}</div>`;
    const a = document.getElementById("a");
    const b = document.getElementById("b");
    gridselect(a);
    gridselect(b);
    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    a.querySelector("[data-gridselect-field]").click();
    b.querySelector("[data-gridselect-field]").click();
    expect(a.querySelector("[data-gridselect-panel]").hidden).toBe(true);
    expect(b.querySelector("[data-gridselect-panel]").hidden).toBe(false);
  });

  it("skips ids already taken on the page", () => {
    document.body.innerHTML = `${Array.from({ length: 40 }, (_, i) => `<i id="gridselect-${i}"></i>`).join("")}<div id="w">${rows(11)}</div>`;
    gridselect(document.getElementById("w"));
    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("does not throw on clicks after the open wrapper was removed from the page", () => {
    document.body.innerHTML = `<div id="w">${rows(11)}</div><p id="p">x</p>`;
    const w = document.getElementById("w");
    gridselect(w);
    w.querySelector("[data-gridselect-field]").click();
    w.remove();
    expect(() => document.getElementById("p").click()).not.toThrow();
  });

  it("builds a panel for any non-empty group with threshold 0", () => {
    document.body.innerHTML = `<div id="w">${rows(1)}</div>`;
    const w = document.getElementById("w");
    gridselect(w, { threshold: 0 });
    expect(w.querySelector("[data-gridselect-field]")).not.toBeNull();
  });

  it("survives a change listener that destroys the instance during a pick", () => {
    document.body.innerHTML = `<div id="w">${rows(11)}</div>`;
    const w = document.getElementById("w");
    const gs = gridselect(w);
    w.addEventListener("change", () => gs.destroy());
    w.querySelector("[data-gridselect-field]").click();
    expect(() => w.querySelectorAll("[data-gridselect-item]")[3].click()).not.toThrow();
    expect(gs.value).toBe("v3");
  });
});

describe("QA F2 fixes", () => {
  const setup = (attrs = "", legend = "<legend>Currency</legend>") => {
    document.body.innerHTML = `<fieldset id="w" ${attrs}>${legend}${rows(11)}</fieldset>`;
    const w = document.getElementById("w");
    gridselect(w);
    return {
      w,
      field: w.querySelector("[data-gridselect-field]"),
      search: w.querySelector("[data-gridselect-search]"),
      list: w.querySelector("[data-gridselect-scroller]"),
      panel: w.querySelector("[data-gridselect-panel]"),
    };
  };
  const press = (el, key, init = {}) => {
    const e = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
    el.dispatchEvent(e);
    return e;
  };

  it("keeps aria-expanded on the combobox in sync with the panel", () => {
    const { field, search } = setup();
    expect(search.getAttribute("aria-expanded")).toBe("false");
    field.click();
    expect(search.getAttribute("aria-expanded")).toBe("true");
    press(search, "Escape");
    expect(search.getAttribute("aria-expanded")).toBe("false");
  });

  it("names the search input and the listbox after the group", () => {
    let { search, list, w } = setup();
    const legendId = w.querySelector("legend").id;
    expect(search.getAttribute("aria-labelledby")).toBe(legendId);
    expect(list.getAttribute("aria-labelledby")).toBe(legendId);

    ({ search, list } = setup('aria-labelledby="h1"', ""));
    expect(search.getAttribute("aria-labelledby")).toBe("h1");
    expect(list.getAttribute("aria-labelledby")).toBe("h1");

    ({ search, list } = setup('aria-label="Currency"', ""));
    expect(search.getAttribute("aria-label")).toBe("Currency");
    expect(list.getAttribute("aria-label")).toBe("Currency");
  });

  it.each(["Enter", "Escape", "ArrowDown", "ArrowRight"])("ignores %s while an IME composition is running", (key) => {
    const { field, search, panel, w } = setup();
    field.click();
    const e = press(search, key, { isComposing: true });
    expect(e.defaultPrevented).toBe(false);
    expect(panel.hidden).toBe(false);
    expect(gridselect(w).value).toBeNull();
    expect(w.querySelector("[data-cursor]")).toBe(w.querySelector("[data-gridselect-item]"));
  });

  it("closes the panel when the field is clicked again", () => {
    const { field, panel, w } = setup();
    field.click();
    field.click();
    expect(panel.hidden).toBe(true);
    expect(field.getAttribute("aria-expanded")).toBe("false");
    expect(gridselect(w).value).toBeNull();
  });
});

describe("search input events (found during tdd F8)", () => {
  it("keeps the search input's own input and change events away from the wrapper", () => {
    document.body.innerHTML = `<div id="w">${rows(11)}</div><button id="o">o</button>`;
    const w = document.getElementById("w");
    gridselect(w);
    const log = [];
    for (const t of ["input", "change"]) w.addEventListener(t, (e) => log.push(`${t}:${e.target.tagName}`));
    w.querySelector("[data-gridselect-field]").click();
    const s = w.querySelector("[data-gridselect-search]");
    s.value = "l1";
    s.dispatchEvent(new Event("input", { bubbles: true }));
    s.dispatchEvent(new Event("change", { bubbles: true }));
    expect(log).toEqual([]);
    expect([...w.querySelectorAll("[data-gridselect-item]")].filter((i) => !i.hidden)).toHaveLength(2);
  });
});

describe("scroll container (equal row heights need a list that can grow)", () => {
  it("wraps the item list in a scroller inside the panel and removes it on destroy", () => {
    document.body.innerHTML = `<div id="w">${rows(11)}</div>`;
    const w = document.getElementById("w");
    const before = w.outerHTML;
    const gs = gridselect(w);
    const scroller = w.querySelector("[data-gridselect-scroller]");
    expect(scroller.classList.contains("gridselect__scroller")).toBe(true);
    expect(scroller.parentElement).toBe(w.querySelector("[data-gridselect-panel]"));
    expect(scroller.firstElementChild).toBe(w.querySelector("[data-gridselect-items]"));
    gs.destroy();
    expect(w.outerHTML).toBe(before);
  });
});

describe("outside clicks inside the wrapper (reported 2026-11-01)", () => {
  it("closes on clicks on the legend or the wrapper itself, but not on the field or in the panel", () => {
    document.body.innerHTML = `<fieldset id="w"><legend>Currency</legend>${rows(11)}</fieldset>`;
    const w = document.getElementById("w");
    gridselect(w);
    const field = w.querySelector("[data-gridselect-field]");
    const panel = w.querySelector("[data-gridselect-panel]");
    field.click();
    w.querySelector("[data-gridselect-search]").click();
    expect(panel.hidden).toBe(false);
    w.querySelector("legend").click();
    expect(panel.hidden).toBe(true);
    field.click();
    w.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(panel.hidden).toBe(true);
  });
});

describe("F24 panelContainer without layout", () => {
  it("opens without errors in jsdom", () => {
    document.body.innerHTML = `<div data-gridselect-container="x"><fieldset id="w">${rows(20)}</fieldset></div>`;
    gridselect(document.getElementById("w"), { panelContainer: "x" });
    document.querySelector("[data-gridselect-field]").click();
    expect(document.querySelector("[data-gridselect-panel]").hidden).toBe(false);
  });
});
