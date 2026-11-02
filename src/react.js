// React wrapper around <grid-select>: props become attributes, value/items go to the element's
// properties, and the element's native change event becomes onChange(value). No logic of its own.
// Works with React 18 and 19 (forwardRef, no React 19-only API).
import { createElement, forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import "./element.js";

/**
 * @typedef {import("./gridselect.js").Item} Item
 * @typedef {string | string[] | null} Value
 * @typedef {object} GridSelectProps
 * @property {Value} [value] Controlled value: the element always shows it. Use with onChange.
 * @property {Value} [defaultValue] Initial value of an uncontrolled field.
 * @property {(value: Value) => void} [onChange] Called with the new value after the user picks.
 * @property {Item[]} [items] Entries; replace <option>/<optgroup> children as source.
 * @property {string} [name]
 * @property {string} [label]
 * @property {string} [ariaLabel]
 * @property {boolean} [multiple]
 * @property {number} [threshold]
 * @property {"grid" | "list" | "flow"} [layout]
 * @property {"filter" | "highlight"} [search]
 * @property {"substring" | "fuzzy"} [match]
 * @property {string[] | false} [shortcuts]
 * @property {string} [placeholder]
 * @property {string} [searchPlaceholder]
 * @property {boolean} [required]
 * @property {boolean} [disabled]
 * @property {number} [max]
 * @property {boolean} [searchDescription]
 * @property {"auto" | "fixed"} [panelHeight]
 * @property {"full" | "fixed"} [panelWidth]
 * @property {string[]} [pinned]
 * @property {string} [recent]
 * @property {number} [recentMax]
 * @property {string} [pinnedText]
 * @property {string} [recentText]
 * @property {string} [id]
 * @property {string} [className]
 * @property {import("react").ReactNode} [children]
 */

/** @param {GridSelectProps} p */
const attributes = (p) => ({
  id: p.id, className: p.className, name: p.name, label: p.label, "aria-label": p.ariaLabel,
  threshold: p.threshold === undefined ? undefined : String(p.threshold),
  layout: p.layout, search: p.search, match: p.match, placeholder: p.placeholder, "search-placeholder": p.searchPlaceholder,
  shortcuts: p.shortcuts === false ? "off" : p.shortcuts?.join(","),
  max: p.max === undefined ? undefined : String(p.max), pinned: p.pinned?.join(","), recent: p.recent, "recent-max": p.recentMax === undefined ? undefined : String(p.recentMax),
  "pinned-text": p.pinnedText, "recent-text": p.recentText,
  multiple: p.multiple ? "" : undefined, "search-description": p.searchDescription ? "" : undefined, "panel-height": p.panelHeight, "panel-width": p.panelWidth, required: p.required ? "" : undefined, disabled: p.disabled ? "" : undefined,
});

export const GridSelect = /** @type {import("react").ForwardRefExoticComponent<GridSelectProps & import("react").RefAttributes<import("./element.js").GridSelectElement>>} */ (
  forwardRef(/** @param {GridSelectProps} props */ function GridSelect(props, ref) {
    const el = /** @type {import("react").MutableRefObject<import("./element.js").GridSelectElement | null>} */ (useRef(null));
    const latest = useRef(props);
    latest.current = props;
    useImperativeHandle(ref, () => /** @type {import("./element.js").GridSelectElement} */ (el.current), []);

    // Items first: the default value must find its entries.
    useLayoutEffect(() => {
      if (props.items !== undefined) /** @type {any} */ (el.current).items = props.items;
    }, [props.items]);

    useLayoutEffect(() => {
      const node = /** @type {import("./element.js").GridSelectElement} */ (el.current);
      if (latest.current.value === undefined && latest.current.defaultValue !== undefined) node.value = latest.current.defaultValue;
      const onChange = () => {
        const p = latest.current;
        p.onChange?.(node.value);
        // Controlled: show `value` until the parent renders a new one.
        if (p.value !== undefined) node.value = p.value;
      };
      node.addEventListener("change", onChange);
      return () => node.removeEventListener("change", onChange);
    }, []);

    // Every render, so a controlled field always shows `value`.
    useLayoutEffect(() => {
      if (props.value !== undefined) /** @type {any} */ (el.current).value = props.value;
    });

    return createElement("grid-select", { ...attributes(props), ref: el }, props.children);
  })
);
