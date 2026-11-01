// Filtering speed in a real browser: every keystroke on 200 items stays within one frame (16 ms).
import { test, expect } from "@playwright/test";

test("filters 200 items per keystroke within a frame", async ({ page }) => {
  await page.goto("/playground/");
  const perKey = await page.evaluate(async () => {
    const { gridselect } = await import("/src/gridselect.js");
    const wrapper = document.createElement("fieldset");
    wrapper.setAttribute("data-gridselect", "");
    for (let i = 0; i < 200; i++) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      Object.assign(input, { type: "radio", name: "perf", value: `v${i}` });
      label.append(input, ` Item ${i}`);
      wrapper.append(label);
    }
    document.querySelector("main").append(wrapper);
    gridselect(wrapper);
    wrapper.querySelector("[data-gridselect-field]").click();
    const search = wrapper.querySelector("[data-gridselect-search]");
    const queries = ["i", "it", "ite", "item", "item 1", "item 19", "item 199", "item 1", "i", ""];
    const t = performance.now();
    for (const q of queries) {
      search.value = q;
      search.dispatchEvent(new Event("input", { bubbles: true }));
      wrapper.querySelector("[data-gridselect-items]").getBoundingClientRect(); // force layout
    }
    return (performance.now() - t) / queries.length;
  });
  expect(perKey).toBeLessThan(16);
});
