# Sources

<script setup>
import { currencies, regions, countries, airports, fakeLoad } from "../.vuepress/data.js";
</script>

Radios, checkboxes and a `<select>` work as written in your HTML (see [Getting started](/guide/README.md)). Entries can also come from JavaScript:

<Example :options="{ name: 'airport', items: airports, value: 'FRA' }">
  <fieldset data-gridselect><legend>Airport</legend></fieldset>
</Example>

## Entries from JavaScript

Instead of writing inputs, pass the entries. The wrapper must be empty (a
`<legend>` is fine):

```js
const gs = gridselect(document.querySelector("#airport"), {
  name: "airport",                       // submitted under this name
  items: ["BER", { value: "FRA", label: "Frankfurt" }, { value: "MUC", label: "Munich", disabled: true }],
  value: "FRA",                          // initial choice
  multiple: false,                       // true builds checkboxes
});

gs.setItems(await loadAirports());       // swap the entries later
```

GridSelect builds native radios (or checkboxes) with labels, marked
`data-gridselect-generated`, so everything else works as with your own
markup: forms, events, panel, search and digits. Strings and numbers are
value and label at once; labels are plain text. Without `name` the inputs
still form a group but are not submitted.

`setItems()` replaces the entries in the same instance. Chosen values that
still exist stay chosen, the others are dropped, and no event fires (read
`gs.value` afterwards). Crossing the threshold switches between visible items
and the panel. Invalid entries throw a `TypeError` that names their position,
and leave the current entries untouched.

Instances built from your own markup or a select have no `setItems()`. When
you change their inputs, call `gs.destroy()` and `gridselect(el)` again.

## `<select>` as source

A wrapper may hold one `<select>` instead of radios:

```html
<div data-gridselect>
  <label for="size">Size</label>
  <select id="size" name="size" required>
    <option value="">Choose a size…</option>
    <option value="s">Small</option>
    <option value="m">Medium</option>
  </select>
</div>
```

GridSelect hides the select and builds one radio per option (attribute
`data-gridselect-generated` on its label), so short selects become visible
items and long ones get the field and panel, with search and digits. The
generated radios point to no form, only the select is submitted. Picking
sets `select.value` and fires `input` and `change` on the select, so
`event.target` is the select and your existing listeners keep working.

- An option with an empty value is the placeholder: it is not an item, its
  text becomes the field text, and `gs.value` is `null` while it is chosen.
- Options inside `<optgroup>` get a heading per group above the threshold,
  see [Groups](/guide/groups.md). `disabled` on options, groups and the select is
  respected, the text comes from `option.label`.
- Without a `<legend>` or `aria-label` on the wrapper, the select's own
  `<label>` names the field.
- Changes made by your code show up after a `change` event on the select or
  a form reset. `gs.value = "m"` updates everything without events.
- `<select multiple>` becomes checkboxes the same way, with the panel's
  multiple choice above the threshold. `gs.value` is an array, and the form
  submits every selected option.
