# The panel

When a group has more items than the [threshold](/guide/concepts.md#the-threshold-visible-items-or-a-field-with-a-panel) (10 by default), GridSelect no longer shows the items on the page. Instead it shows a compact **field**, and clicking the field opens the **panel** with a search input and all items. This page explains how the panel behaves and what you can change about it: how the items are arranged, how wide the panel becomes, and in which direction it opens.

<script setup>
import { currencies, countries } from "../.vuepress/data.js";
</script>

<Example :options="{ items: currencies, value: 'CHF' }">
  <fieldset data-gridselect><legend>Currency</legend></fieldset>
</Example>

## Opening and closing

The field looks like a select box and shows the current choice, or a placeholder ("Select…") when nothing is chosen. The panel opens when someone clicks the field, or presses Enter, Space or the down arrow while the field has the keyboard focus. The focus then moves into the search input, so typing immediately narrows the list.

The panel closes when an item is picked (in a single-choice group), when someone presses Escape or Tab, or when they click anywhere outside the field and the panel. Escape and a pick move the focus back to the field; Tab and an outside click let the focus continue to wherever it was going. Closing without a pick never changes the selection.

The field shows the label of the chosen item. In a multiple-choice group it shows up to two labels and, from three chosen items on, a count such as "3 selected". You can change that text with the option `selectedText`, for example `selectedText: (n) => n + " ausgewählt"`, and the placeholder with `placeholder`.

## Layouts

The items in the panel can be arranged in three ways. Choose the layout with the option `layout` or the attribute `data-layout`.

The **grid** layout is the default. It arranges the items in columns of equal width, and that width follows the longest label: GridSelect measures the widest item each time the panel opens, so short labels such as country names fit many columns side by side, while longer labels get fewer, wider columns. A single very long label never forces everything into one column, because a column is at most half as wide as the list; such a label wraps onto a second line instead, and all rows keep the same height so the grid stays even. In the grid, the left and right arrow keys move to the previous and next item, and the up and down arrow keys move one row up or down.

<Example :options="{ items: countries }">
  <fieldset data-gridselect><legend>Country (grid)</legend></fieldset>
</Example>

The **list** layout puts one item per row. It suits long texts such as sentences or addresses that would be hard to read in narrow columns. Only the up and down arrow keys move the cursor; the left and right arrow keys stay in the search input for editing the text.

<Example :options="{ items: currencies, layout: 'list' }">
  <fieldset data-gridselect><legend>Currency (list)</legend></fieldset>
</Example>

The **flow** layout lets the items run one after another and wrap at the end of a line, each item exactly as wide as its label, much like words in a paragraph. It packs the most items into the least space. Because the items are not aligned in columns, the up and down arrow keys jump to the item in the row above or below whose centre is closest to the current one.

<Example :options="{ items: currencies, layout: 'flow' }">
  <fieldset data-gridselect><legend>Currency (flow)</legend></fieldset>
</Example>

```js
gridselect(el, { layout: "list" }); // or "grid" (default) or "flow"
```

```html
<fieldset data-gridselect data-layout="flow"> … </fieldset>
```

## Width

By default the panel is as wide as the browser window, minus 10 pixels on each side. This shows as many columns as possible, so people see more items without scrolling. When all items fit into a single row, the panel is only as wide as they need and starts below the field instead of stretching across the window.

If the full width is too much for your page, you have two choices. You can keep the full-width behaviour but cap it with the CSS variable `--gs-panel-max-width`; the panel then grows up to that width at most. Or you can switch to the narrow variant with `panelWidth: "fixed"` (attribute `data-panel-width="fixed"`): the panel then starts at the left edge of the field and is exactly as wide as the CSS variable `--gs-panel-width`, which the default stylesheet sets to 40rem.

```css
/* full width, but never wider than 60rem */
#currency { --gs-panel-max-width: 60rem; }
```

<Example :options="{ items: currencies, panelWidth: 'fixed' }">
  <fieldset data-gridselect><legend>Currency (narrow, panelWidth: "fixed")</legend></fieldset>
</Example>

## Height and direction

By default (`panelHeight: "auto"`) GridSelect decides each time the panel opens where it should appear. It measures the room between the field and the bottom of the window, and the room between the field and the top. If the whole list fits below the field, the panel opens below. If it does not fit, the panel opens towards the side with more room; when it opens upwards it carries the attribute `data-placement="top"`, which you can use in your own CSS.

The panel then grows up to 8 pixels before the edge of the window, but never taller than its content: a short list gives a short panel, a long list fills the available room and becomes scrollable. If there is less than 10rem of room on both sides, the panel opens below with a list height of 10rem, and the page itself scrolls. While the panel is open, scrolling the page or resizing the window recalculates direction, width and height.

If you prefer a predictable panel, set `panelHeight: "fixed"` (attribute `data-panel-height="fixed"`). The panel then always opens below the field, and its list is at most as high as the CSS variable `--gs-list-max-height`, 18rem in the default stylesheet.

| Option | Attribute | Values |
|---|---|---|
| `layout` | `data-layout` | `"grid"` (default), `"list"`, `"flow"` |
| `panelWidth` | `data-panel-width` | `"full"` (default), `"fixed"` |
| `panelHeight` | `data-panel-height` | `"auto"` (default), `"fixed"` |

## What GridSelect adds to the page

Above the threshold GridSelect hides your radio buttons or checkboxes and their labels, but they stay in the page and in the form. Picking an item in the panel checks the corresponding input and fires its `input` and `change` events, so forms and your event listeners work as before.

GridSelect adds two elements to the wrapper: the field and the panel. Their structure looks like this:

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

Every element carries a `data-gridselect-*` attribute and a class of the same name, so you can style or test it. The states are expressed as attributes: `aria-expanded="true"` on the open field, `aria-selected="true"` on chosen items, `data-cursor` on the item under the [cursor](/guide/concepts.md#the-panel-and-the-cursor), and `aria-disabled="true"` on disabled items. [Styling and themes](/guide/styling.md) and the reference page [Attributes and hooks](/reference/attributes.md) list them all.

The text of each item is the text of its label. Icons or other markup inside a label are not copied into the panel, which keeps the panel predictable and safe.
