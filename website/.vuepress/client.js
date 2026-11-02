// Loads GridSelect (from src/, so the docs always show the current code) and the live example component.
import { defineClientConfig } from "vuepress/client";
import "@gridselect/gridselect.css";
import Example from "./components/Example.vue";

export default defineClientConfig({
  enhance({ app }) {
    app.component("Example", Example);
  },
});
