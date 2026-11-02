// Type check only (npm run test:types), never executed.
import { gridselect } from "@emmgeede/gridselect";

const gs = gridselect(document.createElement("fieldset"));
const v: string | string[] | null = gs.value;
gs.value = "EUR";
gs.value = ["a", "b"];
gs.value = null;
gs.destroy();
// @ts-expect-error value is never a number
gs.value = 42;

gridselect(document.body, { threshold: 20, layout: "list", placeholder: "x", searchPlaceholder: "y" });
// @ts-expect-error unknown layout
gridselect(document.body, { layout: "table" });
// @ts-expect-error threshold is a number
gridselect(document.body, { threshold: "20" });

gridselect(document.body, { search: "highlight", noResultsText: "Nichts", resultsText: (n) => n + " Treffer" });
// @ts-expect-error unknown search mode
gridselect(document.body, { search: "fuzzy" });
// @ts-expect-error resultsText is a function
gridselect(document.body, { resultsText: "x" });

gridselect(document.body, { shortcuts: ["", "Shift", "Control+Alt"] });
gridselect(document.body, { shortcuts: false });
// @ts-expect-error shortcuts is an array or false
gridselect(document.body, { shortcuts: true });

gridselect(document.body, { selectedText: (n) => n + " gewählt" });
// @ts-expect-error selectedText is a function
gridselect(document.body, { selectedText: "x" });

const fromItems = gridselect(document.body, { items: ["a", { value: 1, label: "One", disabled: true }], name: "x", value: "a", multiple: false });
fromItems.setItems(["b"]);
// @ts-expect-error items are strings, numbers or objects with a value
gridselect(document.body, { items: [true] });
gridselect(document.body, { items: ["a", { label: "G", items: ["b", { value: 2, label: "Two" }] }] });
// @ts-expect-error groups are one level deep
gridselect(document.body, { items: [{ label: "G", items: [{ label: "H", items: [] }] }] });

import "@emmgeede/gridselect/element";
const el = document.createElement("grid-select");
const elValue: string | string[] | null = el.value;
el.items = ["a", { value: "b", label: "B" }];

gridselect(document.body, { match: "fuzzy" });
// @ts-expect-error unknown match mode
gridselect(document.body, { match: "regex" });

gridselect(document.body, { layout: "flow" });
