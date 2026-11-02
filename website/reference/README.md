# Options

Returns the instance for `wrapper`. Calling it again on the same element
returns the same instance (options of later calls are ignored).

The wrapper holds either radios with one shared `name` (single choice) or
checkboxes (multiple choice). Throws a `TypeError` if `wrapper` is not an
element, if it mixes radios and checkboxes, or if its radios have different
names. Duplicate values log a warning. For radios the first input with that
value wins, for checkboxes all of them are set.

## Options

| Option | Data attribute | Default | Meaning |
|---|---|---|---|
| `threshold` | `data-threshold` | `10` | Radio groups with more radios than this get the panel. `0` means always |
| `layout` | `data-layout` | `"grid"` | `"grid"` aligns items in columns as wide as the widest one, `"list"` stacks them in one column for long labels, `"flow"` lets them run one after another like chips |
| `placeholder` | | `"Select…"` | Field text while nothing is selected |
| `searchPlaceholder` | | `"Search…"` | Placeholder of the search input |
| `search` | `data-search` | `"filter"` | `"filter"` hides non-matches, `"highlight"` keeps every item in place and marks matches |
| `match` | `data-match-mode` | `"substring"` | `"fuzzy"` matches letters in order with gaps and words in any order, see [Search](/guide/search.md) |
| `noResultsText` | | `"No matches"` | Hint (filter mode) and announcement when nothing matches |
| `resultsText` | | `n => n === 1 ? "1 result" : n + " results"` | Screen reader announcement of the match count. A function, so plural rules of any language fit |
| `selectedText` | | `n => n + " selected"` | Field text of a multiple choice group with more than two entries chosen (one or two show their labels) |
| `items` | | | Entries for an empty wrapper, see [Entries from JavaScript](/guide/sources.md#entries-from-javascript) |
| `name` | | | Form name of the inputs built from `items` |
| `value` | | | Initial choice for `items` (an array with `multiple`) |
| `multiple` | | `false` | Build checkboxes instead of radios from `items` |
| `shortcuts` | `data-shortcuts="off"` | `["", "Shift", "Alt"]` | Digit key tiers, see [Digit shortcuts](/guide/keyboard.md#digit-shortcuts). `false` turns them off |
| `panelWidth` | `data-panel-width` | `"full"` | `"full"`: the panel spans the window, 10 px from each edge, narrower when everything fits in one row. `"fixed"`: `--gs-panel-width` from the field's edge |
| `panelHeight` | `data-panel-height` | `"auto"` | `"auto"`: the panel opens where it has room and grows up to the window edge. `"fixed"`: always below, list as high as `--gs-list-max-height`. See [Above the threshold](/guide/panel.md) |
| `load` | | | `(query, signal) => Promise<items>`: entries from a server, see [Entries from a server](/guide/server.md) |
| `minQueryLength`, `minQueryText` | | `0`, `n => "Type " + n + " characters to search"` | With `load`: load only from this many characters, and the hint below |
| `loadingText`, `errorText` | | `"Loading…"`, `"Could not load entries"` | With `load`: shown and announced while loading and on failure |
| `searchDescription` | `data-search-description` | `false` | Search the entries' descriptions too, see [Descriptions](/guide/descriptions.md) |
| `max` | `data-max="3"` | | Multiple choice: at most this many, see [Multiple choice](/guide/multiple.md) |
| `maxText` | | `n => "Maximum of " + n + " reached"` | Announcement at the limit |
| `pinned` | `data-pinned="EUR,USD"` | | Values shown again on top of the panel, see [Pinned and recent entries](/guide/pinned.md) |
| `recent` | `data-recent="currency"` | off | Storage key: remember the last picks and show them on top |
| `recentMax` | `data-recent-max` | `5` | How many recent picks; `0` turns recent off |
| `pinnedText`, `recentText` | | `"Pinned"`, `"Recent"` | Headings of the two groups |

JS options win over data attributes. Invalid values fall back to the default.
