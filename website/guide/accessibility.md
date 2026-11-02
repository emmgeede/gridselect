# Accessibility

<script setup>
import { currencies, regions, countries, airports, fakeLoad } from "../.vuepress/data.js";
</script>

Try it with the keyboard alone, or with a screen reader:

<Example :options="{ items: countries }">
  <fieldset data-gridselect><legend>Country</legend></fieldset>
</Example>

GridSelect is built for WCAG 2.2 level AA:

- **Native first.** Below the threshold your radios and checkboxes stay
  native, with the browser's own semantics and keyboard handling.
- **WAI-ARIA patterns.** Above the threshold the field, the search input
  (`role="combobox"`, `aria-expanded`, `aria-activedescendant`) and the list
  (`role="listbox"`, `role="option"`, `aria-selected`, `aria-disabled`)
  follow the WAI-ARIA combobox and listbox patterns. All of them take the
  group's name from your `<legend>`, `aria-label` or `aria-labelledby`.
- **Keyboard only.** Everything works without a mouse: open, search, arrow
  keys, Enter, Escape, Tab, digits. Keys during an IME composition are left
  to the input method.
- **Announcements.** A `role="status"` region tells screen readers how many
  items match. Digit shortcuts are exposed as `aria-keyshortcuts`, the visible
  badges are `aria-hidden`.
- **Forms.** `required`, `disabled` and validation keep working, an invalid
  group moves focus to the field and sets `aria-invalid`.
- **Not by colour alone.** States come from attributes (`aria-selected`,
  `data-match`, `data-dimmed`) that styles can mark with more than colour.
  The default stylesheet meets AA contrast in light and dark mode, marks
  states with weight, outline or strike-through as well as colour, keeps
  text readable with increased text spacing and at 320 px width, and shows
  modifier keys as letters, not hard-to-read symbols.

Conformance is a property of the whole page, so a few things stay with you:
give every group a name, keep sufficient contrast if you write your own CSS,
and keep focus outlines visible. The behaviour above is covered by unit and
browser tests, and axe-core checks every state (closed, open, filtered,
highlighted, no matches, invalid) for WCAG 2.0, 2.1 and 2.2 A and AA in
light and dark mode on every push; the Accessibility badge above shows the
result. A screen reader walkthrough runs as a browser test too: it drives
every step by keyboard and checks the role, name, state and announcements
screen readers read from the accessibility tree. It runs in Chromium; it is
not a substitute for listening with Orca, NVDA or VoiceOver, which has not
been done.
