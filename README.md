<p align="center"><a href="https://gridselect.im/demo/"><img src="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/logo.svg?v=3" width="80" alt="GridSelect logo: four rounded squares in shades of sky blue"></a></p>

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

**[Try the demo](https://gridselect.im/demo/)**

<a href="https://gridselect.im/demo/">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/filter-dark.png?v=5">
  <img src="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/filter-light.png?v=5" width="100%" alt="A currency field with its panel open. The search input contains 'dollar' and six matching currencies are shown as numbered items in a three-column grid, the first one outlined as the cursor.">
</picture>
</a>

<sub><b>Long list, filter mode (default).</b> The field opened a panel with 40 currencies. Typing
"dollar" hides everything else and renumbers the six matches 1 to 6. The outlined item is the
cursor: Enter, a click or its digit picks it.</sub>

<a href="https://gridselect.im/demo/">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/short-dark.png?v=5">
  <img src="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/short-light.png?v=5" width="100%" alt="A short list of four shipping options shown as rounded items with digit badges 1 to 4, the first one selected.">
</picture>
</a>

<sub><b>Short list.</b> Up to 10 entries stay visible as items. They are native radio buttons
underneath; arrow keys move between them and the digits 1 to 4 pick one directly.</sub>

<a href="https://gridselect.im/demo/">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/highlight-dark.png?v=5">
  <img src="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/highlight-light.png?v=5" width="100%" alt="Highlight mode: all currencies stay in place, the two krone entries are shown in blue, the others dimmed, the cursor is on Norwegian krone, digit badges switch to S1, S2 for the second tier.">
</picture>
</a>

<sub><b>Long list, highlight mode</b> (<code>data-search="highlight"</code>). The same list searched for
"krone". Nothing is hidden on purpose: every entry keeps its place, so people who use the list
daily can rely on positions. The matches (Danish and Norwegian krone) are marked in blue, the
cursor jumps to the first match, all other entries are dimmed. Entries 11 to 20 are picked with
Shift and a digit (S1 to S0).</sub>

**Status:** version 1.2.0, stable. Published on npm as
`@emmgeede/gridselect`, because npm treats the plain name `gridselect` as too
similar to an older package. Versions
follow [Semantic Versioning](https://semver.org/). See
[Features](#features) for what works today and [CHANGELOG.md](CHANGELOG.md)
for what changed.

## Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Reacting to changes](#reacting-to-changes)
  - [Several at once](#several-at-once)
- [Documentation](#documentation)
- [Features](#features)
- [Browser support](#browser-support)
- [Development](#development)
- [License](#license)

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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@emmgeede/gridselect@1/src/gridselect.css">
<script src="https://cdn.jsdelivr.net/npm/@emmgeede/gridselect@1/dist/gridselect.min.js"></script>
<script>
  document.querySelectorAll("[data-gridselect]").forEach((el) => gridselect(el));
</script>
```

Prefer HTML only? Use the custom element, see [`<grid-select>`](https://gridselect.im/docs/guide/frameworks.html):

```html
<script src="https://cdn.jsdelivr.net/npm/@emmgeede/gridselect@1/dist/gridselect-element.min.js"></script>
```

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
gs.value; // "EUR"
gs.value = "CHF"; // checks the CHF radio, fires no event
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
  // the whole selection: "CHF", or ["a", "c"] for checkboxes
  console.log(gs.value);
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

## Documentation

The full documentation, with a live example on every page, is at
**[gridselect.im/docs](https://gridselect.im/docs/)**.

- **Guide:** [sources](https://gridselect.im/docs/guide/sources.html) (radios, checkboxes, `<select>`,
  `items`), [entries from a server](https://gridselect.im/docs/guide/server.html),
  [the panel](https://gridselect.im/docs/guide/panel.html), [search](https://gridselect.im/docs/guide/search.html),
  [keyboard and digits](https://gridselect.im/docs/guide/keyboard.html), [groups](https://gridselect.im/docs/guide/groups.html),
  [pinned and recent entries](https://gridselect.im/docs/guide/pinned.html),
  [descriptions](https://gridselect.im/docs/guide/descriptions.html),
  [multiple choice](https://gridselect.im/docs/guide/multiple.html), [forms](https://gridselect.im/docs/guide/forms.html),
  [styling and themes](https://gridselect.im/docs/guide/styling.html),
  [accessibility](https://gridselect.im/docs/guide/accessibility.html),
  [`<grid-select>`, React, Vue and others](https://gridselect.im/docs/guide/frameworks.html).
- **Reference:** [options](https://gridselect.im/docs/reference/), [attributes and hooks](https://gridselect.im/docs/reference/attributes.html),
  [instance and events](https://gridselect.im/docs/reference/instance.html), [CSS variables](https://gridselect.im/docs/reference/css.html).

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
| Entries from a JS array, `setItems()` | available |
| `<grid-select>` custom element | available |
| Fuzzy matching | available |
| Auto column width and flow layout | available |
| Group headings (`<optgroup>`, groups in `items`) | available |
| Pinned and recent entries | available |
| Upper limit for multiple choice (`max`) | available |
| Descriptions (a second line per entry) | available |
| Panel opens where there is room, up to the window edge | available |
| Panel in the full window width | available |
| `<grid-select>` as a form control (validity, reset, `FormData`) | available |
| Entries from a server (`load`) | available |
| Themes: showcase, high contrast, compact, open for contributions | available |
| React and Vue wrappers | available |

## Browser support

Current evergreen browsers (Chrome, Edge, Firefox, Safari).

## Development

```sh
npm install
npm test             # unit tests (Vitest + jsdom), type check, package contents
npm run test:e2e     # browser tests (Playwright, Chromium) incl. axe-core checks
npm run build        # dist/gridselect.d.ts and dist/gridselect.min.js
npm run screenshots  # README images and animations in assets/, from the demo page (needs ImageMagick)
npm run playground   # http://localhost:5173/playground/ (tests) and /demo/
node scripts/pr-check.js  # the contribution rules CI checks on pull requests
```

Contributing: read [AGENTS.md](AGENTS.md) (rules for people and AI agents,
with a `contributing` skill for Claude Code) and, for themes,
[CONTRIBUTING.md](CONTRIBUTING.md).

Releases: pushing a version tag (`vX.Y.Z`, matching `package.json`) runs the
Publish workflow, which tests, builds and publishes to npm with provenance.

The playground loads `src/gridselect.js` directly and shows every variant:
short and long radio groups, checkboxes, both search modes, the list layout,
a form with `required`, `disabled`, submit and reset, and a log of the
`change` events. Its styling is provisional until the stylesheet ships.

## License

[MIT](LICENSE)
