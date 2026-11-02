# Options

This page lists every setting of GridSelect in one place. The [guide](/guide/README.md) explains the features in detail; here you find the exact names, values and defaults.

## `gridselect(wrapper, options?)`

The function `gridselect()` sets up one group. Its first argument is the wrapper element that contains the group, its second, optional argument an object with options. It returns an [instance](/reference/instance.md), an object with the property `value` and the methods `setItems()` and `destroy()`.

```js
import { gridselect } from "@emmgeede/gridselect";

const gs = gridselect(document.querySelector("#currency"), { threshold: 5, search: "highlight" });
```

Calling `gridselect()` again on the same wrapper does not create a second instance. It returns the existing one and ignores the options of the later call; to change options, call `gs.destroy()` first and then `gridselect()` again.

The wrapper must contain either radio buttons that share one `name`, or checkboxes, or one `<select>`, or nothing at all when you pass `items` or `load`. GridSelect throws a `TypeError` if the first argument is not an element, if the wrapper mixes radio buttons and checkboxes, if its radio buttons have different names, or if it contains a `<select>` and other inputs at the same time. If two entries share a value, a warning appears in the browser console.

## Options and data attributes

Most options can also be written as a `data-` attribute on the wrapper, which is convenient when the markup comes from a server or a template. If both are given, the option passed to `gridselect()` wins. An invalid value, such as an unknown layout name, is ignored, and the default applies.

### Display

| Option | Attribute | Default | What it does |
|---|---|---|---|
| `threshold` | `data-threshold` | `10` | The number of items up to which they stay visible on the page. With more items, GridSelect shows a field that opens a panel. `0` means the panel is always used. See [How GridSelect works](/guide/concepts.md#the-threshold-visible-items-or-a-field-with-a-panel). |
| `layout` | `data-layout` | `"grid"` | How the panel arranges the items: `"grid"` in columns as wide as the longest item, `"list"` one per row for long texts, `"flow"` one after another like words. See [The panel](/guide/panel.md#layouts). |
| `panelWidth` | `data-panel-width` | `"full"` | `"full"` makes the panel as wide as the window, 10 pixels from each edge, and narrower when all items fit in one row. `"fixed"` uses the CSS variable `--gs-panel-width`, starting at the field's left edge. |
| `panelHeight` | `data-panel-height` | `"auto"` | `"auto"` opens the panel where there is more room and lets it grow up to the window's edge, never beyond its content. `"fixed"` always opens below, with the list at most `--gs-list-max-height` high. |
| `placeholder` | | `"Select…"` | The text in the field while nothing is chosen. |
| `selectedText` | | `n => n + " selected"` | A function that returns the field text when more than two entries are chosen in a multiple choice. One or two chosen entries show their labels. |

### Search

| Option | Attribute | Default | What it does |
|---|---|---|---|
| `search` | `data-search` | `"filter"` | `"filter"` hides items that do not match. `"highlight"` keeps every item in place and marks the matches. See [Search](/guide/search.md). |
| `match` | `data-match-mode` | `"substring"` | `"substring"` needs the typed text in the label as one piece. `"fuzzy"` lets the letters appear with gaps and the words in any order. |
| `searchDescription` | `data-search-description` | `false` | When true, the search also looks at the items' descriptions; matches in the label still come first. |
| `searchPlaceholder` | | `"Search…"` | The placeholder text of the search input. |
| `noResultsText` | | `"No matches"` | The text shown and announced when nothing matches. |
| `resultsText` | | `n => n === 1 ? "1 result" : n + " results"` | A function that returns the screen reader announcement for a number of matches, so that plural rules of any language fit. |

### Keyboard

| Option | Attribute | Default | What it does |
|---|---|---|---|
| `shortcuts` | `data-shortcuts="off"` | `["", "Shift", "Alt"]` | The modifier keys for the digit shortcuts, one entry per tier of ten items. An empty string stands for plain digits. `false` turns the digit shortcuts off. See [Keyboard and digits](/guide/keyboard.md#digit-shortcuts). |

### Entries from JavaScript

| Option | Attribute | Default | What it does |
|---|---|---|---|
| `items` | | | An array of entries for an empty wrapper: strings, numbers, objects with `value`, `label`, `description` and `disabled`, or groups `{ label, items }`. GridSelect builds the inputs from them. See [Sources](/guide/sources.md#entries-from-javascript). |
| `name` | | | The form name of the inputs built from `items`. Without a name the inputs are not submitted. |
| `value` | | | The initial choice for `items`; an array with `multiple`. |
| `multiple` | | `false` | When true, `items` become checkboxes and several entries can be chosen. |

### Entries from a server

| Option | Attribute | Default | What it does |
|---|---|---|---|
| `load` | | | A function `(query, signal) => Promise<items>` that returns the entries for the typed text. GridSelect calls it when the panel opens and 250 milliseconds after typing. See [Entries from a server](/guide/server.md). |
| `minQueryLength` | | `0` | The number of characters people must type before `load` is called. |
| `minQueryText` | | `n => "Type " + n + " characters to search"` | A function that returns the hint shown below `minQueryLength`. |
| `loadingText` | | `"Loading…"` | The text shown and announced while a request runs. |
| `errorText` | | `"Could not load entries"` | The text shown and announced when a request fails. |

### Multiple choice

| Option | Attribute | Default | What it does |
|---|---|---|---|
| `max` | `data-max` | none | The largest number of entries that can be chosen. At the limit the other entries are locked. See [Multiple choice](/guide/multiple.md#an-upper-limit). |
| `maxText` | | `n => "Maximum of " + n + " reached"` | A function that returns the announcement when the limit is reached or hit. |

### Pinned and recent entries

| Option | Attribute | Default | What it does |
|---|---|---|---|
| `pinned` | `data-pinned` | none | Values to show at the top of the panel, in this order. As an attribute, separate them with commas. See [Pinned and recent entries](/guide/pinned.md). |
| `recent` | `data-recent` | off | A storage key. When set, GridSelect remembers the last picks in the browser and shows them at the top. |
| `recentMax` | `data-recent-max` | `5` | How many recent picks are kept and shown. `0` turns recent entries off. |
| `pinnedText` | | `"Pinned"` | The heading of the pinned entries. |
| `recentText` | | `"Recent"` | The heading of the recent entries. |
