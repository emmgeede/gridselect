# Groups

Long lists are easier to scan when related entries stand together under a heading: currencies by region, products by category, team members by department. GridSelect supports such groups. In the panel each group gets a heading and starts on a new row, and the heading stays visible at the top while you scroll through a long group.

<script setup>
import { regions } from "../.vuepress/data.js";
</script>

<Example :options="{ items: regions }">
  <fieldset data-gridselect><legend>Currency by region</legend></fieldset>
</Example>

## Defining groups

Groups can come from three sources. In a `<select>` or in the `<grid-select>` element, use the native `<optgroup>` element; its `label` attribute becomes the heading.

```html
<select name="currency">
  <optgroup label="Europe">
    <option value="EUR">Euro</option>
    <option value="CHF">Swiss franc</option>
  </optgroup>
  <optgroup label="Asia">
    <option value="JPY">Japanese yen</option>
  </optgroup>
</select>
```

With the `items` option, write a group as an object with a `label` for the heading and an `items` array for its entries. Entries outside any group can stand before, between or after the groups; they appear in their place without a heading.

```js
gridselect(el, {
  name: "currency",
  items: [
    "USD",                                                   // no group, no heading
    { label: "Europe", items: ["EUR", { value: "CHF", label: "Swiss franc" }] },
    { label: "Asia", items: ["JPY", "CNY"] },
  ],
});
```

Groups are one level deep: a group cannot contain another group, and GridSelect throws an error that names the position if it does. Empty groups are left out. A group of radio buttons or checkboxes written by hand cannot be grouped; use `items` or a `<select>` for that.

## How groups behave

Headings are shown only in the panel, that is above the [threshold](/guide/concepts.md#the-threshold-visible-items-or-a-field-with-a-panel). A short list shows its entries in their order without headings, because all entries are visible anyway.

In the panel the keyboard moves freely across groups. The left and right arrows continue from the last entry of one group to the first entry of the next, and the up and down arrows jump to the nearest entry in the row above or below, even if that row belongs to another group. The cursor never lands on a heading. The digit badges run on across groups instead of starting again at 1, so every entry keeps a unique shortcut.

When people search in filter mode, the groups keep their order and only the entries within each group are sorted by how well they match. A group without any matching entry is hidden together with its heading. The heading text itself is not searched: typing "Europe" does not show all European currencies, it finds entries whose label contains "Europe". In highlight mode every group stays visible.

## Accessibility

Each group is marked with `role="group"` and named by its heading, so screen readers announce the group name when the cursor enters a new group. All entries of an `<optgroup disabled>` are disabled.

## Styling

A group is an element with the class `gridselect__group` (attribute `data-gridselect-group`); it shares the columns of the whole list, so items of different groups line up. The heading has the class `gridselect__group-label`. The default stylesheet keeps the heading at the top of the scrolling area while its group scrolls by, and it reserves room so that the heading never covers the item under the cursor.
