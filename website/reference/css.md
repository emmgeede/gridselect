# CSS variables

The default stylesheet takes its colours and sizes from CSS custom properties, also called CSS variables, whose names start with `--gs-`. Changing a variable is the easiest way to adapt GridSelect to your design, because you do not need to know or override any of the stylesheet's rules.

Set a variable on `:root` to change every GridSelect on the page, or on one wrapper or any of its ancestors to change only the groups inside it. The stylesheet sits in the cascade layer `gridselect`, and themes sit in their own layers after it, so any rule you write outside a layer wins without `!important`. Light and dark mode follow the operating system through `prefers-color-scheme`; set `data-theme="light"` or `data-theme="dark"` on any ancestor to force one. The colour defaults below are those of the light mode; the dark mode uses its own values with the same contrast. See [Styling and themes](/guide/styling.md) for more.

| Variable | What | Default (light) |
|---|---|---|
| `--gs-bg` | Panel and field background | `#ffffff` |
| `--gs-item-bg` | Item background | `#f5f7fa` |
| `--gs-fg` | Text | `#0e1117` |
| `--gs-muted` | Dimmed text, headings, descriptions | `#636b78` |
| `--gs-border` | Borders (3:1) | `#7a8494` |
| `--gs-accent` | Selected background, focus and cursor ring | `#03a2a5` |
| `--gs-accent-fg` | Text on the accent | `#0e1117` |
| `--gs-accent-text` | Matches in highlight mode | `#00787b` |
| `--gs-key-bg` | Digit badge | `#dce6ec` |
| `--gs-key-fg` | Digit badge text | `#0e1117` |
| `--gs-key-selected-bg` | Badge of a chosen item | `#8ed5d6` |
| `--gs-invalid` | Invalid field | `#b91c1c` |
| `--gs-shadow` | Panel shadow | `0 8px 30px rgb(0 13 26 / 0.12)` |
| `--gs-font` | Font | `inherit` |
| `--gs-radius` | Item corner radius | `999px` |
| `--gs-gap` | Space between items | `0.5rem` |
| `--gs-item-min-height` | Item height (at least 24 px) | `2rem` |
| `--gs-item-padding` | Item padding | `0.25rem 0.75rem` |
| `--gs-item-min-width` | Smallest grid column | `8rem` |
| `--gs-focus-width` | Focus and cursor ring | `2px` |
| `--gs-panel-width` | Panel width with `panelWidth: "fixed"` | `min(40rem, 100vw - 2rem)` |
| `--gs-panel-max-width` | Cap for the full-width panel | `none` |
| `--gs-list-max-height` | List height with `panelHeight: "fixed"` | `18rem` |
| `--gs-auto-width` | Set by GridSelect: width of the widest item | `measured` |

Themes set the same variables, plus a few rules of their own. If you change colours, keep the contrast that WCAG 2.2 AA requires: 4.5:1 for text against its background, and 3:1 for borders, focus outlines and the cursor.
