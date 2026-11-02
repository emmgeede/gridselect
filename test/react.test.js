// @vitest-environment jsdom
// F13: React wrapper. See docs/features/F13-framework-wrapper/spec.md.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createElement as h, createRef, useState, act } from "react";
import { createRoot } from "react-dom/client";
import { GridSelect } from "@emmgeede/gridselect/react";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const many = (n) => Array.from({ length: n }, (_, i) => ({ value: `v${i}`, label: `L${i}` }));
let host, root;
beforeEach(() => {
  document.body.innerHTML = "";
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => act(() => root.unmount()));
const render = (el) => act(() => root.render(el));
const gs = () => host.querySelector("grid-select");
const inputs = () => [...host.querySelectorAll("label[data-gridselect-generated] input")];
function pick(value) {
  const input = inputs().find((i) => i.value === value);
  act(() => input.click());
}

describe("React wrapper", () => {
  it("registers <grid-select> and renders it with attributes and items", () => {
    expect(customElements.get("grid-select")).toBeTruthy();
    render(h(GridSelect, { name: "cur", label: "Currency", items: ["EUR", "CHF"] }));
    expect(gs().getAttribute("name")).toBe("cur");
    expect(gs().querySelector("legend").textContent).toBe("Currency");
    expect(inputs().map((i) => i.value)).toEqual(["EUR", "CHF"]);
  });

  it("maps camelCase props to attributes, booleans only when true", () => {
    render(h(GridSelect, { ariaLabel: "Cur", threshold: 3, layout: "flow", search: "highlight", match: "fuzzy",
      placeholder: "P", searchPlaceholder: "S", shortcuts: ["", "Shift"], multiple: false, required: true, disabled: false, items: ["a"] }));
    const a = (n) => gs().getAttribute(n);
    expect([a("aria-label"), a("threshold"), a("layout"), a("search"), a("match"), a("placeholder"), a("search-placeholder"), a("shortcuts")])
      .toEqual(["Cur", "3", "flow", "highlight", "fuzzy", "P", "S", ",Shift"]);
    expect(gs().hasAttribute("required")).toBe(true);
    expect(gs().hasAttribute("multiple")).toBe(false);
    expect(gs().hasAttribute("disabled")).toBe(false);
    render(h(GridSelect, { ariaLabel: "Cur", shortcuts: false, items: ["a"] }));
    expect(a("shortcuts")).toBe("off");
    render(h(GridSelect, { ariaLabel: "Cur", items: ["a"], pinned: ["a", "b"], recent: "k", recentMax: 2, pinnedText: "P", recentText: "R", max: 4 }));
    expect(a("max")).toBe("4");
    expect([a("pinned"), a("recent"), a("recent-max"), a("pinned-text"), a("recent-text")]).toEqual(["a,b", "k", "2", "P", "R"]);
  });

  it("is controlled: onChange gets the new value, the element keeps showing value", () => {
    const onChange = vi.fn();
    render(h(GridSelect, { label: "x", items: ["a", "b"], value: "a", onChange }));
    expect(gs().value).toBe("a");
    pick("b");
    expect(onChange).toHaveBeenCalledWith("b");
    expect(gs().value).toBe("a");
  });

  it("follows the parent state, also for multiple choice", () => {
    let last;
    function Parent() {
      const [v, setV] = useState(["a"]);
      last = v;
      return h(GridSelect, { label: "x", multiple: true, items: ["a", "b", "c"], value: v, onChange: setV });
    }
    render(h(Parent));
    pick("c");
    expect(last).toEqual(["a", "c"]);
    expect(gs().value).toEqual(["a", "c"]);
  });

  it("is uncontrolled with defaultValue", () => {
    const onChange = vi.fn();
    render(h(GridSelect, { label: "x", items: ["a", "b"], defaultValue: "a", onChange }));
    expect(gs().value).toBe("a");
    pick("b");
    expect(gs().value).toBe("b");
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("takes option and optgroup children and follows changes", async () => {
    const opts = (vals) => vals.map((v) => h("option", { key: v, value: v }, v));
    render(h(GridSelect, { label: "x" }, opts(["a", "b"])));
    expect(inputs().map((i) => i.value)).toEqual(["a", "b"]);
    await act(async () => root.render(h(GridSelect, { label: "x" }, opts(["a", "b", "c"]))));
    expect(inputs().map((i) => i.value)).toEqual(["a", "b", "c"]);
    await act(async () => root.render(h(GridSelect, { label: "x", threshold: 2 }, h("optgroup", { label: "G" }, opts(["a", "b", "c"])))));
    act(() => host.querySelector("[data-gridselect-field]").click());
    expect(host.querySelector("[data-gridselect-group-label]").textContent).toBe("G");
  });

  it("takes new items and keeps chosen values that still exist", () => {
    render(h(GridSelect, { label: "x", items: ["a", "b"], defaultValue: "b" }));
    render(h(GridSelect, { label: "x", items: ["b", "c"], defaultValue: "b" }));
    expect(inputs().map((i) => i.value)).toEqual(["b", "c"]);
    expect(gs().value).toBe("b");
    render(h(GridSelect, { label: "x", items: many(12), defaultValue: "b" }));
    expect(host.querySelector("[data-gridselect-field]")).not.toBeNull();
  });

  it("forwards the ref and unmounts cleanly", () => {
    const ref = createRef();
    render(h(GridSelect, { ref, label: "x", items: ["a"] }));
    expect(ref.current).toBe(gs());
    act(() => root.unmount());
    expect(host.innerHTML).toBe("");
    root = createRoot(host);
  });

  it("switches from uncontrolled to controlled without errors", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    render(h(GridSelect, { label: "x", items: ["a", "b"] }));
    render(h(GridSelect, { label: "x", items: ["a", "b"], value: "b" }));
    expect(gs().value).toBe("b");
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });
});

describe("React 18 compatibility", () => {
  it("uses only APIs that React 18 has", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/react.js", "utf8");
    const names = /import \{([^}]+)\} from "react"/.exec(src)[1].split(",").map((s) => s.trim());
    const react18 = ["createElement", "forwardRef", "useImperativeHandle", "useLayoutEffect", "useRef", "useEffect", "useState", "useMemo", "useCallback"];
    expect(names.filter((n) => !react18.includes(n))).toEqual([]);
    expect(src).not.toMatch(/\buse\(|useActionState|useOptimistic|useFormStatus/);
  });
});
