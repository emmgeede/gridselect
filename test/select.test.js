// @vitest-environment jsdom
// F5: <select> as source. See docs/features/F5-select-quelle/spec.md.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { gridselect } from "@emmgeede/gridselect";

/** Wrapper with a select; `opts` html strings, e.g. ['<option value="a">A</option>']. */
function setup(opts, { selectAttrs = "", before = "", wrapper = '<fieldset id="w"><legend>Currency</legend>', end = "</fieldset>", options } = {}) {
  document.body.innerHTML = `<form id="f">${before}${wrapper}<label for="s">Pick</label><select id="s" name="cur" ${selectAttrs}>${opts.join("")}</select>${end}</form>`;
  const w = document.getElementById("w");
  const select = document.getElementById("s");
  return { w, select, gs: gridselect(w, options) };
}
const opt = (n, from = 0) => Array.from({ length: n }, (_, i) => `<option value="v${i + from}">L${i + from}</option>`);
const generated = (w) => [...w.querySelectorAll("label[data-gridselect-generated] input")];

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("building from a select", () => {
  it("creates one generated radio per option, in order, including optgroups", () => {
    const { w } = setup(['<option value="a">A</option>', '<optgroup label="G"><option value="b" label="Bee">ignored</option></optgroup>', '<option value="c">C</option>']);
    const r = generated(w);
    expect(r.map((x) => x.value)).toEqual(["a", "b", "c"]);
    expect(r.map((x) => x.labels[0].textContent.replace(/^\d/, "").trim())).toEqual(["A", "Bee", "C"]);
    expect(w.lastElementChild.hasAttribute("data-gridselect-generated")).toBe(true);
  });

  it("names the radios uniquely and keeps them out of the form data", () => {
    const { w } = setup(opt(3), { selectAttrs: "" });
    const r = generated(w);
    expect(new Set(r.map((x) => x.name)).size).toBe(1);
    expect(r[0].name).not.toBe("cur");
    expect(r[0].getAttribute("form")).toBeTruthy();
    expect(document.getElementById(r[0].getAttribute("form"))).toBeNull();
    expect(r[0].form).toBeNull();
    r[2].click();
    expect([...new FormData(document.getElementById("f")).entries()]).toEqual([["cur", "v2"]]);
  });

  it("disables radios of disabled options, groups and selects", () => {
    let { w } = setup(['<option value="a">A</option>', '<option value="b" disabled>B</option>', '<optgroup label="G" disabled><option value="c">C</option></optgroup>']);
    expect(generated(w).map((x) => x.disabled)).toEqual([false, true, true]);
    ({ w } = setup(opt(2), { selectAttrs: "disabled" }));
    expect(generated(w).every((x) => x.disabled)).toBe(true);
  });

  it("hides the select and its labels hard", () => {
    const { select } = setup(opt(3));
    for (const el of [select, ...select.labels]) {
      expect(el.hidden).toBe(true);
      expect(el.style.getPropertyValue("display")).toBe("none");
      expect(el.style.getPropertyPriority("display")).toBe("important");
    }
  });

  it("shows flat radios up to 10 options and the panel above", () => {
    let { w } = setup(opt(10));
    expect(w.querySelector("[data-gridselect-field]")).toBeNull();
    expect(generated(w).every((x) => !x.hidden)).toBe(true);
    ({ w } = setup(['<option value="">Choose…</option>', ...opt(10)]));
    expect(w.querySelector("[data-gridselect-field]")).toBeNull();
    ({ w } = setup(opt(11)));
    expect(w.querySelector("[data-gridselect-field]")).not.toBeNull();
    expect(generated(w).every((x) => x.hidden)).toBe(true);
  });
});

describe("placeholder and initial value", () => {
  it("skips the placeholder option and uses its text for the field", () => {
    const { w, gs } = setup(['<option value="">Bitte wählen…</option>', ...opt(11)]);
    expect(generated(w).map((x) => x.value)).not.toContain("");
    expect(w.querySelector("[data-gridselect-field]").textContent).toBe("Bitte wählen…");
    expect(gs.value).toBeNull();
  });

  it("lets the placeholder option win only when no placeholder option is given", () => {
    const { w } = setup(['<option value="">Bitte wählen…</option>', ...opt(11)], { options: { placeholder: "Pick one" } });
    expect(w.querySelector("[data-gridselect-field]").textContent).toBe("Pick one");
  });

  it("checks the radio of the selected option, also the natively preselected first one", () => {
    let { w, gs } = setup(['<option value="a">A</option>', '<option value="b" selected>B</option>']);
    expect(generated(w).find((x) => x.checked).value).toBe("b");
    expect(gs.value).toBe("b");
    ({ w, gs } = setup(['<option value="a">A</option>', '<option value="b">B</option>']));
    expect(gs.value).toBe("a");
    expect(generated(w)[0].checked).toBe(true);
  });
});

describe("special cases", () => {
  it("throws for a select mixed with radios or a second select", () => {
    document.body.innerHTML = `<div id="w"><select><option>a</option></select><input type="radio" name="x"></div>`;
    expect(() => gridselect(document.getElementById("w"))).toThrow(/^gridselect:/);
    document.body.innerHTML = `<div id="w"><select><option>a</option></select><select><option>b</option></select></div>`;
    expect(() => gridselect(document.getElementById("w"))).toThrow(TypeError);
  });

  it("restores the original markup on destroy, below and above the threshold", () => {
    for (const n of [3, 12]) {
      document.body.innerHTML = `<form><fieldset id="w"><legend>X</legend><label for="s" style="color: red">Pick</label><select id="s">${opt(n).join("")}</select></fieldset></form>`;
      const w = document.getElementById("w");
      const before = w.outerHTML;
      const gs = gridselect(w);
      if (n > 10) w.querySelector("[data-gridselect-field]").click();
      gs.destroy();
      expect(w.outerHTML).toBe(before);
    }
  });
});

function events(w) {
  const log = [];
  for (const t of ["input", "change"]) w.addEventListener(t, (e) => log.push(`${t}:${e.target.tagName}:${e.target.value}`));
  return log;
}

describe("picking and events", () => {
  it("sets the select and fires its events only, for clicks, digits and panel picks", () => {
    let { w, select } = setup(opt(3));
    let log = events(w);
    generated(w)[2].click();
    expect(select.value).toBe("v2");
    expect(log).toEqual(["input:SELECT:v2", "change:SELECT:v2"]);

    log.length = 0;
    generated(w)[0].dispatchEvent(new KeyboardEvent("keydown", { code: "Digit2", key: "2", bubbles: true, cancelable: true }));
    expect(select.value).toBe("v1");
    expect(log).toEqual(["input:SELECT:v1", "change:SELECT:v1"]);

    ({ w, select } = setup(opt(12)));
    log = events(w);
    w.querySelector("[data-gridselect-field]").click();
    w.querySelectorAll("[data-gridselect-item]")[5].click();
    expect(select.value).toBe("v5");
    expect(log).toEqual(["input:SELECT:v5", "change:SELECT:v5"]);
    expect(w.querySelector("[data-gridselect-field]").textContent).toBe("L5");
  });

  it("sets the value without events, falling back to the placeholder or no selection", () => {
    let { w, select, gs } = setup(['<option value="">Choose…</option>', ...opt(12)]);
    const log = events(w);
    gs.value = "v3";
    expect(select.value).toBe("v3");
    expect(generated(w).find((r) => r.checked).value).toBe("v3");
    expect(w.querySelector("[data-gridselect-field]").textContent).toBe("L3");
    gs.value = "nope";
    expect(select.value).toBe("");
    expect(gs.value).toBeNull();
    expect(w.querySelector("[data-gridselect-field]").textContent).toBe("Choose…");
    expect(log).toEqual([]);

    ({ select, gs } = setup(opt(3)));
    gs.value = null;
    expect(select.selectedIndex).toBe(-1);
    expect(gs.value).toBeNull();
  });

  it("follows outside changes announced with a change event", () => {
    const { w, select } = setup(opt(12));
    select.value = "v7";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(generated(w).find((r) => r.checked).value).toBe("v7");
    expect(w.querySelector("[data-gridselect-field]").textContent).toBe("L7");
  });

  it("follows a form reset", async () => {
    const { w, gs } = setup(['<option value="a">A</option>', '<option value="b" selected>B</option>', '<option value="c">C</option>']);
    gs.value = "c";
    document.getElementById("f").reset();
    await new Promise((r) => setTimeout(r, 0));
    expect(generated(w).find((r) => r.checked).value).toBe("b");
  });
});

describe("required and naming", () => {
  it("flags and focuses the field above the threshold", () => {
    const { w } = setup(['<option value="">Choose…</option>', ...opt(12)], { selectAttrs: "required" });
    document.getElementById("f").requestSubmit();
    const field = w.querySelector("[data-gridselect-field]");
    expect(document.activeElement).toBe(field);
    expect(field.getAttribute("aria-invalid")).toBe("true");
  });

  it("flags the radios and focuses the first enabled one below the threshold, clears after a pick", () => {
    const { w } = setup(['<option value="">Choose…</option>', '<option value="a" disabled>A</option>', ...opt(3)], { selectAttrs: "required" });
    document.getElementById("f").requestSubmit();
    const r = generated(w);
    expect(document.activeElement).toBe(r[1]);
    expect(r.every((x) => x.getAttribute("aria-invalid") === "true")).toBe(true);
    r[2].click();
    expect(r.some((x) => x.hasAttribute("aria-invalid"))).toBe(false);
  });

  it("names the panel after the select's label when the wrapper has no name, and cleans up", () => {
    document.body.innerHTML = `<div id="w"><label for="s">Pick a currency</label><select id="s">${opt(12).join("")}</select></div>`;
    const w = document.getElementById("w");
    const before = w.outerHTML;
    const gs = gridselect(w);
    const label = w.querySelector("label[for=s]");
    expect(label.id).not.toBe("");
    expect(w.querySelector("[data-gridselect-field]").getAttribute("aria-labelledby")).toMatch(new RegExp(`^${label.id} `));
    expect(w.querySelector("[data-gridselect-search]").getAttribute("aria-labelledby")).toBe(label.id);
    gs.destroy();
    expect(w.outerHTML).toBe(before);
  });
});

describe("QA F5 checks", () => {
  it("puts option text in as text, never as markup", () => {
    const { w } = setup(['<option value="x">&lt;img src=x onerror=alert(1)&gt;</option>', ...opt(11)]);
    expect(w.querySelector("img")).toBeNull();
    expect(w.querySelector("[data-gridselect-label]").textContent).toBe("<img src=x onerror=alert(1)>");
  });

  it("gives two select instances distinct radio names", () => {
    document.body.innerHTML = `<div id="a"><select>${opt(3).join("")}</select></div><div id="b"><select>${opt(3).join("")}</select></div>`;
    gridselect(document.getElementById("a"));
    gridselect(document.getElementById("b"));
    const names = [...document.querySelectorAll("input[type=radio]")].map((r) => r.name);
    expect(new Set(names).size).toBe(2);
  });

  it("treats an empty-value option as placeholder even when it is not first", () => {
    const { w, gs } = setup(['<option value="a">A</option>', '<option value="">None</option>', '<option value="b">B</option>']);
    expect(generated(w).map((r) => r.value)).toEqual(["a", "b"]);
    gs.value = null;
    expect(gs.value).toBeNull();
  });
});

describe("QA F5 fixes", () => {
  it("picks up a select change without event when the panel opens", () => {
    const { w, select } = setup(opt(12));
    select.selectedIndex = 5;
    w.querySelector("[data-gridselect-field]").click();
    expect(w.querySelector('[aria-selected="true"] [data-gridselect-label]').textContent).toBe("L5");
    expect(w.querySelector("[data-gridselect-field]").textContent).toBe("L5");
  });
});
