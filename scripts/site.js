// Assembles the GitHub Pages site in _site/: demo, docs, the whole src/ and themes/, plus a redirect.
// The Pages workflow and the browser tests use this same script, so a missing file shows up in tests.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { writeThemeList } from "./themes.js";

rmSync("_site", { recursive: true, force: true });
mkdirSync("_site");
for (const dir of ["demo", "src", "themes"]) cpSync(dir, `_site/${dir}`, { recursive: true });
writeThemeList("_site/themes");
// The VuePress documentation, when built (npm run docs:build).
if (existsSync("website/.vuepress/dist")) cpSync("website/.vuepress/dist", "_site/docs", { recursive: true });
writeFileSync("_site/index.html",
  '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=demo/"><title>GridSelect</title><a href="demo/">GridSelect demo</a>\n');
