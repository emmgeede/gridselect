# Attributes and hooks

## `<grid-select>` attributes

| Attribute | Meaning |
|---|---|
| `name` | Form name of the inputs |
| `label` | Group name, becomes the `<legend>`. Without `label` or `aria-label` the console warns, a group needs a name |
| `multiple` | Checkboxes instead of radios |
| `value` | Initial choice, comma-separated with `multiple`. Without it, `selected` options count |
| `threshold`, `layout`, `search`, `match`, `placeholder`, `search-placeholder` | As the options of the same name |
| `min-query-length`, `loading-text`, `error-text` | As the options with `load` (set `el.load` as a property) |
| `max`, `search-description`, `panel-height`, `panel-width` | As the options `max`, `searchDescription`, `panelHeight` and `panelWidth` |
| `pinned`, `recent`, `recent-max`, `pinned-text`, `recent-text` | As `pinned` (comma-separated), `recent`, `recentMax`, `pinnedText`, `recentText` |
| `shortcuts` | `off`, or tiers separated by commas, e.g. `,Shift,Alt` |
| `required`, `disabled` | As on native inputs |

Properties: `el.value`, `el.items`, `el.load`, and as a form control `el.form`, `el.name`, `el.validity`, `el.validationMessage`, `el.willValidate`, `checkValidity()`, `reportValidity()`, `setCustomValidity()`. See [Custom element and frameworks](/guide/frameworks.md) and [Forms](/guide/forms.md).

## Data attributes on the wrapper

Options can also be set on the wrapper. JavaScript options win.

| Attribute | Option |
|---|---|
| `data-threshold` | `threshold` |
| `data-layout` | `layout` (`grid`, `list`, `flow`) |
| `data-search` | `search` (`filter`, `highlight`) |
| `data-match-mode` | `match` (`substring`, `fuzzy`) |
| `data-shortcuts="off"` | `shortcuts: false` |
| `data-max` | `max` |
| `data-pinned`, `data-recent`, `data-recent-max` | `pinned`, `recent`, `recentMax` |
| `data-search-description` | `searchDescription` |
| `data-panel-width`, `data-panel-height` | `panelWidth`, `panelHeight` |

## Structure hooks

GridSelect marks what it builds with `data-gridselect-*` attributes (and BEM classes `gridselect__*` of the same names). Style or test against these.

| Hook | Element |
|---|---|
| `data-gridselect` | The wrapper you write |
| `data-gridselect-field` | The button that opens the panel |
| `data-gridselect-panel` | The panel; `data-placement="top"` when it opens upwards |
| `data-gridselect-search` | The search input (`role="combobox"`) |
| `data-gridselect-scroller` | The scrolling list (`role="listbox"`) |
| `data-gridselect-items` | The item list inside the scroller |
| `data-gridselect-item` | One entry (`role="option"`), with `data-value` |
| `data-gridselect-label`, `data-gridselect-description` | Text and second line of an entry |
| `data-gridselect-key` | The digit badge; `data-modifiers` and `data-prefix` name the tier |
| `data-gridselect-group`, `data-gridselect-group-label` | A group (`role="group"`) and its heading |
| `data-gridselect-top`, `data-gridselect-section` | Pinned and recent groups, and the plain list below them |
| `data-gridselect-empty`, `data-gridselect-status` | The message in the panel and the live region |
| `data-gridselect-generated` | Labels GridSelect built from `items` or a `<select>` |

## State attributes

| Attribute | Meaning |
|---|---|
| `aria-expanded="true"` | On the field and the search while the panel is open |
| `aria-selected="true"` | On chosen items |
| `data-cursor` | On the item the arrow keys are on |
| `data-match`, `data-dimmed` | Matches and non-matches in highlight mode |
| `aria-disabled="true"` | Disabled entries; with `data-limit` an entry locked by `max` |
| `aria-invalid="true"` | On the field (or the inputs) after a blocked submit |
