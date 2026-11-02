## What and why

<!-- One or two sentences. Link the issue: "Closes #123". -->

## How it was tested

<!-- Which tests you added (unit in test/, browser in e2e/) and what you tried by hand. -->

## Checklist

- [ ] An issue was agreed first (for anything beyond a typo).
- [ ] Tests first: a new or changed test fails without the change and passes with it.
- [ ] Anything about layout, visibility, focus or real keys has a Playwright test in `e2e/`, and new variants are on the playground.
- [ ] `npm test` and `npm run test:e2e` pass locally.
- [ ] `node scripts/pr-check.js` passes.
- [ ] README updated (usage, options, feature table, Contents list), and an entry under `## [Unreleased]` in CHANGELOG.md.
- [ ] No version change, no new runtime dependency, size budget kept.
- [ ] Accessible: native inputs, ARIA states, 4.5:1 text and 3:1 indicators, works by keyboard alone.
