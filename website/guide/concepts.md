# How GridSelect works

This page explains the ideas and terms that the rest of the documentation relies on. If a word like "threshold" or "cursor" appears somewhere and you are unsure what it means, it is explained here.

## Native fields stay the source of truth

GridSelect never replaces your form fields. It works on top of a group of radio buttons, a group of checkboxes or a `<select>` element, and those native fields always hold the real state. When someone picks an entry in GridSelect, the corresponding radio button or checkbox is checked (or the option of the select is selected), and the browser fires its normal events.

This has three practical consequences. First, your form submits the selection under the field's `name` without any extra code. Second, everything the browser already does for forms keeps working: `required`, `form.reset()`, `FormData`, and restoring values when people navigate back. Third, if the script fails to load, the original fields are still there and still usable.

## The wrapper

GridSelect needs one element that contains the group. This element is called the **wrapper**. Usually it is a `<fieldset>` with a `<legend>`, because the legend gives the group an accessible name. You mark the wrapper with the attribute `data-gridselect` and pass it to `gridselect()`. Everything GridSelect adds, such as the field, the panel and the digit badges, is added inside the wrapper.

## Items

Each choice in the group is called an **item**. An item has a value (what the form submits) and a label (what people see). It can also be disabled, belong to a group with a heading, and carry a description as a second line. Where the items come from is up to you: from radio buttons or checkboxes in your HTML, from the options of a `<select>`, from a JavaScript array, or from a server. The [Sources](/guide/sources.md) page covers all of them.

## The threshold: visible items or a field with a panel

GridSelect shows a group in one of two ways, depending on how many items it has.

**Up to the threshold** the items stay visible on the page. Each label is styled as a rounded item, and people pick one with a click, with the arrow keys as in any radio group, or with a digit. This is the right form for short lists, because every option is visible without any extra step.

**Above the threshold** the items are folded away. GridSelect shows a compact **field** that looks like a select box and displays the current choice. Clicking the field (or pressing Enter, Space or the down arrow while it has the focus) opens the **panel**: a search input above a grid of all items. This form keeps long lists from filling the page, and the search makes a specific entry quick to find.

The **threshold** is the number of items at which GridSelect switches. It is 10 by default, which means that a group with ten items stays visible and a group with eleven or more gets the field and the panel. You can set it per group with the option `threshold` or the attribute `data-threshold`:

```js
// more than five items: field and panel
gridselect(el, { threshold: 5 });
// stays visible up to a hundred items
gridselect(el, { threshold: 100 });
```

```html
<fieldset data-gridselect data-threshold="5"> … </fieldset>
```

One feature always uses the panel, whatever the number of items: loading entries from a server, because the number of results is not known in advance. All other features work in both forms.

## The panel and the cursor

The panel opens below or above the field, depending on where there is more room, and grows up to the edge of the window. By default it is as wide as the window. Its parts are a search input, the list of items and, when needed, a short message such as "No matches".

While the panel is open, the keyboard focus stays in the search input, so people can type at any time. One item is marked with an outline: this is the **cursor**. The arrow keys move the cursor through the grid, and Enter picks the item under it. The cursor is not the same as the selection: the selection is what is checked, the cursor is where the keyboard currently points. Screen readers announce the item under the cursor as people move.

[The panel](/guide/panel.md) explains layouts, width and height, and [Search](/guide/search.md) explains how typing narrows or highlights the items.

## Digit shortcuts and tiers

Every item gets a small badge with a digit. Pressing that digit picks the item directly, which is much faster than moving the cursor for people who use a list every day. The first ten items get the digits 1 to 9 and 0. Because there are only ten digits, further items are reached with a modifier key: by default Shift and a digit picks items 11 to 20, and Alt and a digit picks items 21 to 30. Each such range of ten is called a **tier**. The badge shows the modifier as a letter before the digit, for example `S1` for Shift and 1.

You can choose other modifiers or turn the digits off. [Keyboard and digits](/guide/keyboard.md) explains the details.

## Layouts

Above the threshold the items in the panel can be arranged in three ways, called **layouts**. The default `grid` arranges them in equal columns that are as wide as the longest item, so short labels fit many columns side by side. The `list` layout puts one item per row, which suits long texts. The `flow` layout lets items run one after another like words in a sentence, each as wide as its label. [The panel](/guide/panel.md#layouts) shows all three.

## Terms at a glance

| Term | Meaning |
|---|---|
| Wrapper | The element around the group, marked with `data-gridselect`, passed to `gridselect()`. |
| Item | One choice: a value, a label, optionally a description, a group and a disabled state. |
| Threshold | The number of items up to which they stay visible. Above it, a field with a panel is used. Default 10. |
| Field | The compact button above the threshold that shows the current choice and opens the panel. |
| Panel | The pop-up with the search input and all items. |
| Cursor | The outlined item in the panel that the arrow keys move and Enter picks. |
| Digit badge | The small number on each item; pressing the digit picks the item. |
| Tier | A range of ten items reached with one modifier key, for example Shift for items 11 to 20. |
| Layout | How items are arranged in the panel: `grid`, `list` or `flow`. |
| Instance | The object `gridselect()` returns, with `value`, `setItems()` and `destroy()`. |
