// Contribution rules checked on every pull request (scripts/pr-check.js).
import { describe, it, expect } from "vitest";
import { checkPullRequest } from "../scripts/pr-check.js";

const base = { files: [], baseVersion: "1.0.0", headVersion: "1.0.0", unreleased: "", dependencies: {}, labels: [] };

describe("pull request rules", () => {
  it("passes a docs-only change", () => {
    expect(checkPullRequest({ ...base, files: ["README.md"] })).toEqual([]);
  });

  it("asks for a CHANGELOG entry under [Unreleased] when code, styles or themes change", () => {
    for (const file of ["src/gridselect.js", "src/gridselect.css", "themes/forest.css"]) {
      const problems = checkPullRequest({ ...base, files: [file, "README.md"] });
      expect(problems.join(" "), file).toMatch(/CHANGELOG/);
    }
    expect(checkPullRequest({ ...base, files: ["themes/forest.css", "CHANGELOG.md"], unreleased: "### Added\n- Forest theme." })).toEqual([]);
  });

  it("asks for a README update when code changes, unless labelled skip-readme", () => {
    const pr = { ...base, files: ["src/gridselect.js", "CHANGELOG.md"], unreleased: "### Fixed\n- x" };
    expect(checkPullRequest(pr).join(" ")).toMatch(/README/);
    expect(checkPullRequest({ ...pr, labels: ["skip-readme"] })).toEqual([]);
  });

  it("refuses version changes and runtime dependencies", () => {
    expect(checkPullRequest({ ...base, headVersion: "1.1.0" }).join(" ")).toMatch(/version/);
    expect(checkPullRequest({ ...base, dependencies: { lodash: "^4" } }).join(" ")).toMatch(/dependenc/);
  });

  it("refuses local-only files", () => {
    expect(checkPullRequest({ ...base, files: ["docs/prd.md"] }).join(" ")).toMatch(/docs\//);
    expect(checkPullRequest({ ...base, files: ["CLAUDE.md"] }).join(" ")).toMatch(/CLAUDE\.md/);
  });
});
