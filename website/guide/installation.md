# Installation

GridSelect has no dependencies. The package contains the core script, an optional custom element, a stylesheet, optional themes, and thin components for React and Vue. You only load the parts you use.

## With npm and a bundler

Install the package:

```sh
npm install @emmgeede/gridselect
```

Then import the function and, if you want the ready-made look, the stylesheet. Bundlers such as Vite, webpack or esbuild handle the CSS import; in other setups link the file `node_modules/@emmgeede/gridselect/src/gridselect.css` yourself.

```js
import { gridselect } from "@emmgeede/gridselect";
import "@emmgeede/gridselect/gridselect.css";

gridselect(document.querySelector("#currency"));
```

The package ships plain JavaScript modules with TypeScript declarations, so editors show the options and their types without any extra package.

## From a CDN, without a build step

If your page has no build step, load the prebuilt files from a CDN. The script defines a global function `gridselect` on `window`. The `@1` in the address always loads the newest 1.x version, which never contains breaking changes.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@emmgeede/gridselect@1/src/gridselect.css">
<script src="https://cdn.jsdelivr.net/npm/@emmgeede/gridselect@1/dist/gridselect.min.js"></script>
<script>
  document.querySelectorAll("[data-gridselect]").forEach((el) => gridselect(el));
</script>
```

If you would rather not call any JavaScript at all, load the build that contains the custom element instead. It registers the tag `<grid-select>`, which you then write directly in your HTML; see [Custom element and frameworks](/guide/frameworks.md).

```html
<script src="https://cdn.jsdelivr.net/npm/@emmgeede/gridselect@1/dist/gridselect-element.min.js"></script>
```

## Which file does what

| Import | Contents |
|---|---|
| `@emmgeede/gridselect` | The core function `gridselect()`. Everything on this site works with it. |
| `@emmgeede/gridselect/element` | The custom element `<grid-select>`. Importing it registers the tag. |
| `@emmgeede/gridselect/react` | A React component around `<grid-select>`. Needs React 18 or newer. |
| `@emmgeede/gridselect/vue` | A Vue 3 component around `<grid-select>`. Needs Vue 3.3 or newer. |
| `@emmgeede/gridselect/gridselect.css` | The default stylesheet: light and dark mode, WCAG 2.2 AA contrast. |
| `@emmgeede/gridselect/themes/*.css` | Optional themes that you load after the stylesheet, see [Styling and themes](/guide/styling.md#themes). |

React and Vue are optional peer dependencies. Installing GridSelect never installs them; the components simply expect them to be present when you import them.

## Size

The core script weighs about 9 kB minified and compressed with gzip, the core together with the custom element about 11 kB. The test suite checks both numbers on every change, so they cannot grow unnoticed.

## Browser support

GridSelect supports the current versions of Chrome, Edge, Firefox and Safari, including their mobile versions. It uses modern but widely available features such as CSS layers, `:has()` and subgrid, and `ElementInternals` for the custom element as a form control. Older browsers are not supported, and there are no polyfills.
