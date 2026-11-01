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

[Unreleased]: https://github.com/emmgeede/gridselect/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/emmgeede/gridselect/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/emmgeede/gridselect/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/emmgeede/gridselect/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/emmgeede/gridselect/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/emmgeede/gridselect/releases/tag/v0.1.0
