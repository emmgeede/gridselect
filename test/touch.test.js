// @vitest-environment jsdom
// F25: touch screens. See docs/features/F25-touch/spec.md.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { gridselect } from "@emmgeede/gridselect";

const names = ["Euro", "Franc", "Dollar", "Pound", "Yen", "Krone", "Zloty", "Forint", "Lira", "Real", "Rand", "Peso"];
function radios({ legend = "Currency", wrapperAttrs = "" } = {}) {
  const items = names.map((n, i) => `<label><input type="radio" name="cur" value="v${i}"> ${n}</label>`).join("");
  document.body.innerHTML = `<fieldset data-gridselect ${wrapperAttrs}>${legend ? `<legend>${legend}</legend>` : ""}${items}</fieldset>`;
  return document.querySelector("[data-gridselect]");
}
/** Pretends a device: `touch` → pointer coarse, `narrow` → max-width 640px. */
function device({ touch = false, narrow = false } = {}) {
  window.matchMedia = (q) => ({ matches: (q.includes("pointer: coarse") && touch) || (q.includes("max-width: 640px") && narrow) });
}
const $ = (w, part) => w.querySelector(`[data-gridselect-${part}]`);
const shown = (el) => !!el && !el.closest("[hidden]");

const original = window.matchMedia;
beforeEach(() => (document.body.innerHTML = ""));
afterEach(() => (window.matchMedia = original));

describe("phone: sheet", () => {
  it("opens as a sheet with the group name and a close button, without focusing the search", () => {
    device({ touch: true, narrow: true });
    const w = radios();
    gridselect(w);
    $(w, "field").click();
    const panel = $(w, "panel");
    expect(panel.hasAttribute("data-sheet")).toBe(true);
    expect(shown($(w, "close"))).toBe(true);
    expect($(w, "close").getAttribute("aria-label")).toBe("Close");
    expect($(w, "close").tabIndex).toBe(-1);
    expect(shown($(w, "title"))).toBe(true);
    expect($(w, "title").textContent).toBe("Currency");
    expect($(w, "title").getAttribute("aria-hidden")).toBe("true");
    expect(document.activeElement).toBe(panel);
  });

  it("the close button closes and returns focus to the field", () => {
    device({ touch: true, narrow: true });
    const w = radios();
    gridselect(w);
    $(w, "field").click();
    $(w, "close").click();
    expect($(w, "panel").hidden).toBe(true);
    expect(document.activeElement).toBe($(w, "field"));
  });

  it("title falls back to aria-label", () => {
    device({ touch: true, narrow: true });
    const w = radios({ legend: "", wrapperAttrs: 'aria-label="Money"' });
    gridselect(w);
    $(w, "field").click();
    expect($(w, "title").textContent).toBe("Money");
  });

  it("sheet: false and data-sheet=off keep the normal panel, with the close button", () => {
    device({ touch: true, narrow: true });
    for (const [opts, attrs] of [[{ sheet: false }, ""], [{}, 'data-sheet="off"']]) {
      const w = radios({ wrapperAttrs: attrs });
      gridselect(w, opts);
      $(w, "field").click();
      expect($(w, "panel").hasAttribute("data-sheet")).toBe(false);
      expect(shown($(w, "close"))).toBe(true);
      expect(shown($(w, "title"))).toBe(false);
    }
  });

  it("closeText names the button", () => {
    device({ touch: true, narrow: true });
    const w = radios();
    gridselect(w, { closeText: "Schließen" });
    $(w, "field").click();
    expect($(w, "close").getAttribute("aria-label")).toBe("Schließen");
  });

  it("keys still work after tapping into the search", () => {
    device({ touch: true, narrow: true });
    const w = radios();
    gridselect(w);
    $(w, "field").click();
    $(w, "search").focus();
    $(w, "search").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect($(w, "panel").hidden).toBe(true);
  });
});

describe("tablet and desktop", () => {
  it("tablet: normal panel, close button, search not focused", () => {
    device({ touch: true, narrow: false });
    const w = radios();
    gridselect(w);
    $(w, "field").click();
    expect($(w, "panel").hasAttribute("data-sheet")).toBe(false);
    expect(shown($(w, "close"))).toBe(true);
    expect(document.activeElement).toBe($(w, "panel"));
  });

  it("desktop: no sheet, no close button, search focused, also without matchMedia", () => {
    for (const setup of [() => device(), () => (window.matchMedia = undefined)]) {
      setup();
      const w = radios();
      gridselect(w);
      $(w, "field").click();
      expect($(w, "panel").hasAttribute("data-sheet")).toBe(false);
      expect(shown($(w, "close"))).toBe(false);
      expect(shown($(w, "title"))).toBe(false);
      expect(document.activeElement).toBe($(w, "search"));
    }
  });
});

describe("<grid-select>", () => {
  it("sheet=off and close-text reach the panel", async () => {
    await import("../src/element.js");
    device({ touch: true, narrow: true });
    document.body.innerHTML = `<grid-select label="Cur" threshold="2" sheet="off" close-text="Zu">${names.map((n) => `<option>${n}</option>`).join("")}</grid-select>`;
    const el = document.querySelector("grid-select");
    $(el, "field").click();
    expect($(el, "panel").hasAttribute("data-sheet")).toBe(false);
    expect($(el, "close").getAttribute("aria-label")).toBe("Zu");
  });
});
