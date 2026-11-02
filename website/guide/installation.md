# Installation

```sh
npm install @emmgeede/gridselect
```

```js
import { gridselect } from "@emmgeede/gridselect";
import "@emmgeede/gridselect/gridselect.css"; // optional
```

Without a bundler, from a CDN (`window.gridselect`):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@emmgeede/gridselect@0/src/gridselect.css">
<script src="https://cdn.jsdelivr.net/npm/@emmgeede/gridselect@0/dist/gridselect.min.js"></script>
<script>
  document.querySelectorAll("[data-gridselect]").forEach((el) => gridselect(el));
</script>
```

Prefer HTML only? Use the custom element, see [`<grid-select>`](/guide/frameworks.md):

```html
<script src="https://cdn.jsdelivr.net/npm/@emmgeede/gridselect@0/dist/gridselect-element.min.js"></script>
```

## Browser support

Current evergreen browsers (Chrome, Edge, Firefox, Safari).
