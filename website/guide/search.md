# Search

Every panel has a search input at the top, and the keyboard focus is placed there as soon as the panel opens. People can therefore start typing right away to find an entry, without reaching for the mouse. This page explains how the search compares the typed text with the items, the two ways of showing the results, and how to make the search more forgiving.

<script setup>
import { currencies } from "../.vuepress/data.js";
</script>

## What is searched

The search compares the typed text with the **label** of each item, that is the visible text, not the value that the form submits. The comparison ignores upper and lower case, spaces at the beginning and end, and accents: typing `zur` finds "Zürich", and typing `ZLOTY` finds "Polish złoty". If people should also be able to find an entry by a code such as `CHF`, put the code into the label, for example "Swiss franc (CHF)".

Items can carry a second line, called a description (see [Descriptions](/guide/descriptions.md)). By default the search ignores descriptions. With the option `searchDescription: true` it searches them too, and items whose label matches still come before items that only match in their description.

Every time the panel opens, the search starts empty, so a new visit always shows the complete list.

## Two ways to show the results

GridSelect offers two search modes. Choose one with the option `search` or the attribute `data-search`.

### Filter mode (default)

In filter mode, typing hides every item that does not match. The remaining items are sorted so that labels which start with the typed text come first, followed by labels that contain it somewhere else. The cursor jumps to the first match, so pressing Enter right after typing picks the best result. The digit badges are renumbered from 1, which means that the first match can always be picked by pressing 1. If nothing matches, the panel shows the text "No matches" (change it with `noResultsText`), and Enter does nothing.

Open the field and type `dollar`:

<Example :options="{ items: currencies }">
  <fieldset data-gridselect><legend>Currency (filter mode)</legend></fieldset>
</Example>

Filter mode suits people who look for an entry by name and do not care where it sits in the list.

### Highlight mode

In highlight mode nothing is hidden and nothing moves. The matching items are emphasised, the others are dimmed, and the cursor jumps to the first match. The digit badges keep their numbers. This mode is meant for lists that people use every day: they learn where an entry sits or which digit picks it, and the search must not change that.

Open the field and type `krone`:

<Example :options="{ items: currencies, search: 'highlight' }">
  <fieldset data-gridselect><legend>Currency (highlight mode)</legend></fieldset>
</Example>

```js
gridselect(el, { search: "highlight" }); // or "filter", the default
```

```html
<fieldset data-gridselect data-search="highlight"> … </fieldset>
```

In highlight mode matching items carry the attribute `data-match` and the others `data-dimmed`, which the stylesheet uses for their look.

## Forgiving search with fuzzy matching

By default the typed text must appear in the label as one piece. Fuzzy matching relaxes this: the letters of each typed word only need to appear in the label in the right order, with any number of other letters in between. Several words can be typed in any order. Typing `nzd` therefore finds "New Zealand dollar", `swfr` finds "Swiss franc", and `franc swiss` finds it too. In filter mode the results are ordered by how well they match: letters at the start of words and letters that follow each other directly rank higher.

Switch it on with the option `match: "fuzzy"` or the attribute `data-match-mode="fuzzy"`. Fuzzy matching works with both search modes. It does not correct typing mistakes; every typed letter has to occur in the label.

Try `nzd` or `swfr`:

<Example :options="{ items: currencies, match: 'fuzzy' }">
  <fieldset data-gridselect><legend>Currency (fuzzy)</legend></fieldset>
</Example>

## What screen readers hear

The panel contains a visually hidden status region. After each change of the search text it tells screen readers how many items match, for example "6 results", or that nothing matches. You can change the wording with `resultsText`, a function that receives the number of matches, so plural rules of any language fit:

```js
gridselect(el, { resultsText: (n) => (n === 1 ? "1 Treffer" : `${n} Treffer`), noResultsText: "Keine Treffer" });
```

The search input, the field and the list take their accessible name from the wrapper's `<legend>`, from `aria-labelledby` or from `aria-label`. Typing with an input method editor, as used for Chinese or Japanese, works too: keys pressed while a character is being composed are left to the input method.

## Options at a glance

| Option | Attribute | Effect |
|---|---|---|
| `search` | `data-search` | `"filter"` (default) hides non-matches, `"highlight"` keeps every item in place and marks matches. |
| `match` | `data-match-mode` | `"substring"` (default) needs the text in one piece, `"fuzzy"` allows gaps and any word order. |
| `searchDescription` | `data-search-description` | Also searches the items' descriptions. |
| `searchPlaceholder` | | Placeholder of the search input, default "Search…". |
| `noResultsText` | | Text when nothing matches, default "No matches". |
| `resultsText` | | Function that returns the announcement for a number of matches. |
