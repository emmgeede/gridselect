# Entries from a server

<script setup>
import { currencies, regions, countries, airports, fakeLoad } from "../.vuepress/data.js";
</script>

Type to search; the fake server answers after 400 ms.

<Example :options="{ name: 'remote' }" :load="fakeLoad">
  <fieldset data-gridselect><legend>Currency (from a server)</legend></fieldset>
</Example>

For long or changing data, let GridSelect ask your server:

```js
gridselect(document.querySelector("#city"), {
  name: "city",
  load: async (query, signal) => {
    const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`, { signal });
    return (await res.json()).map((c) => ({ value: c.id, label: c.name }));
  },
  minQueryLength: 2, // optional: only search from two characters
});
```

- The wrapper starts empty and always gets the field and panel. On open
  GridSelect calls `load("", signal)`, and 250 ms after the last keystroke
  `load(query, signal)`. The answer (the `items` format, groups included)
  replaces the list; the panel, the search text and the focus stay, and the
  cursor goes to the first result. GridSelect does not filter the answer
  again: your server decides what matches.
- While loading, the panel and the status region say "Loading…"
  (`loadingText`); a failed request shows "Could not load entries"
  (`errorText`) and keeps the entries, typing again retries. A newer request
  aborts the older one through `signal`, and late answers are ignored.
- Below `minQueryLength` nothing loads and the panel says "Type 2 characters
  to search" (`minQueryText(n)`).
- A chosen entry stays chosen when a later answer lacks it: the field text
  and the submitted value stay right.
- On `<grid-select>` set the property: `el.load = (query, signal) => …`,
  with the attributes `min-query-length`, `loading-text` and `error-text`.
  The React and Vue components take a `load` prop.
