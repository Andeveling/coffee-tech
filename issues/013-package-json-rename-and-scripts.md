## Parent PRD

`prds/003-template-readiness.md`

## What to build

Rename the package, bump the version, and add the 3 new scripts (`setup`, `db:reset`, `test:ci`). This is the "package is now a template" edit, distinct from the script that does the work (slice 010) and the docs that describe it (slice 012).

Three concrete changes to `package.json`:

1. **`name`**: `coffee-tech` → `next-feature-first-template`. (Confirm the name in the issue's "Verification" comment — if the maintainer prefers `feature-first-nextjs` or `nextjs-architecture-template`, edit and document.)
2. **`description`**: empty string (or the current value, which is also empty) → `"Next.js 16 feature-first boilerplate with auth, E2E tests, and form orchestration"`.
3. **`version`**: `0.1.0` → `0.2.0` (per the PRD's "non-breaking, just signals template-ready" decision).
4. **`scripts` additions**:
   - `"setup": "bun run scripts/setup.ts"`
   - `"db:reset": "rm -f local.db && bun run db:migrate"` (the README will note the Windows alternative: `del local.db && bun run db:migrate`)
   - `"test:ci": "bun run test -- --reporter=verbose"`
5. **Test addition**: `tests/template/package-name.test.ts` (a new test in the template-tests folder) that reads `package.json` and asserts `name` is not `coffee-tech` and `version` is `0.2.0`.

The vertical seam: **after this slice, the package is a real template package** (generic name, generic description, version bumped, setup entry-point wired). A dev who clones and runs `bun run setup` gets the script from slice 010 invoked through this entry-point.

## Acceptance criteria

- [ ] `package.json` `name` is `next-feature-first-template` (or the alternative name confirmed by the maintainer in the issue's Verification comment).
- [ ] `package.json` `description` is the one-line summary from the PRD.
- [ ] `package.json` `version` is `0.2.0`.
- [ ] `package.json` `scripts.setup` is `bun run scripts/setup.ts`.
- [ ] `package.json` `scripts.db:reset` is `rm -f local.db && bun run db:migrate`.
- [ ] `package.json` `scripts.test:ci` is `bun run test -- --reporter=verbose`.
- [ ] All other `package.json` fields (dependencies, devDependencies, ignoreScripts, trustedDependencies) are unchanged.
- [ ] `tests/template/package-name.test.ts` passes.
- [ ] `bun run check` passes.
- [ ] `bun run test` passes.
- [ ] `bun run test:e2e` passes.
- [ ] Manual verification: `bun run setup` works after the rename (the script reads the renamed package, no hardcoded `coffee-tech` references anywhere).

## Blocked by

- Blocked by `issues/010-setup-scaffold-vertical-slice.md`. The `setup` script entry point in `package.json` must point to a real script that exists.

## User stories addressed

- User story 14 (`package.json` `name` is generic, not `coffee-tech`)
- User story 15 (`package.json` `description` is a one-line summary)
- User story 16 (`setup` script in `package.json`)
- User story 18 (`db:reset` script that drops SQLite + re-runs migrations)
- User story 12 (every command in the README will use `bun` — this is the wiring; slice 012 is the docs that mention it)
