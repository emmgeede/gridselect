# Forms

GridSelect is designed to sit inside ordinary HTML forms without any glue code. This page explains why that works, what happens when a form is submitted, validated or reset, and how the `<grid-select>` element behaves as a form field of its own.

<script setup>
import { ref } from "vue";
const sent = ref("");
const submit = (e) => (sent.value = JSON.stringify([...new FormData(e.target)]));
</script>

The example is a form with a required field. Press "Submit" without choosing anything: the browser stops the submission and points at the field. Choose a destination and submit again: the output shows what the form would send.

<Example>
  <form @submit.prevent="submit">
    <grid-select name="destination" label="Destination" required>
      <option value="BER">Berlin</option>
      <option value="OSL">Oslo</option>
      <option value="ZRH">Zurich</option>
    </grid-select>
    <p><button>Submit</button> <output>{{ sent }}</output></p>
  </form>
</Example>

## Why forms just work

GridSelect never replaces your form fields; it only adds an interface on top of them (see [How GridSelect works](/guide/concepts.md#native-fields-stay-the-source-of-truth)). The radio buttons, checkboxes or the `<select>` stay in the form with their `name` and `value`. When someone picks an entry, the matching native field is checked or selected. A submitted form therefore contains exactly what it would contain without GridSelect, and server code does not need to change.

The same is true for everything else the browser does with forms:

- **Submitting** sends the chosen value under the field's name. With checkboxes or `<select multiple>`, every chosen value is sent.
- **`FormData`** and `form.elements` see the native fields as usual.
- **Resetting** the form (a reset button or `form.reset()`) restores the initial choice, and GridSelect updates the field text and the panel accordingly.
- **Disabling** a field or a surrounding `<fieldset>` disables the GridSelect interface too.

## Required fields and validation

Add the `required` attribute to the inputs or to the `<select>` as you normally would. If the group is still empty when the form is submitted, the browser cancels the submission. Because the native inputs are hidden above the threshold, the browser could not point at them; GridSelect therefore moves the focus to the visible field and marks it with `aria-invalid="true"`, so screen readers announce it as invalid and the default stylesheet draws a red border. Below the threshold the browser points at the first input as usual. The mark disappears as soon as an entry is chosen.

## `<grid-select>` as a form field of its own

The [`<grid-select>` element](/guide/frameworks.md) goes one step further: the element itself is a form field, just like a `<select>`. It appears in `form.elements`, and it submits its value under its `name` attribute, with one entry per chosen value for `multiple`. The radio buttons it creates inside are not submitted, so nothing arrives twice.

The element offers the same validation interface as native fields:

| Property or method | What it does |
|---|---|
| `el.form` | The form the element belongs to. |
| `el.validity` | The validity state; `valueMissing` is true when the element is required and empty. |
| `el.validationMessage` | The message the browser shows, for `required` the same text a native `<select>` would show. |
| `el.willValidate` | Whether the element takes part in form validation. |
| `el.checkValidity()` | Returns whether the element is valid. |
| `el.reportValidity()` | Like `checkValidity()`, and shows the browser's message if it is not. |
| `el.setCustomValidity(message)` | Marks the element invalid with your own message; an empty string clears it. |

A required, empty element matches the CSS pseudo-class `:invalid`, and submitting the form is blocked with the focus on the field. A form reset restores the start value from the `value` attribute or the `selected` options, a disabled `<fieldset>` around the element disables it, and when people navigate back to the page, the browser can restore their choice.

This relies on a browser feature called `ElementInternals`, which all current browsers support. In a browser without it, the element falls back to letting its inner inputs submit, which still sends the right value.
