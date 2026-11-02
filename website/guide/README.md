# Getting started

GridSelect turns a group of native form fields into a selection control that works equally well for three entries and for three hundred. You keep writing the HTML you already know (a group of radio buttons, a group of checkboxes, or a `<select>`), wrap it in an element, and call one function. GridSelect then decides on its own how to present the entries.

Short lists stay visible on the page, so people can see every option at a glance and pick one with a single click. Each entry gets a small number badge, so a keyboard user can also pick it by pressing that digit. Long lists are folded into a compact field. Clicking the field opens a panel with a search input and a grid of all entries. In the panel people can type to narrow the list, move through the grid with the arrow keys, or press a digit.

The point at which GridSelect switches from the first form to the second is called the **threshold**. By default it is 10: a group with up to ten entries stays visible, a group with eleven or more gets the field and the panel. You can change the threshold per group. The page [How GridSelect works](/guide/concepts.md) explains this and the other terms used throughout the documentation.

Try both forms below. The first example has four entries and therefore stays visible. The second has more than ten, so it shows a field; click it, type `dollar`, and use the arrow keys.

<script setup>
import { currencies } from "../.vuepress/data.js";
</script>

<Example>
  <fieldset data-gridselect>
    <legend>Shipping</legend>
    <label><input type="radio" name="ship" value="std" checked> Standard</label>
    <label><input type="radio" name="ship" value="exp"> Express</label>
    <label><input type="radio" name="ship" value="next"> Next day</label>
    <label><input type="radio" name="ship" value="pick"> Pick-up</label>
  </fieldset>
</Example>

<Example :options="{ items: currencies, value: 'CHF' }">
  <fieldset data-gridselect><legend>Currency</legend></fieldset>
</Example>

## Your first GridSelect in three steps

### 1. Load the script and the stylesheet

Install the package with npm and import the function and the stylesheet. If you do not use a bundler, load the files from a CDN instead; the [Installation](/guide/installation.md) page shows both ways.

```sh
npm install @emmgeede/gridselect
```

```js
import { gridselect } from "@emmgeede/gridselect";
import "@emmgeede/gridselect/gridselect.css";
```

The stylesheet is optional but recommended. It gives the items, the field and the panel their look, including light and dark mode, and it meets the contrast requirements of WCAG 2.2 AA. Without it GridSelect still works, but you have to style everything yourself.

### 2. Write the markup you would write anyway

Write a normal radio group (one choice) or checkbox group (several choices) and wrap it in an element with the attribute `data-gridselect`. A `<fieldset>` with a `<legend>` is the best wrapper, because the legend gives the whole group a name that screen readers announce.

```html
<fieldset data-gridselect>
  <legend>Shipping</legend>
  <label><input type="radio" name="ship" value="std" checked> Standard</label>
  <label><input type="radio" name="ship" value="exp"> Express</label>
  <label><input type="radio" name="ship" value="next"> Next day</label>
</fieldset>
```

Every input needs a `<label>` around it, because GridSelect takes the visible text of each entry from its label. A `<select>` works too; see [Sources](/guide/sources.md).

### 3. Call `gridselect()`

```js
const gs = gridselect(document.querySelector("[data-gridselect]"));
```

The call returns an instance. Its `value` property tells you what is selected, and setting it changes the selection:

```js
console.log(gs.value); // "std"
gs.value = "exp";      // selects Express, without firing an event
```

That is all. The native inputs stay in the page, stay in your form and keep their names and values, so submitting the form, resetting it and the `required` attribute work exactly as before. If JavaScript is not available, people simply see and use the original radio group.

## Several groups at once

If a page has several groups, call `gridselect()` for each wrapper. Calling it twice on the same wrapper is harmless; it returns the instance that already exists.

```js
document.querySelectorAll("[data-gridselect]").forEach((el) => gridselect(el));
```

## Reacting to changes

GridSelect does not invent its own events. When someone picks an entry, the native input underneath is checked and fires the usual `input` and `change` events, exactly as if the person had clicked the radio button itself. These events bubble up, so one listener on the wrapper is enough:

```js
const wrapper = document.querySelector("[data-gridselect]");
wrapper.addEventListener("change", (event) => {
  console.log("picked", event.target.value);      // the radio or checkbox that changed
  console.log("selection", gridselect(wrapper).value);
});
```

For a `<select>` the events come from the select element, so existing listeners on it keep working. Setting `gs.value` from code does not fire any event, just like setting `checked` on a native input.

## Where to go next

- [How GridSelect works](/guide/concepts.md) explains the threshold, the panel, the cursor and the digit shortcuts in detail.
- [Sources](/guide/sources.md) shows every way to provide the entries: radios, checkboxes, a `<select>` or a JavaScript array.
- [The panel](/guide/panel.md) describes what happens above the threshold and how you can change the panel's layout, width and height.
- [Custom element and frameworks](/guide/frameworks.md) shows the `<grid-select>` element and the React and Vue components, if you prefer to write GridSelect as a tag.
- [Options](/reference/README.md) lists every setting in one table.
