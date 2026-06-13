## Parent PRD

`prds/002-prune-code-comments.md`

## What to build

Replace 15-line JSDoc at `lib/forms/is-safe-next-path.ts:1-15` with 1-line JSDoc. Preserve both invariants: (a) names the open-redirect defense, (b) names the standalone-because-testable reason.

### Exact replacement

DELETE lines 1-15 (current JSDoc):

```ts
/**
 * Validate and normalize a `next` search-param value before using it as
 * a `redirect()` target.
 *
 * Accepts only internal paths to prevent open-redirect attacks (a
 * malicious link like `/login?next=https://evil.example` must not be
 * honored). The accepted shape is `/` followed by an optional path
 * component — no protocol, no host, no scheme-relative URLs.
 *
 * This is a **security primitive**, not orchestration. It is kept as a
 * standalone, white-box-tested module so its guarantee is independent
 * of the form-action factory that calls into it. A future test suite
 * can mock the factory; this utility's tests are a property test of
 * the open-redirect defense.
 */
```

INSERT single-line JSDoc:

```ts
/** Security primitive: rejects non-internal paths to prevent open-redirect via `?next=https://…`. Standalone so its guarantee is testable in isolation — do not inline into the form-action factory. */
```

## Acceptance criteria

- [ ] Old 15-line block deleted
- [ ] New 1-line block present at top of file
- [ ] Function body (lines 17-23 in old file) unchanged
- [ ] `lib/forms/is-safe-next-path.test.ts` still 10 cases, all green
- [ ] `bun run check` green (biome may wrap line; verify wrap is whitespace-only)
- [ ] `bun run test` green
- [ ] File diff is < 15 lines net negative

## Blocked by

None — can start immediately.

## User stories addressed

- User story 4 (security primitive keeps 1-3 line JSDoc naming invariant + standalone reason)
