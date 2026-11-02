/**
 * @typedef {object} GridSelect
 * @property {string | string[] | null} value
 *   Radio group: the checked value, or null. Checkbox group: all checked values in DOM order.
 *   Setting it changes `checked` without firing events, like setting a native input.
 * @property {() => void} destroy Forgets the instance and removes everything GridSelect added.
 * @property {(items: Item[]) => void} setItems Replaces the entries of an instance created with
 *   `items`; chosen values that still exist stay chosen, no event fires. Throws for other sources.
 */

/**
 * @typedef {string | number | { value: string | number, label?: string, description?: string, disabled?: boolean }} Entry
 * @typedef {{ label: string, items: Entry[] }} Group A heading in the panel above its entries.
 * @typedef {Entry | Group} Item
 */

/** @typedef {{ label: string }} GroupInfo */
/** Group of a generated input, set by the select and items sources, read by the panel. @type {WeakMap<HTMLInputElement, GroupInfo>} */
const groupOf = new WeakMap();

/**
 * @typedef {object} Options
 * @property {number} [threshold] Radio groups with more inputs than this get the grid panel. Default 10.
 * @property {string} [placeholder] Field text while nothing is selected. Default "Select…".
 * @property {string} [searchPlaceholder] Placeholder of the search input. Default "Search…".
 * @property {"grid" | "list" | "flow"} [layout] "grid" (default) aligns items in columns as wide as the
 *   widest item, "list" stacks them in one column for long labels, "flow" lets them run like chips.
 * @property {string} [noResultsText] Hint and announcement when nothing matches. Default "No matches".
 * @property {string[] | false} [shortcuts] Modifier tiers for digit keys, each tier covers ten
 *   items, e.g. ["", "Shift", "Alt"] (default). Names: Shift, Alt, Control, Meta, joined with "+".
 *   false turns digit shortcuts off.
 * @property {(count: number) => string} [selectedText] Field text for more than two chosen
 *   entries of a multiple choice group. Default `n => n + " selected"`.
 * @property {(count: number) => string} [resultsText] Screen reader announcement for `count` > 0
 *   matches. Default `n => n === 1 ? "1 result" : n + " results"`.
 * @property {"filter" | "highlight"} [search] "filter" hides non-matches, "highlight" keeps every
 *   item in place and marks matches (data-match) and non-matches (data-dimmed). Default "filter".
 * @property {"substring" | "fuzzy"} [match] How the query matches labels: "substring" (default) or
 *   "fuzzy" (letters in order with gaps, words in any order, better matches first in filter mode).
 * @property {Item[]} [items] Entries for an empty wrapper: GridSelect builds native radios (or
 *   checkboxes with `multiple`) from them. Strings and numbers are value and label at once.
 * @property {string} [name] Form name of the inputs built from `items`. Without it they are not submitted.
 * @property {string | number | (string | number)[]} [value] Initial choice for `items`.
 * @property {boolean} [multiple] Build checkboxes instead of radios from `items`.
 * @property {string[]} [pinned] Values shown again on top of the panel, under `pinnedText`.
 * @property {string} [recent] Storage key: the last picked entries are kept in localStorage and
 *   shown on top of the panel, under `recentText`. Off by default.
 * @property {number} [recentMax] How many recent entries to keep and show. Default 5, 0 turns it off.
 * @property {string} [pinnedText] Heading of the pinned entries. Default "Pinned".
 * @property {string} [recentText] Heading of the recent entries. Default "Recent".
 * @property {number} [max] Multiple choice: at most this many entries. 0 or unset for no limit.
 * @property {"auto" | "fixed"} [panelHeight] "auto" (default) opens the panel towards the room it
 *   needs and lets it grow up to the window edge; "fixed" always opens below, the list as high as
 *   --gs-list-max-height.
 * @property {boolean} [searchDescription] Search the entries' descriptions too (label matches first).
 * @property {(max: number) => string} [maxText] Announcement when the limit is reached or hit.
 *   Default `n => "Maximum of " + n + " reached"`.
 */

const DEFAULT_THRESHOLD = 10;
const DEFAULT_SHORTCUTS = ["", "Shift", "Alt"];
/** Canonical order for aria-keyshortcuts and for comparing tiers. */
const MODIFIERS = ["Control", "Alt", "Meta", "Shift"];

/**
 * @typedef {object} Tier
 * @property {string} name The tier as the developer wrote it, e.g. "Shift+Control".
 * @property {string} combo Canonical modifiers, e.g. "Control+Shift" ("" for none).
 * @property {string} prefix Readable letters for the badge, e.g. "CS" ("" for none).
 */

/**
 * @param {unknown} option `shortcuts` option
 * @param {string | null} attr `data-shortcuts` attribute
 * @returns {Tier[]}
 */
function parseTiers(option, attr) {
  if (option === false || (option === undefined && attr === "off")) return [];
  const list = Array.isArray(option) ? option : DEFAULT_SHORTCUTS;
  return list.map((name) => {
    const parts = String(name).split("+").map((p) => p.trim()).filter(Boolean);
    const unknown = parts.find((p) => !MODIFIERS.includes(p));
    if (unknown !== undefined)
      throw new TypeError(`gridselect: unknown modifier "${unknown}" in shortcuts, use ${MODIFIERS.join(", ")}`);
    const used = MODIFIERS.filter((m) => parts.includes(m));
    return { name: parts.join("+"), combo: used.join("+"), prefix: used.map((m) => m[0]).join("") };
  });
}

/**
 * Shortcut of the item at display position `pos`, or null beyond the last tier.
 * Digits 1..9, 0 cover ten items per tier.
 * @param {Tier[]} tiers
 * @param {number} pos
 */
function shortcutAt(tiers, pos) {
  const tier = tiers[Math.floor(pos / 10)];
  if (!tier) return null;
  const digit = String(((pos % 10) + 1) % 10);
  return { digit, tier, aria: tier.combo ? `${tier.combo}+${digit}` : digit };
}

/**
 * Display position a key press selects, or -1. Uses event.code, so Shift+1 is not "!".
 * @param {Tier[]} tiers
 * @param {KeyboardEvent} e
 */
function positionOf(tiers, e) {
  const m = /^(Digit|Numpad)(\d)$/.exec(e.code);
  // With NumLock off the number pad sends arrows and Home/End: those stay navigation keys.
  if (!m || (m[1] === "Numpad" && !/^\d$/.test(e.key))) return -1;
  const pressed = { Control: e.ctrlKey, Alt: e.altKey, Meta: e.metaKey, Shift: e.shiftKey };
  const combo = MODIFIERS.filter((k) => pressed[/** @type {keyof typeof pressed} */ (k)]).join("+");
  const tier = tiers.findIndex((t) => t.combo === combo);
  if (tier < 0) return -1;
  const d = Number(m[2]);
  return tier * 10 + (d === 0 ? 9 : d - 1);
}

/** @param {unknown} n */
const isCount = (n) => Number.isInteger(n) && /** @type {number} */ (n) >= 0;

/** Limit of a multiple choice group (`max`, `data-max`), 0 for none. @param {Options} opts @param {Element} wrapper */
function maxOf(opts, wrapper) {
  if (isCount(opts.max)) return /** @type {number} */ (opts.max);
  const a = wrapper.getAttribute("data-max");
  return a !== null && /^\d+$/.test(a) ? Number(a) : 0;
}
/** @param {Options} opts @param {number} n */
const maxMessage = (opts, n) => (typeof opts.maxText === "function" ? String(opts.maxText(n)) : `Maximum of ${n} reached`);
/** Says `text` in a live region, again even when it equals the last announcement. @param {Element} region @param {string} text */
const announce = (region, text) => (region.textContent = region.textContent === text ? text + "\u00a0" : text);
/** Locks (or unlocks) an entry at the limit: aria-disabled on `target`, data-limit on `mark`. */
function setLimit(/** @type {Element} */ target, /** @type {Element | null | undefined} */ mark, /** @type {boolean} */ on, /** @type {boolean} */ disabled = false) {
  if (on || disabled) target.setAttribute("aria-disabled", "true");
  else target.removeAttribute("aria-disabled");
  mark?.toggleAttribute("data-limit", on && !disabled);
}

/** @type {WeakMap<Element, GridSelect>} */
const instances = new WeakMap();

/** Input values are always strings: numbers match their string form, anything else matches nothing. @param {unknown} x */
const key = (x) => (typeof x === "string" || typeof x === "number" ? String(x) : undefined);

/**
 * @param {Element} wrapper
 * @param {GridSelect} instance
 */
function register(wrapper, instance) {
  instances.set(wrapper, instance);
  return instance;
}

/**
 * Turns a wrapper around a native radio or checkbox group into a GridSelect instance.
 * Calling it again on the same wrapper returns the existing instance.
 *
 * @param {Element} wrapper
 * @param {Options} [options]
 * @returns {GridSelect}
 */
export function gridselect(wrapper, options) {
  // nodeType instead of instanceof: works for elements from other frames too.
  // Object.prototype.toString never throws, unlike String() on prototype-less objects.
  if (wrapper?.nodeType !== 1 || typeof wrapper.querySelectorAll !== "function")
    throw new TypeError("gridselect: expected a DOM element, got " + Object.prototype.toString.call(wrapper));
  const existing = instances.get(wrapper);
  if (existing) return existing;
  if (options !== null && typeof options === "object" && Array.isArray(options.items))
    return register(wrapper, fromItems(wrapper, options));
  return register(wrapper, build(wrapper, options));
}

/**
 * Sets up one instance on the native inputs (or select) already in the wrapper.
 * @param {Element} wrapper
 * @param {Options} [options]
 * @returns {GridSelect}
 */
function build(wrapper, options) {
  // A <select> is turned into generated radios, which then run through the radio pipeline.
  const selects = wrapper.querySelectorAll("select");
  /** @type {ReturnType<typeof fromSelect> | null} */
  let source = null;
  if (selects.length) {
    if (selects.length > 1 || wrapper.querySelector("input[type=radio], input[type=checkbox]"))
      throw new TypeError("gridselect: wrapper holds a select plus other inputs, use one source");
    source = fromSelect(wrapper, selects[0]);
  }

  /** @param {string} type */
  const find = (type) => /** @type {NodeListOf<HTMLInputElement>} */ (wrapper.querySelectorAll(`input[type=${type}]`));
  const radios = find("radio");
  const multiple = find("checkbox").length > 0;
  if (multiple && radios.length) throw new TypeError("gridselect: wrapper mixes radio and checkbox inputs, use one type");
  const names = [...new Set([...radios].map((r) => r.name))];
  if (names.length > 1) throw new TypeError("gridselect: radios have different names: " + names.join(", "));

  // Read live on every access, so reset, clicks and outside changes are always reflected.
  const inputs = () => [...find(multiple ? "checkbox" : "radio")];
  const checked = () => inputs().filter((i) => i.checked).map((i) => i.value);

  // Non-objects (e.g. the index from forEach(gridselect)) and invalid values fall back to defaults.
  const opts = options !== null && typeof options === "object" ? options : {};
  const attr = wrapper.getAttribute("data-threshold");
  const fromAttr = attr !== null && /^\d+$/.test(attr) ? Number(attr) : undefined;
  const threshold = isCount(opts.threshold) ? opts.threshold : (fromAttr ?? DEFAULT_THRESHOLD);
  const tiers = parseTiers(opts.shortcuts, wrapper.getAttribute("data-shortcuts"));
  const panelOpts = source?.placeholder !== undefined && opts.placeholder === undefined ? { ...opts, placeholder: source.placeholder } : opts;
  const all = inputs();
  const ui = all.length > /** @type {number} */ (threshold)
    ? createPanel(wrapper, all, panelOpts, tiers, source?.label, () => source?.pull(), multiple) : null;
  const flatUndo = ui || !tiers.length ? [] : addKeyElements(inputs(), tiers);
  for (const i of inputs()) describe(i, i.labels?.[0]?.querySelector("[data-gridselect-description]"), flatUndo);
  // Limit below the threshold: lock the unchecked boxes, block ticking more, announce.
  const max = multiple && !ui ? maxOf(opts, wrapper) : 0;
  const flatStatus = max ? statusRegion(wrapper.ownerDocument) : null;
  const full = () => !!max && checked().length >= max;
  const flatSync = () => {
    if (!max) return;
    for (const i of inputs()) setLimit(i, i.labels?.[0], !i.checked && full());
  };
  if (flatStatus) {
    wrapper.append(flatStatus);
    /** @param {Event} e */
    const onClick = (e) => {
      const t = /** @type {HTMLInputElement} */ (e.target);
      if (!inputs().includes(t) || !t.checked) return;
      if (checked().length > max) {
        e.preventDefault(); // undoes the tick, no input or change event
        announce(flatStatus, maxMessage(opts, max));
      } else if (checked().length === max) announce(flatStatus, maxMessage(opts, max));
    };
    const onReset = () => setTimeout(flatSync, 0);
    const form = inputs()[0]?.form;
    wrapper.addEventListener("click", onClick);
    wrapper.addEventListener("change", flatSync);
    form?.addEventListener("reset", onReset);
    flatUndo.push(() => {
      wrapper.removeEventListener("click", onClick);
      wrapper.removeEventListener("change", flatSync);
      form?.removeEventListener("reset", onReset);
      flatStatus.remove();
      for (const i of inputs()) setLimit(i, i.labels?.[0], false);
    });
    flatSync();
  }
  if (!ui && tiers.length) {
    /** Digit keys while the focus is on one of the group's inputs. @param {KeyboardEvent} e */
    const onKey = (e) => {
      const list = inputs();
      if (e.isComposing || !list.includes(/** @type {HTMLInputElement} */ (e.target))) return;
      const pos = positionOf(tiers, e);
      if (pos < 0) return;
      e.preventDefault();
      const input = list[pos];
      if (!input || input.matches(":disabled")) return;
      if (multiple && !input.checked && full()) return void announce(/** @type {Element} */ (flatStatus), maxMessage(opts, max));
      if (multiple) input.checked = !input.checked;
      else if (input.checked) return void input.focus();
      else {
        input.checked = true;
        input.focus();
      }
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    wrapper.addEventListener("keydown", /** @type {EventListener} */ (onKey));
    flatUndo.push(() => wrapper.removeEventListener("keydown", /** @type {EventListener} */ (onKey)));
  }

  if (source) source.connect(inputs(), ui, flatUndo);

  const values = inputs().map((i) => i.value);
  const dupes = [...new Set(values.filter((v, n) => values.indexOf(v) !== n))];
  if (dupes.length) console.warn("gridselect: duplicate values:", dupes.join(", "));

  /** @type {GridSelect} */
  const instance = {
    get value() {
      if (source) return source.value();
      return multiple ? checked() : (checked()[0] ?? null);
    },
    set value(v) {
      if (source) {
        source.set(v);
        flatSync();
        return;
      }
      if (multiple) {
        if (!Array.isArray(v)) throw new TypeError("gridselect: value of a checkbox group must be an array");
        const wanted = v.map(key);
        for (const i of inputs()) i.checked = wanted.includes(i.value);
        ui?.render();
        flatSync();
        return;
      }
      const match = inputs().find((i) => i.value === key(v));
      for (const i of inputs()) i.checked = i === match;
      ui?.render();
    },
    setItems() {
      throw new TypeError("gridselect: setItems() needs an instance created with the items option");
    },
    destroy() {
      ui?.destroy();
      for (const fn of flatUndo) fn();
      for (const fn of source?.undo ?? []) fn();
      instances.delete(wrapper);
    },
  };
  return instance;
}

/**
 * Validates `items` into value/label/disabled records; names the position of a bad entry.
 * @param {unknown} items
 */
function normalizeItems(items) {
  if (!Array.isArray(items)) throw new TypeError("gridselect: items must be an array");
  /** @type {{ value: string, label: string, description?: string, disabled: boolean, group?: GroupInfo }[]} */
  const out = [];
  /**
   * @param {unknown} it
   * @param {string} at position for the error message
   * @param {GroupInfo} [group]
   */
  const add = (it, at, group) => {
    if (typeof it === "string" || typeof it === "number") return out.push({ value: String(it), label: String(it), disabled: false, group });
    const rec = /** @type {{ value?: unknown, label?: unknown, description?: unknown, disabled?: unknown, items?: unknown }} */ (it ?? {});
    const v = rec.value;
    if (typeof it === "object" && v === undefined && "items" in rec && !group) {
      if (typeof rec.label !== "string" || !Array.isArray(rec.items))
        throw new TypeError(`gridselect: group at ${at} needs a string label and an items array`);
      const g = { label: rec.label };
      return rec.items.forEach((x, j) => add(x, `${at}.items[${j}]`, g));
    }
    if (typeof v !== "string" && typeof v !== "number")
      throw new TypeError(`gridselect: item at ${at} needs a string or number value`);
    out.push({ value: String(v), label: rec.label === undefined ? String(v) : String(rec.label),
      description: typeof rec.description === "string" ? rec.description : undefined, disabled: rec.disabled === true, group });
  };
  items.forEach((it, i) => add(it, `items[${i}]`));
  return out;
}

/**
 * An instance whose entries come from a JS array: builds native inputs, then delegates to build().
 * setItems() rebuilds inside the same instance object.
 * @param {Element} wrapper
 * @param {Options} opts
 * @returns {GridSelect}
 */
function fromItems(wrapper, opts) {
  if (wrapper.querySelector("input[type=radio], input[type=checkbox], select"))
    throw new TypeError("gridselect: the items option needs a wrapper without inputs or a select");
  const doc = wrapper.ownerDocument;
  const multiple = opts.multiple === true;
  const named = typeof opts.name === "string" && opts.name !== "";
  // Without a name the radios still need a common one to form a group, but must not be submitted.
  const name = named ? /** @type {string} */ (opts.name) : uniqueId(doc);
  const noForm = named ? null : uniqueId(doc);
  const rest = { ...opts, items: undefined };
  /** @type {HTMLLabelElement[]} */
  let labels = [];
  /** @type {GridSelect} */
  let inner;

  /**
   * @param {ReturnType<typeof normalizeItems>} list
   * @param {string[]} chosen
   */
  function render(list, chosen) {
    labels = list.map((it) => {
      const label = doc.createElement("label");
      label.setAttribute("data-gridselect-generated", "");
      const input = doc.createElement("input");
      input.type = multiple ? "checkbox" : "radio";
      input.name = name;
      input.value = it.value;
      input.disabled = it.disabled;
      input.checked = chosen.includes(it.value);
      if (noForm) input.setAttribute("form", noForm);
      if (it.group) groupOf.set(input, it.group);
      label.append(input, " ", it.label);
      addDescription(label, it.description);
      wrapper.append(label);
      return label;
    });
    inner = build(wrapper, rest);
  }

  let destroyed = false;

  /**
   * After a rebuild: the field if there is one, else the input with the same value, the checked
   * one, or the first enabled one.
   * @param {string} [value]
   */
  function focusAgain(value) {
    const fieldEl = /** @type {HTMLElement | null} */ (wrapper.querySelector("[data-gridselect-field]"));
    if (fieldEl) return fieldEl.focus();
    const list = labels.map((l) => /** @type {HTMLInputElement} */ (l.querySelector("input")));
    (list.find((i) => i.value === value && !i.disabled) ?? list.find((i) => i.checked) ?? list.find((i) => !i.disabled))?.focus();
  }

  /** @param {unknown} v */
  const asList = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]).map(key).filter((k) => k !== undefined);
  render(normalizeItems(opts.items), asList(opts.value));

  /** @type {GridSelect} */
  const outer = {
    get value() {
      return inner.value;
    },
    set value(v) {
      inner.value = v;
    },
    setItems(items) {
      if (destroyed) throw new TypeError("gridselect: setItems() after destroy()");
      const list = normalizeItems(items); // throws before anything changes
      const chosen = asList(inner.value);
      // Rebuilding removes the focused element; keep keyboard and screen reader users in place.
      const active = /** @type {HTMLElement | null} */ (doc.activeElement);
      const hadFocus = !!active && wrapper.contains(active);
      const focusedValue = active instanceof HTMLInputElement ? active.value : undefined;
      inner.destroy();
      for (const l of labels) l.remove();
      render(list, chosen);
      instances.set(wrapper, outer);
      if (hadFocus) focusAgain(focusedValue);
    },
    destroy() {
      destroyed = true;
      inner.destroy();
      for (const l of labels) l.remove();
      instances.delete(wrapper);
    },
  };
  return outer;
}

/**
 * Hides an element of the page so its CSS cannot bring it back, and records how to undo it.
 * @param {HTMLElement} el
 * @param {(() => void)[]} undo
 */
function hideHard(el, undo) {
  if (el.hidden) return;
  const style = el.getAttribute("style");
  el.hidden = true;
  el.style.setProperty("display", "none", "important");
  undo.push(() => {
    el.hidden = false;
    // Restore the attribute verbatim, the browser would otherwise reformat it.
    if (style === null) el.removeAttribute("style");
    else el.setAttribute("style", style);
  });
}

/**
 * Builds one generated radio (checkbox for `multiple`) per selectable option and hides the
 * select. The inputs carry a form attribute pointing nowhere, so only the select is submitted.
 * connect() keeps both in sync.
 * @param {Element} wrapper
 * @param {HTMLSelectElement} select
 */
function fromSelect(wrapper, select) {
  const doc = wrapper.ownerDocument;
  /** @type {(() => void)[]} */
  const undo = [];
  const options = [...select.options];
  const placeholderOption = options.find((o) => o.value === "");
  const name = uniqueId(doc);
  const noForm = uniqueId(doc);
  /** @type {Map<Element, GroupInfo>} */
  const groups = new Map();
  for (const o of options) {
    if (o.value === "") continue;
    const label = doc.createElement("label");
    label.setAttribute("data-gridselect-generated", "");
    const input = doc.createElement("input");
    input.type = select.multiple ? "checkbox" : "radio";
    input.name = name;
    input.value = o.value;
    input.setAttribute("form", noForm);
    input.disabled = select.disabled || o.matches(":disabled");
    input.checked = o.selected;
    const og = o.parentElement;
    if (og?.localName === "optgroup") {
      if (!groups.has(og)) groups.set(og, { label: /** @type {HTMLOptGroupElement} */ (og).label });
      groupOf.set(input, /** @type {GroupInfo} */ (groups.get(og)));
    }
    label.append(input, " ", o.label);
    addDescription(label, o.dataset.description);
    wrapper.append(label);
    undo.push(() => label.remove());
  }
  const label = select.labels?.[0];
  for (const el of [select, ...(select.labels ?? [])]) hideHard(el, undo);

  /** @type {HTMLInputElement[]} */
  let radios = [];
  /** @type {{ render(): void, invalid(): void } | null} */
  let ui = null;

  /** @param {string} value */
  const optionOf = (value) => options.find((o) => o.value === value);
  // Inputs follow the select, e.g. after outside code changed it or a form reset.
  function pull() {
    for (const r of radios) r.checked = select.multiple ? !!optionOf(r.value)?.selected : r.value === select.value;
  }
  function sync() {
    pull();
    ui?.render();
  }

  return {
    select,
    pull,
    placeholder: placeholderOption?.label,
    label,
    undo,
    value() {
      if (select.multiple) return [...select.selectedOptions].map((o) => o.value).filter(Boolean);
      return select.value || null;
    },
    /** @param {unknown} v */
    set(v) {
      if (select.multiple) {
        if (!Array.isArray(v)) throw new TypeError("gridselect: value of a multiple select must be an array");
        const wanted = v.map(key);
        for (const o of options) o.selected = o.value !== "" && wanted.includes(o.value);
        sync();
        return;
      }
      const k = key(v);
      if (k && options.some((o) => o.value === k)) select.value = k;
      else if (placeholderOption) select.value = "";
      else select.selectedIndex = -1;
      sync();
    },
    /**
     * @param {HTMLInputElement[]} list the generated radios
     * @param {{ render(): void, invalid(): void } | null} panel
     * @param {(() => void)[]} more undo list of the instance
     */
    connect(list, panel, more) {
      radios = list;
      ui = panel;
      /** @param {Event} e */
      const stop = (e) => e.stopPropagation();
      /** @param {Event} e */
      const onRadioChange = (e) => {
        e.stopPropagation();
        for (const r of radios) r.removeAttribute("aria-invalid");
        const input = /** @type {HTMLInputElement} */ (e.target);
        if (select.multiple) {
          const option = optionOf(input.value);
          if (option) option.selected = input.checked;
          // A placeholder means "nothing chosen": it must not be submitted next to real values.
          for (const o of options) if (o.value === "") o.selected = false;
        } else select.value = input.value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
      };
      /** @param {Event} e */
      const onInvalid = (e) => {
        e.preventDefault(); // the select is hidden, the browser could not point at it
        if (ui) return ui.invalid();
        for (const r of radios) r.setAttribute("aria-invalid", "true");
        radios.find((r) => !r.disabled)?.focus();
      };
      const onReset = () => setTimeout(sync, 0);
      for (const r of radios) {
        r.addEventListener("input", stop);
        r.addEventListener("change", onRadioChange);
      }
      select.addEventListener("change", sync);
      select.addEventListener("invalid", onInvalid);
      select.form?.addEventListener("reset", onReset);
      more.push(() => {
        for (const r of radios) {
          r.removeEventListener("input", stop);
          r.removeEventListener("change", onRadioChange);
        }
        select.removeEventListener("change", sync);
        select.removeEventListener("invalid", onInvalid);
        select.form?.removeEventListener("reset", onReset);
      });
    },
  };
}

let lastId = 0;
/** @param {Document} doc */
function uniqueId(doc) {
  let id;
  do id = `gridselect-${++lastId}`;
  while (doc.getElementById(id));
  return id;
}

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {Document} doc
 * @param {K} tag
 * @param {string} part BEM element name, also used for the data-gridselect-* hook
 * @returns {HTMLElementTagNameMap[K]}
 */
function create(doc, tag, part) {
  const el = doc.createElement(tag);
  el.className = `gridselect__${part}`;
  el.setAttribute(`data-gridselect-${part}`, "");
  return el;
}

/** Label text without digit and description elements, else the value. @param {HTMLInputElement} radio */
function labelText(radio) {
  const label = radio.labels?.[0];
  if (!label) return radio.value;
  const copy = /** @type {Element} */ (label.cloneNode(true));
  for (const key of copy.querySelectorAll("[data-gridselect-key], [data-gridselect-description]")) key.remove();
  return (copy.textContent ?? "").trim() || radio.value;
}

/** Second line of an entry, "" for none. @param {HTMLInputElement} radio */
const descText = (radio) => radio.labels?.[0]?.querySelector("[data-gridselect-description]")?.textContent?.trim() ?? "";

/** Appends a description element to a generated label. @param {Element} label @param {string} [text] */
function addDescription(label, text) {
  if (!text) return;
  const d = create(label.ownerDocument, "span", "description");
  d.textContent = text;
  label.append(d);
}

/**
 * Makes `el` described by a description element (`d`), kept out of el's name: hidden content
 * does not count for the name, a direct aria-describedby reference still reads it.
 * @param {Element} el @param {Element | null | undefined} d @param {(() => void)[]} [undo]
 */
function describe(el, d, undo) {
  if (!d?.textContent?.trim()) return el.removeAttribute("aria-describedby");
  const doc = el.ownerDocument;
  const hadId = d.id;
  if (!d.id) d.id = uniqueId(doc);
  d.setAttribute("aria-hidden", "true");
  el.setAttribute("aria-describedby", d.id);
  undo?.push(() => {
    el.removeAttribute("aria-describedby");
    d.removeAttribute("aria-hidden");
    if (!hadId) d.removeAttribute("id");
  });
}

/**
 * Modifier letters for the badge (C, A, M, S), readable where symbols like ⇧ are not.
 * @param {Element} key
 * @param {string} prefix
 */
function setPrefix(key, prefix) {
  if (prefix) key.setAttribute("data-prefix", prefix);
  else key.removeAttribute("data-prefix");
}

/**
 * Below the threshold: digit element in each label plus aria-keyshortcuts on each input.
 * An existing [data-gridselect-key] in a label is used instead (filled only when empty).
 * @param {HTMLInputElement[]} inputs
 * @param {Tier[]} tiers
 * @returns {(() => void)[]} undo steps
 */
function addKeyElements(inputs, tiers) {
  /** @type {(() => void)[]} */
  const undo = [];
  inputs.forEach((input, pos) => {
    const sc = shortcutAt(tiers, pos);
    if (!sc) return;
    input.setAttribute("aria-keyshortcuts", sc.aria);
    undo.push(() => input.removeAttribute("aria-keyshortcuts"));
    const label = input.labels?.[0];
    if (!label) return;
    let key = label.querySelector("[data-gridselect-key]");
    if (key) {
      if (!key.textContent) {
        key.textContent = sc.digit;
        const own = key;
        undo.push(() => (own.textContent = ""));
      }
    } else {
      key = create(input.ownerDocument, "span", "key");
      key.setAttribute("aria-hidden", "true");
      key.textContent = sc.digit;
      label.prepend(key);
      const added = key;
      undo.push(() => added.remove());
    }
    key.setAttribute("data-modifiers", sc.tier.name);
    setPrefix(key, sc.tier.prefix);
    const el = key;
    undo.push(() => {
      el.removeAttribute("data-modifiers");
      el.removeAttribute("data-prefix");
    });
  });
  return undo;
}

/** Visually hidden live region, by inline style, so it works without our stylesheet. @param {Document} doc */
function statusRegion(doc) {
  const status = create(doc, "div", "status");
  status.setAttribute("role", "status");
  status.style.cssText =
    "position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
  return status;
}

/**
 * Hides or shows one of our own elements. The `hidden` attribute alone loses against any page
 * CSS that sets `display`, so an inline display: none backs it up.
 * @param {HTMLElement} el
 * @param {boolean} hide
 */
function setHidden(el, hide) {
  el.hidden = hide;
  el.style.display = hide ? "none" : "";
}

/**
 * Fuzzy score (higher is better) or -1: every word of the query must occur as a subsequence of
 * the text. Matches at word starts and runs of consecutive letters score higher.
 * @param {string} text folded label
 * @param {string} query folded query
 */
function fuzzyScore(text, query) {
  let total = 0;
  for (const word of query.split(/\s+/)) {
    let pos = -1;
    let run = 0;
    for (const ch of word) {
      const at = text.indexOf(ch, pos + 1);
      if (at < 0) return -1;
      run = at === pos + 1 ? run + 1 : 0;
      total += 1 + run * 2 + (at === 0 || !/[\p{L}\p{N}]/u.test(text[at - 1]) ? 3 : 0);
      pos = at;
    }
  }
  return total;
}

/** Lowercase without accents, so "zur" finds "Zürich". @param {string} text */
const fold = (text) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * Builds the closed field and the hidden panel next to the (then hidden) native radios.
 *
 * @param {Element} wrapper
 * @param {HTMLInputElement[]} radios
 * @param {Options} opts
 * @param {Tier[]} tiers digit shortcut tiers, empty when off
 * @param {HTMLElement} [fallbackLabel] names the field when the wrapper has no name (e.g. a select's label)
 * @param {() => void} [beforeOpen] lets a source update the radios first (select changed without event)
 * @param {boolean} [multiple] checkboxes: picking toggles and the panel stays open
 */
function createPanel(wrapper, radios, opts, tiers, fallbackLabel, beforeOpen, multiple = false) {
  const doc = wrapper.ownerDocument;
  const placeholder = typeof opts.placeholder === "string" ? opts.placeholder : "Select…";

  // Everything we change on existing elements is recorded here, so destroy() undoes only that.
  /** @type {(() => void)[]} */
  const undo = [];
  for (const el of radios.flatMap((r) => [r, ...(r.labels ?? [])])) hideHard(el, undo);

  const field = create(doc, "button", "field");
  field.type = "button";
  field.id = uniqueId(doc);
  field.setAttribute("aria-haspopup", "listbox");
  field.setAttribute("aria-expanded", "false");

  const panel = create(doc, "div", "panel");
  setHidden(panel, true);

  const search = create(doc, "input", "search");
  search.type = "text";
  search.setAttribute("role", "combobox");
  search.setAttribute("aria-autocomplete", "list");
  search.setAttribute("aria-expanded", "false");
  search.placeholder = typeof opts.searchPlaceholder === "string" ? opts.searchPlaceholder : "Search…";

  // The scroller is the listbox: it scrolls (the list inside grows freely, so CSS can give every
  // grid row the height of the tallest one without clipping), and as a widget the scrolling
  // region is reached through the combobox. The list inside only lays out the items.
  const scroller = create(doc, "div", "scroller");
  scroller.id = uniqueId(doc);
  scroller.setAttribute("role", "listbox");
  if (multiple) scroller.setAttribute("aria-multiselectable", "true");
  const list = create(doc, "div", "items");
  list.setAttribute("role", "presentation");
  scroller.append(list);
  const layout = opts.layout ?? wrapper.getAttribute("data-layout");
  const isList = layout === "list";
  const isFlow = layout === "flow";
  if (isList || isFlow) list.classList.add(`gridselect__items--${layout}`);
  search.setAttribute("aria-controls", scroller.id);

  /** Item index → radio index; items after the list's own are copies on top of the panel. */
  const radioOf = radios.map((_, i) => i);
  /** Points item `item` at radio `r`: value and text. */
  const fill = (/** @type {HTMLElement} */ item, /** @type {number} */ r) => {
    item.dataset.value = radios[r].value;
    const label = /** @type {HTMLElement} */ (item.lastChild);
    label.textContent = labelText(radios[r]);
    addDescription(label, descText(radios[r]));
    describe(item, label.lastElementChild);
  };
  const makeItem = (/** @type {number} */ r) => {
    const item = create(doc, "div", "item");
    item.id = uniqueId(doc);
    item.setAttribute("role", "option");
    if (tiers.length) {
      const key = create(doc, "span", "key");
      key.setAttribute("aria-hidden", "true");
      item.append(key);
    }
    item.append(create(doc, "span", "label"));
    fill(item, r);
    return item;
  };
  const items = radios.map((_, i) => makeItem(i));
  /** A role=group section with a heading. @param {string} label */
  const makeGroup = (label) => {
    const section = create(doc, "div", "group");
    const head = create(doc, "div", "group-label");
    head.id = uniqueId(doc);
    head.setAttribute("role", "presentation");
    head.textContent = label;
    section.setAttribute("role", "group");
    section.setAttribute("aria-labelledby", head.id);
    section.append(head);
    return section;
  };
  // Groups: each run of items with the same group (or none) is a section inside the list. A
  // named section is a role=group with a heading; it keeps its items together while filtering.
  /** @type {HTMLElement[]} section of each item; empty when there are no groups */
  const sectionOf = [];
  if (radios.some((r) => groupOf.has(r))) {
    /** @type {HTMLElement | undefined} */ let section;
    /** @type {GroupInfo | undefined} */ let current;
    radios.forEach((radio, i) => {
      const g = groupOf.get(radio);
      if (!section || g !== current) {
        current = g;
        if (g) section = makeGroup(g.label);
        else {
          section = create(doc, "div", "group");
          section.setAttribute("role", "presentation");
          section.removeAttribute("data-gridselect-group");
          section.setAttribute("data-gridselect-section", "");
        }
        list.append(section);
      }
      section.append(items[i]);
      sectionOf.push(section);
    });
  } else list.append(...items);
  const sections = [...new Set(sectionOf)];

  // Pinned and recent entries: copies on top of the panel, each group with a fixed number of places.
  /** @param {unknown} v @param {string} attr */
  const valuesOf = (v, attr) => (Array.isArray(v) ? v.map(String) : wrapper.getAttribute(attr)?.split(",").map((x) => x.trim()) ?? []);
  const indexOf = (/** @type {string} */ v) => radios.findIndex((r) => r.value === v);
  const pinIdx = [...new Set(valuesOf(opts.pinned, "data-pinned").map(indexOf).filter((i) => i >= 0))];
  const recentKey = typeof opts.recent === "string" && opts.recent ? opts.recent : wrapper.getAttribute("data-recent");
  const maxAttr = wrapper.getAttribute("data-recent-max");
  const recentMax = !recentKey ? 0 : isCount(opts.recentMax) ? /** @type {number} */ (opts.recentMax)
    : maxAttr !== null && /^\d+$/.test(maxAttr) ? Number(maxAttr) : 5;
  const storeKey = `gridselect-recent:${recentKey}`;
  /** @returns {string[]} */
  const readRecent = () => {
    try {
      const v = JSON.parse((doc.defaultView ?? window).localStorage.getItem(storeKey) ?? "[]");
      return Array.isArray(v) ? v.map(String) : [];
    } catch {
      return [];
    }
  };
  /** @param {string} value */
  const remember = (value) => {
    try {
      (doc.defaultView ?? window).localStorage.setItem(storeKey, JSON.stringify([value, ...readRecent().filter((v) => v !== value)].slice(0, recentMax)));
    } catch { /* storage blocked: nothing to remember */ }
  };
  /** @type {number[]} item indices of the top places, pinned first */
  const tops = [];
  /** @type {HTMLElement[]} */
  const topSections = [];
  for (const [count, text, fallback] of /** @type {const} */ ([[pinIdx.length, opts.pinnedText, "Pinned"], [recentMax, opts.recentText, "Recent"]])) {
    if (!count) continue;
    const section = makeGroup(typeof text === "string" ? text : fallback);
    section.setAttribute("data-gridselect-top", "");
    for (let k = 0; k < count; k++) {
      const r = fallback === "Pinned" ? pinIdx[k] : 0;
      tops.push(items.length);
      radioOf.push(r);
      sectionOf[items.length] = section;
      const item = makeItem(r);
      items.push(item);
      section.append(item);
    }
    topSections.push(section);
  }
  // Without groups of its own the list gets one plain section, so CSS can set it off from the top.
  if (tops.length && !sections.length) {
    const section = create(doc, "div", "group");
    section.setAttribute("role", "presentation");
    section.removeAttribute("data-gridselect-group");
    section.setAttribute("data-gridselect-section", "");
    radios.forEach((_, i) => section.append(items[(sectionOf[i] = section, i)]));
    list.append(section);
    sections.push(section);
  }
  list.prepend(...topSections);
  /** Recent places: refilled from storage on every open. Pinned values are not repeated. */
  function fillRecent() {
    if (!recentMax) return;
    const values = readRecent().map(indexOf).filter((i) => i >= 0 && !pinIdx.includes(i));
    const section = topSections[topSections.length - 1];
    tops.slice(pinIdx.length).forEach((j, k) => {
      const r = values[k];
      if (r !== undefined) {
        radioOf[j] = r;
        fill(items[j], r);
      }
      items[j].toggleAttribute("data-empty", r === undefined);
    });
    section.toggleAttribute("data-empty", !values.length);
  }

  const empty = create(doc, "div", "empty");
  setHidden(empty, true);
  empty.textContent = typeof opts.noResultsText === "string" ? opts.noResultsText : "No matches";
  // Announces the match count. Visually hidden by inline style, so it works without our stylesheet.
  const status = statusRegion(doc);
  /** @type {(n: number) => string} */
  const resultsText = typeof opts.resultsText === "function" ? opts.resultsText : (n) => (n === 1 ? "1 result" : `${n} results`);
  panel.append(search, scroller, empty, status);
  const keys = radios.map((r) => fold(labelText(r)));
  const descKeys = (opts.searchDescription ?? wrapper.hasAttribute("data-search-description")) ? radios.map((r) => fold(descText(r))) : null;
  const highlight = (opts.search ?? wrapper.getAttribute("data-search")) === "highlight";
  const fuzzy = (opts.match ?? wrapper.getAttribute("data-match-mode")) === "fuzzy";

  // Group name: <legend>, else the wrapper's aria-labelledby or aria-label.
  const legend = wrapper.querySelector(":scope > legend");
  const ariaLabel = wrapper.getAttribute("aria-label");
  let labelledBy = wrapper.getAttribute("aria-labelledby");
  const nameEl = legend ?? (!labelledBy && !ariaLabel ? fallbackLabel : null);
  if (nameEl) {
    if (!nameEl.id) {
      nameEl.id = uniqueId(doc);
      undo.push(() => nameEl.removeAttribute("id"));
    }
    labelledBy = nameEl.id;
  }
  if (labelledBy) field.setAttribute("aria-labelledby", `${labelledBy} ${field.id}`);
  // Search input and listbox carry the group name too, not just the placeholder.
  for (const el of [search, scroller]) {
    if (labelledBy) el.setAttribute("aria-labelledby", labelledBy);
    else if (ariaLabel) el.setAttribute("aria-label", ariaLabel);
  }

  const max = multiple ? maxOf(opts, wrapper) : 0;
  /** @type {(n: number) => string} */
  const selectedText = typeof opts.selectedText === "function" ? opts.selectedText : (n) => `${n} selected`;
  function render() {
    const chosen = radios.filter((r) => r.checked);
    const current = chosen[0];
    field.textContent = !chosen.length ? placeholder
      : chosen.length <= 2 ? chosen.map(labelText).join(", ")
      : String(selectedText(chosen.length));
    const locked = !!max && chosen.length >= max;
    items.forEach((item, i) => {
      const r = radios[radioOf[i]];
      item.setAttribute("aria-selected", String(r.checked));
      setLimit(item, item, locked && !r.checked, r.matches(":disabled"));
    });
    field.disabled = radios.every((r) => r.matches(":disabled"));
    if (current) field.removeAttribute("aria-invalid");
    if (!labelledBy && ariaLabel) field.setAttribute("aria-label", `${ariaLabel}, ${field.textContent}`);
  }
  render();

  /** Indices into `items` the arrow keys walk through, in display order. */
  let order = items.map((_, i) => i);
  /** Position of the cursor within `order`, -1 for none. */
  let cursor = -1;
  /** @type {HTMLElement | undefined} The item carrying data-cursor; `order` may change under it. */
  let marked;
  /** @param {number} pos */
  function setCursor(pos) {
    marked?.removeAttribute("data-cursor");
    marked = undefined;
    if (!order.length) {
      cursor = -1;
      search.removeAttribute("aria-activedescendant");
      return;
    }
    cursor = Math.max(0, Math.min(pos, order.length - 1));
    const item = (marked = items[order[cursor]]);
    item.setAttribute("data-cursor", "");
    search.setAttribute("aria-activedescendant", item.id);
    item.scrollIntoView?.({ block: "nearest" });
  }

  /** Cursor on the selected entry (on top or in the list), else on the first one. */
  const cursorToSelection = () => {
    const r = radios.findIndex((x) => x.checked);
    setCursor(Math.max(0, order.findIndex((j) => radioOf[j] === r)));
  };

  // filter: non-matches hidden, label-start matches first. highlight: everything stays, matches
  // and non-matches get marked. An empty query restores the plain list in both modes.
  function applyQuery() {
    const query = fold(search.value.trim());
    /** @type {number[]} matching items, best first */
    let matched;
    if (fuzzy) {
      // d: 1 for a match in the description only, sorted after label matches
      const scored = keys.map((key, i) => {
        let s = fuzzyScore(key, query);
        const d = s < 0 && descKeys ? 1 : 0;
        if (d) s = fuzzyScore(/** @type {string[]} */ (descKeys)[i], query);
        return { i, s, d };
      }).filter((x) => x.s >= 0);
      matched = scored.sort((a, b) => a.d - b.d || b.s - a.s || a.i - b.i).map((x) => x.i);
    } else {
      /** @type {number[]} */ const starts = [];
      /** @type {number[]} */ const contains = [];
      /** @type {number[]} */ const described = [];
      keys.forEach((key, i) => {
        const pos = key.indexOf(query);
        if (pos === 0) starts.push(i);
        else if (pos > 0) contains.push(i);
        else if (descKeys?.[i].includes(query)) described.push(i);
      });
      matched = [...starts, ...contains, ...described];
    }
    const isMatch = new Set(matched);
    // Top places only without a query, and only those with an entry. Their entries then leave the
    // list, so nothing shows twice; while searching the list has everything again.
    const top = query ? [] : tops.filter((j) => !items[j].hasAttribute("data-empty"));
    const onTop = new Set(top.map((j) => radioOf[j]));
    const all = radios.map((_, i) => i).filter((i) => !onTop.has(i));
    if (highlight) {
      const firstMatch = all.find((i) => isMatch.has(i));
      items.forEach((item, i) => {
        item.toggleAttribute("data-match", !!query && isMatch.has(i));
        item.toggleAttribute("data-dimmed", !!query && !isMatch.has(i));
      });
      order = [...top, ...all];
      if (!query) cursorToSelection();
      else if (firstMatch !== undefined) setCursor(firstMatch);
    } else {
      order = query ? matched : all;
      // Groups keep their order, only the items inside a group are sorted (stable sort).
      if (sections.length) order.sort((a, b) => sections.indexOf(sectionOf[a]) - sections.indexOf(sectionOf[b]));
      order = [...top, ...order];
      const shown = new Set(order);
      items.forEach((item, i) => setHidden(item, !shown.has(i)));
      for (const i of order) (sectionOf[i] ?? list).append(items[i]);
      for (const sec of sections) setHidden(sec, !order.some((i) => sectionOf[i] === sec));
      setHidden(empty, !query || order.length > 0);
      if (query) setCursor(0);
      else cursorToSelection();
    }
    for (const sec of topSections) setHidden(sec, !!query || sec.hasAttribute("data-empty"));
    for (const j of tops) setHidden(items[j], !top.includes(j));
    if (highlight) radios.forEach((_, i) => setHidden(items[i], onTop.has(i)));
    renumber();
    // Last, so a throwing resultsText from the page cannot stop the filtering above.
    const count = matched.length;
    status.textContent = !query ? "" : count ? String(resultsText(count)) : empty.textContent;
  }
  // The search input is ours: its input/change events must not look like a new selection.
  search.addEventListener("input", (e) => {
    e.stopPropagation();
    applyQuery();
  });
  search.addEventListener("change", (e) => e.stopPropagation());

  // Digits follow the display order: top entries, then the list, in one run.
  function renumber() {
    if (!tiers.length) return;
    /** @type {number[]} display position per item, -1 when not shown */
    const posOf = items.map(() => -1);
    order.forEach((i, pos) => (posOf[i] = pos));
    items.forEach((item, i) => {
      const pos = posOf[i];
      const sc = pos < 0 ? null : shortcutAt(tiers, pos);
      const key = /** @type {HTMLElement} */ (item.firstChild);
      key.textContent = sc ? sc.digit : "";
      key.setAttribute("data-modifiers", sc ? sc.tier.name : "");
      setPrefix(key, sc ? sc.tier.prefix : "");
      if (sc) item.setAttribute("aria-keyshortcuts", sc.aria);
      else item.removeAttribute("aria-keyshortcuts");
    });
  }

  function open() {
    if (!panel.hidden) return;
    beforeOpen?.();
    render();
    search.value = "";
    fillRecent();
    render();
    setHidden(panel, false);
    field.setAttribute("aria-expanded", "true");
    search.setAttribute("aria-expanded", "true");
    applyQuery();
    if (!isList && !isFlow) measure();
    place();
    search.focus();
    doc.addEventListener("click", onOutsideClick, true);
    view?.addEventListener("scroll", place, { passive: true });
    view?.addEventListener("resize", place);
  }

  const view = doc.defaultView;
  /**
   * "auto": below when everything fits there, else towards the larger room; the list grows up to
   * 8 px before the window edge, never beyond its content, at least 10rem. "fixed": CSS decides.
   */
  function place() {
    scroller.style.maxHeight = "";
    panel.removeAttribute("data-placement");
    const f = field.getBoundingClientRect();
    if ((opts.panelHeight ?? wrapper.getAttribute("data-panel-height")) === "fixed" || !view || !f.height) return;
    scroller.style.maxHeight = "none";
    const p = panel.getBoundingClientRect();
    const chrome = p.height - scroller.getBoundingClientRect().height;
    const offset = p.top - f.bottom; // the gap CSS puts between field and panel
    const below = view.innerHeight - f.bottom - offset - 8;
    const above = f.top - offset - 8;
    const min = 10 * parseFloat(getComputedStyle(doc.documentElement).fontSize);
    const up = p.height > below && above > below && above - chrome >= min;
    const room = Math.max(up ? above : below, min + chrome);
    scroller.style.maxHeight = `${room - chrome}px`;
    if (up) panel.setAttribute("data-placement", "top");
  }

  /** @param {boolean} [refocus] Move focus back to the field (not wanted on Tab or outside clicks). */
  function close(refocus = true) {
    if (panel.hidden) return;
    setHidden(panel, true);
    field.setAttribute("aria-expanded", "false");
    search.setAttribute("aria-expanded", "false");
    doc.removeEventListener("click", onOutsideClick, true);
    view?.removeEventListener("scroll", place);
    view?.removeEventListener("resize", place);
    if (refocus) field.focus();
  }

  /** Anything but the field and the panel closes, also empty space or the legend inside the wrapper. @param {MouseEvent} e */
  function onOutsideClick(e) {
    const target = /** @type {Node} */ (e.target);
    if (!field.contains(target) && !panel.contains(target)) close(false);
  }

  /** Like a user click on the input behind item `index`: radios check and close, checkboxes toggle. */
  function pick(/** @type {number} */ index) {
    const radio = radios[radioOf[index]];
    if (!radio) return;
    if (radio.matches(":disabled")) return;
    const count = radios.filter((r) => r.checked).length;
    if (max && !radio.checked && count >= max) return void announce(status, maxMessage(opts, max));
    if (max && !radio.checked && count + 1 === max) announce(status, maxMessage(opts, max));
    if (recentMax && (!multiple || !radio.checked)) remember(radio.value);
    if (multiple) {
      radio.checked = !radio.checked;
      radio.dispatchEvent(new Event("input", { bubbles: true }));
      radio.dispatchEvent(new Event("change", { bubbles: true }));
      render();
      return;
    }
    if (!radio.checked) {
      radio.checked = true;
      radio.dispatchEvent(new Event("input", { bubbles: true }));
      radio.dispatchEvent(new Event("change", { bubbles: true }));
    }
    render();
    close();
  }

  list.addEventListener("click", (e) => {
    const item = /** @type {Element} */ (e.target).closest("[data-gridselect-item]");
    if (item) pick(items.indexOf(/** @type {HTMLDivElement} */ (item)));
  });

  field.addEventListener("click", () => (panel.hidden ? open() : close()));
  field.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " " && e.key !== "ArrowDown") return;
    e.preventDefault();
    open();
  });
  // Column count as laid out by CSS (auto-fill), never hardcoded.
  function columns() {
    const tracks = (doc.defaultView ?? window).getComputedStyle(list).gridTemplateColumns.split(" ").filter((t) => t && t !== "none");
    return Math.max(1, tracks.length);
  }

  // Grid: every column as wide as the widest item on one line (CSS reads --gs-auto-width).
  function measure() {
    let max = 0;
    for (const it of items) Object.assign(it.style, { width: "max-content", whiteSpace: "nowrap" });
    for (const it of items) max = Math.max(max, it.getBoundingClientRect().width);
    for (const it of items) Object.assign(it.style, { width: "", whiteSpace: "" });
    list.style.setProperty("--gs-auto-width", `${Math.ceil(max)}px`);
  }

  /**
   * Flow layout: offset to the item in the next (dir 1) or previous (dir -1) row whose centre is
   * nearest to the cursor's. 0 at the first/last row, ±1 without layout information.
   * @param {1 | -1} dir
   */
  function rowStep(dir) {
    const rect = (/** @type {number} */ pos) => items[order[pos]].getBoundingClientRect();
    const cur = rect(cursor);
    if (!cur.height) return dir;
    const rows = order.map((_, pos) => ({ pos, r: rect(pos) }))
      .filter(({ r }) => (dir > 0 ? r.top >= cur.bottom - 1 : r.bottom <= cur.top + 1));
    if (!rows.length) return 0;
    const top = dir > 0 ? Math.min(...rows.map((x) => x.r.top)) : Math.max(...rows.map((x) => x.r.top));
    const centre = (/** @type {DOMRect} */ r) => r.left + r.width / 2;
    const best = rows.filter((x) => Math.abs(x.r.top - top) < 2)
      .reduce((a, b) => (Math.abs(centre(b.r) - centre(cur)) < Math.abs(centre(a.r) - centre(cur)) ? b : a));
    return best.pos - cursor;
  }

  search.addEventListener("keydown", (e) => {
    // Keys during an IME composition belong to the input method, not to us.
    if (e.isComposing) return;
    // Tier digits always pick and are never typed, even without a matching item.
    const pos = tiers.length ? positionOf(tiers, e) : -1;
    if (pos >= 0) {
      e.preventDefault();
      if (order[pos] !== undefined) pick(order[pos]);
      return;
    }
    /** @type {Record<string, () => number>} */
    const moves = isList
      ? { ArrowDown: () => 1, ArrowUp: () => -1 }
      : isFlow || sections.length > 1 || tops.length ? { ArrowRight: () => 1, ArrowLeft: () => -1, ArrowDown: () => rowStep(1), ArrowUp: () => rowStep(-1) }
      : { ArrowRight: () => 1, ArrowLeft: () => -1, ArrowDown: columns, ArrowUp: () => -columns() };
    if (moves[e.key]) {
      e.preventDefault();
      setCursor(cursor + moves[e.key]());
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(order[cursor]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close(false);
    }
  });

  // A hidden required radio cannot show the browser's hint, so the field takes focus instead.
  function onInvalid() {
    field.setAttribute("aria-invalid", "true");
    field.focus();
  }
  // reset fires before the inputs change, so render on the next task.
  const onReset = () => setTimeout(render, 0);
  const form = radios[0].form;
  for (const r of radios) r.addEventListener("invalid", onInvalid);
  form?.addEventListener("reset", onReset);
  undo.push(() => {
    for (const r of radios) r.removeEventListener("invalid", onInvalid);
    form?.removeEventListener("reset", onReset);
  });

  wrapper.append(field, panel);

  return {
    render,
    invalid: onInvalid,
    destroy() {
      close(false);
      field.remove();
      panel.remove();
      for (const fn of undo) fn();
    },
  };
}
