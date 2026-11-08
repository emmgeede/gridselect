// F12: theme list built from the header comments in themes/. See docs/features/F12-theme-galerie/spec.md.
import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { themeList, writeThemeList } from "../scripts/themes.js";

describe("theme list", () => {
  it("reads name, description and author from each CSS header, sorted by file name", () => {
    const dir = mkdtempSync(join(tmpdir(), "gs-themes-"));
    writeFileSync(join(dir, "zeta.css"), "/*\n * @name Zeta\n * @description Last one.\n * @author Ann\n */\n@layer gridselect-zeta {}\n");
    writeFileSync(join(dir, "alpha.css"), "/* @name Alpha @description First, with spaces. @author Bo Li */\n");
    writeFileSync(join(dir, "bare.css"), "@layer gridselect-bare {}\n");
    writeFileSync(join(dir, "notes.txt"), "not a theme");
    expect(themeList(dir)).toEqual([
      { file: "alpha.css", name: "Alpha", description: "First, with spaces.", author: "Bo Li" },
      { file: "bare.css", name: "bare", description: "", author: "" },
      { file: "zeta.css", name: "Zeta", description: "Last one.", author: "Ann" },
    ]);
    writeThemeList(dir);
    expect(JSON.parse(readFileSync(join(dir, "index.json"), "utf8")).map((t) => t.file)).toEqual(["alpha.css", "bare.css", "zeta.css"]);
  });

  it("ships at least showcase, high-contrast, compact and tippkraft, each with a full header", () => {
    const list = themeList("themes");
    for (const file of ["compact.css", "high-contrast.css", "showcase.css", "tippkraft.css"]) {
      const t = list.find((x) => x.file === file);
      expect(t, file).toBeTruthy();
      expect(t.name && t.description && t.author, file).toBeTruthy();
    }
  });

  it("keeps the generated index out of git and the npm package", () => {
    expect(readFileSync(".gitignore", "utf8")).toMatch(/^themes\/index\.json$/m);
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.files).toContain("themes/*.css");
    expect(pkg.exports["./themes/*"]).toBe("./themes/*");
  });

  it("site.js writes _site/themes/index.json", () => {
    execFileSync("node", ["scripts/site.js"]);
    const list = JSON.parse(readFileSync("_site/themes/index.json", "utf8"));
    expect(list.map((t) => t.file)).toEqual(readdirSync("themes").filter((f) => f.endsWith(".css")).sort());
  });
});
