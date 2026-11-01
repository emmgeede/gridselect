// @vitest-environment jsdom
// F11: fuzzy matching. See docs/features/F11-fuzzy-suche/spec.md.
import { describe, it, expect, beforeEach } from "vitest";
import { gridselect } from "@emmgeede/gridselect";
import "@emmgeede/gridselect/element";

const currencies = ["Euro (EUR)", "Swiss franc (CHF)", "US dollar (USD)", "Pound sterling (GBP)", "Japanese yen (JPY)",
  "Danish krone (DKK)", "Norwegian krone (NOK)", "Swedish krona (SEK)", "Polish złoty (PLN)", "Czech koruna (CZK)",
  "Hungarian forint (HUF)", "Turkish lira (TRY)", "Brazilian real (BRL)", "South African rand (ZAR)", "Canadian dollar (CAD)",
  "Australian dollar (AUD)", "New Zealand dollar (NZD)"];

function setup({ options, attrs = "" } = {}) {
  const rows = currencies.map((c, i) => `<label><input type="radio" name="c" value="v${i}"> ${c}</label>`).join("");
  document.body.innerHTML = `<fieldset id="w" ${attrs}><legend>Currency</legend>${rows}</fieldset>`;
  const w = document.getElementById("w");
  const gs = gridselect(w, options);
  w.querySelector("[data-gridselect-field]").click();
  return { w, gs };
}
const label = (i) => i.querySelector("[data-gridselect-label]").textContent;
const shown = (w) => [...w.querySelectorAll("[data-gridselect-item]")].filter((i) => !i.hidden).map(label);
const marked = (w) => [...w.querySelectorAll("[data-gridselect-item][data-match]")].map(label);
function type(w, text) {
  const s = w.querySelector("[data-gridselect-search]");
  s.value = text;
  s.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("fuzzy matching", () => {
  it("is off by default and switched on by option, data-match-mode or element attribute", () => {
    let { w } = setup();
    type(w, "swfr");
    expect(shown(w)).toEqual([]);
    ({ w } = setup({ options: { match: "fuzzy" } }));
    type(w, "swfr");
    expect(shown(w)).toEqual(["Swiss franc (CHF)"]);
    ({ w } = setup({ attrs: 'data-match-mode="fuzzy"' }));
    type(w, "swfr");
    expect(shown(w)).toEqual(["Swiss franc (CHF)"]);
    ({ w } = setup({ attrs: 'data-match-mode="fuzzy"', options: { match: "substring" } }));
    type(w, "swfr");
    expect(shown(w)).toEqual([]);
    ({ w } = setup({ options: { match: "regex" } }));
    type(w, "swfr");
    expect(shown(w)).toEqual([]);

    document.body.innerHTML = `<grid-select label="X" match="fuzzy" threshold="0">${currencies.map((c) => `<option>${c}</option>`).join("")}</grid-select>`;
    const el = document.querySelector("grid-select");
    el.querySelector("[data-gridselect-field]").click();
    type(el, "swfr");
    expect(shown(el)).toEqual(["Swiss franc (CHF)"]);
  });

  it("matches letters in order with gaps, words in any order, no typo tolerance", () => {
    const { w } = setup({ options: { match: "fuzzy" } });
    type(w, "swfr");
    expect(shown(w)[0]).toBe("Swiss franc (CHF)");
    type(w, "franc swiss");
    expect(shown(w)).toEqual(["Swiss franc (CHF)"]);
    type(w, "dolar");
    expect(shown(w).sort()).toEqual(["Australian dollar (AUD)", "Canadian dollar (CAD)", "New Zealand dollar (NZD)", "US dollar (USD)"]);
    type(w, "xq");
    expect(shown(w)).toEqual([]);
    expect(w.querySelector("[data-gridselect-empty]").hidden).toBe(false);
    type(w, ".*(");
    expect(shown(w)).toEqual([]);
  });

  it("ranks word starts and runs before scattered matches, ties keep the original order", () => {
    const { w } = setup({ options: { match: "fuzzy" } });
    type(w, "sw");
    expect(shown(w)).toEqual(["Swiss franc (CHF)", "Swedish krona (SEK)"]);
    // "ka": "krona"/"koruna" have k at a word start; "Turkish lira" only has scattered k and a
    type(w, "ka");
    const list = shown(w);
    expect(list.indexOf("Turkish lira (TRY)")).toBeGreaterThan(list.indexOf("Swedish krona (SEK)"));
    expect(list.indexOf("Turkish lira (TRY)")).toBeGreaterThan(list.indexOf("Czech koruna (CZK)"));
  });

  it("keeps positions in highlight mode and marks fuzzy matches", () => {
    const { w } = setup({ options: { match: "fuzzy", search: "highlight" } });
    type(w, "nzd");
    expect(shown(w)).toEqual(currencies);
    expect(marked(w)).toEqual(["New Zealand dollar (NZD)"]);
    expect(w.querySelector("[data-cursor] [data-gridselect-label]").textContent).toBe("New Zealand dollar (NZD)");
  });

  it("announces counts, renumbers digits and picks with Enter", () => {
    const { w, gs } = setup({ options: { match: "fuzzy" } });
    type(w, "dolar");
    expect(w.querySelector("[data-gridselect-status]").textContent).toBe("4 results");
    expect(w.querySelector("[data-cursor] [data-gridselect-key]").textContent).toBe("1");
    w.querySelector("[data-gridselect-search]").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(gs.value).not.toBeNull();
  });
});
