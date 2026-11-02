# Getting started

<Example>
  <fieldset data-gridselect>
    <legend>Shipping</legend>
    <label><input type="radio" name="ship" value="std" checked> Standard</label>
    <label><input type="radio" name="ship" value="exp"> Express</label>
    <label><input type="radio" name="ship" value="next"> Next day</label>
    <label><input type="radio" name="ship" value="pick"> Pick-up</label>
  </fieldset>
</Example>

You write a plain radio group, checkbox group or `<select>`, wrap it, and
GridSelect does the rest. Short lists stay visible as items. Longer lists
switch to a compact field that opens a panel with a search input and a
multi-column grid, fully keyboard accessible. Typing filters the items, or
highlights matches in place, and digits pick an entry directly.

Your markup stays native, so forms submit, reset and validate as usual, and
everything still works without JavaScript.

```html
<fieldset data-gridselect>
  <legend>Currency</legend>
  <label><input type="radio" name="cur" value="EUR" checked> Euro</label>
  <label><input type="radio" name="cur" value="CHF"> Swiss franc</label>
</fieldset>
```

```js
import { gridselect } from "@emmgeede/gridselect";

const gs = gridselect(document.querySelector("[data-gridselect]"));
gs.value;           // "EUR"
gs.value = "CHF";   // checks the CHF radio, fires no event
```

## Reacting to changes

GridSelect keeps your inputs as the source of truth. Whenever the user picks
something, by clicking an input, using the keyboard or choosing an item in
the panel, GridSelect sets `checked` on the native input and the browser's
own `input` and `change` events fire on it. Both bubble, so one listener on
the wrapper covers the whole group:

```js
const wrapper = document.querySelector("[data-gridselect]");
const gs = gridselect(wrapper);

wrapper.addEventListener("change", (event) => {
  console.log(event.target.value); // the input that changed, e.g. "CHF"
  console.log(gs.value);           // the whole selection: "CHF", or ["a", "c"] for checkboxes
});
```

There is no custom event to learn: code that listens to `change` or `input`
with `addEventListener` keeps working unchanged. React is the exception for
picks inside the panel, because React's `onChange` on radios listens to
clicks, not to `change`. In React, attach a native listener to the wrapper
(via a ref) until the planned framework wrappers exist. Setting `gs.value` from
code fires no event, just like setting `checked` yourself, and a form
submit always sends the current selection.

## Several at once

```js
document.querySelectorAll("[data-gridselect]").forEach((el) => gridselect(el));
```

Use `forEach((el) => gridselect(el))`, not `forEach(gridselect)`: the second
form passes the index as a second argument, which will be read as options in
later versions.

A `<fieldset>` with a `<legend>` is the recommended wrapper, it gives screen
readers the group name. Any element works, `data-gridselect` is only a
convention for selecting wrappers and for the stylesheet.
