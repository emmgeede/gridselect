# Descriptions

Sometimes a short label is not enough to tell entries apart. Two employees may share a name, a product code may need its full name next to it, or a country is easier to recognise together with its capital. For such cases an item can carry a **description**: a second, smaller line of text below its label.

<script setup>
import { countries } from "../.vuepress/data.js";
</script>

The example shows countries with their capitals. Searching for capitals is switched on, so try typing `paris`.

<Example :options="{ items: countries, searchDescription: true }">
  <fieldset data-gridselect><legend>Country</legend></fieldset>
</Example>

## Adding descriptions

How you add a description depends on the [source](/guide/sources.md) of the entries. With the `items` option, give the entry a `description`:

```js
gridselect(el, {
  items: [
    { value: "FR", label: "France", description: "Capital: Paris" },
    { value: "DE", label: "Germany", description: "Capital: Berlin" },
  ],
});
```

On an `<option>`, in a `<select>` or in the `<grid-select>` element, use the attribute `data-description`. In your own radio or checkbox markup, put an element with the attribute `data-gridselect-description` inside the label:

```html
<option value="FR" data-description="Capital: Paris">France</option>

<label><input type="radio" name="country" value="FR"> France <small data-gridselect-description>Capital: Paris</small></label>
```

Descriptions are always treated as plain text, never as HTML.

## Where descriptions appear

The description is shown below the label, in a smaller and muted style, both in visible items below the threshold and in the panel, including groups and the pinned and recent entries at the top. The closed field shows only the label of the chosen entry, so it stays compact.

In the grid layout the column width takes the description into account, so short descriptions fit on one line. A column is never wider than half the list, though; longer descriptions wrap, and all rows of the grid keep the same height.

## What screen readers hear

Screen readers read the label as the entry's name and the description afterwards, as additional information. Technically the description is linked with `aria-describedby`. This keeps names short, which matters when people move quickly through a list: they hear "France", and if they pause, "Capital: Paris".

## Searching descriptions

By default the search looks only at the labels, because matches in descriptions can be surprising: someone typing "paris" might not expect France to appear. If searching descriptions makes sense for your data, switch it on with `searchDescription: true` or the attribute `data-search-description`. Entries whose label matches are still listed before entries that match only in their description.
