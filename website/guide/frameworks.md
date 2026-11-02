# Custom element and frameworks

So far this guide has used the function `gridselect()`, which you call on a wrapper with your own markup. GridSelect can also be written as an HTML tag, `<grid-select>`, which needs no JavaScript call at all. The tag is also the foundation for using GridSelect in React, Vue, Svelte, Angular and other frameworks. This page explains the tag, its attributes and properties, and the ready-made components for React and Vue.

<Example>
  <grid-select name="destination" label="Destination" search="highlight">
    <option value="">Choose a destination…</option>
    <option value="BER">Berlin (BER)</option>
    <option value="OSL" selected>Oslo (OSL)</option>
    <option value="ZRH" disabled>Zurich (ZRH)</option>
    <option value="VIE">Vienna (VIE)</option>
  </grid-select>
</Example>

## The `<grid-select>` element

Load the element once, from npm or from a CDN, and the browser knows the tag. Then write it like a `<select>`: the entries are `<option>` children, and the settings are attributes.

```html
<grid-select name="destination" label="Destination" search="highlight">
  <option value="">Choose a destination…</option>
  <option value="BER">Berlin (BER)</option>
  <option value="OSL" selected>Oslo (OSL)</option>
  <option value="ZRH" disabled>Zurich (ZRH)</option>
</grid-select>

<script type="module">
  import "@emmgeede/gridselect/element"; // registers <grid-select>
</script>
```

The element follows the same rules as a `<select>`. An option with an empty value is the placeholder: it is not an entry, and its text is shown while nothing is chosen. An option without a `value` uses its text as value. `selected` marks the initial choice, `disabled` an unavailable entry, and `<optgroup>` creates [groups](/guide/groups.md). Options can carry a `data-description` for a second line.

Inside, the element builds exactly what you would write by hand: a `<fieldset>` with a `<legend>` and one radio button (or checkbox) per option, and then runs `gridselect()` on it. Everything else in this guide therefore applies unchanged, and the stylesheet, the themes and screen readers treat it like any other GridSelect. The element does not use a shadow DOM, so your page's CSS reaches inside it.

### Attributes

| Attribute | Meaning |
|---|---|
| `name` | The name under which a form submits the choice. |
| `label` | The visible name of the group, shown as its legend. A group needs a name; without `label` or `aria-label` the browser console shows a warning. |
| `aria-label` | A name for screen readers only, if no visible label is wanted. |
| `multiple` | Allows several choices (checkboxes instead of radio buttons). |
| `value` | The initial choice, comma-separated for `multiple`. Without it, the `selected` options count. |
| `required`, `disabled` | Work as on native form fields. |
| `threshold`, `layout`, `search`, `match`, `placeholder`, `search-placeholder` | The options of the same name, see the [options reference](/reference/README.md). |
| `shortcuts` | `off`, or the tiers separated by commas, for example `,Shift,Alt`. |
| `max`, `search-description`, `panel-height`, `panel-width` | The options `max`, `searchDescription`, `panelHeight` and `panelWidth`. |
| `pinned`, `recent`, `recent-max`, `pinned-text`, `recent-text` | Pinned and recent entries; `pinned` as a comma-separated list. |
| `min-query-length`, `loading-text`, `error-text` | Settings for entries from a server; the function itself is a property, see below. |

### Properties

`el.value` reads and sets the selection, like `gs.value` on an instance. `el.items` takes an array in the format of the [`items` option](/guide/sources.md#entries-from-javascript) and then replaces the `<option>` children as the source of entries. `el.load` takes a function for [entries from a server](/guide/server.md). Inside a form the element is a form field of its own, with `el.form`, `el.validity` and the other validation properties described in [Forms](/guide/forms.md).

### Changes at runtime

Frameworks change attributes and children all the time, and the element is built for that. When an attribute changes, or when options are added, removed or edited, the element rebuilds itself. It keeps the current choice and, if it had the keyboard focus, the focus too. Until someone has made a choice, the options' `selected` state and the `value` attribute decide what is chosen; after that, the person's choice wins.

The native `input` and `change` events bubble up from the element, so `el.addEventListener("change", …)` works. In frameworks, prefer such a native listener over framework-specific change props.

## React

The package contains a small React component that renders `<grid-select>` and connects it to React's way of handling form values. React 18 and 19 are supported; React is an optional peer dependency, so it is never installed because of GridSelect.

```jsx
import { useState } from "react";
import { GridSelect } from "@emmgeede/gridselect/react";
import "@emmgeede/gridselect/gridselect.css";

function CurrencyField() {
  const [currency, setCurrency] = useState("CHF");
  return (
    <GridSelect name="currency" label="Currency" items={currencies}
      value={currency} onChange={setCurrency} search="highlight" />
  );
}
```

With `value` and `onChange` the component is a controlled field: it always shows `value`, and a pick calls `onChange` with the new value (an array for `multiple`) so you can store it. If you do not need control, pass `defaultValue` instead of `value`. Entries can come from `items`, in the same format as the `items` option, or from `<option>` and `<optgroup>` children. All attributes of the element are available as props in camelCase, for example `searchPlaceholder`, `panelWidth`, `recentMax`, plus `load` for a server function. `shortcuts` takes an array or `false`. A `ref` points to the `<grid-select>` element.

## Vue

The Vue component works the same way and supports `v-model`. It requires Vue 3.3 or newer, again as an optional peer dependency.

```vue
<script setup>
import { ref } from "vue";
import { GridSelect } from "@emmgeede/gridselect/vue";
const currency = ref("CHF");
</script>

<template>
  <GridSelect v-model="currency" name="currency" label="Currency" :items="currencies" />
</template>
```

It takes the same props as the React component and passes the native `change` and `input` events on. If you write `<grid-select>` directly in a Vue template instead of using the component, tell Vue's compiler that it is a custom element, for example with `compilerOptions.isCustomElement: (tag) => tag === "grid-select"`.

## Svelte, Angular and others

Other frameworks can use the element directly, because every modern framework supports custom elements. Import the element once and bind its value and events as you would for a native field.

```svelte
<script>
  import "@emmgeede/gridselect/element";
  let currency = $state("CHF");
</script>

<grid-select name="currency" label="Currency" value={currency}
  onchange={(e) => (currency = e.currentTarget.value)}>
  <option value="EUR">Euro</option>
  <option value="CHF">Swiss franc</option>
</grid-select>
```

In Angular, allow custom elements in the component with `CUSTOM_ELEMENTS_SCHEMA`, then bind properties and events as usual:

```ts
@Component({
  selector: "app-currency",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<grid-select name="currency" label="Currency" [items]="currencies"
    (change)="currency = $any($event.currentTarget).value"></grid-select>`,
})
export class CurrencyComponent { currencies = ["EUR", "CHF"]; currency = "CHF"; }
```
