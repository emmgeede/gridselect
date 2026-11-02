# Custom element and frameworks

<Example>
  <grid-select name="destination" label="Destination" search="highlight">
    <option value="">Choose a destination…</option>
    <option value="BER">Berlin (BER)</option>
    <option value="OSL" selected>Oslo (OSL)</option>
    <option value="ZRH" disabled>Zurich (ZRH)</option>
    <option value="VIE">Vienna (VIE)</option>
  </grid-select>
</Example>

## `<grid-select>`

The custom element builds everything from HTML, no JavaScript call needed:

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

It works in the light DOM: inside it builds a `<fieldset data-gridselect>`
with a `<legend>` and native radios (or checkboxes with `multiple`) from its
`<option>` children (also inside `<optgroup>`, see [Groups](/guide/groups.md)), which it hides. So the stylesheet, the theme, forms and
screen readers work as everywhere else, and `input` and `change` bubble up
from the element.

| Attribute | Meaning |
|---|---|
| `name` | Form name of the inputs |
| `label` | Group name, becomes the `<legend>`. Without `label` or `aria-label` the console warns, a group needs a name |
| `multiple` | Checkboxes instead of radios |
| `value` | Initial choice, comma-separated with `multiple`. Without it, `selected` options count |
| `threshold`, `layout`, `search`, `match`, `placeholder`, `search-placeholder` | As the options of the same name |
| `min-query-length`, `loading-text`, `error-text` | As the options with `load` (set `el.load` as a property) |
| `max`, `search-description`, `panel-height`, `panel-width` | As the options `max`, `searchDescription`, `panelHeight` and `panelWidth` |
| `pinned`, `recent`, `recent-max`, `pinned-text`, `recent-text` | As `pinned` (comma-separated), `recent`, `recentMax`, `pinnedText`, `recentText` |
| `shortcuts` | `off`, or tiers separated by commas, e.g. `,Shift,Alt` |
| `required`, `disabled` | As on native inputs |

Properties: `el.value` reads and sets the selection like `gs.value`, and
`el.items = [...]` (format as in [Entries from JavaScript](/guide/sources.md#entries-from-javascript))
replaces the `<option>` children as source. When attributes or options change,
as frameworks do all the time, the element rebuilds and keeps the choice and
the focus. An option with an empty value is the placeholder, an option without
`value` uses its text.

Inside a form it is a form control of its own, see [Forms](/guide/forms.md).

In React, Vue, Svelte or Angular write `<grid-select>` like any HTML element.
For events, add a native listener (`addEventListener("change", …)`, in React
via a ref) rather than relying on framework-specific change props.

## React and Vue

Thin wrappers around `<grid-select>`, in the same package. React (18 or 19)
and Vue (3.3 or newer) are optional peer dependencies: install them only if
you use the wrapper.

## React

```jsx
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

- `value` with `onChange(value)` is a controlled field: the element always
  shows `value`. `defaultValue` makes it uncontrolled.
- `items` takes the same format as [Entries from JavaScript](/guide/sources.md#entries-from-javascript),
  groups included. `<option>` and `<optgroup>` children work too.
- The other attributes of `<grid-select>` are props in camelCase:
  `ariaLabel`, `multiple`, `threshold`, `layout`, `search`, `match`,
  `placeholder`, `searchPlaceholder`, `required`, `disabled`, `max`,
  `searchDescription`, `panelHeight`, `panelWidth`, `pinned`,
  `recent`, `recentMax`, `pinnedText`, `recentText`, and `shortcuts` as an
  array or `false`.
- `ref` points to the `<grid-select>` element.

## Vue

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

The Vue component takes the same props, supports `v-model` and passes the
native `change` and `input` events on. If you use `<grid-select>` directly in
Vue templates, tell the compiler it is a custom element
(`compilerOptions.isCustomElement: (tag) => tag === "grid-select"`).

## Svelte, Angular and others

These frameworks use the element itself:

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

```ts
// Angular: allow custom elements in the component, then bind as usual
@Component({
  selector: "app-currency",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<grid-select name="currency" label="Currency" [items]="currencies"
    (change)="currency = $any($event.currentTarget).value"></grid-select>`,
})
export class CurrencyComponent { currencies = ["EUR", "CHF"]; currency = "CHF"; }
```
