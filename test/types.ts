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
