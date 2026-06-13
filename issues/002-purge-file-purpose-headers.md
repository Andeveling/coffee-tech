## Parent PRD

`prds/002-prune-code-comments.md`

## What to build

Delete file-purpose headers from non-test files. Each header restates name + first lines, violates why-only rule.

Surviving file headers in test infra (different rule — bypass invariant) live in `003-purge-inline-what-comments.md` companion slice.

### DELETE these blocks exactly

| File | Lines (current) |
|---|---|
| `vitest.setup.ts` | 1-7 (whole header above env record) |
| `playwright.config.ts` | 3-9 (header above `defineConfig`) |
| `proxy.ts` | 4-8 (header above `PUBLIC_PATH_PREFIXES`) |
| `features/auth/index.ts` | 1-3 (barrel-purpose header) |
| `test/server-only-stub.ts` | 1-3 (stub-purpose header) — **KEEP**, see below |

### `db/index.ts` story

PRD user story 16 says delete `// eslint-disable-next-line no-var`. Search shows that line **does not exist** in file. Reclassify story: verify file has zero linter leftovers before/during slice, write finding in commit msg.

### `scripts/seed.ts:17-19` story

PRD mark "KEEP" — explains `USER_ALREADY_EXISTS` idempotent outcome. Out of scope for this slice; lives in `009-purge-test-what-comments.md`.

### `test/server-only-stub.ts` — reclassify

Stub header is "why" (bypass of `server-only` sentinel for vitest Node runtime). User story 7 says keep. **Delete this slice's row from the table; file is NOT touched here.**

### `features/auth/index.ts:1-3` — reclassify

Header says "client-safe barrel; NEVER re-export server-only". User story 6 says keep. **Delete this slice's row; file is NOT touched here.**

### Net scope after reclassify

3 files touched: `vitest.setup.ts`, `playwright.config.ts`, `proxy.ts`.

## Acceptance criteria

- [ ] `vitest.setup.ts` lines 1-7 deleted; `requiredEnv` record starts at line 1
- [ ] `playwright.config.ts` lines 3-9 deleted; `import` line stays at top
- [ ] `proxy.ts` lines 4-8 deleted; `import` lines stay at top
- [ ] `db/index.ts` verified to have zero linter leftovers; finding noted in commit msg
- [ ] `test/server-only-stub.ts` header **untouched** (out of slice)
- [ ] `features/auth/index.ts` header **untouched** (out of slice)
- [ ] `bun run check` green
- [ ] `bun run test` green
- [ ] `rg "^\s*//|^\s*/\*\*" vitest.setup.ts playwright.config.ts proxy.ts` returns only the `// must be last` line in `proxy.ts:33` (Round 2 territory, may still be there at slice close)

## Blocked by

None — can start immediately.

## User stories addressed

- User story 3 (no file-purpose headers above self-describing files)
- User story 18 (`vitest.setup.ts` header)
- User story 19 (`playwright.config.ts` header)
- User story 16 (`db/index.ts` linter leftover — verified absent)
- User story 29 (no docs files added)
