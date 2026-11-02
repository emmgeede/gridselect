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

// F13: wrappers
import { createElement } from "react";
import { GridSelect as ReactGridSelect } from "@emmgeede/gridselect/react";
import { GridSelect as VueGridSelect } from "@emmgeede/gridselect/vue";
createElement(ReactGridSelect, { value: "a", onChange: (v) => console.log(v), items: ["a", { label: "G", items: ["b"] }], layout: "flow", shortcuts: false });
// @ts-expect-error unknown layout
createElement(ReactGridSelect, { layout: "table" });
type VueProps = InstanceType<typeof VueGridSelect>["$props"];
const vueOk: VueProps = { modelValue: ["a"], items: ["a"], layout: "list", searchPlaceholder: "x" };
// @ts-expect-error unknown layout
const vueBad: VueProps = { layout: "table" };

// F16: pinned and recent
gridselect(document.body, { pinned: ["a"], recent: "k", recentMax: 3, pinnedText: "P", recentText: "R" });
// @ts-expect-error recentMax is a number
gridselect(document.body, { recentMax: "3" });
createElement(ReactGridSelect, { pinned: ["a"], recent: "k", recentMax: 3, pinnedText: "P", recentText: "R" });
const vuePinned: VueProps = { pinned: ["a"], recent: "k", recentMax: 3 };

// F17: max
gridselect(document.body, { max: 3, maxText: (n) => `max ${n}` });
// @ts-expect-error max is a number
gridselect(document.body, { max: "3" });
createElement(ReactGridSelect, { multiple: true, max: 2 });
const vueMax: VueProps = { multiple: true, max: 2 };

// F18: descriptions
gridselect(document.body, { items: [{ value: "a", description: "d" }], searchDescription: true });
// @ts-expect-error description is a string
gridselect(document.body, { items: [{ value: "a", description: 1 }] });
createElement(ReactGridSelect, { searchDescription: true });
const vueDesc: VueProps = { searchDescription: true };

// F22: panel height
gridselect(document.body, { panelHeight: "fixed" });
// @ts-expect-error unknown panel height
gridselect(document.body, { panelHeight: "tall" });
createElement(ReactGridSelect, { panelHeight: "auto" });
const vuePanel: VueProps = { panelHeight: "fixed" };

// F23: panel width
gridselect(document.body, { panelWidth: "fixed" });
// @ts-expect-error unknown panel width
gridselect(document.body, { panelWidth: "wide" });
createElement(ReactGridSelect, { panelWidth: "full" });
const vueWidth: VueProps = { panelWidth: "fixed" };

// F19: form control
const gsEl = document.createElement("grid-select");
const ok: boolean = gsEl.checkValidity() && gsEl.reportValidity() && gsEl.validity.valueMissing && gsEl.willValidate;
const owner: HTMLFormElement | null = gsEl.form;
gsEl.setCustomValidity("");
const msg: string = gsEl.validationMessage + gsEl.name;
