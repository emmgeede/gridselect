# Styling and themes

GridSelect separates behaviour from appearance. The script builds the structure and manages the states; how everything looks is decided entirely by CSS. You can use the default stylesheet as it is, adjust it with a handful of CSS variables, add one of the ready-made themes, or write your own styles from scratch.

The examples in this documentation use the showcase theme. The example below changes two variables on the wrapper, the accent colour and the corner radius, without touching anything else:

<Example>
  <fieldset data-gridselect style="--gs-accent: #7c3aed; --gs-accent-fg: #ffffff; --gs-radius: 6px">
    <legend>Size</legend>
    <label><input type="radio" name="size" value="s"> Small</label>
    <label><input type="radio" name="size" value="m" checked> Medium</label>
    <label><input type="radio" name="size" value="l"> Large</label>
  </fieldset>
</Example>

## The default stylesheet

The stylesheet `gridselect.css` gives GridSelect a complete look in light and dark mode. It turns the labels of a short group into rounded items with a digit badge, styles the field so that it resembles a select box, and lays out the panel with its search input and grid. Load it once, from npm or a CDN:

```js
import "@emmgeede/gridselect/gridselect.css";
```

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@emmgeede/gridselect@1/src/gridselect.css">
```

Below the threshold the stylesheet styles the labels that are direct children of the wrapper. The native input inside each label is made invisible but stays focusable and in the form, so keyboard and screen reader users still reach it. For this to work, every input must sit inside its label.

All colours meet the contrast requirements of WCAG 2.2 AA: at least 4.5:1 for text and 3:1 for borders, focus outlines and the cursor. The browser tests check this in light and dark mode on every change. States are never shown by colour alone: a chosen item is also bold, a disabled item is crossed out, the cursor has an outline.

## Your own CSS always wins

Every rule of the stylesheet sits inside a CSS cascade layer named `gridselect`. Rules outside of layers, which is what you normally write, always take precedence over rules inside a layer, no matter how specific the selectors are. You therefore never need `!important` to override GridSelect; a plain rule in your own stylesheet is enough.

## Changing the look with variables

Most adjustments do not need any new rules. The stylesheet reads its colours and sizes from CSS variables whose names start with `--gs-`. Set them on `:root` to change every GridSelect on the page, or on one wrapper (or any ancestor) to change only that one:

```css
:root {
  --gs-accent: #6d28d9;      /* chosen item, focus ring, cursor */
  --gs-accent-fg: #ffffff;   /* text on the accent colour */
  --gs-radius: 0.5rem;       /* corners of the items */
}
```

The most important variables are the colours (`--gs-bg`, `--gs-fg`, `--gs-muted`, `--gs-border`, `--gs-accent`), the sizes of items (`--gs-item-min-height`, `--gs-item-padding`, `--gs-item-min-width`, `--gs-gap`) and the panel dimensions (`--gs-panel-width`, `--gs-panel-max-width`, `--gs-list-max-height`). The reference page [CSS variables](/reference/css.md) lists every variable with its default value. If you change colours, check that they still reach the contrast ratios mentioned above.

## Light and dark mode

By default GridSelect follows the operating system's setting through `prefers-color-scheme`. If your site has its own switch, set `data-theme="light"` or `data-theme="dark"` on any ancestor, usually on `<html>`, and GridSelect follows that instead.

## Styling the states yourself

If you write your own styles, use the attributes that GridSelect sets rather than inventing classes. A chosen item has `aria-selected="true"`, the item under the cursor has `data-cursor`, a disabled item has `aria-disabled="true"`, the open field has `aria-expanded="true"`, and in highlight mode matching items have `data-match` while the others have `data-dimmed`. All parts also carry BEM classes such as `gridselect__field` and `gridselect__item`. [Attributes and hooks](/reference/attributes.md) lists them all.

## Themes

A theme is a second, small stylesheet that you load after `gridselect.css`. It changes colours, sizes and a few details, and it sits in its own cascade layer (`gridselect-<name>`), so your own CSS still wins over it. Four looks are available:

| Theme | Meant for | How to load it |
|---|---|---|
| Default | Strict WCAG 2.2 AA everywhere, with 3:1 borders on every control, in teal. | `gridselect.css` alone |
| Showcase | A compact, contemporary look in sky blue, with flat rows, check marks and keycap-like badges. | `themes/showcase.css` |
| High contrast | People with low vision: black and white, 2-pixel borders, 7:1 text contrast (WCAG AAA), underlined matches. | `themes/high-contrast.css` |
| Compact | Data-heavy screens: smaller, denser items in the colours of the default stylesheet; items stay at least 24 pixels high. | `themes/compact.css` |

```js
import "@emmgeede/gridselect/gridselect.css";
import "@emmgeede/gridselect/themes/showcase.css";
```

<table>
<tr>
<td width="50%">
<a href="https://gridselect.im/demo/"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/theme-default-dark.png?v=1">
  <img src="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/theme-default-light.png?v=1" width="100%" alt="The currency panel filtered for dollar with the default stylesheet: teal accent, rounded items with 3:1 borders.">
</picture></a>
<br><sub><b>Default</b></sub>
</td>
<td width="50%">
<a href="https://gridselect.im/demo/"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/theme-showcase-dark.png?v=1">
  <img src="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/theme-showcase-light.png?v=1" width="100%" alt="The same panel with the showcase theme: sky blue, flat rows, subtle borders.">
</picture></a>
<br><sub><b>Showcase</b></sub>
</td>
</tr>
<tr>
<td width="50%">
<a href="https://gridselect.im/demo/"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/theme-high-contrast-dark.png?v=1">
  <img src="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/theme-high-contrast-light.png?v=1" width="100%" alt="The same panel with the high contrast theme: black on white, thick borders.">
</picture></a>
<br><sub><b>High contrast</b></sub>
</td>
<td width="50%">
<a href="https://gridselect.im/demo/"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/theme-compact-dark.png?v=1">
  <img src="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/theme-compact-light.png?v=1" width="100%" alt="The same panel with the compact theme: default colours, smaller and denser items.">
</picture></a>
<br><sub><b>Compact</b></sub>
</td>
</tr>
</table>


The showcase theme keeps the resting borders of the field and the items deliberately subtle. The field is still recognisable by its text and its arrow, and the search input shows a border with 3:1 contrast while it has the focus. If you need strong borders on every control at all times, use the default stylesheet alone or the high contrast theme. Every theme passes the same automatic checks in light and dark mode: axe-core, 4.5:1 contrast for all text (7:1 for high contrast), and 3:1 for the arrow, the focused search input and the cursor.

You can compare all themes live with the Theme switch on the [demo page](https://gridselect.im/demo/). If you want to contribute a theme of your own, the [contributing notes](/reference/contributing.md) explain the rules: one file, a short header comment, its own layer, and the automatic checks.
