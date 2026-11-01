// @vitest-environment jsdom
// Edge cases from docs/features/F1-kern/spec.md, added during saas-qa F1.
import { describe, it, expect, beforeEach } from "vitest";
import { gridselect } from "@emmgeede/gridselect";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("F1 edge cases", () => {
  it("accepts radios without a name and reads the first checked one", () => {
    document.body.innerHTML = `<div id="w">
      <input type="radio" value="a"><input type="radio" value="b" checked><input type="radio" value="c" checked></div>`;
    expect(gridselect(document.getElementById("w")).value).toBe("b");
  });

  it("reads and sets disabled inputs like native code does", () => {
    document.body.innerHTML = `<div id="w">
      <input type="radio" name="x" value="a" checked><input type="radio" name="x" value="b" disabled></div>`;
    const gs = gridselect(document.getElementById("w"));
    gs.value = "b";
    expect(gs.value).toBe("b");
  });

  it("ignores same-name radios outside the wrapper", () => {
    document.body.innerHTML = `
      <div id="w"><input type="radio" name="x" value="in"></div>
      <input type="radio" name="x" value="out" checked>`;
    expect(gridselect(document.getElementById("w")).value).toBeNull();
  });

  it("works without the data-gridselect attribute", () => {
    document.body.innerHTML = `<section id="w"><input type="radio" name="x" value="a" checked></section>`;
    expect(gridselect(document.getElementById("w")).value).toBe("a");
  });

  it("reflects a native form reset", () => {
    document.body.innerHTML = `<form><div id="w">
      <input type="radio" name="x" value="a" checked><input type="radio" name="x" value="b"></div></form>`;
    const gs = gridselect(document.getElementById("w"));
    gs.value = "b";
    document.querySelector("form").reset();
    expect(gs.value).toBe("a");
  });

  it("throws for nested wrappers with different radio names", () => {
    document.body.innerHTML = `<div id="outer"><input type="radio" name="a" value="1">
      <div id="inner"><input type="radio" name="b" value="2"></div></div>`;
    expect(() => gridselect(document.getElementById("outer"))).toThrow(TypeError);
    expect(gridselect(document.getElementById("inner")).value).toBeNull();
  });

  it("submits the value natively with the form", () => {
    document.body.innerHTML = `<form><div id="w">
      <input type="radio" name="cur" value="EUR"><input type="radio" name="cur" value="CHF"></div></form>`;
    gridselect(document.getElementById("w")).value = "CHF";
    expect(new FormData(document.querySelector("form")).get("cur")).toBe("CHF");
  });
});
