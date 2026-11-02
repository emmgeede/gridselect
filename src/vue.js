// Vue 3 wrapper around <grid-select>: props become attributes, items and v-model go to the
// element's properties, the element's native change becomes update:modelValue. No logic of its own.
import { defineComponent, h, onMounted, onBeforeUnmount, ref, watch } from "vue";
import "./element.js";

/** @param {boolean} on */
const flag = (on) => (on ? "" : undefined);

export const GridSelect = defineComponent({
  name: "GridSelect",
  props: {
    modelValue: { type: /** @type {import("vue").PropType<string | string[] | null>} */ ([String, Array]), default: undefined },
    items: { type: /** @type {import("vue").PropType<import("./gridselect.js").Item[]>} */ (Array), default: undefined },
    name: String,
    label: String,
    ariaLabel: String,
    multiple: Boolean,
    threshold: Number,
    layout: /** @type {import("vue").PropType<"grid" | "list" | "flow">} */ (String),
    search: /** @type {import("vue").PropType<"filter" | "highlight">} */ (String),
    match: /** @type {import("vue").PropType<"substring" | "fuzzy">} */ (String),
    shortcuts: { type: /** @type {import("vue").PropType<string[] | false>} */ ([Array, Boolean]), default: undefined },
    placeholder: String,
    searchPlaceholder: String,
    required: Boolean,
    disabled: Boolean,
    max: Number,
    searchDescription: Boolean,
    panelHeight: /** @type {import("vue").PropType<"auto" | "fixed">} */ (String),
    pinned: /** @type {import("vue").PropType<string[]>} */ (Array),
    recent: String,
    recentMax: Number,
    pinnedText: String,
    recentText: String,
  },
  emits: ["update:modelValue", "change", "input"],
  setup(props, { emit, slots, expose }) {
    const el = /** @type {import("vue").Ref<import("./element.js").GridSelectElement | null>} */ (ref(null));
    expose({ el });
    /** @param {Event} e */
    const onChange = (e) => {
      emit("update:modelValue", el.value?.value);
      emit("change", e);
    };
    /** @param {Event} e */
    const onInput = (e) => emit("input", e);
    onMounted(() => {
      const node = /** @type {any} */ (el.value);
      if (props.items !== undefined) node.items = props.items;
      if (props.modelValue !== undefined) node.value = props.modelValue;
      node.addEventListener("change", onChange);
      node.addEventListener("input", onInput);
    });
    onBeforeUnmount(() => {
      el.value?.removeEventListener("change", onChange);
      el.value?.removeEventListener("input", onInput);
    });
    watch(() => props.items, (items) => { if (el.value) /** @type {any} */ (el.value).items = items ?? null; });
    watch(() => props.modelValue, (v) => { if (el.value && v !== undefined) /** @type {any} */ (el.value).value = v; });

    return () => h("grid-select", {
      ref: el,
      "^name": props.name, "^label": props.label, "^aria-label": props.ariaLabel,
      "^threshold": props.threshold === undefined ? undefined : String(props.threshold),
      "^layout": props.layout, "^search": props.search, "^match": props.match,
      "^placeholder": props.placeholder, "^search-placeholder": props.searchPlaceholder,
      "^shortcuts": props.shortcuts === false ? "off" : props.shortcuts?.join(","),
      "^max": props.max === undefined ? undefined : String(props.max), "^pinned": props.pinned?.join(","), "^recent": props.recent,
      "^recent-max": props.recentMax === undefined ? undefined : String(props.recentMax),
      "^pinned-text": props.pinnedText, "^recent-text": props.recentText,
      "^multiple": flag(props.multiple), "^search-description": flag(props.searchDescription), "^panel-height": props.panelHeight, "^required": flag(props.required), "^disabled": flag(props.disabled),
    }, slots.default?.());
  },
});
