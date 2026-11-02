# Working on GridSelect

Rules for everyone who changes this repository, people and AI agents alike
(Claude Code, Copilot, Cursor, Codex and others read this file). Claude Code
users also get the `contributing` skill in `.claude/skills/`, which walks
through these steps. Themes have extra rules in [CONTRIBUTING.md](CONTRIBUTING.md).

## What GridSelect is

A dependency-free select component on top of native radios, checkboxes and
`<select>`. Up to a threshold the entries stay visible as items; above it a
field opens a panel with search, a grid and digit shortcuts. Entries are
called **items**, never chips or pills.

| Path | What |
|---|---|
| `src/gridselect.js` | Core: `gridselect(wrapper, options)`, sources, panel, search, keys |
| `src/element.js` | `<grid-select>` custom element (light DOM) |
| `src/react.js`, `src/vue.js` | Thin wrappers around `<grid-select>` |
| `src/gridselect.css` | Default stylesheet in `@layer gridselect`, `--gs-*` variables |
| `themes/*.css` | Optional themes, one layer each |
| `test/` | Vitest + jsdom: behaviour through the public API |
| `e2e/` | Playwright against `playground/` and `demo/`: layout, focus, keys, axe |
| `playground/` | Test page with every variant (`npm run playground`) |
| `demo/` | Public demo, https://gridselect.im/demo/ |

## Principles (not negotiable)

- **Native inputs stay the source of truth.** Forms submit, reset and validate
  without extra code; without JavaScript the native field still works.
- **Data attributes mark structure** (`data-gridselect-*`), **ARIA marks
  state** (`aria-selected`, `aria-expanded`, `aria-disabled` …). Own CSS
  classes follow BEM (`gridselect__item`).
- **Accessible: WCAG 2.2 AA.** Keyboard alone must do everything; text 4.5:1,
  focus and state indicators 3:1; states never by colour alone; announce
  changes through the `role="status"` region; keep names short and put extra
  text in descriptions.
- **No runtime dependencies.** Not even small ones.
- **Size budget:** the limits in `test/package.test.js` (core and core plus
  element, min+gzip). A change that needs more is a maintainer decision;
  say so in the pull request instead of raising the limit yourself.
- **Simple.** Every new option, attribute or visible control needs a reason.
  Prefer the smaller change.
- **Code comments in English**, short and about why, not what. JSDoc types
  on public functions; `npm test` also type-checks.

## How to make a change

1. **Agree first.** For anything beyond a typo open an issue and wait for a
   maintainer's go, so nobody builds something that cannot be merged.
2. **Branch** from `main`.
3. **Test first.** Write the test, see it fail, then write the smallest code
   that makes it pass. Test through the public API (`gridselect()`, the DOM it
   builds, the element, the wrappers), not internals. Expected values come
   from the spec or a worked example, never recomputed like the code does.
4. **Browser tests** for anything that depends on layout, visibility, focus
   or real key presses: a Playwright test in `e2e/`, and the variant on the
   playground first. Check accessibility with axe (see `e2e/a11y.e2e.js`).
5. **Docs in the same pull request.** README: usage, options table,
   attributes, feature table, and the Contents list in sync with the
   headings. CHANGELOG: an entry under `## [Unreleased]` (Added, Changed,
   Fixed …, Keep a Changelog). Numbers in docs (sizes, versions) are checked
   by tests; keep them true.
6. **Do not** change the version, create tags, edit `CHANGELOG` release
   sections, or add files under `docs/` or `CLAUDE.md` (maintainer-only).
7. **Run everything:**

   ```sh
   npm test                        # unit tests, types, package and size checks
   npm run test:e2e                # build, then Playwright incl. axe
   node scripts/pr-check.js        # the rules CI checks on your pull request
   ```

8. **Commit messages:** `feat: …`, `fix: …`, `docs: …`, `test: …`,
   `chore: …`, in English, present tense.
9. **Open the pull request** with the template filled in: what and why, the
   issue, how it was tested.

CI runs the tests, axe and `scripts/pr-check.js` on every pull request. A
pull request that fails them will not be reviewed.
