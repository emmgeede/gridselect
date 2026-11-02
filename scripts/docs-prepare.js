// Copies CHANGELOG.md and CONTRIBUTING.md into the docs (website/reference/), with links that work there.
import { readFileSync, writeFileSync } from "node:fs";

const GH = "https://github.com/emmgeede/gridselect/blob/main/";
const fix = (md) => md.replace(/\]\((AGENTS\.md|CONTRIBUTING\.md|README\.md)\)/g, `](${GH}$1)`);
// Version headings are reference links in CHANGELOG.md ("## [1.0.0] - …"); plain text in the docs, so the
// heading anchor keeps a readable name.
writeFileSync("website/reference/changelog.md", fix(readFileSync("CHANGELOG.md", "utf8")).replace(/^## \[([^\]]+)\]/gm, "## $1"));
writeFileSync("website/reference/contributing.md", fix(readFileSync("CONTRIBUTING.md", "utf8")));
