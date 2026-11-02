# Entries from a server

Some lists are too long or change too often to be written into the page: all cities of a country, the customers of a company, the products in a shop. For these GridSelect can ask your server for the entries while people type. You provide one function, `load`, and GridSelect calls it whenever it needs entries. Everything else, from the search field to the keyboard support, works as usual.

The example below uses a pretend server that answers after 400 milliseconds. Open the field and type `dol`: you will see a short loading message, and then only the matching currencies.

<script setup>
import { fakeLoad } from "../.vuepress/data.js";
</script>

<Example :options="{ name: 'remote' }" :load="fakeLoad">
  <fieldset data-gridselect><legend>Currency (from a server)</legend></fieldset>
</Example>

## Setting it up

Start with an empty wrapper and pass a `load` function. GridSelect calls it with two arguments: the text in the search field, and an `AbortSignal`. The function returns a promise that resolves to the entries, in the same format as the [`items` option](/guide/sources.md#entries-from-javascript): strings, numbers, or objects with `value`, `label` and optionally `description` and `disabled`, and groups if you like.

```js
gridselect(document.querySelector("#city"), {
  name: "city",
  load: async (query, signal) => {
    const response = await fetch(`/api/cities?q=${encodeURIComponent(query)}`, { signal });
    const cities = await response.json();
    return cities.map((city) => ({ value: city.id, label: city.name, description: city.country }));
  },
});
```

Pass the `signal` on to `fetch`. GridSelect uses it to cancel a request that is no longer needed, for example because someone kept typing.

## When GridSelect calls `load`

GridSelect calls `load("")` with an empty query each time the panel opens, so people see a first set of entries right away. While they type, it waits until they pause for 250 milliseconds and then calls `load` with the current text. This keeps the number of requests low even for fast typists.

When the answer arrives, it replaces the list in the open panel. The panel stays open, the search text and the keyboard focus stay where they were, and the cursor moves to the first result. GridSelect does not filter the answer again, because your server decides what counts as a match: it may search in fields that are not shown, correct typos, or rank results by relevance.

Because GridSelect cannot know in advance how many entries the server will return, a group with `load` always shows the field and the panel, regardless of the [threshold](/guide/concepts.md#the-threshold-visible-items-or-a-field-with-a-panel).

## Loading, errors and outdated answers

While a request is running, the panel shows the text "Loading…", and screen readers announce it through the panel's status region. If the request fails, because the network is down or your function throws, the panel shows "Could not load entries" instead and keeps the entries it already had. Typing again starts a new attempt. You can replace both texts, for example to translate them:

```js
gridselect(el, { load, loadingText: "Lädt …", errorText: "Laden fehlgeschlagen" });
```

Answers can arrive out of order on a slow network. GridSelect therefore aborts the previous request as soon as it starts a new one, and it ignores any answer that belongs to an aborted request. The list always shows the result of the latest query.

## Waiting for a few characters

For very large datasets an empty or one-letter query would return far too many entries. Set `minQueryLength` to start loading only once people have typed enough. Until then the list stays empty and the panel explains what to do, by default with "Type 2 characters to search". The function `minQueryText` lets you change that text.

```js
gridselect(el, { load, minQueryLength: 2, minQueryText: (n) => `Bitte mindestens ${n} Zeichen eingeben` });
```

## The chosen entry always stays

A later answer may not contain the entry that is currently chosen. Imagine someone picks "Berlin", then searches for "Munich": the new answer contains only Munich. GridSelect remembers the value and the label of every chosen entry, so the selection does not get lost. The field keeps showing "Berlin", `gs.value` stays `"BER"`, and the form still submits it, until someone picks something else.

## With `<grid-select>`, React and Vue

On the [custom element](/guide/frameworks.md) set the function as a property, because a function cannot be written as an HTML attribute. The texts and the minimum length have matching attributes.

```html
<grid-select id="city" name="city" label="City" min-query-length="2" loading-text="Loading cities…"></grid-select>
<script type="module">
  document.querySelector("#city").load = (query, signal) => fetch(`/api/cities?q=${query}`, { signal }).then((r) => r.json());
</script>
```

The React and Vue components accept the function as a `load` prop.
