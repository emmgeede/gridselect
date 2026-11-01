# GridSelect

A dependency-free JavaScript component for picking from a list of choices.
You write a plain radio or checkbox group (or, later, a `<select>`), wrap it,
and GridSelect does the rest. Short lists stay visible as plain inputs. Radio
groups with more than 10 entries switch to a compact field that opens a panel
with a search input and a multi-column grid of items, fully keyboard
accessible. Typing filters the items, or highlights matches in place.

Your markup stays native, so forms submit, reset and validate as usual, and
everything still works without JavaScript.

**Status:** early development, not released on npm yet. See
[Features](#features) for what works today and [CHANGELOG.md](CHANGELOG.md)
for what changed.

## Usage

```html
<fieldset data-gridselect>
  <legend>Currency</legend>
  <label><input type="radio" name="cur" value="EUR" checked> Euro</label>
  <label><input type="radio" name="cur" value="CHF"> Swiss franc</label>
</fieldset>
```

```js
import { gridselect } from "gridselect";

const gs = gridselect(document.querySelector("[data-gridselect]"));
gs.value;           // "EUR"
gs.value = "CHF";   // checks the CHF radio, fires no event
```

### Reacting to changes

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

### Several at once

```js
document.querySelectorAll("[data-gridselect]").forEach((el) => gridselect(el));
```

Use `forEach((el) => gridselect(el))`, not `forEach(gridselect)`: the second
form passes the index as a second argument, which will be read as options in
later versions.

A `<fieldset>` with a `<legend>` is the recommended wrapper, it gives screen
readers the group name. Any element works, `data-gridselect` is only a
convention for selecting wrappers and for the stylesheet.

## API

### `gridselect(wrapper, options?)`

Returns the instance for `wrapper`. Calling it again on the same element
returns the same instance (options of later calls are ignored).

The wrapper holds either radios with one shared `name` (single choice) or
checkboxes (multiple choice). Throws a `TypeError` if `wrapper` is not an
element, if it mixes radios and checkboxes, or if its radios have different
names. Duplicate values log a warning. For radios the first input with that
value wins, for checkboxes all of them are set.

### Options

| Option | Data attribute | Default | Meaning |
|---|---|---|---|
| `threshold` | `data-threshold` | `10` | Radio groups with more radios than this get the panel. `0` means always |
| `layout` | `data-layout` | `"grid"` | `"list"` stacks the items in one column, for long labels |
| `placeholder` | | `"Select…"` | Field text while nothing is selected |
| `searchPlaceholder` | | `"Search…"` | Placeholder of the search input |
| `search` | `data-search` | `"filter"` | `"filter"` hides non-matches, `"highlight"` keeps every item in place and marks matches |
| `noResultsText` | | `"No matches"` | Hint (filter mode) and announcement when nothing matches |
| `resultsText` | | `n => n === 1 ? "1 result" : n + " results"` | Screen reader announcement of the match count. A function, so plural rules of any language fit |

JS options win over data attributes. Invalid values fall back to the default.

### Above the threshold

GridSelect hides your radios and labels (`hidden`) but keeps them in the
form: they still submit, reset and validate, and picking an item checks the
radio and fires `input` and `change` on it, so your listeners keep working.
It adds two elements to the wrapper:

```html
<button data-gridselect-field class="gridselect__field" aria-haspopup="listbox">Euro</button>
<div data-gridselect-panel class="gridselect__panel" hidden>
  <input data-gridselect-search class="gridselect__search" role="combobox">
  <div data-gridselect-items class="gridselect__items" role="listbox">
    <div data-gridselect-item class="gridselect__item" role="option" aria-selected="true" data-value="EUR">Euro</div>
    …
  </div>
</div>
```

Style the states through attributes: `[aria-expanded="true"]` on the field,
`[aria-selected="true"]` on the selected item, `[data-cursor]` on the item
the arrow keys are on, `[aria-disabled="true"]` on disabled ones, and
`.gridselect__items--list` for the list layout. The grid's column count is
read from the CSS (`grid-template-columns`, e.g.
`repeat(auto-fill, minmax(6rem, 1fr))`), so arrow up/down always jump one
visual row. A ready-made stylesheet is planned. Until then the panel needs
your own CSS to look like a grid.

Item text is the label's text content. Icons or other markup inside a label
are not copied into the panel.

### Search

Typing matches the label text (not the value), ignoring case, surrounding
spaces and accents: `zur` finds `Zürich`. Want `CHF` to be searchable? Put
it in the label, e.g. `Swiss franc (CHF)`.

- `filter` (default): non-matches get `hidden`, matches that start with the
  query come first. The cursor jumps to the first match, arrow keys walk the
  visible items only. With no match, `[data-gridselect-empty]` shows the
  `noResultsText` and Enter does nothing.
- `highlight`: items never move. Matches get `data-match`, the rest
  `data-dimmed`, the cursor jumps to the first match and arrow keys still
  reach every item, so frequent users can rely on positions.

A visually hidden `[data-gridselect-status]` (`role="status"`) announces the
number of matches to screen readers. The search starts empty on every open.

The field, the search input and the listbox take their accessible name from
the wrapper's `<legend>`, `aria-labelledby` or `aria-label`. Keys pressed
during an IME composition are left to the input method. If a required group is empty on submit,
the field gets focus and `aria-invalid="true"`.

### `instance.value`

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

### `instance.destroy()`

Forgets the instance and removes everything GridSelect added (field, panel,
`hidden` attributes, generated ids, listeners).

### TypeScript

Types ship with the package, no `@types` package needed.

## Keyboard

Up to the threshold everything is native, GridSelect does not intercept any
key. Radios: Tab enters and leaves the group, arrow keys move and select.
Checkboxes: each checkbox is a Tab stop, Space toggles.

Above the threshold:

| Where | Key | Action |
|---|---|---|
| Field | Enter, Space, Arrow down, click | Open the panel, focus the search input. A second click closes it |
| Panel | Arrow left / right | Previous / next item (grid layout only) |
| Panel | Arrow up / down | One row up / down (one item in list layout). Stops at the edges |
| Panel | Enter, click on an item | Pick it and close |
| Panel | Escape | Close without change, focus back on the field |
| Panel | Tab, Shift+Tab, click outside | Close without change, focus moves on as usual |

## Features

| Feature | Status |
|---|---|
| Radio and checkbox groups, `value`, `destroy()`, TypeScript types | available |
| Grid panel above a configurable threshold (default 10), grid or list layout | available |
| Search modes `filter` (default) and `highlight` | available |
| Digit shortcuts with configurable modifier tiers | planned |
| `<select>` as source | planned |
| Optional stylesheet with CSS variables, light and dark | planned |
| npm release and demo page | planned |
| Multiple choice in the grid panel, `<select multiple>` | later |
| Options from a JS array | later |
| `<grid-select>` custom element | later |
| Fuzzy search, theme gallery, React/Vue wrappers | ideas |

## Browser support

Current evergreen browsers (Chrome, Edge, Firefox, Safari).

## Development

```sh
npm install
npm test   # unit tests (Vitest + jsdom) and type check
```

## License

[MIT](LICENSE)
