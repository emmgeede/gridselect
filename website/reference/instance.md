# Instance and events

The function `gridselect()` returns an **instance**: a small object through which your code reads and changes the selection and, when it is no longer needed, removes GridSelect again. This page describes the instance and the events your code can listen to.

```js
const gs = gridselect(document.querySelector("#currency"));
```

## `instance.value`

The property `value` returns the current selection and lets you change it. What it returns depends on the kind of group:

| Group | Reading returns | Setting accepts |
|---|---|---|
| Radio buttons or a single `<select>` (one choice) | The chosen value as a string, or `null` when nothing is chosen. | A value: the matching entry is chosen. `null` or a value that does not exist clears the selection. |
| Checkboxes or `<select multiple>` (several choices) | An array of all chosen values in the order of the list, or an empty array. | An array: exactly those entries are chosen, values that do not exist are ignored. Anything other than an array throws a `TypeError`. |

Numbers are compared in their text form, so `gs.value = 2` chooses the entry whose value is `"2"`. Values of other types, such as booleans or objects, match nothing.

Setting `value` from code does not fire an event, in the same way that setting `checked` on a native checkbox does not. If other parts of your page must react, call them yourself after setting the value. The field text, the panel and the native inputs are all updated at once.

```js
gs.value = "EUR";
console.log(gs.value); // "EUR"
```

## `instance.setItems(items)`

`setItems()` replaces all entries of an instance that was created with the `items` option. It accepts the same format as `items`, keeps every chosen value that still exists, drops the others, and switches between visible items and the panel if the new number of entries crosses the threshold. It fires no event. Instances created from your own markup or from a `<select>` throw a `TypeError` when `setItems()` is called, because their entries belong to your HTML. [Sources](/guide/sources.md#replacing-the-entries-later) explains the details.

```js
gs.setItems([{ value: "EUR", label: "Euro" }, { value: "USD", label: "US dollar" }]);
```

## `instance.destroy()`

`destroy()` removes everything GridSelect added: the field, the panel, the digit badges, the `hidden` attributes on your inputs, generated ids and all event listeners. Your original markup is left exactly as it was before `gridselect()` was called, and the instance is forgotten, so a later `gridselect()` on the same wrapper starts from scratch. Use it when you remove a group from the page, or when you have changed its inputs and want GridSelect to read them again.

## Events

GridSelect does not define events of its own. Whenever someone picks an entry, whether by clicking, with the keyboard or in the panel, GridSelect checks the native input and the browser fires the usual `input` and `change` events on it. Both events bubble, so one listener on the wrapper covers the whole group:

```js
const wrapper = document.querySelector("#currency");
const gs = gridselect(wrapper);

wrapper.addEventListener("change", (event) => {
  console.log(event.target.value); // the input that changed, for example "CHF"
  console.log(gs.value);           // the whole selection: "CHF", or ["a", "c"] for checkboxes
});
```

When the source is a `<select>`, the events fire on the select itself, so `event.target` is the select and existing listeners on it keep working. The `<grid-select>` element lets the events bubble up from inside, so a listener on the element works as well; the [React and Vue components](/guide/frameworks.md) turn them into `onChange` and `v-model`.

Typing into the search input does not fire `input` or `change` on the wrapper, because searching does not change the selection.

## TypeScript

The package ships its own type declarations, so no separate `@types` package is needed. Editors show the options with their allowed values, and type checking catches mistakes such as an unknown layout name. The `<grid-select>` element is also known to TypeScript, so `document.querySelector("grid-select")` returns a typed element with `value`, `items`, `load` and the form properties.
