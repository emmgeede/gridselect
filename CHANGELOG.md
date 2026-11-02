# Changelog

All notable changes to GridSelect. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions follow
[Semantic Versioning](https://semver.org/). Dates are ISO 8601 (YYYY-MM-DD),
each version has a matching git tag `vX.Y.Z`.

Until 1.0.0 every finished feature raises the minor version and fixes raise
the patch version. 1.0.0 will be the first npm release; from then on the
JavaScript API, the data attributes and the `--gs-*` variables are stable,
and breaking changes need a new major version.

## [Unreleased]

## [0.15.0] - 2026-11-02

### Added

- React and Vue wrappers: `@emmgeede/gridselect/react` (`<GridSelect>` with
  `value`/`onChange`, `defaultValue`, `items`, props in camelCase, `ref`;
  React 18 and 19) and `@emmgeede/gridselect/vue` (`v-model`, the same
  props, `change` and `input` passed on; Vue 3.3+). Both wrap
  `<grid-select>`; React and Vue are optional peer dependencies.

## [0.14.0] - 2026-11-02

### Added

- Themes `high-contrast` (black and white, 2 px borders, 7:1 text, WCAG
  AAA) and `compact` (dense spacing, colours of the default stylesheet),
  next to `showcase`.
- Any file in `themes/` can be imported: `"./themes/*"` export, e.g.
  `@emmgeede/gridselect/themes/compact.css`.
- `CONTRIBUTING.md` with the rules for new themes. The browser tests check
  every theme automatically (axe, text contrast, chevron, focus and cursor,
  header comment, own layer, light and dark).
- Demo: a Theme switch (built with GridSelect) offers Default and every
  theme, remembers the choice, and shows the theme's description.

### Changed

- Demo: the light and dark switch is labelled "Mode".

## [0.13.0] - 2026-11-02

### Added

- Group headings in the panel: options inside `<optgroup>` (in a `<select>`
  or a `<grid-select>`) and group objects in `items`
  (`{ label, items: [...] }`, also in `setItems()`) get a heading above
  their entries. Each group starts a new row, the heading stays at the top
  while its group scrolls by, and each group is a `role="group"` named by its
  heading. Arrow keys cross groups, digits run on, the filter keeps the
  group order.

### Changed

- Size budget: core 7 kB, core plus element 8.5 kB (min+gzip).
- Errors for invalid `items` name the path, e.g. `items[1].items[0]`,
  instead of `position 1`.

## [0.12.2] - 2026-11-02

### Added

- README images for the grid and flow layouts, and animations for search,
  multiple choice, keyboard navigation and digit shortcuts. With reduced
  motion turned on, a still image replaces each animation.

## [0.12.1] - 2026-11-01

### Fixed

- A click next to the field (inside its wrapper, e.g. on empty space or the
  legend) now closes the open panel, like any other click outside.

### Changed

- The demo shows both panel layouts, the auto-width grid and the flow layout.
- Releases are published from GitHub Actions with npm Trusted Publishing and
  provenance when a version tag is pushed.
- README logo and screenshots link to the demo, which also keeps GitHub from
  drawing a background behind them.

## [0.12.0] - 2026-11-01

### Added

- Grid columns as wide as the widest item: the panel measures its items on
  open and sets `--gs-auto-width`; the stylesheets use it (at least
  `--gs-item-min-width`, at most half the list), so short labels get as many
  columns as fit.
- Flow layout, `layout: "flow"` (`data-layout`, element attribute `layout`):
  items run one after another like chips; arrow up and down jump to the
  nearest item in the row above or below.
- Logo in the README.

### Changed

- The showcase theme, the demo and the README screenshots use sky blue as
  accent; the default stylesheet stays teal.
- Size budget: core 6.5 kB, core plus element 8 kB (min+gzip).

## [0.11.0] - 2026-11-01

### Added

- Fuzzy matching, option `match: "fuzzy"` (`data-match-mode`, element
  attribute `match`): letters of each word in order with gaps, words in any
  order, better matches first in filter mode. Works with both search modes.

### Fixed

- The published demo missed `src/element.js` and showed nothing interactive.
  The site is now assembled by `npm run site`, and a browser test checks the
  assembled site for script errors and missing files before every deploy.

## [0.10.0] - 2026-11-01

### Added

- Custom element `<grid-select>` (`@emmgeede/gridselect/element`, CDN file
  `dist/gridselect-element.min.js`): builds a named fieldset with native
  inputs from its `<option>` children or the `items` property, light DOM,
  attributes for all options, `value` and `items` properties, rebuilds on
  attribute and option changes while keeping choice and focus.
- A test guards the size budget: core 6 kB, core plus element 7.5 kB gzip.

## [0.9.0] - 2026-11-01

### Added

- Entries from a JS array: options `items`, `name`, `value` and `multiple`
  build native radios or checkboxes in an empty wrapper.
  `instance.setItems(items)` swaps them later, keeps chosen values that still
  exist and switches between visible items and the panel as needed.

### Changed

- README: installation right after the introduction, screenshots at full
  width with three columns in the panel and a transparent backdrop around
  the card, so they sit on GitHub's own light or dark background. Each
  screenshot has a caption explaining what it shows.

## [0.8.0] - 2026-11-01

### Added

- Optional showcase theme `@emmgeede/gridselect/themes/showcase.css`:
  compact, contemporary look (14 px text, flat panel rows, soft fills, check
  mark on selected entries, keycap badges), light and dark, WCAG AA text
  contrast. Used by the demo and the README screenshots.

- Multiple choice in the panel: checkbox groups above the threshold get the
  field and panel, items toggle and the panel stays open, the field shows up
  to two labels or `selectedText(n)` (option, default `n + " selected"`).
- `<select multiple>` is supported: generated checkboxes, the select stays
  the source of truth and fires `input` and `change`.

### Changed

- `<select multiple>` is no longer left native with a warning.
- README screenshots show the showcase theme, framed with padding, rounded
  corners and a light neutral backdrop.
- The demo page has a new split layout with a style switch and a note on
  what the showcase theme does and does not keep from WCAG.
- Grid rows in the panel share the height of the tallest row, and digit
  badges have a fixed width so labels line up. The listbox role moved to a
  new scroll container (`[data-gridselect-scroller]`) around the item list.

### Fixed

- Typing in the panel's search input no longer sends `input` and `change`
  events to the wrapper, so `change` listeners only see real selections.

## [0.7.1] - 2026-11-01

### Changed

- Published on npm as `@emmgeede/gridselect`: npm rejected the plain name
  `gridselect` as too similar to an existing package. Imports are now
  `@emmgeede/gridselect` and `@emmgeede/gridselect/gridselect.css`. 0.7.0 was
  tagged but never published.

## [0.7.0] - 2026-11-01

### Added

- Minified build `dist/gridselect.min.js` for use without a bundler
  (`window.gridselect`), CDN fields `unpkg` and `jsdelivr`, tests and build
  run before every publish.
- Demo page, published on GitHub Pages: https://emmgeede.github.io/gridselect/
- README screenshots (light and dark), badges, installation section.
- Automated accessibility checks with axe-core (WCAG 2.0/2.1/2.2 A and AA)
  in every state, light and dark, on every push.
- CI on GitHub Actions for unit and browser tests.

### Fixed

- Filtering no longer does quadratic work per keystroke.

## [0.6.0] - 2026-11-01

### Added

- Optional stylesheet `gridselect/gridselect.css` in `@layer gridselect`:
  items, field, panel, states and digit badges, light and dark mode
  (`prefers-color-scheme` or `data-theme`), all colours and sizes as `--gs-*`
  variables, WCAG 2.2 AA contrast.

## [0.5.0] - 2026-11-01

### Added

- `<select>` as source: GridSelect hides the select and builds radios for
  its options (not submitted), so selects get the same items, panel, search
  and digits. Picks set `select.value` and fire `input` and `change` on the
  select. An option with an empty value is the placeholder. `required`,
  `disabled`, reset and the select's `<label>` are respected.
- `<select multiple>` stays native with a console warning, `value` already
  reads and writes it as an array.

### Fixed

- The panel picks up select changes made by code without an event when it
  opens.

## [0.4.0] - 2026-11-01

### Added

- Digit shortcuts, option `shortcuts` / `data-shortcuts="off"`: 1 to 9 and
  0 pick ten entries per tier, tiers default to `["", "Shift", "Alt"]` and
  take any combination of `Shift`, `Alt`, `Control`, `Meta`. A digit badge
  (`[data-gridselect-key]`) is added to each label and panel item, or an
  existing one in the label is used. Inputs and items get
  `aria-keyshortcuts`.
- Badges of modifier tiers carry readable letters in `data-prefix` (`S1`,
  `A3`, `CS2`) instead of symbols.

### Changed

- With digit shortcuts on (the default) GridSelect adds the digit badges to
  your labels. `destroy()` removes them again.

### Fixed

- Hidden native labels, the closed panel and filtered-out items stay hidden
  even when the page CSS sets `display` on them.
- Number pad keys with NumLock off navigate instead of picking an item.
- Spaces around `+` in tier names are accepted.

## [0.3.0] - 2026-11-01

### Added

- Search in the panel, option `search` / `data-search`: `"filter"` (default)
  hides non-matches and lists label-start matches first, `"highlight"` keeps
  items in place and marks them with `data-match` / `data-dimmed`. Matching
  ignores case, surrounding spaces and accents.
- Screen reader announcement of the match count, options `resultsText` and
  `noResultsText`.

### Fixed

- A throwing `resultsText` no longer stops the filtering.

## [0.2.0] - 2026-11-01

### Added

- Grid panel for radio groups above a threshold (option `threshold` /
  `data-threshold`, default 10): a closed field, a panel with a search input
  and one item per radio, following the WAI-ARIA combobox and listbox
  pattern. Arrow keys move through the grid using the column count from the
  CSS. Enter or click picks, Escape, Tab, outside clicks and a second click
  on the field close. Keys during IME composition are not intercepted.
- Option `layout` / `data-layout`: `"list"` for one column with long labels.
- Options `placeholder` and `searchPlaceholder`.
- Picking in the panel checks the native radio and fires `input` and
  `change`. Form submit, reset, `required` and `disabled` keep working.

### Changed

- Entries are called "items" (were "chips" during development).

## [0.1.0] - 2026-11-01

### Added

- `gridselect(wrapper)` turns a native radio or checkbox group inside a
  wrapper into an instance. Same wrapper, same instance.
- `instance.value` reads and sets the selection: a string or `null` for
  radios, an array for checkboxes. Setting fires no event. Numbers match
  their string form, other types match nothing.
- `instance.destroy()`.
- Clear `TypeError`s for a missing element, mixed radios and checkboxes, and
  radios with different names. Warning for duplicate values.
- TypeScript declarations generated from JSDoc.

[Unreleased]: https://github.com/emmgeede/gridselect/compare/v0.15.0...HEAD
[0.15.0]: https://github.com/emmgeede/gridselect/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/emmgeede/gridselect/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/emmgeede/gridselect/compare/v0.12.2...v0.13.0
[0.12.2]: https://github.com/emmgeede/gridselect/compare/v0.12.1...v0.12.2
[0.12.1]: https://github.com/emmgeede/gridselect/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/emmgeede/gridselect/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/emmgeede/gridselect/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/emmgeede/gridselect/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/emmgeede/gridselect/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/emmgeede/gridselect/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/emmgeede/gridselect/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/emmgeede/gridselect/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/emmgeede/gridselect/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/emmgeede/gridselect/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/emmgeede/gridselect/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/emmgeede/gridselect/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/emmgeede/gridselect/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/emmgeede/gridselect/releases/tag/v0.1.0
