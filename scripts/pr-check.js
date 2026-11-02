// Checks a pull request against the contribution rules in AGENTS.md. Runs in CI on every pull
// request and locally: node scripts/pr-check.js [base-ref]  (default origin/main).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * @param {{ files: string[], baseVersion: string, headVersion: string, unreleased: string,
 *   dependencies: Record<string, string>, labels: string[] }} pr
 * @returns {string[]} problems, empty when everything is fine
 */
export function checkPullRequest(pr) {
  const problems = [];
  const touches = (re) => pr.files.some((f) => re.test(f));
  if (touches(/^(src|themes)\//) && (!pr.files.includes("CHANGELOG.md") || !pr.unreleased.trim()))
    problems.push("Code, styles or themes changed: add an entry under ## [Unreleased] in CHANGELOG.md (Keep a Changelog).");
  if (touches(/^src\//) && !touches(/^(README\.md|website\/)/) && !pr.labels.includes("skip-readme"))
    problems.push("Code changed: update the documentation in website/ (and README.md if the overview changes), or ask a maintainer for the skip-readme label if nothing user-visible changed.");
  if (pr.headVersion !== pr.baseVersion)
    problems.push(`Do not change the version in package.json (${pr.baseVersion} → ${pr.headVersion}): the maintainer sets it when releasing.`);
  if (Object.keys(pr.dependencies).length)
    problems.push(`GridSelect has no runtime dependencies; remove: ${Object.keys(pr.dependencies).join(", ")}.`);
  if (touches(/^docs\//)) problems.push("docs/ is local to the maintainer and must not be committed.");
  if (touches(/^CLAUDE\.md$/)) problems.push("CLAUDE.md is local to the maintainer and must not be committed.");
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const baseRef = process.argv[2] ?? "origin/main";
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" });
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const changelog = readFileSync("CHANGELOG.md", "utf8");
  const problems = checkPullRequest({
    files: git("diff", "--name-only", `${baseRef}...HEAD`).split("\n").filter(Boolean),
    baseVersion: JSON.parse(git("show", `${baseRef}:package.json`)).version,
    headVersion: pkg.version,
    unreleased: /## \[Unreleased\]\n([\s\S]*?)\n## \[/.exec(changelog)?.[1] ?? "",
    dependencies: pkg.dependencies ?? {},
    labels: (process.env.PR_LABELS ?? "").split(",").map((l) => l.trim()).filter(Boolean),
  });
  for (const p of problems) console.error(`✗ ${p}`);
  if (problems.length) process.exit(1);
  console.log("✓ Pull request follows the contribution rules.");
}
