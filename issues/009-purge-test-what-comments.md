## Parent PRD

`prds/002-prune-code-comments.md`

## What to build

Delete "what" comments from test files. Keep 4 "why" comments across 3 files. Touches 3 test files + 1 script.

### DELETE these comments exactly

| File:Line | Comment text |
|---|---|
| `e2e/login.e2e.test.ts:30` | `// Sign out by clearing cookies so the next assertion starts fresh.` |
| `e2e/login.e2e.test.ts:68` | `// Direct visit to a private path with next= → login → land on next target.` |
| `e2e/login.e2e.test.ts:74` | `// next= is preserved through the form; the page lands on /dashboard?tab=profile.` |
| `features/auth/_schemas/login.schema.test.ts:45` | `// Compile-time check: the literal must satisfy LoginInput.` |

### KEEP these "why" comments exactly (out of scope)

| File:Line | Comment text | Why keep |
|---|---|---|
| `e2e/login.e2e.test.ts:17-18` | `// Self-contained: register a fresh user, then sign in with the same credentials. Avoids depending on a pre-seeded user.` | Test isolation invariant |
| `e2e/login.e2e.test.ts:45-46` | `// Scope to the form-level alert (the paragraph inside the form), not the global Next route announcer which is also role="alert".` | Playwright selector ambiguity (Next announcer is also `role="alert"`) |
| `features/auth/_actions/login.action.test.ts:43-45` | `// The factory's behaviour is covered in lib/forms/define-form-action.test.ts. This test exercises only the auth-specific wiring...` | Test boundary (no duplicate factory coverage) |
| `features/auth/_schemas/login.schema.test.ts:8` | `// Build the email at runtime to avoid source-level scrubbing in the harness.` | Harness invariant |
| `scripts/seed.ts:17-19` | `// better-auth throws USER_ALREADY_EXISTS when the user is already in the DB. That is the expected idempotent outcome of re-running the seed script.` | Idempotent seed behavior |

## Acceptance criteria

- [ ] 4 "what" comments deleted (lines above)
- [ ] 5 "why" comments **untouched**
- [ ] `register.action.test.ts` verified to have zero comments (already true per search)
- [ ] `bun run check` green
- [ ] `bun run test` green (vitest unit tests: schema, action)
- [ ] `bun run test:e2e` green (Playwright: login flow stays green — no behavior change)
- [ ] `rg "^\s*//" e2e/ features/auth/_actions/login.action.test.ts features/auth/_schemas/login.schema.test.ts` returns exactly the 5 protected "why" comments

## Blocked by

None — can start immediately. All 3 test files + 1 script are disjoint from non-test slices.

## User stories addressed

- User story 20 (KEEP self-contained user "why")
- User story 21 (KEEP Playwright `role="alert"` "why")
- User story 22 (KEEP factory/test boundary "why")
- User story 23 (KEEP harness email scrubbing "why")
- User story 24 (DELETE other e2e "what" comments)
- User story 25 (KEEP `scripts/seed.ts` "why")
- User story 26 (DELETE compile-time check "what")
