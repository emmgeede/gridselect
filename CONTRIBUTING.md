# Contributing

Bug reports, ideas and pull requests are welcome. For code changes, please
open an issue first so we can agree on the approach. Every change comes with
tests (`npm test` for logic, `npm run test:e2e` for anything visible).

## Contributing a theme

A theme is one CSS file in `themes/`. It changes how GridSelect looks, never
its markup or behaviour.

1. **File name.** `themes/<name>.css`, lowercase with dashes, e.g.
   `themes/forest.css`.
2. **Header comment.** The file starts with a comment that names the theme.
   The demo and `themes/index.json` are built from it:

   ```css
   /*
    * @name Forest
    * @description Calm greens with rounded items.
    * @author your-github-name
    */
   ```

   Add `@contrast AAA` if the theme promises 7:1 text contrast; the checks
   then hold it to that.
3. **Own layer.** Put every rule inside `@layer gridselect-<name> { … }`. The
   layer comes after `gridselect`, so the theme wins over the default
   stylesheet and still loses to the page's own CSS.
4. **Only GridSelect.** Set `--gs-*` variables and style GridSelect's own
   selectors (`[data-gridselect]`, `.gridselect__*`). Nothing else on the page.
5. **Light and dark.** Define colours for both, the same way the existing
   themes do: on `:root` and `[data-theme="light"]`, under
   `@media (prefers-color-scheme: dark)` for `:root:not([data-theme="light"])`,
   and on `[data-theme="dark"]`.

### Checks

`npm run test:e2e` picks up every file in `themes/` on its own
(`e2e/themes.e2e.js`). In light and dark mode, with the panel open, it checks:

- no axe violations (WCAG 2.2 AA);
- text contrast of at least 4.5:1 (7:1 with `@contrast AAA`) for the field,
  dimmed, matching and selected entries, digit badges, the search input and
  group headings;
- at least 3:1 for the field's chevron, the focused search input's border and
  the cursor indicator;
- the header comment and the layer;
- different panel colours in light and dark mode.

A theme that fails a check cannot be merged. To look at your theme, run
`npm run playground` and open the demo at http://localhost:5173/demo/: it
lists every theme in the Theme picker.
