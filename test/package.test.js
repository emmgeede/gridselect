// F7: what goes into the npm package. Builds first, so it takes a moment.
import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const run = (cmd) => execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

describe("npm package", () => {
  beforeAll(() => run("npm run build"), 60_000);

  it("builds the declarations and a minified IIFE exposing window.gridselect", () => {
    expect(readFileSync("dist/gridselect.d.ts", "utf8")).toContain("export declare function gridselect");
    const code = readFileSync("dist/gridselect.min.js", "utf8");
    expect(code.length).toBeLessThan(readFileSync("src/gridselect.js", "utf8").length / 2);
    const sandbox = {};
    sandbox.globalThis = sandbox;
    runInNewContext(code, sandbox);
    expect(typeof sandbox.gridselect).toBe("function");
  });

  it("packs exactly the published files", () => {
    const [{ files }] = JSON.parse(run("npm pack --dry-run --json --ignore-scripts"));
    expect(files.map((f) => f.path).sort()).toEqual([
      "CHANGELOG.md", "LICENSE", "README.md", "dist/gridselect.d.ts", "dist/gridselect.min.js",
      "package.json", "src/gridselect.css", "src/gridselect.js", "themes/showcase.css",
    ]);
  });

  it("runs tests and build before publishing, and points CDNs to the IIFE", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.scripts.prepublishOnly).toMatch(/npm test/);
    expect(pkg.scripts.prepublishOnly).toMatch(/npm run build/);
    expect(pkg.unpkg).toBe("./dist/gridselect.min.js");
    expect(pkg.jsdelivr).toBe("./dist/gridselect.min.js");
    expect(Object.keys(pkg.exports)).toEqual([".", "./gridselect.css", "./themes/showcase.css", "./dist/gridselect.min.js"]);
  });
});

describe("README on npm (QA F7)", () => {
  it("uses absolute URLs for images, since assets/ is not in the package", () => {
    const readme = readFileSync("README.md", "utf8");
    const srcs = [...readme.matchAll(/(?:src|srcset)="([^"]+)"/g)].map((m) => m[1]);
    expect(srcs.length).toBeGreaterThan(0);
    expect(srcs.filter((s) => !s.startsWith("https://"))).toEqual([]);
  });
});
