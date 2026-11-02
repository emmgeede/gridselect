// @vitest-environment jsdom
// F13: Vue wrapper. See docs/features/F13-framework-wrapper/spec.md.
import { describe, it, expect, beforeEach } from "vitest";
import { createApp, h, ref, nextTick } from "vue";
import { GridSelect } from "@emmgeede/gridselect/vue";

let host, app;
beforeEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
  host = document.createElement("div");
  document.body.append(host);
});
function mount(render) {
  app = createApp({ render });
  app.config.compilerOptions.isCustomElement = (tag) => tag === "grid-select";
  app.mount(host);
}
const gs = () => host.querySelector("grid-select");
const inputs = () => [...host.querySelectorAll("label[data-gridselect-generated] input")];
const pick = (value) => inputs().find((i) => i.value === value).click();

describe("Vue wrapper", () => {
  it("registers <grid-select> and renders attributes, booleans only when true", () => {
    expect(customElements.get("grid-select")).toBeTruthy();
    mount(() => h(GridSelect, { name: "cur", label: "Currency", items: ["EUR", "CHF"], ariaLabel: "C", threshold: 3, layout: "flow",
      searchPlaceholder: "S", shortcuts: ["", "Alt"], required: true, pinned: ["EUR"], recent: "k", recentMax: 2, max: 4, panelContainer: "page" }));
    const a = (n) => gs().getAttribute(n);
    expect([a("name"), a("aria-label"), a("threshold"), a("layout"), a("search-placeholder"), a("shortcuts")])
      .toEqual(["cur", "C", "3", "flow", "S", ",Alt"]);
    expect([a("pinned"), a("recent"), a("recent-max"), a("max"), a("panel-container")]).toEqual(["EUR", "k", "2", "4", "page"]);
    expect(gs().hasAttribute("required")).toBe(true);
    expect(gs().hasAttribute("multiple")).toBe(false);
    expect(inputs().map((i) => i.value)).toEqual(["EUR", "CHF"]);
  });

  it("supports v-model and passes change through", async () => {
    const v = ref("EUR");
    const changes = [];
    mount(() => h(GridSelect, { label: "x", items: ["EUR", "CHF"], modelValue: v.value, "onUpdate:modelValue": (x) => (v.value = x),
      onChange: () => changes.push(1) }));
    await nextTick();
    expect(gs().value).toBe("EUR");
    pick("CHF");
    expect(v.value).toBe("CHF");
    expect(changes.length).toBe(1);
    await nextTick();
    expect(gs().value).toBe("CHF");
    v.value = "EUR";
    await nextTick();
    expect(gs().value).toBe("EUR");
  });

  it("v-model with multiple returns arrays", async () => {
    const v = ref(["a"]);
    mount(() => h(GridSelect, { label: "x", multiple: true, items: ["a", "b"], modelValue: v.value, "onUpdate:modelValue": (x) => (v.value = x) }));
    await nextTick();
    pick("b");
    expect(v.value).toEqual(["a", "b"]);
  });

  it("takes slot options, new items, and unmounts cleanly", async () => {
    const items = ref(null);
    mount(() => h(GridSelect, { label: "x", items: items.value ?? undefined }, () => [h("option", { value: "a" }, "a"), h("option", { value: "b" }, "b")]));
    await nextTick();
    expect(inputs().map((i) => i.value)).toEqual(["a", "b"]);
    items.value = ["c", "d", "e"];
    await nextTick();
    expect(inputs().map((i) => i.value)).toEqual(["c", "d", "e"]);
    app.unmount();
    app = null;
    expect(host.innerHTML).toBe("");
  });
});
