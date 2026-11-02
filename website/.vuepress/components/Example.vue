<script setup>
// A live GridSelect: the slot holds the markup, `options` (optional) go to gridselect().
// Elements with data-gridselect are set up after mounting; <grid-select> registers itself.
import { onMounted, onBeforeUnmount, ref } from "vue";

const props = defineProps({ options: { type: Object, default: () => ({}) }, load: { type: Function, default: undefined } });
const root = ref(null);
const instances = [];

onMounted(async () => {
  const { gridselect } = await import("@gridselect/gridselect.js");
  await import("@gridselect/element.js");
  for (const el of root.value.querySelectorAll("[data-gridselect]:not(grid-select [data-gridselect])"))
    instances.push(gridselect(el, props.load ? { ...props.options, load: props.load } : props.options));
});
onBeforeUnmount(() => instances.forEach((gs) => gs.destroy()));
</script>

<template>
  <ClientOnly>
    <div ref="root" class="gs-example"><slot /></div>
  </ClientOnly>
</template>

<style>
.gs-example {
  margin: 1rem 0;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
}
</style>
