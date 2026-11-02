# Pinned and recent entries

In many lists a few entries are chosen far more often than all the others: the home currency, the main warehouse, the colleague you always assign tasks to. GridSelect can put such entries at the very top of the panel, so they are always one key away. There are two kinds, and you can use either or both.

**Pinned entries** are fixed favourites that you, the developer, choose. They are the same for everyone who uses the page, for example because a shop mostly sells in euros and US dollars.

**Recent entries** are the entries a person picked last. GridSelect remembers them in the person's browser, so each person sees their own recent choices. This is useful when different people work with different entries.

<script setup>
import { currencies } from "../.vuepress/data.js";
</script>

The example pins Euro and US dollar and remembers recent picks. Pick a few currencies, then open the panel again.

<Example :options="{ items: currencies, pinned: ['EUR', 'USD'], recent: 'docs-currency' }">
  <fieldset data-gridselect><legend>Currency</legend></fieldset>
</Example>

## Setting it up

Pass the values to pin in the option `pinned`, in the order they should appear. To remember recent picks, give the option `recent` a storage key: a short name that is unique for this field on your site, such as `"currency"`. Both also exist as attributes on the wrapper.

```js
gridselect(el, { pinned: ["EUR", "USD"], recent: "currency" });
```

```html
<fieldset data-gridselect data-pinned="EUR,USD" data-recent="currency"> … </fieldset>
```

Values in `pinned` that do not exist in the list are ignored. By default GridSelect remembers the last five picks; change the number with `recentMax` (attribute `data-recent-max`), and use 0 to switch recent entries off.

## How they appear

Pinned and recent entries are shown as groups at the top of the panel, with the headings "Pinned" and "Recent". You can change both headings with `pinnedText` and `recentText`, for example to translate them. Below them follows the rest of the list, separated by a line.

An entry that is shown at the top is left out of the list below, so nothing appears twice. The digit badges run on from the top into the list without a gap: the first pinned entry is always 1, and the list continues where the top groups end. Recent entries never repeat a pinned one.

As soon as people type into the search, the top groups disappear and the list contains every entry again, so pinned and recent entries can be found like any other. Pinned and recent entries only exist in the panel, that is above the [threshold](/guide/concepts.md#the-threshold-visible-items-or-a-field-with-a-panel); a short list shows all entries anyway.

<a href="https://gridselect.im/demo/">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/pinned-dark.png?v=2">
  <img src="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/pinned-light.png?v=2" width="100%" alt="A currency panel with a Pinned group (Euro, US dollar, digits 1 and 2) and a Recent group (Japanese yen, Swiss franc, digits 3 and 4) above the remaining list, which goes on with digit 5.">
</picture>
</a>

<sub>Two pinned entries and two recent picks, followed by the rest of the list. The digits run on without a gap.</sub>

## Where recent entries are stored

Recent entries are kept in the browser's `localStorage`, under the key `gridselect-recent:` followed by the name you chose, for example `gridselect-recent:currency`. GridSelect stores only values that exist in the list, newest first, and at most `recentMax` of them. With a multiple-choice group, only ticking an entry counts as a pick, not unticking it. If the browser blocks storage, for example in a private window with strict settings, the recent group simply stays empty and nothing else changes.

The stored values never leave the person's browser; GridSelect sends nothing anywhere. Keep in mind, however, that the values can be personal information, for example the name of a person or a home town. If that is the case on your site, mention the storage in your privacy notice.
