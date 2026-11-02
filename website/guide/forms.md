# Forms

<script setup>
import { ref } from "vue";
const sent = ref("");
const submit = (e) => (sent.value = JSON.stringify([...new FormData(e.target)]));
</script>

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

GridSelect keeps your native inputs (or `<select>`), so a form submits, resets and validates as usual. `required` works too: an empty group is reported on submit, the field gets the focus and `aria-invalid="true"`.

## `<grid-select>` in forms

In forms `<grid-select>` is a form control of its own, like a `<select>`:
it appears in `form.elements`, submits its value under `name` (each value
separately with `multiple`), and has `el.form`, `el.validity`,
`el.validationMessage`, `el.willValidate`, `checkValidity()`,
`reportValidity()` and `setCustomValidity()`. With `required` and nothing
chosen it is invalid with the browser's own message, matches `:invalid`, and
a submit is blocked with the focus on the field. A form reset brings back the
start value, a disabled `<fieldset>` around it disables it, and the browser's
back and forward buttons restore the choice. So `new FormData(form)` just
works. (Browsers without `ElementInternals` fall back to the inner inputs.)
