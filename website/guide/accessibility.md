# Accessibility

GridSelect is built to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. Accessibility is not an add-on here: the decision to keep native form fields underneath, the keyboard support and the digit shortcuts all serve people who cannot or do not want to use a mouse, who use a screen reader, or who need high contrast and large text. This page explains what GridSelect does for accessibility and what remains your responsibility.

<script setup>
import { countries } from "../.vuepress/data.js";
</script>

Try the example with the keyboard alone, or with a screen reader switched on:

<Example :options="{ items: countries }">
  <fieldset data-gridselect><legend>Country</legend></fieldset>
</Example>

## Native fields first

Below the [threshold](/guide/concepts.md#the-threshold-visible-items-or-a-field-with-a-panel) the items are your own radio buttons or checkboxes. Browsers and screen readers have supported these elements for decades, so their names, states and keyboard behaviour work everywhere without any special code. GridSelect only adds the digit shortcuts and the visual style.

## The panel follows established patterns

Above the threshold GridSelect builds an interface that follows the patterns published by the W3C for this kind of control, the "combobox" and "listbox" patterns of WAI-ARIA. In practice this means:

- The search input announces itself as a combobox, says whether the panel is open (`aria-expanded`), and points at the item under the cursor (`aria-activedescendant`). Screen readers therefore announce each item as the cursor moves, while the focus stays in the search input.
- The list announces itself as a list of options (`role="listbox"` with `role="option"`). Each option says whether it is chosen (`aria-selected`) or unavailable (`aria-disabled`), and a multiple-choice list says that several options can be chosen.
- The field, the search input and the list all take their name from the group's `<legend>`, `aria-labelledby` or `aria-label`, so screen readers always say what the control is for.

## Everything works with the keyboard

Every action has a keyboard equivalent: opening the panel, searching, moving with the arrow keys, picking with Enter, closing with Escape or Tab, and picking directly with a digit. The page [Keyboard and digits](/guide/keyboard.md) lists all keys. Typing with an input method editor, as used for Chinese and Japanese, is not disturbed: keys pressed while a character is being composed are left to the input method.

## What is announced

Changes that people cannot see are announced through a status region, a hidden element with `role="status"` that screen readers read out when its text changes. GridSelect uses it for the number of search results ("6 results"), for "No matches", for "Loading…" and errors when entries come from a server, and for "Maximum of 3 reached" when a multiple choice has an upper limit.

The digit shortcuts are exposed through `aria-keyshortcuts` on each input or option. The visible badges themselves are hidden from screen readers, so a name is announced as "Euro", not as "1 Euro".

Group headings are announced when the cursor enters a new group, and descriptions are announced after the name, as additional information.

## Visible design

The default stylesheet meets the contrast requirements in light and dark mode: 4.5:1 for text and 3:1 for borders, focus outlines and the cursor. States never rely on colour alone; chosen items are also bold, disabled items are crossed out, and the cursor has an outline. Items are at least 24 pixels high, as WCAG 2.2 requires for click targets. The layout stays usable with enlarged text spacing and at a window width of 320 pixels, and modifier keys on the badges are written as letters (`S1`), not as symbols that are hard to read. The high contrast theme goes further and reaches 7:1 for all text.

## Forms and errors

`required`, `disabled` and form validation keep working. When a required group is empty on submit, the focus moves to the field and it is marked with `aria-invalid="true"`, which screen readers announce. See [Forms](/guide/forms.md).

## What stays your responsibility

Accessibility is a property of the whole page, so some things are up to you:

- Give every group a name, preferably with a `<legend>`. GridSelect warns in the browser console if a `<grid-select>` element has neither `label` nor `aria-label`.
- If you write your own CSS or change the colour variables, keep the contrast ratios and keep focus outlines visible.
- Use labels that make sense when read out of context, because screen reader users often hear an item on its own.

## How this is tested

Unit tests and browser tests cover the behaviour described above. On every change, axe-core checks every state of the component (closed, open, filtered, highlighted, without matches, invalid) for WCAG 2.0, 2.1 and 2.2 at levels A and AA, in light and dark mode, and the same check runs over every page of this documentation. A further browser test walks through a screen reader checklist with the keyboard and verifies the role, name, state and announcements that screen readers take from the browser's accessibility tree. This test runs in Chromium; it is not a substitute for listening with Orca, NVDA or VoiceOver, which has not been done.
