# CSS variables

The default stylesheet sits in `@layer gridselect`, themes in their own layers after it, so any rule of yours wins without `!important`. Set the variables on `:root`, on a wrapper or any ancestor. Dark mode follows `prefers-color-scheme`; force it with `data-theme="light"` or `data-theme="dark"` on any ancestor.

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

Themes set the same variables (and a few own rules). See [Styling and themes](/guide/styling.md).
