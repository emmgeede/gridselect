// <grid-select>: the GridSelect custom element. Importing this module registers it.
// It works in the light DOM: a <fieldset data-gridselect> with native inputs built from its
// <option> children (or the `items` property), so styles, forms and screen readers need nothing extra.
import { gridselect } from "./gridselect.js";

const ATTRIBUTES = ["name", "label", "aria-label", "multiple", "value", "threshold", "layout", "search", "match",
  "shortcuts", "placeholder", "search-placeholder", "required", "disabled", "pinned", "recent", "recent-max", "pinned-text", "recent-text", "max", "search-description", "panel-height", "panel-width", "panel-container", "sheet", "close-text", "min-query-length", "loading-text", "error-text"];

const SOURCE = ["OPTION", "OPTGROUP"];

// Server-side rendering has no HTMLElement; importing must not throw there.
const Base = /** @type {typeof HTMLElement} */ (typeof HTMLElement === "undefined" ? class {} : HTMLElement);

/**
 * Hides an option for everyone and returns how to restore its attributes verbatim.
 * @param {HTMLElement} el
 */
function hide(el) {
  const style = el.getAttribute("style");
  el.hidden = true;
  el.style.setProperty("display", "none", "important");
  return () => {
    el.hidden = false;
    if (style === null) el.removeAttribute("style");
    else el.setAttribute("style", style);
  };
}

/** @param {unknown} v */
const asList = (v) => (Array.isArray(v) ? v.map(String) : v == null ? [] : [String(v)]);

export class GridSelectElement extends Base {
  static get observedAttributes() {
    return ATTRIBUTES;
  }

  // A real form control (form.elements, validity, reset) where ElementInternals can set a value.
  static formAssociated = true;
  /** @type {ElementInternals | null} null: the inner inputs submit, as before */
  #internals = null;
  #formDisabled = false;
  #custom = "";

  constructor() {
    super();
    const i = typeof this.attachInternals === "function" ? this.attachInternals() : null;
    if (typeof i?.setFormValue === "function") this.#internals = i;
  }

  /** Value and validity for the form, after every build and change. */
  #sync() {
    const i = this.#internals;
    if (!i || !this.#gs) return;
    const list = asList(this.#gs.value);
    const name = this.getAttribute("name");
    /** @type {FormData | string | null} */
    let data = null;
    if (name && list.length && this.hasAttribute("multiple")) {
      data = new FormData();
      for (const v of list) data.append(name, v);
    } else if (name && list.length) data = list[0];
    i.setFormValue(data, JSON.stringify(list));
    const anchor = /** @type {HTMLElement | undefined} */ (this.querySelector("[data-gridselect-field]") ?? this.querySelector("input:not(:disabled)") ?? undefined);
    if (this.#custom) i.setValidity({ customError: true }, this.#custom, anchor);
    else if (this.hasAttribute("required") && !list.length) {
      // The browser's own words for an empty required select.
      const probe = this.ownerDocument.createElement("select");
      probe.required = true;
      i.setValidity({ valueMissing: true }, probe.validationMessage || "Please select an item in the list.", anchor);
    } else i.setValidity({});
  }

  #onChange = () => {
    this.#dirty = true;
    for (const el of this.querySelectorAll("[aria-invalid]")) el.removeAttribute("aria-invalid");
    this.#sync();
  };

  /** A blocked submit: mark the field (or the inputs) as invalid, like gridselect() does. */
  #onInvalid = () => {
    const field = this.querySelector("[data-gridselect-field]");
    for (const el of field ? [field] : this.querySelectorAll("input")) el.setAttribute("aria-invalid", "true");
  };

  get form() {
    return this.#internals?.form ?? null;
  }
  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(v) {
    this.setAttribute("name", v);
  }
  /** @returns {ValidityState} */
  get validity() {
    return /** @type {ValidityState} */ (this.#internals?.validity);
  }
  get validationMessage() {
    return this.#internals?.validationMessage ?? "";
  }
  get willValidate() {
    return this.#internals?.willValidate ?? false;
  }
  checkValidity() {
    return this.#internals?.checkValidity() ?? true;
  }
  reportValidity() {
    return this.#internals?.reportValidity() ?? true;
  }
  /** @param {string} message empty to clear */
  setCustomValidity(message) {
    this.#custom = String(message);
    this.#sync();
  }
  formResetCallback() {
    this.#pendingValue = undefined;
    this.#dirty = false;
    this.#rebuild(true);
  }
  /** @param {boolean} disabled */
  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    if (this.#fieldset) this.#fieldset.disabled = disabled || this.hasAttribute("disabled");
  }
  /** @param {string} state the JSON list given to setFormValue */
  formStateRestoreCallback(state) {
    try {
      const list = JSON.parse(state);
      this.value = this.hasAttribute("multiple") ? list : (list[0] ?? null);
    } catch { /* not ours: ignore */ }
  }

  /** @type {import("./gridselect.js").GridSelect | null} */
  #gs = null;
  /** @type {HTMLFieldSetElement | null} */
  #fieldset = null;
  /** @type {(() => void)[]} */
  #undo = [];
  /** @type {import("./gridselect.js").Item[] | null} */
  #items = null;
  /** @type {MutationObserver | null} */
  #observer = null;
  #queued = false;
  /** @type {unknown} Value set before the element is built (frameworks do that); applied on build. */
  #pendingValue = undefined;
  /** Someone picked or code set a value: from then on rebuilds keep the choice, before that the markup decides. */
  #dirty = false;

  connectedCallback() {
    // Frameworks may set properties before the element is defined; take them over now.
    for (const prop of /** @type {const} */ (["items", "value", "load"])) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const v = /** @type {any} */ (this)[prop];
        delete (/** @type {any} */ (this))[prop];
        /** @type {any} */ (this)[prop] = v;
      }
    }
    this.addEventListener("change", this.#onChange);
    this.addEventListener("invalid", this.#onInvalid);
    this.#build();
    this.#observer = new MutationObserver((list) => this.#onMutations(list));
    this.#observer.observe(this, { childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ["value", "label", "disabled", "selected", "data-description"] });
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#observer = null;
    this.removeEventListener("change", this.#onChange);
    this.removeEventListener("invalid", this.#onInvalid);
    this.#teardown();
  }

  /** @param {string} name */
  attributeChangedCallback(name) {
    if (this.#gs) this.#rebuild(name === "value");
  }

  /** The selection, like `gridselect().value`. Setting it fires no event. */
  get value() {
    if (this.#gs) return this.#gs.value;
    return /** @type {string | string[] | null} */ (this.#pendingValue ?? null);
  }

  set value(v) {
    this.#dirty = true;
    if (this.#gs) this.#gs.value = v;
    else this.#pendingValue = v;
    this.#sync();
  }

  /** @type {((query: string, signal: AbortSignal) => Promise<import("./gridselect.js").Item[]>) | null} */
  #load = null;
  /** Entries from a server, as the `load` option: `el.load = (query, signal) => fetch(…)`. */
  get load() {
    return this.#load;
  }

  set load(fn) {
    this.#load = typeof fn === "function" ? fn : null;
    if (this.#gs) this.#rebuild(false);
  }

  /** Entries as in the `items` option; when set they replace the <option> children as source. */
  get items() {
    return this.#items;
  }

  set items(list) {
    this.#items = list;
    if (this.#gs) this.#rebuild(false);
  }

  /** @param {MutationRecord[]} list */
  #onMutations(list) {
    const relevant = list.some((m) => {
      if (this.#fieldset && this.#fieldset.contains(m.target)) return false; // our own DOM work
      if (m.type === "childList")
        return [...m.addedNodes, ...m.removedNodes].some((n) => SOURCE.includes(n.nodeName));
      const node = m.target.nodeType === Node.TEXT_NODE ? m.target.parentElement : m.target;
      return SOURCE.includes(node?.nodeName ?? "");
    });
    if (!relevant || this.#queued) return;
    this.#queued = true;
    queueMicrotask(() => {
      this.#queued = false;
      if (this.#gs) this.#rebuild(false);
    });
  }

  /** @param {string[]} [chosen] values to keep; undefined takes them from attributes and options */
  #build(chosen) {
    const doc = this.ownerDocument;
    const options = /** @type {HTMLOptionElement[]} */ ([...this.querySelectorAll(":scope > option, :scope > optgroup > option")]);
    for (const o of this.querySelectorAll(":scope > option, :scope > optgroup")) this.#undo.push(hide(/** @type {HTMLElement} */ (o)));
    const multiple = this.hasAttribute("multiple");
    const attr = (/** @type {string} */ name) => this.getAttribute(name);

    const fromOptions = !this.#items;
    /** @param {HTMLOptionElement} o */
    const entry = (o) => ({ value: o.value, label: o.label, description: o.dataset.description, disabled: o.matches(":disabled") });
    /** @type {import("./gridselect.js").Item[]} */
    /** @param {Element} el */
    const entries = (el) => /** @type {HTMLOptionElement[]} */ ([...el.querySelectorAll(":scope > option")]).filter((o) => o.value !== "").map(entry);
    const items = this.#items ?? [...this.children].flatMap(/** @returns {import("./gridselect.js").Item[]} */ (c) =>
      c.localName === "optgroup" ? [{ label: /** @type {HTMLOptGroupElement} */ (c).label, items: entries(c) }]
      : c.localName === "option" && /** @type {HTMLOptionElement} */ (c).value !== "" ? [entry(/** @type {HTMLOptionElement} */ (c))] : []);
    const placeholderOption = fromOptions ? options.find((o) => o.value === "" && o.parentElement === this) : undefined;

    let value = chosen;
    if (value === undefined && this.#pendingValue !== undefined) value = asList(this.#pendingValue);
    this.#pendingValue = undefined;
    if (value === undefined) {
      const fromAttr = attr("value");
      value = fromAttr !== null ? (multiple ? fromAttr.split(",").map((s) => s.trim()) : [fromAttr])
        : options.filter((o) => o.value !== "" && o.hasAttribute("selected")).map((o) => o.value);
    }

    const fieldset = doc.createElement("fieldset");
    fieldset.setAttribute("data-gridselect", "");
    const label = attr("label");
    const ariaLabel = attr("aria-label");
    if (label !== null) {
      const legend = doc.createElement("legend");
      legend.textContent = label;
      fieldset.append(legend);
    } else if (ariaLabel !== null) fieldset.setAttribute("aria-label", ariaLabel);
    else console.warn("gridselect: <grid-select> needs a label or aria-label attribute, a group without a name fails WCAG");
    if (this.hasAttribute("disabled") || this.#formDisabled) fieldset.disabled = true;
    this.append(fieldset);
    this.#fieldset = fieldset;

    const shortcuts = attr("shortcuts");
    const threshold = attr("threshold");
    this.#gs = gridselect(fieldset, {
      items: this.#load ? (this.#items ?? []) : items,
      load: this.#load ?? undefined,
      minQueryLength: /^\d+$/.test(attr("min-query-length") ?? "") ? Number(attr("min-query-length")) : undefined,
      loadingText: attr("loading-text") ?? undefined,
      errorText: attr("error-text") ?? undefined,
      multiple,
      // With ElementInternals the element submits; unnamed inner inputs point to no form.
      name: this.#internals ? undefined : (attr("name") ?? undefined),
      value: multiple ? value : value[0],
      threshold: threshold !== null && /^\d+$/.test(threshold) ? Number(threshold) : undefined,
      layout: /** @type {any} */ (attr("layout") ?? undefined),
      search: /** @type {any} */ (attr("search") ?? undefined),
      match: /** @type {any} */ (attr("match") ?? undefined),
      placeholder: attr("placeholder") ?? placeholderOption?.label ?? undefined,
      searchPlaceholder: attr("search-placeholder") ?? undefined,
      shortcuts: shortcuts === null ? undefined : shortcuts === "off" ? false : shortcuts.split(",").map((s) => s.trim()),
      pinned: attr("pinned")?.split(",").map((s) => s.trim()),
      recent: attr("recent") ?? undefined,
      recentMax: /^\d+$/.test(attr("recent-max") ?? "") ? Number(attr("recent-max")) : undefined,
      max: /^\d+$/.test(attr("max") ?? "") ? Number(attr("max")) : undefined,
      searchDescription: this.hasAttribute("search-description") || undefined,
      panelHeight: /** @type {any} */ (attr("panel-height") ?? undefined),
      panelWidth: /** @type {any} */ (attr("panel-width") ?? undefined),
      panelContainer: attr("panel-container") ?? undefined,
      sheet: attr("sheet") === "off" ? false : undefined,
      closeText: attr("close-text") ?? undefined,
      pinnedText: attr("pinned-text") ?? undefined,
      recentText: attr("recent-text") ?? undefined,
    });
    if (this.hasAttribute("required")) for (const i of fieldset.querySelectorAll("input")) i.required = true;
    this.#sync();
  }

  #teardown() {
    this.#gs?.destroy();
    this.#gs = null;
    this.#fieldset?.remove();
    this.#fieldset = null;
    for (const fn of this.#undo) fn();
    this.#undo = [];
  }

  /** Rebuilds with the current choice (or the value attribute) and keeps the focus in place. */
  #rebuild(/** @type {boolean} */ useValueAttribute) {
    const chosen = useValueAttribute || !this.#dirty ? undefined : asList(this.#gs?.value);
    const active = /** @type {HTMLElement | null} */ (this.ownerDocument.activeElement);
    const hadFocus = !!active && !!this.#fieldset?.contains(active);
    const focusedValue = active instanceof HTMLInputElement ? active.value : undefined;
    this.#teardown();
    this.#build(chosen);
    if (!hadFocus || !this.#fieldset) return;
    const field = /** @type {HTMLElement | null} */ (this.#fieldset.querySelector("[data-gridselect-field]"));
    if (field) return field.focus();
    const inputs = /** @type {HTMLInputElement[]} */ ([...this.#fieldset.querySelectorAll("input")]);
    const values = asList(this.#gs?.value);
    (inputs.find((i) => i.value === focusedValue && !i.disabled) ?? inputs.find((i) => values.includes(i.value))
      ?? inputs.find((i) => !i.disabled))?.focus();
  }
}

if (typeof customElements !== "undefined" && !customElements.get("grid-select"))
  customElements.define("grid-select", GridSelectElement);
