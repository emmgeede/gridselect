# Changelog

All notable changes to GridSelect. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `gridselect(wrapper)` turns a native radio or checkbox group inside a
  wrapper into an instance. Same wrapper, same instance.
- `instance.value` reads and sets the selection: a string or `null` for
  radios, an array for checkboxes. Setting fires no event. Numbers
  match their string form, other types match nothing.
- `instance.destroy()`.
- Clear `TypeError`s for a missing element, mixed radios and checkboxes, and
  radios with different names. Warning for duplicate values.
- TypeScript declarations generated from JSDoc.
- Grid panel for radio groups above a threshold (option `threshold` /
  `data-threshold`, default 10): a closed field, a panel with a search input
  and one item per radio, following the WAI-ARIA combobox and listbox
  pattern. Arrow keys move through the grid using the column count from the
  CSS. Enter or click picks, Escape, Tab, outside clicks and a second click
  on the field close. Keys during IME composition are not intercepted.
- Option `layout` / `data-layout`: `"list"` for one column with long labels.
- Options `placeholder` and `searchPlaceholder`.
- Search in the panel, option `search` / `data-search`: `"filter"` (default)
  hides non-matches and lists label-start matches first, `"highlight"` keeps
  items in place and marks them with `data-match` / `data-dimmed`. Matching
  ignores case, surrounding spaces and accents.
- Screen reader announcement of the match count, options `resultsText` and
  `noResultsText`.
- Picking in the panel checks the native radio and fires `input` and
  `change`. Form submit, reset, `required` and `disabled` keep working.

### Changed

- Entries are called "items" (was "chips" during development).
