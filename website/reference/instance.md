# Instance and events

## `instance.value`

| Group | Read | Set |
|---|---|---|
| Radios | checked value, or `null` | a value checks that radio. `null` or an unknown value clears the selection |
| Checkboxes | array of checked values in DOM order, `[]` if none | an array checks exactly those values, unknown ones are ignored. Anything else throws a `TypeError` |

Numbers match their string form, so `gs.value = 2` checks the input with
`value="2"`. Any other type (arrays on a radio group, booleans, objects)
matches nothing. Setting the value fires no event, just like setting `checked` on a native
input. User changes fire the native `change` event, which bubbles up to the
wrapper:

```js
wrapper.addEventListener("change", () => console.log(gs.value));
```

## `instance.setItems(items)`

Only for instances created with `items`, see
[Entries from JavaScript](/guide/sources.md#entries-from-javascript). Throws a `TypeError`
otherwise.

## `instance.destroy()`

Forgets the instance and removes everything GridSelect added (field, panel,
`hidden` attributes, generated ids, listeners).

## TypeScript

Types ship with the package, no `@types` package needed.

## Events

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
