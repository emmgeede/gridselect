// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { gridselect } from "@emmgeede/gridselect";

function mount(html) {
  document.body.innerHTML = `<fieldset data-gridselect>${html}</fieldset>`;
  return document.querySelector("[data-gridselect]");
}

const currencies = `
  <label><input type="radio" name="cur" value="EUR" checked> Euro</label>
  <label><input type="radio" name="cur" value="CHF"> Franken</label>
  <label><input type="radio" name="cur" value="USD"> Dollar</label>`;

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("radio group", () => {
  it("reads the value of the checked radio", () => {
    const gs = gridselect(mount(currencies));
    expect(gs.value).toBe("EUR");
  });

  it("reads null when no radio is checked", () => {
    const gs = gridselect(mount(currencies.replace(" checked", "")));
    expect(gs.value).toBeNull();
  });

  it("follows a user click and lets exactly one native change event reach the wrapper", () => {
    const wrapper = mount(currencies);
    const gs = gridselect(wrapper);
    const events = [];
    wrapper.addEventListener("change", (e) => events.push(e));

    wrapper.querySelector("[value=CHF]").click();

    expect(gs.value).toBe("CHF");
    expect(events).toHaveLength(1);
    expect(events[0].target.value).toBe("CHF");
  });

  it("checks the matching radio on set, without firing events", () => {
    const wrapper = mount(currencies);
    const gs = gridselect(wrapper);
    const events = [];
    wrapper.addEventListener("change", (e) => events.push(e));
    wrapper.addEventListener("input", (e) => events.push(e));

    gs.value = "CHF";

    expect(wrapper.querySelector("[value=CHF]").checked).toBe(true);
    expect(wrapper.querySelector("[value=EUR]").checked).toBe(false);
    expect(gs.value).toBe("CHF");
    expect(events).toHaveLength(0);
  });

  it.each([null, "GBP"])("clears the selection when set to %s", (v) => {
    const wrapper = mount(currencies);
    const gs = gridselect(wrapper);

    gs.value = v;

    expect(wrapper.querySelectorAll(":checked")).toHaveLength(0);
    expect(gs.value).toBeNull();
  });
});

describe("instance lifecycle", () => {
  it("returns the same instance for the same wrapper", () => {
    const wrapper = mount(currencies);
    expect(gridselect(wrapper)).toBe(gridselect(wrapper));
  });

  it("leaves the markup untouched without digit shortcuts", () => {
    const wrapper = mount(currencies);
    const before = wrapper.outerHTML;
    gridselect(wrapper, { shortcuts: false });
    expect(wrapper.outerHTML).toBe(before);
  });

  it("hands out a new instance after destroy, markup still untouched", () => {
    const wrapper = mount(currencies);
    const before = wrapper.outerHTML;
    const gs = gridselect(wrapper);

    gs.destroy();

    expect(wrapper.outerHTML).toBe(before);
    expect(gridselect(wrapper)).not.toBe(gs);
  });
});

describe("invalid input", () => {
  it.each([
    ["null", () => null],
    ["a string", () => "[data-gridselect]"],
    ["a text node", () => document.createTextNode("x")],
  ])("throws a gridselect TypeError for %s", (_, arg) => {
    expect(() => gridselect(arg())).toThrow(TypeError);
    expect(() => gridselect(arg())).toThrow(/^gridselect:/);
  });

  it("throws when radios and checkboxes are mixed, naming both types", () => {
    const wrapper = mount(`<input type="radio" name="a" value="1"><input type="checkbox" value="2">`);
    expect(() => gridselect(wrapper)).toThrow(TypeError);
    expect(() => gridselect(wrapper)).toThrow(/radio.*checkbox|checkbox.*radio/);
  });

  it("throws when radios have different names, naming them", () => {
    const wrapper = mount(`<input type="radio" name="cur" value="1"><input type="radio" name="size" value="2">`);
    expect(() => gridselect(wrapper)).toThrow(TypeError);
    expect(() => gridselect(wrapper)).toThrow(/cur.*size/);
  });

  it("accepts a wrapper without inputs, value null", () => {
    const gs = gridselect(mount(`<p>nothing here</p>`));
    expect(gs.value).toBeNull();
  });
});

describe("duplicate values and keyboard", () => {
  it("warns once about a duplicate value and sets only the first radio", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const wrapper = mount(`
      <input type="radio" name="x" value="dup" id="first">
      <input type="radio" name="x" value="dup" id="second">
      <input type="radio" name="x" value="other" checked>`);

    const gs = gridselect(wrapper);
    gs.value = "dup";

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0].join(" ")).toContain("dup");
    expect(wrapper.querySelector("#first").checked).toBe(true);
    expect(wrapper.querySelector("#second").checked).toBe(false);
    warn.mockRestore();
  });

  it.each(["ArrowDown", "ArrowRight", " ", "Tab"])("does not intercept the %s key", (key) => {
    const wrapper = mount(currencies);
    gridselect(wrapper);
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });

    wrapper.querySelector("[value=EUR]").dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});

const toppings = `
  <label><input type="checkbox" value="a" checked> A</label>
  <label><input type="checkbox" value="b"> B</label>
  <label><input type="checkbox" value="c" checked> C</label>`;

describe("checkbox group", () => {
  it("reads the checked values in DOM order", () => {
    expect(gridselect(mount(toppings)).value).toEqual(["a", "c"]);
  });

  it("reads an empty array when nothing is checked", () => {
    expect(gridselect(mount(toppings.replaceAll(" checked", ""))).value).toEqual([]);
  });

  it("checks exactly the given values on set, ignores unknown ones, fires no events", () => {
    const wrapper = mount(toppings);
    const gs = gridselect(wrapper);
    const events = [];
    wrapper.addEventListener("change", (e) => events.push(e));
    wrapper.addEventListener("input", (e) => events.push(e));

    gs.value = ["b", "c", "x"];

    expect(gs.value).toEqual(["b", "c"]);
    expect(events).toHaveLength(0);
  });

  it("throws a TypeError when set to a non-array and keeps the selection", () => {
    const gs = gridselect(mount(toppings));
    expect(() => {
      gs.value = "a";
    }).toThrow(TypeError);
    expect(gs.value).toEqual(["a", "c"]);
  });
});

describe("QA F1 fixes", () => {
  it.each([
    ["an object without prototype", () => Object.create(null)],
    ["a fake object with nodeType 1", () => ({ nodeType: 1 })],
  ])("throws a gridselect TypeError for %s", (_, arg) => {
    expect(() => gridselect(arg())).toThrow(TypeError);
    expect(() => gridselect(arg())).toThrow(/^gridselect:/);
  });

  it("matches numbers against string values", () => {
    const radios = gridselect(mount(`<input type="radio" name="n" value="1" checked><input type="radio" name="n" value="2">`));
    radios.value = 2;
    expect(radios.value).toBe("2");

    document.body.innerHTML = "";
    const boxes = gridselect(mount(`<input type="checkbox" value="1"><input type="checkbox" value="2">`));
    boxes.value = [1];
    expect(boxes.value).toEqual(["1"]);
  });

  it.each([[["2"]], [true], [{ toString: () => "2" }]])("treats %j as an unknown radio value and clears", (v) => {
    const gs = gridselect(mount(`<input type="radio" name="n" value="1" checked><input type="radio" name="n" value="2">`));
    gs.value = v;
    expect(gs.value).toBeNull();
  });

  it("ignores non-string, non-number entries in a checkbox array", () => {
    const gs = gridselect(mount(`<input type="checkbox" value="1"><input type="checkbox" value="2">`));
    gs.value = [["1"], true, 2];
    expect(gs.value).toEqual(["2"]);
  });

  it("does not claim the first input wins for duplicate checkbox values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    gridselect(mount(`<input type="checkbox" value="d"><input type="checkbox" value="d">`));
    expect(warn.mock.calls[0].join(" ")).not.toContain("first input wins");
    expect(warn.mock.calls[0].join(" ")).toContain("d");
    warn.mockRestore();
  });
});
