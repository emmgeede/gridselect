// Filtering speed in a real browser: every keystroke on 200 items stays within one frame (16 ms).
import { test, expect } from "@playwright/test";

for (const match of ["substring", "fuzzy"]) test(`filters 200 items per keystroke within a frame (${match})`, async ({ page }) => {
  await page.goto("/playground/");
  const perKey = await page.evaluate(async (match) => {
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
    gridselect(wrapper, { match });
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
  }, match);
  expect(perKey).toBeLessThan(16);
});
