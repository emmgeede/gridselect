# Multiple choice

When people may choose several entries, use a group of checkboxes or a `<select multiple>` as the [source](/guide/sources.md), or pass `multiple: true` together with `items`. GridSelect then works with checkboxes underneath, and everything on this page applies.

<script setup>
import { currencies } from "../.vuepress/data.js";
</script>

The example allows at most three currencies. Open it, type `dollar`, and tick several entries in a row.

<Example :options="{ items: currencies, multiple: true, max: 3 }">
  <fieldset data-gridselect><legend>Watchlist</legend></fieldset>
</Example>

## How picking works

Below the [threshold](/guide/concepts.md#the-threshold-visible-items-or-a-field-with-a-panel) the items are ordinary checkboxes: each one can be ticked and unticked on its own, with a click, with Space, or with its digit.

Above the threshold the panel behaves differently from a single choice. Picking an item ticks it, or unticks it if it was ticked already, and the panel stays open. The search text stays as well, so people can type "dollar" once and then tick several dollar currencies in a row. Each tick fires the native `input` and `change` events right away, exactly as clicking a checkbox would. The list announces itself to screen readers as a list in which several entries can be selected.

The field shows the labels of up to two chosen entries. From three on it shows a count, "3 selected" by default; the option `selectedText` lets you change that text, for example `selectedText: (n) => n + " ausgewählt"`.

The instance's `value` is always an array of the chosen values, in the order of the list, and an empty array when nothing is chosen. Setting it replaces the whole selection:

```js
gs.value = ["EUR", "USD"];
```

## An upper limit

With the option `max` (attribute `data-max`) you can limit how many entries may be chosen. It works in both forms, below and above the threshold.

```js
gridselect(el, { multiple: true, items, max: 3 });
```

When the limit is reached, the remaining entries are locked. They look muted, show a "not allowed" mouse pointer and cannot be ticked, neither by click, nor by Space, nor by a digit. They are not crossed out, which distinguishes them from entries that are disabled for good, and they stay reachable with the keyboard and readable for screen readers, so people can still see what is available. Unticking any entry lifts the lock at once.

When the limit is reached, and again on every attempt to tick one more entry, the status region tells screen readers "Maximum of 3 reached". Change the text with `maxText`, a function that receives the limit:

```js
gridselect(el, { multiple: true, items, max: 3, maxText: (n) => `Höchstens ${n} auswählbar` });
```

If the initial selection already exceeds the limit, GridSelect keeps it unchanged and locks the remaining entries until the number of chosen entries falls below the limit. `max` has no effect on a single-choice group.

<a href="https://gridselect.im/demo/">
<picture>
  <source media="(prefers-reduced-motion: reduce) and (prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/multiple-dark.png?v=4">
  <source media="(prefers-reduced-motion: reduce)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/multiple-light.png?v=4">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/multiple-dark.webp?v=4">
  <img src="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/multiple-light.webp?v=4" width="100%" alt="Animation: the watchlist panel opens, 'dollar' filters it, Enter ticks US dollar, arrow right and Enter tick Canadian dollar, the digit 4 ticks New Zealand dollar, the field reads '3 selected', Escape closes the panel.">
</picture>
</a>

<sub>Ticking three dollar currencies: Enter, an arrow and Enter, then a digit. After the third tick the other entries are locked, and the field reads "3 selected".</sub>
