// VuePress config for the documentation at https://gridselect.im/docs/
import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import { defaultTheme } from "@vuepress/theme-default";
import { searchPlugin } from "@vuepress/plugin-search";
import { getDirname, path } from "vuepress/utils";

const __dirname = getDirname(import.meta.url);

const guide = ["", "installation", "sources", "server", "panel", "search", "keyboard", "groups", "pinned", "descriptions",
  "multiple", "forms", "styling", "accessibility", "frameworks"].map((p) => `/guide/${p}`);

export default defineUserConfig({
  base: "/docs/",
  lang: "en-US",
  title: "GridSelect",
  description: "One select for every list, short or long: native radios, checkboxes and selects with a searchable grid.",
  head: [["link", { rel: "icon", href: "/docs/logo.svg" }]],
  bundler: viteBundler({
    viteOptions: { server: { fs: { allow: [path.resolve(__dirname, "../..")] } } },
    vuePluginOptions: { template: { compilerOptions: { isCustomElement: (tag) => tag === "grid-select" } } },
  }),
  alias: { "@gridselect": path.resolve(__dirname, "../../src"), "@themes": path.resolve(__dirname, "../../themes") },
  theme: defaultTheme({
    logo: "/logo.svg",
    repo: "emmgeede/gridselect",
    docsDir: "website",
    // The theme's prev/next links carry an aria-label that differs from their text (WCAG 2.5.3); the sidebar covers navigation.
    prev: false,
    next: false,
    navbar: [
      { text: "Guide", link: "/guide/" },
      { text: "Reference", link: "/reference/" },
      { text: "Demo", link: "https://gridselect.im/demo/" },
      { text: "npm", link: "https://www.npmjs.com/package/@emmgeede/gridselect" },
    ],
    sidebar: {
      "/guide/": guide,
      "/reference/": ["/reference/", "/reference/attributes", "/reference/instance", "/reference/css", "/reference/changelog", "/reference/contributing"],
    },
  }),
  plugins: [searchPlugin()],
});
