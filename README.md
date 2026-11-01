# GridSelect

[![npm version](https://img.shields.io/npm/v/@emmgeede/gridselect)](https://www.npmjs.com/package/@emmgeede/gridselect)
[![CI](https://github.com/emmgeede/gridselect/actions/workflows/ci.yml/badge.svg)](https://github.com/emmgeede/gridselect/actions/workflows/ci.yml)
[![Accessibility](https://github.com/emmgeede/gridselect/actions/workflows/accessibility.yml/badge.svg)](https://github.com/emmgeede/gridselect/actions/workflows/accessibility.yml)
[![Bundle size](https://img.shields.io/bundlejs/size/@emmgeede/gridselect)](https://bundlejs.com/?q=@emmgeede/gridselect)
[![License: MIT](https://img.shields.io/github/license/emmgeede/gridselect)](LICENSE)

A dependency-free JavaScript component for picking from a list of choices.
You write a plain radio group, checkbox group or `<select>`, wrap it, and
GridSelect does the rest. Short lists stay visible as items. Longer lists
switch to a compact field that opens a panel with a search input and a
multi-column grid, fully keyboard accessible. Typing filters the items, or
highlights matches in place, and digits pick an entry directly.

Your markup stays native, so forms submit, reset and validate as usual, and
everything still works without JavaScript.

**[Try the demo](https://emmgeede.github.io/gridselect/)**

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/filter-dark.png?v=3">
  <img src="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/filter-light.png?v=3" width="100%" alt="A currency field with its panel open. The search input contains 'dollar' and six matching currencies are shown as numbered items in a three-column grid, the first one outlined as the cursor.">
</picture>

<sub><b>Long list, filter mode (default).</b> The field opened a panel with 40 currencies. Typing
"dollar" hides everything else and renumbers the six matches 1 to 6. The outlined item is the
cursor: Enter, a click or its digit picks it.</sub>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/short-dark.png?v=3">
  <img src="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/short-light.png?v=3" width="100%" alt="A short list of four shipping options shown as rounded items with digit badges 1 to 4, the first one selected.">
</picture>

<sub><b>Short list.</b> Up to 10 entries stay visible as items. They are native radio buttons
underneath; arrow keys move between them and the digits 1 to 4 pick one directly.</sub>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/highlight-dark.png?v=3">
  <img src="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/highlight-light.png?v=3" width="100%" alt="Highlight mode: all currencies stay in place, the two krone entries are shown in teal, the others dimmed, the cursor is on Norwegian krone, digit badges switch to S1, S2 for the second tier.">
</picture>

<sub><b>Long list, highlight mode</b> (<code>data-search="highlight"</code>). The same list searched for
"krone". Nothing is hidden on purpose: every entry keeps its place, so people who use the list
daily can rely on positions. The matches (Danish and Norwegian krone) are marked in teal, the
cursor jumps to the first match, all other entries are dimmed. Entries 11 to 20 are picked with
Shift and a digit (S1 to S0).</sub>

**Status:** version 0.8.0, early development. Published on npm as
`@emmgeede/gridselect`, because npm treats the plain name `gridselect` as too
similar to an older package. Versions
follow [Semantic Versioning](https://semver.org/). See
[Features](#features) for what works today and [CHANGELOG.md](CHANGELOG.md)
for what changed.

## Installation

```sh
npm install @emmgeede/gridselect
```

```js
import { gridselect } from "@emmgeede/gridselect";
import "@emmgeede/gridselect/gridselect.css"; // optional
```

Without a bundler, from a CDN (`window.gridselect`):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@emmgeede/gridselect@0/src/gridselect.css">
<script src="https://cdn.jsdelivr.net/npm/@emmgeede/gridselect@0/dist/gridselect.min.js"></script>
<script>
  document.querySelectorAll("[data-gridselect]").forEach((el) => gridselect(el));
</script>
```



## Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Reacting to changes](#reacting-to-changes)
  - [Several at once](#several-at-once)
- [API](#api)
  - [`gridselect(wrapper, options?)`](#gridselectwrapper-options)
  - [Options](#options)
  - [Above the threshold](#above-the-threshold)
  - [Multiple choice](#multiple-choice)
  - [`<select>` as source](#select-as-source)
  - [Search](#search)
  - [`instance.value`](#instancevalue)
  - [`instance.destroy()`](#instancedestroy)
  - [TypeScript](#typescript)
- [Styling](#styling)
  - [Showcase theme](#showcase-theme)
- [Keyboard](#keyboard)
  - [Digit shortcuts](#digit-shortcuts)
- [Accessibility](#accessibility)
- [Features](#features)
- [Browser support](#browser-support)
- [Development](#development)
- [License](#license)

## Usage

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
| `selectedText` | | `n => n + " selected"` | Field text of a multiple choice group with more than two entries chosen (one or two show their labels) |
| `shortcuts` | `data-shortcuts="off"` | `["", "Shift", "Alt"]` | Digit key tiers, see [Digit shortcuts](#digit-shortcuts). `false` turns them off |

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
  <div data-gridselect-scroller class="gridselect__scroller" role="listbox">
    <div data-gridselect-items class="gridselect__items" role="presentation">
      <div data-gridselect-item class="gridselect__item" role="option" aria-selected="true" data-value="EUR">Euro</div>
      …
    </div>
  </div>
</div>
```

The scroller scrolls, the item list inside grows freely, so the stylesheet
can give every grid row the height of the tallest one.

Style the states through attributes: `[aria-expanded="true"]` on the field,
`[aria-selected="true"]` on the selected item, `[data-cursor]` on the item
the arrow keys are on, `[aria-disabled="true"]` on disabled ones, and
`.gridselect__items--list` for the list layout. The grid's column count is
read from the item list's CSS (`grid-template-columns`, e.g.
`repeat(auto-fill, minmax(6rem, 1fr))`), so arrow up/down always jump one
visual row. The optional stylesheet (see [Styling](#styling)) does all of this, or
write your own.

Item text is the label's text content. Icons or other markup inside a label
are not copied into the panel.

### Multiple choice

Checkbox groups and `<select multiple>` above the threshold get the same
field and panel. The list carries `aria-multiselectable="true"`, picking an
item toggles it, fires `input` and `change` right away (like clicking a
checkbox) and keeps the panel open with the search as it was, so you can
filter for "dollar" and tick several in a row. The field shows one or two
labels, or `selectedText(n)` for more. `gs.value` is always an array.

### `<select>` as source

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
- Options inside `<optgroup>` are listed in order, the group labels are not
  shown yet. `disabled` on options, groups and the select is respected, the
  text comes from `option.label`.
- Without a `<legend>` or `aria-label` on the wrapper, the select's own
  `<label>` names the field.
- Changes made by your code show up after a `change` event on the select or
  a form reset. `gs.value = "m"` updates everything without events.
- `<select multiple>` becomes checkboxes the same way, with the panel's
  multiple choice above the threshold. `gs.value` is an array, and the form
  submits every selected option.

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

## Styling

GridSelect works without any CSS of ours. For a ready look, include the
optional stylesheet:

```js
import "@emmgeede/gridselect/gridselect.css";
```

or `<link rel="stylesheet" href="…/gridselect/src/gridselect.css">` from a
CDN. It styles the wrapper's direct `<label>`s as items (the native input
stays focusable but invisible, so wrap inputs in their label), the field,
the panel, the states and the digit badges, in light and dark mode.

Everything is inside `@layer gridselect`, so any rule of your own wins, no
`!important` needed. Most changes are just variables, on `:root`, on one
wrapper, or on any ancestor:

```css
:root {
  --gs-accent: #6d28d9;
  --gs-radius: 0.5rem;
}
```

| Variable | Light | Dark | Used for |
|---|---|---|---|
| `--gs-bg` | `#ffffff` | `#171d28` | Field and panel background |
| `--gs-item-bg` | `#f5f7fa` | `#1c2433` | Item and search background |
| `--gs-fg` | `#0e1117` | `#dee4ee` | Text |
| `--gs-muted` | `#636b78` | `#9ca3af` | Dimmed items, placeholders, disabled |
| `--gs-border` | `#7a8494` | `#7e8ca0` | Borders |
| `--gs-accent` | `#03a2a5` | `#03a2a5` | Selected item, focus ring, cursor |
| `--gs-accent-fg` | `#0e1117` | `#0e1117` | Text on the accent |
| `--gs-accent-text` | `#00787b` | `#03a2a5` | Matches in highlight mode |
| `--gs-key-bg` / `--gs-key-fg` | `#dce6ec` / `#0e1117` | `#2b3646` / `#dee4ee` | Digit badge |
| `--gs-key-selected-bg` | `#8ed5d6` | `#8ed5d6` | Digit badge on the selected item |
| `--gs-invalid` | `#b91c1c` | `#f87171` | Border of an invalid field |

Sizes: `--gs-font`, `--gs-radius`, `--gs-gap`, `--gs-item-min-height`
(`2rem`), `--gs-item-padding`, `--gs-item-min-width` (`8rem`, sets the grid
columns), `--gs-focus-width`, `--gs-panel-width` (`min(40rem, 100vw - 2rem)`),
`--gs-list-max-height` (`18rem`).

All default text and border colours meet WCAG 2.2 AA contrast (4.5:1 for
text, 3:1 for borders and focus), checked by the browser tests in both
modes. If you change colours, keep those ratios. Light or dark follows the
system; `data-theme="light"` or `data-theme="dark"` on any ancestor (e.g.
`<html>`) forces one.

### Showcase theme

The screenshots and the demo use an optional second stylesheet with a compact,
contemporary look: 14 px text, flat rows in the panel, soft fills instead of
outlines, a check mark on selected entries and small keycap badges. Load it
after the default stylesheet:

```js
import "@emmgeede/gridselect/gridselect.css";
import "@emmgeede/gridselect/themes/showcase.css";
```

It lives in its own layer (`gridselect-showcase`), so your own CSS still wins.
It keeps 4.5:1 for all text and 3:1 for the chevron, focus and cursor, but its
resting borders are subtle: the field is recognised by its text and chevron,
and the search input always shows a 3:1 border while it is focused. If you need
strong borders everywhere, stay with the default stylesheet alone. The theme
also works as a template for your own: copy it and change the variables.

## Keyboard

Up to the threshold the keys are native, GridSelect only adds digits (see
below). Radios: Tab enters and leaves the group, arrow keys move and select.
Checkboxes: each checkbox is a Tab stop, Space toggles.

Above the threshold:

| Where | Key | Action |
|---|---|---|
| Field | Enter, Space, Arrow down, click | Open the panel, focus the search input. A second click closes it |
| Panel | Arrow left / right | Previous / next item (grid layout only) |
| Panel | Arrow up / down | One row up / down (one item in list layout). Stops at the edges |
| Panel | Enter, click on an item | Pick it and close. In multiple choice: toggle it, the panel and the search stay |
| Panel | Escape | Close without change, focus back on the field |
| Panel | Tab, Shift+Tab, click outside | Close without change, focus moves on as usual |
| Panel | Digit (per tier) | Pick that item and close (toggle it in multiple choice) |

### Digit shortcuts

Every entry gets a digit: 1 to 9 and 0 pick the first ten, the next tier
(Shift by default) the next ten, then Alt. Below the threshold the digits
work while the focus is in the group (a radio gets checked and focused, a
checkbox toggles). In the panel they always pick and are never typed into
the search; in `filter` mode the visible matches are renumbered from 1, in
`highlight` mode the numbers stay put.

```js
gridselect(el, { shortcuts: ["", "Shift", "Alt"] });      // default
gridselect(el, { shortcuts: ["Alt", "Control+Shift"] });  // plain digits stay free
gridselect(el, { shortcuts: false });                     // off
```

Tiers use `Shift`, `Alt`, `Control` and `Meta`, joined with `+`, and must
match exactly. The key's position counts, not the character, so Shift+1
works on every keyboard layout, and the number pad works too. Careful:
Ctrl+digit and Cmd+digit switch browser tabs, Alt opens menus on Windows,
and on many European layouts AltGr reports Control+Alt, so a `Control+Alt`
tier swallows characters like `{` (AltGr+7) in the search.
Labels with numbers (postcodes, years)? Use tiers without `""` or turn the
digits off, so numbers can be typed into the search.

GridSelect puts a `<span data-gridselect-key class="gridselect__key">` with
the digit at the start of each label (and of each panel item), marked
`aria-hidden` because the input gets `aria-keyshortcuts` instead. The tier is
in `data-modifiers`, and `data-prefix` holds readable letters for it (`S`
Shift, `A` Alt, `C` Control, `M` Meta, e.g. `CS` for Control+Shift), shown
before the digit with `.gridselect__key[data-prefix]::before { content:
attr(data-prefix) }`. Letters rather than symbols like ⇧, which are hard to
make out for many people. Want the digit
somewhere else or in your own form? Put an element with `data-gridselect-key`
into the label yourself: GridSelect fills it when it is empty and leaves it
alone when it has content. `destroy()` removes everything it added.

## Accessibility

GridSelect is built for WCAG 2.2 level AA:

- **Native first.** Below the threshold your radios and checkboxes stay
  native, with the browser's own semantics and keyboard handling.
- **WAI-ARIA patterns.** Above the threshold the field, the search input
  (`role="combobox"`, `aria-expanded`, `aria-activedescendant`) and the list
  (`role="listbox"`, `role="option"`, `aria-selected`, `aria-disabled`)
  follow the WAI-ARIA combobox and listbox patterns. All of them take the
  group's name from your `<legend>`, `aria-label` or `aria-labelledby`.
- **Keyboard only.** Everything works without a mouse: open, search, arrow
  keys, Enter, Escape, Tab, digits. Keys during an IME composition are left
  to the input method.
- **Announcements.** A `role="status"` region tells screen readers how many
  items match. Digit shortcuts are exposed as `aria-keyshortcuts`, the visible
  badges are `aria-hidden`.
- **Forms.** `required`, `disabled` and validation keep working, an invalid
  group moves focus to the field and sets `aria-invalid`.
- **Not by colour alone.** States come from attributes (`aria-selected`,
  `data-match`, `data-dimmed`) that styles can mark with more than colour.
  The default stylesheet meets AA contrast in light and dark mode, marks
  states with weight, outline or strike-through as well as colour, keeps
  text readable with increased text spacing and at 320 px width, and shows
  modifier keys as letters, not hard-to-read symbols.

Conformance is a property of the whole page, so a few things stay with you:
give every group a name, keep sufficient contrast if you write your own CSS,
and keep focus outlines visible. The behaviour above is covered by unit and
browser tests, and axe-core checks every state (closed, open, filtered,
highlighted, no matches, invalid) for WCAG 2.0, 2.1 and 2.2 A and AA in
light and dark mode on every push; the Accessibility badge above shows the
result. A manual screen reader pass (Orca, NVDA, VoiceOver) is still to
come.

## Features

| Feature | Status |
|---|---|
| Radio and checkbox groups, `value`, `destroy()`, TypeScript types | available |
| Grid panel above a configurable threshold (default 10), grid or list layout | available |
| Search modes `filter` (default) and `highlight` | available |
| Digit shortcuts with configurable modifier tiers | available |
| `<select>` as source | available |
| Optional stylesheet with CSS variables, light and dark | available |
| npm release and demo page | available |
| Multiple choice in the grid panel, `<select multiple>` | available |
| Options from a JS array | later |
| `<grid-select>` custom element | later |
| Fuzzy search, theme gallery, React/Vue wrappers | ideas |

## Browser support

Current evergreen browsers (Chrome, Edge, Firefox, Safari).

## Development

```sh
npm install
npm test             # unit tests (Vitest + jsdom), type check, package contents
npm run test:e2e     # browser tests (Playwright, Chromium) incl. axe-core checks
npm run build        # dist/gridselect.d.ts and dist/gridselect.min.js
npm run screenshots  # README images in assets/, from the demo page
npm run playground   # http://localhost:5173/playground/ (tests) and /demo/
```

The playground loads `src/gridselect.js` directly and shows every variant:
short and long radio groups, checkboxes, both search modes, the list layout,
a form with `required`, `disabled`, submit and reset, and a log of the
`change` events. Its styling is provisional until the stylesheet ships.

## License

[MIT](LICENSE)
