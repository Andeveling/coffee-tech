## Parent PRD

`prds/003-template-readiness.md`

## What to build

The end-to-end "first-run" experience for a developer who just cloned the template. This is the **highest-leverage slice** of PRD 003: without it, the dev has to manually run 5 sharp-edged commands (install, copy env, generate 32-char secret, push DB, run dev). With it, one command does all of that.

This slice delivers 3 files, all co-located, all tested together as a single vertical:

1. **`.env.example`** at the repo root — every var from `lib/env.ts` and `lib/public-env.ts`, with a `#` comment line above each explaining purpose + format. Placeholder value for `BETTER_AUTH_SECRET` (not a real secret). The setup script detects and replaces the placeholder on first run.
2. **`scripts/setup.ts`** — a TypeScript script runnable via `bun run scripts/setup.ts`. Idempotent. Steps: verify `bun` is installed → `bun install` (skip if `node_modules` exists) → if `.env` does not exist, copy `.env.example` to `.env` → if `BETTER_AUTH_SECRET` is the placeholder, regenerate via `crypto.randomBytes(32).toString("base64")` → run `bun run db:push` (or `bun run db:migrate`) → run `bun run check` → print `✓ Setup complete. Next: bun run dev`. Catches errors per step, exits 1 on any failure.
3. **`tests/template/env-example.test.ts`** — parses `.env.example`, parses `lib/env.ts` and `lib/public-env.ts` (extracts zod schema keys via a small regex on the source), asserts:
   - The three sets of keys are equal (no var missing from example, no var in example that's not in a schema).
   - Every key in `.env.example` has a non-empty `#` comment line immediately above it.

The vertical seam: **after this slice, a clean clone + `bun run scripts/setup.ts` produces a working repo**. The 4 unit tests prove the env contract is enforced; the setup script proves the flow works end-to-end (verified manually by the implementer; CI gate is in slice 014).

## Acceptance criteria

- [ ] `.env.example` exists at repo root with all 5 vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NODE_ENV`, `NEXT_PUBLIC_APP_URL`. Each has a `#` comment line above it explaining purpose + format.
- [ ] `BETTER_AUTH_SECRET` in `.env.example` is a placeholder (`replace-me-with-openssl-rand-base64-32` or similar), not a real secret. The comment above shows the `openssl rand -base64 32` command.
- [ ] `DATABASE_URL` in `.env.example` has a comment explaining `file:` (local dev, SQLite) vs `libsql:` (production) scheme prefixes.
- [ ] `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` in `.env.example` use the dev value `http://localhost:3000`.
- [ ] `scripts/setup.ts` exists and is runnable via `bun run scripts/setup.ts`.
- [ ] `scripts/setup.ts` is idempotent: running it twice does not error and does not regenerate a fresh secret if the existing one is valid.
- [ ] `scripts/setup.ts` regenerates `BETTER_AUTH_SECRET` only if the current value is the placeholder; preserves a real secret.
- [ ] `scripts/setup.ts` exits 1 with a numbered failure list if any step fails.
- [ ] `scripts/setup.ts` prints `✓ Setup complete. Next: bun run dev` on success.
- [ ] `tests/template/env-example.test.ts` passes (`bun run test`).
- [ ] `bun run check` (biome) passes after the slice.
- [ ] `bun run test` (vitest) passes after the slice.
- [ ] `bun run test:e2e` (playwright) still passes — none of the 6 existing E2E tests broken.
- [ ] Manual verification: in a temp directory, `git clone` the repo, `bun run scripts/setup.ts`, then `bun run dev` boots, `http://localhost:3000/register` renders. Document the result in the issue's "Verification" comment.

## Blocked by

None — can start immediately. This is the first slice; everything else depends on it.

## User stories addressed

- User story 3 (env var list in `.env.example` with comments)
- User story 4 (realistic example values, not placeholders for non-secret vars)
- User story 5 (`BETTER_AUTH_SECRET` length warning + `openssl` hint)
- User story 6 (`DATABASE_URL` scheme explanation)
- User story 7 (test asserts `.env.example` mirrors the zod schemas)
- User story 16 (`setup` script in `package.json` — wired by slice 013, but the script itself ships here)
- User story 17 (idempotent setup)
- User story 19 (setup runs install + env copy + secret gen + DB push + smoke check)
- User story 20 (clear summary on success)
- User story 21 (clear failure list on any step failing)
