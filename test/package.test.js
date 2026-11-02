// F7: what goes into the npm package. Builds first, so it takes a moment.
import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { gzipSync } from "node:zlib";

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
    // npm 11 prints an array of packages, newer versions an object keyed by package name.
    const parsed = JSON.parse(run("npm pack --dry-run --json --ignore-scripts"));
    const { files } = Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0];
    expect(files.map((f) => f.path).sort()).toEqual([
      "CHANGELOG.md", "LICENSE", "README.md", "dist/element.d.ts", "dist/gridselect-element.min.js",
      "dist/gridselect.d.ts", "dist/gridselect.min.js", "dist/react.d.ts", "dist/vue.d.ts", "package.json", "src/element.js", "src/gridselect.css",
      "src/gridselect.js", "src/react.js", "src/vue.js", "themes/compact.css", "themes/high-contrast.css", "themes/showcase.css",
    ]);
  });

  it("runs tests and build before publishing, and points CDNs to the IIFE", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.scripts.prepublishOnly).toMatch(/npm test/);
    expect(pkg.scripts.prepublishOnly).toMatch(/npm run build/);
    expect(pkg.unpkg).toBe("./dist/gridselect.min.js");
    expect(pkg.jsdelivr).toBe("./dist/gridselect.min.js");
    expect(Object.keys(pkg.exports)).toEqual([".", "./element", "./react", "./vue", "./gridselect.css", "./themes/*", "./dist/gridselect.min.js"]);
    expect(pkg.dependencies ?? {}).toEqual({});
    expect(pkg.peerDependencies).toEqual({ react: ">=18", vue: ">=3.3" });
    expect(pkg.peerDependenciesMeta).toEqual({ react: { optional: true }, vue: { optional: true } });
  });
});

describe("numbers in the docs stay true", () => {
  it("the demo states the core size, rounded to whole kB, min+gzip", () => {
    const size = gzipSync(readFileSync("dist/gridselect.min.js"), { level: 9 }).length;
    const claim = /about (\d+) kB/.exec(readFileSync("demo/index.html", "utf8"));
    expect(claim, "demo mentions the size").not.toBeNull();
    expect(Number(claim[1])).toBe(Math.round(size / 1024));
  });

  it("the README status names the current version", () => {
    const { version } = JSON.parse(readFileSync("package.json", "utf8"));
    expect(readFileSync("README.md", "utf8")).toContain(`**Status:** version ${version},`);
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

describe("size budget (PRD principle 6: core 8.5 kB, with element 10.5 kB since F19)", () => {
  it("keeps the core under 8.5 kB and core plus element under 10.5 kB, min+gzip", () => {
    const size = (f) => gzipSync(readFileSync(f), { level: 9 }).length;
    expect(size("dist/gridselect.min.js")).toBeLessThanOrEqual(8704);
    expect(size("dist/gridselect-element.min.js")).toBeLessThanOrEqual(10752);
  });

  it("keeps each framework wrapper under 1 kB min+gzip, without React, Vue and the element (F13)", async () => {
    const { build } = await import("esbuild");
    for (const file of ["src/react.js", "src/vue.js"]) {
      const out = await build({ entryPoints: [file], bundle: true, minify: true, write: false, format: "esm",
        external: ["react", "vue", "./element.js"] });
      expect(gzipSync(out.outputFiles[0].contents, { level: 9 }).length, file).toBeLessThanOrEqual(1024);
    }
  });

  it("registers the element from the IIFE build", () => {
    const code = readFileSync("dist/gridselect-element.min.js", "utf8");
    const defined = [];
    const sandbox = { customElements: { get: () => undefined, define: (n) => defined.push(n) }, HTMLElement: class {}, queueMicrotask };
    sandbox.globalThis = sandbox;
    runInNewContext(code, sandbox);
    expect(defined).toEqual(["grid-select"]);
  });
});
