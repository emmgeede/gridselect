# GridSelect

A dependency-free JavaScript component for picking from a list of choices.
You write a plain radio or checkbox group (or, later, a `<select>`), wrap it,
and GridSelect does the rest. Short lists stay visible as chips. Long lists
will switch to a searchable grid that filters (or highlights) as you type,
with full keyboard navigation.

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

Several at once:

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

### `gridselect(wrapper)`

Returns the instance for `wrapper`. Calling it again on the same element
returns the same instance.

The wrapper holds either radios with one shared `name` (single choice) or
checkboxes (multiple choice). Throws a `TypeError` if `wrapper` is not an
element, if it mixes radios and checkboxes, or if its radios have different
names. Duplicate values log a warning, the first input wins.

### `instance.value`

| Group | Read | Set |
|---|---|---|
| Radios | checked value, or `null` | a value checks that radio. `null` or an unknown value clears the selection |
| Checkboxes | array of checked values in DOM order, `[]` if none | an array checks exactly those values, unknown ones are ignored. Anything else throws a `TypeError` |

Setting the value fires no event, just like setting `checked` on a native
input. User changes fire the native `change` event, which bubbles up to the
wrapper:

```js
wrapper.addEventListener("change", () => console.log(gs.value));
```

### `instance.destroy()`

Forgets the instance. GridSelect does not change your markup, so there is
nothing to restore.

### TypeScript

Types ship with the package, no `@types` package needed.

## Keyboard

Native, GridSelect does not intercept any key. Radios: Tab enters and leaves
the group, arrow keys move and select. Checkboxes: each checkbox is a Tab
stop, Space toggles.

## Features

| Feature | Status |
|---|---|
| Radio and checkbox groups, `value`, `destroy()`, TypeScript types | available |
| Grid panel above a configurable threshold (default 10), grid or list layout | planned |
| Search modes `filter` (default) and `highlight` | planned |
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
