## Parent PRD

`prds/003-template-readiness.md`

## What to build

A GitHub Actions workflow at `.github/workflows/ci.yml` that runs the project's gates on every push and PR. This is the **infrastructure seam** of PRD 003: without CI, a public template is "trust me", not "look, the build is green". With CI, the badge in the README (slice 012) is real.

Two jobs, scoped per the PRD:

1. **`lint-and-unit`** (runs on every `push` to `main` and every `pull_request` to `main`):
   - Checkout.
   - Setup bun 1.x via `oven-sh/setup-bun@v2`.
   - `bun install --frozen-lockfile`.
   - `bun run check` (biome).
   - `bun run test` (vitest, includes the new template tests from slices 010, 012, 013).
   - The job must set the required env vars for `lib/env.ts` to pass zod validation: `DATABASE_URL=file:./ci.db`, `BETTER_AUTH_SECRET=<32+ char placeholder>`, `BETTER_AUTH_URL=http://localhost:3000`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `NODE_ENV=test`. These are hardcoded in the workflow — no repo secrets required for the boilerplate.

2. **`e2e`** (runs only on `push` to `main`, NOT on PRs — keeps PR feedback fast):
   - Checkout.
   - Setup bun.
   - `bun install --frozen-lockfile`.
   - `bunx playwright install --with-deps chromium`.
   - `bun run db:push` (against an ephemeral `ci-e2e.db`, deleted at end of job).
   - `bun run test:e2e`.
   - Uploads Playwright report on failure (artifact, 7-day retention).

The vertical seam: **after this slice, every PR and every `main` push runs the project's gates automatically**. A maintainer who merges without CI green cannot (GitHub branch protection can be set up separately — out of scope for this PRD, but the workflow itself is in place to enforce it).

## Acceptance criteria

- [ ] `.github/workflows/ci.yml` exists at the path `.github/workflows/ci.yml`.
- [ ] Workflow triggers on `push` to `main` and `pull_request` to `main`.
- [ ] `lint-and-unit` job runs `bun run check` + `bun run test` on every trigger.
- [ ] `e2e` job runs `bun run test:e2e` only on `push` to `main` (gated by `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`).
- [ ] Both jobs set the 5 required env vars for `lib/env.ts` validation.
- [ ] Both jobs use `bun install --frozen-lockfile`.
- [ ] `e2e` job runs `bunx playwright install --with-deps chromium` before tests.
- [ ] `e2e` job uploads Playwright report on failure.
- [ ] Workflow file is valid YAML (lint with `bunx js-yaml .github/workflows/ci.yml` or visually inspected).
- [ ] Workflow does NOT require any GitHub repo secrets (all env values are hardcoded placeholders that pass zod validation).
- [ ] `bun run check` passes (the YAML file is not linted by biome; the test in slice 015 is what gates the workflow file).
- [ ] `bun run test` passes (no new test from this slice — the workflow file is verified by GitHub on push, not by vitest).

## Blocked by

None — can start immediately. The workflow is independent of slices 010-013 (it runs the same gates that already exist).

## User stories addressed

- User story 25 (CI runs `bun run check` + `bun run test` on every push)
- User story 26 (CI runs `bun run test:e2e` on `push` to `main`, not on every PR)
- User story 27 (CI uses an ephemeral SQLite DB)
- User story 28 (CI fails the build if `bun run check` reports any error)
