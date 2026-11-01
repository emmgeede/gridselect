// Assembles the GitHub Pages site in _site/: demo, the whole src/ and themes/, plus a redirect.
// The Pages workflow and the browser tests use this same script, so a missing file shows up in tests.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

rmSync("_site", { recursive: true, force: true });
mkdirSync("_site");
for (const dir of ["demo", "src", "themes"]) cpSync(dir, `_site/${dir}`, { recursive: true });
writeFileSync("_site/index.html",
  '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=demo/"><title>GridSelect</title><a href="demo/">GridSelect demo</a>\n');
