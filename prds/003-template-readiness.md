# PRD 003 — Template Readiness

## Problem Statement

The repo is tagged `v0.1.0-mvp` (an annotated, honest "internal MVP starter kit" tag), but a developer who clicks **"Use this template"** on GitHub will get a project that does not actually run end-to-end without their own setup work:

- The `README.md` is the stock `create-next-app` placeholder. It tells the developer to `npm run dev` — but the project uses `bun`, has no `.env.example`, and the missing env vars are validated at module load (`lib/env.ts`) and will throw a hard error on first `import`. A clone-then-run workflow fails immediately.
- There is no `.env.example`. The four required env vars (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NODE_ENV`) plus one public var (`NEXT_PUBLIC_APP_URL`) are documented in code, not in a starter file. A new dev has to read `lib/env.ts` and `lib/public-env.ts` to know what to set, and how.
- There is no `LICENSE`. **Legally, no one outside the owner can use the code** (default copyright is "all rights reserved"). For an open-source template this is a blocker, not a polish item.
- `package.json` is named `coffee-tech` (the product name), not a template name. A dev who clones the template and forgets to rename it ships a `package.json` named `coffee-tech`. Bizarre.
- The dev who clones has no scaffolding script. They have to: install deps, copy env, generate a 32+ char `BETTER_AUTH_SECRET`, decide on a DB URL, run migrations, decide on a port, run dev. Each step has a sharp edge (the secret length, the libsql scheme prefix, the next/headers runtime in better-auth).
- There is no `WELCOME.md` or `prds/000-index.md` connecting the AGENTS.md conventions, the 2 existing PRDs, and the 9 issues into a single onboarding reading order. The dev who lands on the repo has to figure out the workflow from scattered files.
- There is no CI. A PR cannot be validated by GitHub Actions. For an internal MVP this is fine; for a public template it is the difference between "trust me" and "look, the build is green".

The "out" list is concrete and finite: 8 deliverables, each independently verifiable. None of them touch product logic. They are release-readiness, not feature work.

## Solution

Ship the 8 deliverables that turn the MVP into a **template a stranger can clone and run in under 5 minutes**. The deliverable is a working `bun run setup` → `bun run dev` → see-the-register-page flow, documented in a template-specific README, licensed for use, named neutrally, and CI-protected from regressions.

The 8 deliverables are sliced into 7 issues, ordered so each lands on a green `bun run check` + `bun run test` + `bun run test:e2e` baseline:

1. **LICENSE** — single-file deliverable, no seams.
2. **`.env.example`** — must mirror `lib/env.ts` + `lib/public-env.ts` exactly; new test seam.
3. **README rewrite** — template-specific, "Quick start" in 5 commands, "What you get" overview, "Architecture" pointer, "Replace me" checklist.
4. **`package.json` rename + scripts** — generic template name, add `setup` + `db:reset` scripts.
5. **`scripts/setup.ts`** — interactive scaffold: install, env copy, secret generation, DB push, smoke check. New top-level seam.
6. **`prds/000-index.md` + `WELCOME.md`** — onboarding reading order; connects AGENTS.md, the 2 existing PRDs, the 9 issues.
7. **CI (`.github/workflows/ci.yml`)** — runs `bun run check` + `bun run test` + `bun run test:e2e` on PRs and `main`. New infra-level seam.
8. **`CODEOWNERS` + `pull_request_template.md`** — repo governance; small files, low-risk, batched with CI.

The smoke test for the whole PRD is: **a developer with a clean laptop can run `bun run setup` then `bun run dev` then open `http://localhost:3000/register` and see the register form, in under 5 minutes, without reading any source code**. If that flow works, the template is ready. The "Replace me" checklist in the README then walks them through the next steps (rename project, set BETTER_AUTH_SECRET in prod, deploy, etc.).

## User Stories

1. As a developer who just clicked "Use this template" on GitHub, I want a `LICENSE` file at the repo root, so that I have explicit legal permission to use, modify, and distribute the code without contacting the owner.
2. As a developer who just cloned the template, I want the `LICENSE` to be MIT, so that the terms are industry-standard and the fewest number of legal questions block adoption.
3. As a developer who just cloned the template, I want a `.env.example` at the repo root that lists every required env var with a one-line comment explaining its purpose, so that I do not have to read `lib/env.ts` and `lib/public-env.ts` to know what to set.
4. As a developer reading `.env.example`, I want each var to have a realistic example value (not `your-secret-here` placeholders), so that I can `cp .env.example .env` and start without inventing values.
5. As a developer reading `.env.example`, I want a comment next to `BETTER_AUTH_SECRET` explaining that it must be ≥32 chars and how to generate one (`openssl rand -base64 32` or similar), so that the secret-length validation error in `lib/env.ts` does not become my first encounter with the template.
6. As a developer reading `.env.example`, I want a comment next to `DATABASE_URL` explaining the `file:` vs `libsql:` schemes, so that I know which to pick for local dev vs production.
7. As a developer, I want a new test that asserts `.env.example` and `lib/env.ts` + `lib/public-env.ts` declare the same variables, so that a future contributor adding a new env var cannot forget to update the example file.
8. As a developer reading the README, I want a "Quick start" section that gets me from `git clone` to a running app in 5 commands, so that I can evaluate the template in minutes, not hours.
9. As a developer reading the README, I want a "What you get" section that lists the included features (auth flow, form factory, E2E tests, biome, etc.), so that I can decide if the template fits my use case without scrolling through source.
10. As a developer reading the README, I want an "Architecture" section that links to `AGENTS.md` and `.agents/skills/project-architecture/SKILL.md`, so that I can learn the conventions in the order the project expects.
11. As a developer reading the README, I want a "Replace me" checklist at the bottom (rename project, regenerate `BETTER_AUTH_SECRET` for prod, swap the SQLite dev DB for Postgres in prod, deploy, etc.), so that the "from template to production" path is explicit.
12. As a developer reading the README, I want every command in "Quick start" to use `bun` (the project's actual package manager), so that the README does not confuse me with `npm run` / `yarn` / `pnpm` placeholders.
13. As a developer reading the README, I want the README to use a generic name (e.g. "Next.js Feature-First Boilerplate") instead of "coffee-tech", so that the docs match the template's intended use, not the product it was extracted from.
14. As a developer, I want `package.json` `name` to be a generic template name (e.g. `next-feature-first-template`) instead of `coffee-tech`, so that the package does not leak the product origin.
15. As a developer, I want `package.json` `description` to be a one-line summary of what the template provides, so that it shows up correctly in `bun pm ls` and any package registry.
16. As a developer, I want a `setup` script in `package.json` that runs the scaffold in one command, so that I do not have to memorize the 5 manual steps.
17. As a developer, I want the `setup` script to be idempotent (running it twice does not break the repo), so that I can re-run it after pulling new commits.
18. As a developer, I want a `db:reset` script that drops the SQLite file and re-runs migrations, so that I can start fresh without manually deleting `.db` files.
19. As a developer running `bun run setup`, I want the script to install deps, copy `.env.example` to `.env` (if `.env` does not exist), generate a `BETTER_AUTH_SECRET` if the current one is a placeholder, run `bun run db:push` (or `bun run db:migrate`), and verify the boot by running `bun run check`, so that the end-state is a working app.
20. As a developer running `bun run setup`, I want the script to print a clear summary at the end (`✓ Setup complete. Run: bun run dev`), so that I know what to do next.
21. As a developer running `bun run setup`, I want the script to fail loudly with a clear error if any step fails, so that I am not left wondering which step broke.
22. As a developer new to the repo, I want a `WELCOME.md` at the repo root that gives me the 30-second orientation (what this is, who it is for, where to start), so that the first read of the repo is not the giant `AGENTS.md`.
23. As a developer new to the repo, I want `prds/000-index.md` to list the PRDs and issues in the recommended reading order with one-line summaries, so that I do not have to read every file to understand the project's history.
24. As a developer, I want `WELCOME.md` to point to `AGENTS.md` for conventions, `prds/000-index.md` for project history, and `.github/workflows/ci.yml` for build status, so that the onboarding is one path, not three.
25. As a developer opening a PR against this repo, I want GitHub Actions to run `bun run check` + `bun run test` on every push, so that I get fast feedback on lint/format/unit before a human reviews.
26. As a developer opening a PR, I want CI to run `bun run test:e2e` on a merge to `main` (not on every PR), so that PR feedback is fast but the protected branch is verified.
27. As a developer opening a PR, I want CI to use a SQLite ephemeral DB (set up + torn down in the workflow), so that the test environment is reproducible across runs.
28. As a developer opening a PR, I want CI to fail the build if `bun run check` reports any error, so that I cannot merge a repo that is not lint-clean.
29. As a maintainer, I want a `.github/CODEOWNERS` file that assigns ownership of the architectural files (`AGENTS.md`, `prds/`, `features/`, `lib/forms/`, `proxy.ts`, `db/`) to the project lead, so that PRs touching the load-bearing parts require a senior review.
30. As a developer opening a PR, I want a `.github/pull_request_template.md` that lists the standard checklist (tests run, docs updated, AGENTS.md still in sync, no `// biome-ignore` added without rationale), so that the review is consistent.
31. As a developer opening a PR, I want the PR template to reference the relevant PRD and issue numbers by filename, so that the change is traceable to the spec.
32. As a developer, I want all of the above to be implemented in independent issues that each leave the repo in a working state (green tests, biome pass), so that a partial rollout is still useful.
33. As a developer, I want the "template readiness" work to be sliced so that no issue touches product logic — only docs, scripts, and config — so that the change is reviewable as a pure release-readiness PR, not a feature change.
34. As a maintainer, I want the post-`v0.1.0-mvp` state to be `v0.2.0-template-ready`, and the tag to be cut after all 8 deliverables are green, so that a `git checkout v0.2.0` lands a known-working template.
35. As a future contributor, I want the "from template to project" journey to be greppable from a single checklist in the README, so that the "what do I rename" question is answered in one place.

## Implementation Decisions

- **License: MIT**. Industry-standard, shortest text, fewest restrictions. Alternative considered: Apache 2.0 (better patent grant) — rejected because MIT is the de-facto standard for Next.js templates and the patent risk in a boilerplate is negligible.

- **`.env.example` shape**: one file at the repo root, formatted as a "fill-in" template. Every var has a comment line above it (a real `#` comment, not a separate README file) explaining purpose + format + an example. The file is **generated from** `lib/env.ts` + `lib/public-env.ts` zod schemas at test time — a new test reads both, asserts the example file lists exactly the same keys in the same order, and that every key has a non-empty comment. This is the seam: the schemas are the source of truth, the example is a derived artifact.

- **`.env.example` secret handling**: the `BETTER_AUTH_SECRET` value is **not** a real secret in `.env.example` — it is a placeholder like `BETTER_AUTH_SECRET=replace-me-with-openssl-rand-base64-32` plus a comment that shows the `openssl rand -base64 32` command. The `setup` script detects this placeholder and regenerates a real secret on first run.

- **README structure** (replaces the entire current `README.md`):
  - Title + 1-line description.
  - Badges row: `bun` version, CI status, license.
  - **What you get** — bullet list of features, kept under 10 bullets.
  - **Quick start** — 5 commands, copy-paste-able.
  - **Architecture** — 2 paragraphs + link to `AGENTS.md`.
  - **Project history** — link to `prds/000-index.md`.
  - **Replace me** — checklist of "things to do before shipping to prod".
  - **License** — 1 line.

- **`package.json` name**: change from `coffee-tech` to `next-feature-first-template`. Description: `"Next.js 16 feature-first boilerplate with auth, E2E tests, and form orchestration"`. Version bumps to `0.2.0`.

- **New scripts**:
  - `setup` → `bun run scripts/setup.ts` (idempotent scaffold).
  - `db:reset` → `rm -f local.db && bun run db:migrate` (with platform note for Windows in the README).
  - `test:ci` → `bun run test -- --reporter=verbose` for CI-friendly output.

- **`scripts/setup.ts` design**: runs as a TypeScript script via `tsx`. Steps in order:
  1. Verify `bun` is installed (else exit with a clear message).
  2. Run `bun install` (skip if `node_modules` exists and `bun.lock` is unchanged).
  3. If `.env` does not exist, copy `.env.example` to `.env`.
  4. If `BETTER_AUTH_SECRET` in `.env` is the placeholder, regenerate via `crypto.randomBytes(32).toString("base64")`.
  5. Run `bun run db:push` (or `bun run db:migrate` if migrations exist).
  6. Run `bun run check` to confirm biome is clean.
  7. Print summary: `✓ Setup complete. Next: bun run dev`.
  - Each step catches errors and prints a numbered failure list. Exit code 1 on any failure.

- **`prds/000-index.md` content**: a table of all PRDs (`001`, `002`, `003` if this lands) with a one-line summary, the recommended reading order, and the tag that ships each (when applicable). Plus a table of all issues in `issues/`, grouped by status (Implemented, Proposed, Archived). The file is auto-derivable in principle (a future `prd-list` script could regenerate it), but for v0.2.0 it is hand-maintained.

- **`WELCOME.md` content** (~30 lines):
  - "You just cloned a Next.js 16 feature-first boilerplate."
  - "The app is **not** a product. It is a **starting point**: every piece of code is meant to be deleted and rewritten for your use case."
  - 3-line orientation: "Read `prds/000-index.md` for what shipped, `AGENTS.md` for the conventions, then `prds/001-…` to see how the architecture was built."
  - Pointer to `bun run setup` and `bun run dev`.

- **CI design** (`.github/workflows/ci.yml`):
  - Triggers: `push` to `main`, `pull_request` to `main`.
  - Jobs:
    - `lint-and-unit` (runs on every trigger): checkout, setup bun 1.x, `bun install --frozen-lockfile`, `bun run check`, `bun run test`.
    - `e2e` (runs only on `push` to `main`): checkout, setup bun, install Playwright browsers with `bunx playwright install --with-deps chromium`, `bun run db:push` against an ephemeral SQLite file, `bun run test:e2e`.
  - Secrets: none required for the boilerplate (all env vars are placeholders that the e2e test overrides via `process.env` in `e2e/setup.ts` if needed — or, the simpler path: hardcode test values in the workflow file).
  - No Postgres service container needed — SQLite (libsql) is the dev DB.

- **`CODEOWNERS` content**: assigns `@Andeveling` (the repo owner) as the default owner. The two wildcard lines:
  - `/AGENTS.md` `/prds/**` `/issues/**` `@Andeveling` (architectural docs).
  - `/proxy.ts` `/lib/env.ts` `/lib/public-env.ts` `/lib/forms/**` `/db/**` `@Andeveling` (security/persistence surface).

- **`.github/pull_request_template.md` content** (replaces none — file does not exist yet):
  - ## What
  - ## Why
  - ## Acceptance criteria
  - ## Tests run
  - ## AGENTS.md / prds/ updated?
  - ## Related: `prds/NNN-…`, `issues/NNN-…`

- **What this PRD explicitly does NOT do**:
  - Does not add any new product feature.
  - Does not modify `features/auth/*`, `lib/forms/*`, `proxy.ts`, `db/*` functional code.
  - Does not refactor or rename the existing auth, form factory, or proxy files.
  - Does not introduce a "release script" or bump automation — the maintainer cuts the `v0.2.0` tag manually after CI is green.
  - Does not write a `CHANGELOG.md` — the tag + GitHub Releases is the changelog.
  - Does not adopt a linter rule for "must have LICENSE" or "must have .env.example" — those are checked by the test in user story 7.
  - Does not set up a deploy workflow (Vercel, Docker, etc.) — that is per-project, not per-template.

## Testing Decisions

- **What makes a good test** (boilerplate rule, unchanged): test external behavior, not implementation. For the `.env.example` test, the assertion is "the example file matches the schemas" — the implementation detail of "how" is irrelevant. For the `setup` script, the assertion is "after running it, `bun run dev` boots cleanly" — the internal steps are not tested individually (they are integration-tested by the e2e suite).

- **New unit tests** (in `tests/template/`):
  - **`env-example.test.ts`**: parse `.env.example`, parse `lib/env.ts` and `lib/public-env.ts` (extract the zod object keys via a regex on the schema source), assert the three sets of keys are equal. Assert each key in `.env.example` has a `#` comment line above it.
  - **`readme-structure.test.ts`**: read `README.md`, assert it contains the headings: "What you get", "Quick start", "Architecture", "Replace me", "License". Assert every command in "Quick start" starts with `bun run` (no `npm` / `yarn` / `pnpm`).
  - **`prds-index.test.ts`**: read `prds/000-index.md`, assert it lists every PRD file in `prds/` and every issue file in `issues/`.
  - **`license-presence.test.ts`**: read `LICENSE`, assert it contains the word "MIT" (or whatever the chosen license is).
  - **`package-name.test.ts`**: read `package.json`, assert `name` is not the product name `coffee-tech`.

- **New integration test** (in `tests/template/`):
  - **`setup-script.test.ts`**: spawn `bun run setup` in a temp clone of the repo, assert exit code 0, assert `.env` was created, assert `BETTER_AUTH_SECRET` is not the placeholder, assert `local.db` exists, assert `bun run check` passes after setup. This is slow (~10s) and is gated to run only in CI, not in the local `bun run test` suite.

- **E2E smoke test** (added to existing `e2e/`):
  - **`template-smoke.e2e.test.ts`**: hits `http://localhost:3000/`, asserts redirect to `/login` (or `/register`). Hits `/register`, asserts the form renders. This is what the maintainer runs after `bun run setup` to confirm the template is alive.

- **Modules covered by existing tests (unchanged)**: `lib/forms/define-form-action.ts`, `lib/forms/is-safe-next-path.ts`, all `features/auth/_actions/*.action.ts`, all `features/auth/_schemas/*.schema.ts`, `e2e/login.e2e.test.ts`, `e2e/register.e2e.test.ts`. None of these files are touched by this PRD.

- **Gates** (run in this order at every issue boundary):
  1. `bun run check` — biome lint + format. The new tests run as part of `bun run test`.
  2. `bun run test` — vitest unit + the new template tests. The `tests/template/setup-script.test.ts` is skipped locally (via `test.skip` in vitest config gated on `process.env.CI`).
  3. `bun run test:e2e` — Playwright. The new `template-smoke.e2e.test.ts` joins the existing 6 tests.

- **Prior art in the codebase**: PRD 001 set the precedent of slicing architectural work into independent issues with `bun run check` + `bun run test` gates between each. PRD 002 followed the same pattern. This PRD continues it: each of the 7 issues lands on a green baseline. The OpenSpec `prds/` + `issues/` folder convention is the seam.

## Out of Scope

- **Adopting Apache 2.0 or any other license** besides MIT. MIT is the chosen one; the decision is not reopened.
- **Adding a deploy workflow** (Vercel, Docker, Fly, etc.). The README's "Replace me" checklist mentions deployment but does not ship a workflow. Per-project, not per-template.
- **Adding Docker / docker-compose** for local dev. SQLite + `bun run dev` is the dev story. Postgres-in-Docker is a per-project decision.
- **Migrating the `bun.lock` to `bun.lockb` or vice versa**. Whatever the project uses today stays.
- **Adding Storybook, Chromatic, or any visual-review tool**. Not part of the template's value prop.
- **Adding observability** (Sentry, LogRocket, OpenTelemetry). Not part of the boilerplate.
- **Adding analytics**. Not part of the boilerplate.
- **Adding theming / i18n / RTL support**. Not part of the boilerplate.
- **Writing a CHANGELOG.md**. The tag + GitHub Releases is the changelog.
- **Refactoring the existing `prds/001-…` and `prds/002-…`** to use a different template. They are point-in-time specs; rewriting them is history-rewriting.
- **Closing the existing 9 issues** as "Implemented" with full metadata. That is a separate housekeeping task; this PRD adds new content to the `issues/` folder, not metadata to the old ones.
- **Setting up Renovate / Dependabot**. The maintainer can enable Dependabot via the GitHub UI in 1 click; no need to ship a config.
- **Adding a `SECURITY.md`**. Not part of the boilerplate. The README's "Replace me" checklist mentions it for prod, but does not ship a file.
- **Adding a `CONTRIBUTING.md`**. Internal-only template; the maintainer contributes by following the issue template + `AGENTS.md`. No separate CONTRIBUTING doc.
- **Touching `components/ui/*` (shadcn-owned)** or `app/globals.css` (biome-ignored). The PRD does not introduce UI changes.

## Further Notes

- **v0.1.0-mvp → v0.2.0-template-ready is a 1-version jump**, not a major version. The template-readiness work is non-breaking: the existing 35 unit tests + 6 e2e tests still pass. The version bump signals "the package is now usable as a template", not "the architecture changed".

- **The smoke test is the real acceptance criterion**. Everything in this PRD is in service of one workflow: `git clone` → `bun install` → `bun run setup` → `bun run dev` → see the register page. If that flow works, the template is ready. If it does not, no individual deliverable is "done" — even if the LICENSE file exists and CI is green.

- **The `setup` script is the highest-leverage deliverable**. Without it, the README's "Quick start" is 5 manual steps the dev has to read carefully. With it, the README's "Quick start" is 1 command. The script is the difference between "template" and "starter repo you have to wrestle with".

- **No issue tracker is configured for this repo** (the same caveat from PRD 002 applies). The `ready-for-agent` triage label has no label vocabulary. The 7 new issues land as local markdown files in `issues/004-…` through `issues/010-…`, following the existing `prds/003-…` convention. When the project wires a real issue tracker, this PRD and its 7 issues are ready to import.

- **AGENTS.md stays the source of truth for conventions**. The README points to it; the new `WELCOME.md` points to it; the PR template asks "AGENTS.md still in sync?". The template's value is that conventions are **enforced by example in the existing code**, not by docs — the README just points you at them.

- **The 8 deliverables are NOT a checklist for the dev to do by hand** — they are a checklist for **this PRD** to ship. Once shipped, the dev who clones does the work in 5 minutes via `bun run setup`, not via 8 manual steps.

- **Reusing the existing `e2e/login.e2e.test.ts` and `e2e/register.e2e.test.ts` is the highest seam**. They already prove the auth flow works. The new `template-smoke.e2e.test.ts` is a thin wrapper that hits `/` and asserts the proxy redirects to `/login` — a 10-line test that proves the template boots, no more. Anything beyond that is product, not template.

- **The 7 issues (one per deliverable group)** are the natural tracer-bullet slices for the next session. The order: LICENSE → `.env.example` + test → `setup.ts` + test → README + index + welcome (3 docs) → CI + CODEOWNERS + PR template (3 governance files). The maintainer (or the next agent session) opens the `prd-to-issues` skill and slices this PRD the same way PRD 002 was sliced into 8 issues.

- **This PRD does not re-litigate PRD 001's architectural decisions or PRD 002's "why-only" comment rule.** Both are settled. The template-readiness work is downstream of both.
