# Sources

GridSelect needs to know which entries (called [items](/guide/concepts.md#items)) it should offer. You can provide them in four ways, and you can pick whichever fits the rest of your page best: a group of radio buttons, a group of checkboxes, a `<select>` element, or a JavaScript array. A fifth way, loading the entries from a server while people type, has its own page: [Entries from a server](/guide/server.md).

Whichever source you choose, the result behaves the same. The threshold, the panel, the search, the digit shortcuts and the styling all work identically, because GridSelect turns every source into native inputs before it does anything else.

<script setup>
import { airports } from "../.vuepress/data.js";
</script>

## Radio buttons: one choice

A group of radio buttons is the most direct source. Write each option as an `<input type="radio">` inside a `<label>`, give all inputs the same `name`, and wrap the group in an element with `data-gridselect`. The label's text becomes the item's label, the input's `value` becomes its value. A pre-checked input (`checked`) is the initial selection.

```html
<fieldset data-gridselect>
  <legend>Shipping</legend>
  <label><input type="radio" name="ship" value="std" checked> Standard</label>
  <label><input type="radio" name="ship" value="exp"> Express</label>
  <label><input type="radio" name="ship" value="next" disabled> Next day (sold out)</label>
</fieldset>
```

A disabled input becomes a disabled item: it is shown, but crossed out and not selectable. All radio buttons in the group must share one `name`; GridSelect throws an error if they do not, because the browser would treat them as separate groups.

## Checkboxes: several choices

Write checkboxes in the same way to let people choose several items. Each checkbox can have its own `name`, or they can share one; GridSelect only requires that the wrapper does not mix radio buttons and checkboxes. With checkboxes, `gs.value` is an array of all checked values, and picking an item in the panel toggles it instead of closing the panel. [Multiple choice](/guide/multiple.md) explains the details, including an upper limit for the number of choices.

```html
<fieldset data-gridselect>
  <legend>Extras</legend>
  <label><input type="checkbox" name="extras" value="gift"> Gift wrap</label>
  <label><input type="checkbox" name="extras" value="ins" checked> Insurance</label>
</fieldset>
```

## Entries from JavaScript

When the entries come from data, for example from an API response, you do not need to build the markup yourself. Leave the wrapper empty (a `<legend>` is fine) and pass the entries in the option `items`. GridSelect then creates the radio buttons, or checkboxes with `multiple: true`, together with their labels.

<Example :options="{ name: 'airport', items: airports, value: 'FRA' }">
  <fieldset data-gridselect><legend>Airport</legend></fieldset>
</Example>

```js
const gs = gridselect(document.querySelector("#airport"), {
  name: "airport", // the form submits the choice under this name
  items: [
    "BER", // a string (or number) is value and label at once
    { value: "FRA", label: "Frankfurt" },
    { value: "MUC", label: "Munich", disabled: true },
    { value: "ZRH", label: "Zurich", description: "Switzerland" },
  ],
  value: "FRA", // the initial choice (an array with multiple)
  multiple: false, // true creates checkboxes instead of radios
});
```

Each entry is either a string or number, which then serves as both value and label, or an object with a `value` and optional `label`, `description` and `disabled`. Entries can also be grouped under headings by writing `{ label: "Europe", items: [ … ] }`; see [Groups](/guide/groups.md). Labels and descriptions are always treated as plain text, never as HTML, so data from outside cannot inject markup into your page.

The created inputs are real form fields. If you give a `name`, the surrounding form submits the selection under that name. Without a `name` the inputs still work as one group, but they are not submitted, which is useful when GridSelect only drives something on the page.

### Replacing the entries later

An instance created with `items` has a method `setItems()`. It replaces all entries in place, keeps the same instance, and keeps every chosen value that also exists in the new list. Values that no longer exist are dropped. No event fires, so read `gs.value` afterwards if you need the new selection. If the new list crosses the threshold, GridSelect switches between visible items and the field with the panel on its own.

```js
gs.setItems(await loadAirports());
```

If an entry is invalid, for example an object without a `value`, GridSelect throws a `TypeError` that names the position of the bad entry (such as `items[3]`) and leaves the current entries untouched.

Instances built from your own markup or from a `<select>` do not have `setItems()`, because their entries belong to your HTML. If you change that HTML, call `gs.destroy()` and then `gridselect(el)` again.

## `<select>` as source

If your page already uses a `<select>`, keep it. Put it inside the wrapper, and GridSelect hides it and builds one radio button per option (or one checkbox per option for `<select multiple>`). Short selects therefore become visible items, long ones get the field with the panel, and both get search and digit shortcuts.

```html
<div data-gridselect>
  <label for="size">Size</label>
  <select id="size" name="size" required>
    <option value="">Choose a size…</option>
    <option value="s">Small</option>
    <option value="m">Medium</option>
    <option value="l">Large</option>
  </select>
</div>
```

The select remains the field that is submitted. The radio buttons that GridSelect builds are only an interface on top of it: they belong to no form, so nothing is submitted twice. When someone picks an item, GridSelect sets `select.value` and fires `input` and `change` on the select itself. Code that already listens to the select therefore keeps working without changes.

Several details follow the rules of the native element:

- An option with an empty value is treated as the placeholder. It does not become an item; instead its text is shown in the field while nothing is chosen, and `gs.value` is `null` in that state.
- Options inside `<optgroup>` elements are shown under group headings in the panel; see [Groups](/guide/groups.md).
- The `disabled` attribute is respected on options, on option groups and on the whole select. The visible text comes from the option's `label` attribute if it has one, otherwise from its text.
- If the wrapper has no `<legend>` and no `aria-label`, the select's own `<label>` names the field for screen readers.
- If your code changes the select later, GridSelect picks up the change after a `change` event on the select or after a form reset. Setting `gs.value = "m"` updates everything at once, without events.
- `<select multiple>` works the same way with checkboxes, and the form submits every selected option.
