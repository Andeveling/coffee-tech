## Parent PRD

`prds/002-prune-code-comments.md`

## What to build

Replace 10-line JSDoc at `features/auth/_actions/login.action-state.ts:5-14` AND identical 10-line JSDoc at `features/auth/_actions/register.action-state.ts:5-14` with 1-line JSDoc each. **Independent files, identical text** — no cross-file link per PRD decision.

### Exact replacement (both files, same text)

DELETE lines 5-14 in each file (current JSDoc):

```ts
/**
 * Action state shape consumed by `useActionState` in the login form.
 * (register form, in the other file)
 *
 * Lives in its own file (no `"use server"` directive) so that the type
 * alias, the initial-state constant, and the type guard do not violate
 * Next's `"use server"` rule, which only permits async function exports
 * from a server action file. The shape is derived from the factory's
 * generic and the schema's inferred type, so adding a field to the
 * schema updates `fieldErrors` keys automatically.
 */
```

INSERT single-line JSDoc:

```ts
/** Action state shape for `useActionState`. Split from the action file because Next's `"use server"` rule only allows async function exports — types and constants must live outside. */
```

### Files touched

- `features/auth/_actions/login.action-state.ts`
- `features/auth/_actions/register.action-state.ts`

## Acceptance criteria

- [ ] Old 10-line block deleted in `login.action-state.ts`
- [ ] New 1-line block present in `login.action-state.ts`
- [ ] Old 10-line block deleted in `register.action-state.ts`
- [ ] New 1-line block present in `register.action-state.ts`
- [ ] Both new blocks have **identical text** (no file-specific pronouns)
- [ ] Type alias, `*_INITIAL_STATE` const, `*HasError` guard: all unchanged
- [ ] `bun run check` green
- [ ] `bun run test` green
- [ ] File diff is < 18 lines net negative (9 per file)

## Blocked by

None — can start immediately.

## User stories addressed

- User story 5 (action-state files keep 1-3 line JSDoc naming `"use server"` quirk)
