/**
 * @typedef {object} GridSelect
 * @property {string | string[] | null} value
 *   Radio group: the checked value, or null. Checkbox group: all checked values in DOM order.
 *   Setting it changes `checked` without firing events, like setting a native input.
 * @property {() => void} destroy Forgets the instance. The markup stays as it was.
 */

/** @type {WeakMap<Element, GridSelect>} */
const instances = new WeakMap();

/**
 * Turns a wrapper around a native radio or checkbox group into a GridSelect instance.
 * Calling it again on the same wrapper returns the existing instance.
 *
 * @param {Element} wrapper
 * @returns {GridSelect}
 */
export function gridselect(wrapper) {
  // nodeType instead of instanceof: works for elements from other frames too.
  // Object.prototype.toString never throws, unlike String() on prototype-less objects.
  if (wrapper?.nodeType !== 1 || typeof wrapper.querySelectorAll !== "function")
    throw new TypeError("gridselect: expected a DOM element, got " + Object.prototype.toString.call(wrapper));
  const existing = instances.get(wrapper);
  if (existing) return existing;

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

  const values = inputs().map((i) => i.value);
  const dupes = [...new Set(values.filter((v, n) => values.indexOf(v) !== n))];
  if (dupes.length) console.warn("gridselect: duplicate values:", dupes.join(", "));

  // Input values are always strings: numbers match their string form, anything else matches nothing.
  /** @param {unknown} x */
  const key = (x) => (typeof x === "string" || typeof x === "number" ? String(x) : undefined);

  /** @type {GridSelect} */
  const instance = {
    get value() {
      return multiple ? checked() : (checked()[0] ?? null);
    },
    set value(v) {
      if (multiple) {
        if (!Array.isArray(v)) throw new TypeError("gridselect: value of a checkbox group must be an array");
        const wanted = v.map(key);
        for (const i of inputs()) i.checked = wanted.includes(i.value);
        return;
      }
      const match = inputs().find((i) => i.value === key(v));
      for (const i of inputs()) i.checked = i === match;
    },
    destroy() {
      instances.delete(wrapper);
    },
  };
  instances.set(wrapper, instance);
  return instance;
}
