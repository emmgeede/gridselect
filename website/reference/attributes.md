# Attributes and hooks

GridSelect is configured through attributes in three places: on the `<grid-select>` element, on the wrapper of a group set up with `gridselect()`, and on the elements GridSelect builds itself. This page lists all three. The last two lists are useful when you write your own CSS or automated tests, because these attributes are stable from version 1.0 on.

## Attributes of `<grid-select>`

These attributes configure the [custom element](/guide/frameworks.md). Most of them correspond to an [option](/reference/README.md) of the same name, written in kebab-case.

| Attribute | Meaning |
|---|---|
| `name` | The name under which a form submits the choice. |
| `label` | The visible name of the group, shown as its legend. Without `label` or `aria-label` the console warns, because a group needs a name. |
| `aria-label` | A name for screen readers only, used when no visible label is wanted. |
| `multiple` | Allows several choices; the element then works with checkboxes. |
| `value` | The initial choice, comma-separated with `multiple`. Without it, the `selected` options decide. |
| `required`, `disabled` | Work as on native form fields. |
| `threshold`, `layout`, `search`, `match`, `placeholder`, `search-placeholder` | The options of the same name. |
| `shortcuts` | `off`, or the tiers separated by commas, for example `,Shift,Alt`. |
| `max`, `search-description`, `panel-height`, `panel-width` | The options `max`, `searchDescription`, `panelHeight` and `panelWidth`. |
| `pinned`, `recent`, `recent-max`, `pinned-text`, `recent-text` | Pinned and recent entries; `pinned` is a comma-separated list. |
| `min-query-length`, `loading-text`, `error-text` | Settings for entries from a server. The function itself is set as the property `el.load`. |

The element also has properties that cannot be expressed as attributes: `el.value`, `el.items`, `el.load`, and, because it is a form field of its own, `el.form`, `el.name`, `el.validity`, `el.validationMessage`, `el.willValidate`, `checkValidity()`, `reportValidity()` and `setCustomValidity()`. See [Custom element and frameworks](/guide/frameworks.md) and [Forms](/guide/forms.md).

## Data attributes on the wrapper

When you use `gridselect()`, you can write most options as `data-` attributes on the wrapper instead of passing them in JavaScript. This is convenient when the HTML comes from a server or a template. If an option is given both ways, the JavaScript option wins.

| Attribute | Corresponding option |
|---|---|
| `data-threshold` | `threshold` |
| `data-layout` | `layout` (`grid`, `list` or `flow`) |
| `data-search` | `search` (`filter` or `highlight`) |
| `data-match-mode` | `match` (`substring` or `fuzzy`) |
| `data-shortcuts="off"` | `shortcuts: false` |
| `data-max` | `max` |
| `data-pinned`, `data-recent`, `data-recent-max` | `pinned`, `recent`, `recentMax` |
| `data-search-description` | `searchDescription` |
| `data-panel-width`, `data-panel-height` | `panelWidth`, `panelHeight` |

## Structure hooks

Every element GridSelect builds carries a `data-gridselect-*` attribute and a CSS class of the same name in the BEM style (for example `data-gridselect-field` and `gridselect__field`). Use them to style the parts or to find them in tests.

| Hook | Element |
|---|---|
| `data-gridselect` | The wrapper you write around the group. |
| `data-gridselect-field` | The button above the threshold that shows the choice and opens the panel. |
| `data-gridselect-panel` | The panel. It carries `data-placement="top"` when it opens upwards. |
| `data-gridselect-search` | The search input, announced as a combobox. |
| `data-gridselect-scroller` | The scrolling area of the panel, announced as a listbox. |
| `data-gridselect-items` | The list of items inside the scrolling area. |
| `data-gridselect-item` | One item in the panel, announced as an option, with its value in `data-value`. |
| `data-gridselect-label` | The text of an item. |
| `data-gridselect-description` | The second line of an item, see [Descriptions](/guide/descriptions.md). |
| `data-gridselect-key` | The digit badge. `data-modifiers` holds the tier's modifier keys, `data-prefix` the letters shown before the digit. |
| `data-gridselect-group`, `data-gridselect-group-label` | A group of items and its heading, see [Groups](/guide/groups.md). |
| `data-gridselect-top`, `data-gridselect-section` | The pinned and recent groups at the top, and the rest of the list below them. |
| `data-gridselect-empty` | The message in the panel, for example "No matches" or "Loading…". |
| `data-gridselect-status` | The hidden status region that screen readers read out. |
| `data-gridselect-generated` | Labels that GridSelect created from `items` or from a `<select>`. |

## State attributes

GridSelect expresses states as attributes, mostly the standard ARIA attributes that screen readers also rely on. Style these instead of adding your own classes.

| Attribute | Meaning |
|---|---|
| `aria-expanded="true"` | On the field and the search input while the panel is open. |
| `aria-selected="true"` | On items that are chosen. |
| `data-cursor` | On the item under the cursor, the one the arrow keys point at. |
| `data-match`, `data-dimmed` | In highlight mode, on matching and on non-matching items. |
| `aria-disabled="true"` | On disabled items. Together with `data-limit` it marks an item that is locked because a multiple choice reached its `max`. |
| `aria-invalid="true"` | On the field (or the inputs below the threshold) after a submit was blocked because a required group was empty. |
