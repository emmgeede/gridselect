// @vitest-environment jsdom
// F10: the <grid-select> custom element. See docs/features/F10-custom-element/spec.md.
import { describe, it, expect, beforeEach, vi } from "vitest";
import "@emmgeede/gridselect/element";

const tick = () => new Promise((r) => setTimeout(r, 0));
function mount(html) {
  document.body.innerHTML = `<form id="f">${html}</form><button id="out">o</button>`;
  return document.querySelector("grid-select");
}
const opts = (n) => Array.from({ length: n }, (_, i) => `<option value="v${i}">L${i}</option>`).join("");
const inputs = (el) => [...el.querySelectorAll("label[data-gridselect-generated] input")];
const field = (el) => el.querySelector("[data-gridselect-field]");
const text = (i) => i.labels[0].textContent.replace(/^[A-Z]*\d/, "").trim();

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("<grid-select>", () => {
  it("is defined, and importing twice does not throw", async () => {
    expect(customElements.get("grid-select")).toBeDefined();
    await expect(import("@emmgeede/gridselect/element")).resolves.toBeDefined();
  });

  it("builds a named fieldset with radios from its options and hides the options", () => {
    const el = mount(`<grid-select name="cur" label="Currency"><option value="EUR">Euro</option><option value="CHF" selected>Swiss franc</option><option value="USD" label="US dollar" disabled>USD</option></grid-select>`);
    const fs = el.querySelector("fieldset[data-gridselect]");
    expect(fs.querySelector("legend").textContent).toBe("Currency");
    const r = inputs(el);
    expect(r.map((i) => [i.type, i.name, i.value, i.disabled, i.checked])).toEqual([
      ["radio", "cur", "EUR", false, false], ["radio", "cur", "CHF", false, true], ["radio", "cur", "USD", true, false]]);
    expect(r.map(text)).toEqual(["Euro", "Swiss franc", "US dollar"]);
    for (const o of el.querySelectorAll(":scope > option")) {
      expect(o.hidden).toBe(true);
      expect(o.style.getPropertyValue("display")).toBe("none");
    }
    expect(el.value).toBe("CHF");
  });

  it("builds checkboxes with multiple, and the value attribute wins over selected", () => {
    let el = mount(`<grid-select label="X" multiple><option value="a" selected>A</option><option value="b">B</option><option value="c" selected>C</option></grid-select>`);
    expect(inputs(el).map((i) => i.type)).toEqual(["checkbox", "checkbox", "checkbox"]);
    expect(el.value).toEqual(["a", "c"]);
    el = mount(`<grid-select label="X" multiple value="b,c"><option value="a" selected>A</option><option value="b">B</option><option value="c">C</option></grid-select>`);
    expect(el.value).toEqual(["b", "c"]);
    el = mount(`<grid-select label="X" value="b"><option value="a" selected>A</option><option value="b">B</option></grid-select>`);
    expect(el.value).toBe("b");
  });

  it("passes threshold, layout, search, placeholders and shortcuts through", () => {
    let el = mount(`<grid-select label="X" threshold="2" layout="list" search="highlight" placeholder="Pick" search-placeholder="Find" shortcuts=",Shift">${opts(3)}</grid-select>`);
    expect(field(el).textContent).toBe("Pick");
    expect(el.querySelector("[data-gridselect-search]").placeholder).toBe("Find");
    expect(el.querySelector(".gridselect__items--list")).not.toBeNull();
    field(el).click();
    const s = el.querySelector("[data-gridselect-search]");
    s.value = "l1";
    s.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.querySelectorAll("[data-gridselect-item][data-match]")).toHaveLength(1);
    el = mount(`<grid-select label="X" shortcuts="off">${opts(3)}</grid-select>`);
    expect(el.querySelectorAll("[data-gridselect-key]")).toHaveLength(0);
  });

  it("supports required and disabled", () => {
    let el = mount(`<grid-select name="c" label="X" required>${opts(12)}</grid-select>`);
    expect(inputs(el).every((i) => i.required)).toBe(true);
    document.getElementById("f").requestSubmit();
    expect(document.activeElement).toBe(field(el));
    expect(field(el).getAttribute("aria-invalid")).toBe("true");
    el = mount(`<grid-select label="X" disabled>${opts(3)}</grid-select>`);
    expect(el.querySelector("fieldset").disabled).toBe(true);
  });

  it("submits under its name and lets native events through", () => {
    const el = mount(`<grid-select name="cur" label="X">${opts(3)}</grid-select>`);
    const log = [];
    el.addEventListener("change", (e) => log.push(e.target.value));
    inputs(el)[2].click();
    expect(new FormData(document.getElementById("f")).get("cur")).toBe("v2");
    expect(log).toEqual(["v2"]);
  });

  it("reads and writes value without events, and takes items from a property", () => {
    const el = mount(`<grid-select label="X">${opts(3)}</grid-select>`);
    const log = [];
    el.addEventListener("change", () => log.push(1));
    el.value = "v1";
    expect(inputs(el)[1].checked).toBe(true);
    el.items = ["v1", "z"];
    expect(inputs(el).map((i) => i.value)).toEqual(["v1", "z"]);
    expect(el.value).toBe("v1");
    expect(log).toEqual([]);
  });

  it("rebuilds on attribute changes, keeping value and focus", () => {
    const el = mount(`<grid-select label="X" value="v3">${opts(12)}</grid-select>`);
    field(el).focus();
    el.setAttribute("threshold", "20");
    expect(field(el)).toBeNull();
    expect(el.value).toBe("v3");
    expect(document.activeElement).toBe(inputs(el)[3]);
    el.setAttribute("label", "New");
    expect(el.querySelector("legend").textContent).toBe("New");
    expect(el.querySelectorAll("fieldset")).toHaveLength(1);
  });

  it("rebuilds once after option changes, and not for its own changes", async () => {
    const el = mount(`<grid-select label="X">${opts(3)}</grid-select>`);
    const fs = el.querySelector("fieldset");
    el.append(Object.assign(document.createElement("option"), { value: "n", textContent: "New" }));
    el.querySelector("option").textContent = "Changed";
    el.querySelectorAll("option")[1].disabled = true;
    await tick();
    expect(inputs(el).map(text)).toEqual(["Changed", "L1", "L2", "New"]);
    expect(inputs(el)[1].disabled).toBe(true);
    const rebuilt = el.querySelector("fieldset");
    expect(rebuilt).not.toBe(fs);
    inputs(el)[0].click(); // GridSelect's own DOM work must not trigger another rebuild
    await tick();
    expect(el.querySelector("fieldset")).toBe(rebuilt);
  });

  it("cleans up when removed and rebuilds when inserted again", () => {
    const el = mount(`<grid-select label="X">${opts(12)}</grid-select>`);
    el.remove();
    expect(el.querySelector("fieldset")).toBeNull();
    expect([...el.querySelectorAll("option")].every((o) => !o.hidden && !o.hasAttribute("style"))).toBe(true);
    document.body.append(el);
    expect(field(el)).not.toBeNull();
  });

  it("warns without a name and uses aria-label for the fieldset", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mount(`<grid-select>${opts(2)}</grid-select>`);
    expect(warn.mock.calls.some((c) => String(c[0]).startsWith("gridselect:"))).toBe(true);
    warn.mockClear();
    const el = mount(`<grid-select aria-label="Currency">${opts(2)}</grid-select>`);
    expect(el.querySelector("fieldset").getAttribute("aria-label")).toBe("Currency");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("handles no options, options without value, and a placeholder option", () => {
    let el = mount(`<grid-select label="X"></grid-select>`);
    expect(el.value).toBeNull();
    el = mount(`<grid-select label="X"><option>Plain</option></grid-select>`);
    expect(inputs(el)[0].value).toBe("Plain");
    el = mount(`<grid-select label="X"><option value="">Choose…</option>${opts(12)}</grid-select>`);
    expect(inputs(el)).toHaveLength(12);
    expect(field(el).textContent).toBe("Choose…");
  });
});

describe("QA F10 fixes", () => {
  it("keeps a value set before the element is connected", () => {
    const el = document.createElement("grid-select");
    el.setAttribute("label", "X");
    el.innerHTML = '<option value="a">A</option><option value="b">B</option>';
    el.value = "b";
    expect(el.value).toBe("b");
    document.body.append(el);
    expect(el.value).toBe("b");
    expect(inputs(el)[1].checked).toBe(true);
  });

  it("keeps value and items set together before connecting, in either order", () => {
    const el = document.createElement("grid-select");
    el.setAttribute("label", "X");
    el.setAttribute("multiple", "");
    el.value = ["y"];
    el.items = ["x", "y", "z"];
    document.body.append(el);
    expect(el.value).toEqual(["y"]);
  });
});
