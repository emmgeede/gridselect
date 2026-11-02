---
name: contributing
description: Guides a change to GridSelect from issue to pull request so it meets the project's standards (tests first, browser tests, accessibility, README and CHANGELOG, size budget, no version bumps). Use when contributing to this repository, fixing a bug, adding a feature or theme, or preparing a pull request.
---

# Contributing to GridSelect

Follow `AGENTS.md` in the repository root; it is the source of truth. Themes
also follow `CONTRIBUTING.md`. This skill is the order of work.

## 1. Understand before changing

- Read `AGENTS.md` and, for themes, `CONTRIBUTING.md`.
- Find the issue this change belongs to. If there is none and the change is
  more than a typo, stop and help the user open one (problem, proposal,
  alternatives) and wait for a maintainer. Do not start building unagreed
  features.
- Read the code the change touches and its tests. Reuse what is there
  before writing new code.

## 2. Plan the smallest change

- State in one or two sentences what changes for users and which public
  seam shows it (an option, an attribute, the DOM, a key, an announcement).
- Check the principles: native inputs, data attributes for structure, ARIA
  for state, WCAG 2.2 AA, no dependencies, size budget. If the change cannot
  meet one of them, tell the user and suggest raising it in the issue.

## 3. Test first, in slices

For each behaviour:

1. Write one failing test through the public API (`test/*.test.js`). Run it
   and confirm it fails for the right reason.
2. Write the smallest code that passes. Comments in English.
3. Layout, visibility, focus or real keys: add the variant to
   `playground/index.html` and a Playwright test in `e2e/`, including axe
   where it is a visible state.

## 4. Docs in the same change

- README: usage, options table, attributes table, feature table; keep the
  Contents list in sync with the headings.
- CHANGELOG: an entry under `## [Unreleased]` in the right section.
- Never touch the version, tags, released CHANGELOG sections, `docs/` or
  `CLAUDE.md`.

## 5. Verify

Run and fix until all pass:

```sh
npm test
npm run test:e2e
node scripts/pr-check.js
```

If the size test fails, do not raise the limit; shrink the change or explain
the need in the pull request.

## 6. Hand over

- Commit with `feat: …`, `fix: …`, `docs: …`, `test: …` or `chore: …`.
- Draft the pull request text from `.github/pull_request_template.md`: what
  and why, the issue (`Closes #…`), how it was tested, the checklist ticked
  honestly. Show it to the user before they open the pull request.
