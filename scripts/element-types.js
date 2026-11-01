// Adds <grid-select> to the DOM's tag map in the generated declarations, so
// document.createElement("grid-select") and querySelector("grid-select") are typed.
import { appendFileSync } from "node:fs";

appendFileSync("dist/element.d.ts", `
declare global {
  interface HTMLElementTagNameMap {
    "grid-select": GridSelectElement;
  }
}
`);
