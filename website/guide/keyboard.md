# Keyboard and digits

GridSelect can be used completely without a mouse. This matters for people who cannot use a mouse, for screen reader users, and for everyone who enters data all day and wants to be fast. This page describes which keys do what in both forms of a group, and how the digit shortcuts work and can be configured.

<script setup>
import { currencies } from "../.vuepress/data.js";
</script>

Try it below: press Tab until the field has the focus, press Enter to open the panel, move with the arrow keys and press Enter to pick. Or press a digit, or Shift together with a digit, to pick an item directly.

<Example :options="{ items: currencies }">
  <fieldset data-gridselect><legend>Currency</legend></fieldset>
</Example>

## Below the threshold: the keys you already know

As long as a group has no more items than the [threshold](/guide/concepts.md#the-threshold-visible-items-or-a-field-with-a-panel), the items are your own radio buttons or checkboxes, and they keep their native keyboard behaviour. GridSelect does not change it; it only adds the digit shortcuts described below.

In a group of radio buttons, Tab moves the focus into the group, onto the chosen item (or the first one if nothing is chosen), and the next Tab leaves the group. Inside the group, the arrow keys move to the previous or next item and select it at the same time. In a group of checkboxes, every checkbox is a separate stop for Tab, and Space ticks or unticks the one that has the focus.

## Above the threshold: field and panel

Above the threshold the group consists of the field and the panel. While the field has the focus, Enter, Space or the down arrow opens the panel; a click does the same. The focus then moves into the search input, and the following keys apply:

| Key | What happens |
|---|---|
| Typing | Narrows or highlights the items, see [Search](/guide/search.md). |
| Left and right arrows | Move the cursor to the previous or next item. In the list layout they stay in the search input for editing the text. |
| Up and down arrows | Move the cursor one row up or down. In the grid, rows are the visible rows of the grid; in the list layout one item; in the flow layout the nearest item in the row above or below. The cursor stops at the first and last row. |
| Enter | Picks the item under the cursor and closes the panel. In a multiple-choice group it ticks or unticks the item, and the panel stays open. |
| A digit, or a modifier and a digit | Picks the item with that badge, see below. |
| Escape | Closes the panel without changing anything and puts the focus back on the field. |
| Tab or Shift+Tab | Closes the panel without changing anything; the focus moves on as usual. |

The arrow keys follow what people see: in the grid, "down" means the item directly below, however many columns the window allows. Group headings and the pinned and recent groups are skipped; the cursor only lands on items.

<a href="https://gridselect.im/demo/">
<picture>
  <source media="(prefers-reduced-motion: reduce) and (prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/keyboard-dark.png?v=3">
  <source media="(prefers-reduced-motion: reduce)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/keyboard-light.png?v=3">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/keyboard-dark.webp?v=3">
  <img src="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/keyboard-light.webp?v=3" width="100%" alt="Animation: Enter opens the currency panel, the cursor outline moves right twice, down twice and left once, Enter picks Polish złoty and the panel closes with it in the field.">
</picture>
</a>

<sub>The arrow keys move the outlined cursor through the grid, and Enter picks the item and closes the panel. The red badge in the corner shows the key that was just pressed.</sub>

## Digit shortcuts

Moving the cursor step by step is slow when a list has forty entries. GridSelect therefore gives every item a small badge with a digit, and pressing that digit picks the item at once. People who use the same list every day quickly learn that, say, 3 is "US dollar", and from then on choose it with a single key.

Because there are only ten digits, items beyond the tenth are reached with a modifier key. Each group of ten items that shares one modifier is called a **tier**. By default the first tier uses the plain digits 1 to 9 and 0 for items 1 to 10, the second tier uses Shift with a digit for items 11 to 20, and the third tier uses Alt with a digit for items 21 to 30. The badge shows the modifier as a letter before the digit: `S1` means Shift and 1, `A1` means Alt and 1. Letters are used instead of symbols such as ⇧ because many people find those symbols hard to recognise.

On devices that are operated by touch alone, such as phones, the badges are hidden: without a hardware keyboard there are no digit keys to press, and tapping an item picks it directly.

<a href="https://gridselect.im/demo/">
<picture>
  <source media="(prefers-reduced-motion: reduce) and (prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/digits-dark.png?v=3">
  <source media="(prefers-reduced-motion: reduce)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/digits-light.png?v=3">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/digits-dark.webp?v=3">
  <img src="https://raw.githubusercontent.com/emmgeede/gridselect/main/assets/digits-light.webp?v=3" width="100%" alt="Animation: Enter opens the currency panel with digit badges 1 to 0, then S1 to S0 and A1. Pressing 4 picks Pound sterling and closes the panel. After reopening, Shift and 3 picks Brazilian real, badge S3.">
</picture>
</a>

<sub>Pressing 4 picks the fourth entry; Shift and 3 (badge S3) picks the thirteenth. The panel closes right away.</sub>

The digits work in both forms. Below the threshold they work while the focus is anywhere in the group: a radio button is checked and focused, a checkbox is ticked or unticked. In the panel a digit always picks an item and is never typed into the search input. In filter mode the visible matches are numbered from 1 after each keystroke, so the first match is always 1. In highlight mode the numbers never change.

GridSelect counts the position of the key, not the character it produces. Shift and 1 therefore works on every keyboard layout, even where Shift and 1 types `!` or `+`, and the digits on the number pad work too.

### Choosing other modifiers or turning digits off

The option `shortcuts` is a list of tiers. Each tier is a modifier name or several names joined with `+`, and an empty string stands for the plain digits. The names are `Shift`, `Alt`, `Control` and `Meta` (the Command key on a Mac).

```js
gridselect(el, { shortcuts: ["", "Shift", "Alt"] }); // the default
// plain digits stay free for typing
gridselect(el, { shortcuts: ["Alt", "Control+Shift"] });
gridselect(el, { shortcuts: false }); // no digit shortcuts at all
```

```html
<fieldset data-gridselect data-shortcuts="off"> … </fieldset>
```

Turn the plain digits off, or turn shortcuts off entirely, when the labels themselves contain numbers that people want to type into the search, such as postcodes or years. When you choose modifiers, keep the browser and the operating system in mind: Control or Command with a digit switches browser tabs, Alt opens menus on Windows, and on many European keyboards the AltGr key reports itself as Control and Alt together, so a `Control+Alt` tier would swallow characters such as `{` (AltGr and 7) in the search.

### The badge in the markup

GridSelect puts the digit into an element `<span data-gridselect-key class="gridselect__key">` at the start of each label and of each panel item. The badge is hidden from screen readers, because the input itself announces the shortcut through the attribute `aria-keyshortcuts`. The tier's modifiers are stored in `data-modifiers`, and `data-prefix` holds the letters shown before the digit (`S` for Shift, `A` for Alt, `C` for Control, `M` for Meta).

If you want the badge somewhere else in your own markup, place an empty element with `data-gridselect-key` inside the label yourself. GridSelect fills it with the digit instead of adding its own badge, and it leaves an element alone that already has content. `destroy()` removes everything GridSelect added.
