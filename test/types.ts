// Type check only (npm run test:types), never executed.
import { gridselect } from "gridselect";

const gs = gridselect(document.createElement("fieldset"));
const v: string | string[] | null = gs.value;
gs.value = "EUR";
gs.value = ["a", "b"];
gs.value = null;
gs.destroy();
// @ts-expect-error value is never a number
gs.value = 42;
