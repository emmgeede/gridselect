// @vitest-environment jsdom
// F16: pinned and recent entries on top of the panel. See docs/features/F16-angeheftete-eintraege/spec.md.
import { describe, it, expect, beforeEach } from "vitest";
import { gridselect } from "@emmgeede/gridselect";
import "@emmgeede/gridselect/element";

const CODES = ["EUR", "CHF", "USD", "GBP", "JPY", "DKK", "NOK", "SEK", "PLN", "CZK", "HUF", "TRY"];
function mount(attrs = "", opts = {}) {
  document.body.innerHTML = `<fieldset id="w" ${attrs}><legend>Currency</legend></fieldset>`;
  const w = document.getElementById("w");
  return [w, gridselect(w, { items: CODES, ...opts })];
}
const field = (w) => w.querySelector("[data-gridselect-field]");
const search = (w) => w.querySelector("[data-gridselect-search]");
const open = (w) => field(w).click();
const heads = (w) => [...w.querySelectorAll("[data-gridselect-group-label]")].filter((h) => !h.closest("[hidden]")).map((h) => h.textContent);
const groupValues = (w, name) => {
  const g = [...w.querySelectorAll("[data-gridselect-group]")].find((x) => x.querySelector("[data-gridselect-group-label]").textContent === name);
  return g ? [...g.querySelectorAll("[data-gridselect-item]")].filter((i) => !i.hidden).map((i) => i.dataset.value) : null;
};
const badge = (item) => (item.querySelector("[data-gridselect-key]").dataset.prefix ?? "") + item.querySelector("[data-gridselect-key]").textContent;
const visibleItems = (w) => [...w.querySelectorAll("[data-gridselect-item]")].filter((i) => !i.hidden && !i.closest("[hidden]"));
const key = (w, k, init = {}) => search(w).dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const digit = (w, d, shift = false) => key(w, String(d), { code: `Digit${d}`, shiftKey: shift });
function type(w, text) {
  search(w).value = text;
  search(w).dispatchEvent(new Event("input", { bubbles: true }));
}
/** The entry in the list itself, not its copy on top. */
const listItem = (w, v) => [...w.querySelectorAll(`[data-gridselect-item][data-value="${v}"]`)].find((i) => !i.closest("[data-gridselect-top]"));
const stored = (k) => JSON.parse(localStorage.getItem(`gridselect-recent:${k}`));

beforeEach(() => {
  document.body.innerHTML = "";
  localStorage.clear();
});

describe("pinned", () => {
  it("shows the pinned entries on top in their order and not again in the list", () => {
    const [w] = mount("", { pinned: ["CHF", "EUR", "XXX"] });
    open(w);
    expect(heads(w)).toEqual(["Pinned"]);
    expect(groupValues(w, "Pinned")).toEqual(["CHF", "EUR"]);
    expect(visibleItems(w).map((i) => i.dataset.value)).toEqual(["CHF", "EUR", ...CODES.filter((c) => c !== "CHF" && c !== "EUR")]);
  });

  it("finds pinned entries in the list while searching", () => {
    const [w] = mount("", { pinned: ["CHF"] });
    open(w);
    type(w, "chf");
    const found = visibleItems(w);
    expect(found.map((i) => i.dataset.value)).toEqual(["CHF"]);
    expect(found[0].closest("[data-gridselect-top]")).toBeNull();
  });

  it("reads data-pinned and pinnedText, and shows nothing without valid values", () => {
    let [w] = mount('data-pinned="USD, GBP"', { pinnedText: "Favourites" });
    open(w);
    expect(groupValues(w, "Favourites")).toEqual(["USD", "GBP"]);
    [w] = mount("", { pinned: ["nope"] });
    open(w);
    expect(heads(w)).toEqual([]);
  });

  it("picking a pinned entry checks the input; the cursor then starts on it", () => {
    const [w, gs] = mount("", { pinned: ["CHF"] });
    open(w);
    w.querySelector('[data-gridselect-group] [data-value="CHF"]').click();
    expect(gs.value).toBe("CHF");
    open(w);
    const cur = w.querySelector("[data-cursor]");
    expect(cur.dataset.value).toBe("CHF");
    expect(cur.getAttribute("aria-selected")).toBe("true");
    expect(cur.closest("[data-gridselect-top]")).not.toBeNull();
  });

  it("has no top area at or below the threshold", () => {
    document.body.innerHTML = `<fieldset id="w"><legend>x</legend></fieldset>`;
    const w = document.getElementById("w");
    gridselect(w, { items: ["a", "b"], pinned: ["b"] });
    expect(w.querySelector("[data-gridselect-group-label]")).toBeNull();
  });
});

describe("recent", () => {
  it("stores picks newest first, unique, at most recentMax", () => {
    const [w] = mount("", { recent: "cur", recentMax: 3 });
    for (const v of ["USD", "GBP", "USD", "JPY", "DKK"]) {
      open(w);
      listItem(w, v).click();
    }
    expect(stored("cur")).toEqual(["DKK", "JPY", "USD"]);
  });

  it("shows stored values after pinned, skipping pinned and unknown ones", () => {
    localStorage.setItem("gridselect-recent:cur", JSON.stringify(["GBP", "CHF", "gone", "USD"]));
    const [w] = mount('data-recent="cur"', { pinned: ["CHF"], recentText: "Last used" });
    open(w);
    expect(heads(w)).toEqual(["Pinned", "Last used"]);
    expect(groupValues(w, "Last used")).toEqual(["GBP", "USD"]);
  });

  it("updates the recent group on the next open", () => {
    const [w] = mount("", { recent: "cur" });
    open(w);
    expect(heads(w)).toEqual([]);
    listItem(w, "TRY").click();
    open(w);
    expect(groupValues(w, "Recent")).toEqual(["TRY"]);
  });

  it("only counts ticking in multiple choice", () => {
    document.body.innerHTML = `<fieldset id="w"><legend>x</legend></fieldset>`;
    const w = document.getElementById("w");
    gridselect(w, { items: CODES, multiple: true, recent: "m" });
    open(w);
    const usd = listItem(w, "USD");
    usd.click();
    usd.click();
    expect(stored("m")).toEqual(["USD"]);
  });

  it("works without a usable localStorage and with broken stored data", () => {
    localStorage.setItem("gridselect-recent:bad", "{not json");
    let [w] = mount("", { recent: "bad" });
    open(w);
    expect(heads(w)).toEqual([]);
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = () => { throw new Error("blocked"); };
    Storage.prototype.setItem = () => { throw new Error("blocked"); };
    try {
      [w] = mount("", { recent: "x" });
      open(w);
      expect(() => listItem(w, "USD").click()).not.toThrow();
      open(w);
      expect(heads(w)).toEqual([]);
    } finally {
      Storage.prototype.getItem = get;
      Storage.prototype.setItem = set;
    }
  });

  it("recentMax 0 turns recent off", () => {
    const [w] = mount('data-recent="z" data-recent-max="0"');
    open(w);
    listItem(w, "USD").click();
    expect(localStorage.getItem("gridselect-recent:z")).toBeNull();
  });
});

describe("digits, search and keys", () => {
  it("numbers top and list in one run, without gaps", () => {
    localStorage.setItem("gridselect-recent:cur", JSON.stringify(["GBP"]));
    const [w, gs] = mount("", { pinned: ["CHF"], recent: "cur", recentMax: 3 });
    open(w);
    const items = visibleItems(w);
    expect(items.slice(0, 4).map((i) => [i.dataset.value, badge(i)])).toEqual([["CHF", "1"], ["GBP", "2"], ["EUR", "3"], ["USD", "4"]]);
    digit(w, 2);
    expect(gs.value).toBe("GBP");
    open(w);
    digit(w, 3);
    expect(gs.value).toBe("EUR");
    open(w); // recent: EUR, GBP
    expect(visibleItems(w).slice(0, 4).map((i) => [i.dataset.value, badge(i)])).toEqual([["CHF", "1"], ["EUR", "2"], ["GBP", "3"], ["USD", "4"]]);
  });

  it("hides the top while searching and numbers the whole list from 1", () => {
    let [w] = mount("", { pinned: ["CHF", "EUR"] });
    open(w);
    type(w, "u");
    expect(heads(w)).toEqual([]);
    expect(badge(visibleItems(w)[0])).toBe("1");
    [w] = mount('data-search="highlight"', { pinned: ["CHF", "EUR"] });
    open(w);
    expect(visibleItems(w).map((i) => i.dataset.value).slice(0, 3)).toEqual(["CHF", "EUR", "USD"]);
    type(w, "usd");
    expect(heads(w)).toEqual([]);
    expect(visibleItems(w).map((i) => [i.dataset.value, badge(i)]).slice(0, 3)).toEqual([["EUR", "1"], ["CHF", "2"], ["USD", "3"]]);
  });

  it("arrow keys reach the top and cross into the list; the cursor starts on the chosen list entry", () => {
    const [w] = mount("", { pinned: ["CHF", "EUR"], value: "USD" });
    open(w);
    const cur = () => w.querySelector("[data-cursor]");
    expect(cur().dataset.value).toBe("USD");
    expect(cur().closest("[data-gridselect-group]")).toBeNull();
    for (let i = 0; i < 5; i++) key(w, "ArrowLeft");
    expect(cur().dataset.value).toBe("CHF");
    expect(cur().closest("[data-gridselect-group]")).not.toBeNull();
    key(w, "ArrowRight");
    key(w, "ArrowRight");
    expect(cur().dataset.value).toBe("USD");
    expect(cur().closest("[data-gridselect-group]")).toBeNull();
  });
});

describe("element", () => {
  it("<grid-select> takes pinned, recent, recent-max and the texts", () => {
    localStorage.setItem("gridselect-recent:el", JSON.stringify(["USD", "GBP", "JPY"]));
    document.body.innerHTML = `<grid-select label="x" pinned="CHF,EUR" recent="el" recent-max="2" pinned-text="Favourites" recent-text="Last used">${CODES.map((c) => `<option>${c}</option>`).join("")}</grid-select>`;
    const el = document.querySelector("grid-select");
    open(el);
    expect(heads(el)).toEqual(["Favourites", "Last used"]);
    expect(groupValues(el, "Last used")).toEqual(["USD", "GBP"]);
  });
});
