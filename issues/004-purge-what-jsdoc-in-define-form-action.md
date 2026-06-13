## Parent PRD

`prds/002-prune-code-comments.md`

## What to build

Delete JSDoc blocks in `lib/forms/define-form-action.ts` that restate field name + type. Keep the 4 "why" blocks (condensed by other slices).

### DELETE these JSDoc blocks exactly

| Current line | Above symbol | Why delete |
|---|---|---|
| 27 | `ApiErrorMapping<TIn>` type | Restates "what caller can return from mapApiError" — type name says it |
| 43 | `schema: ZodObject<ZodRawShape>` | Field name + type say it; PRD user story 9 |
| 44 | `buildBody: (values: TIn) => unknown` | Field name + signature say it |
| 46 | `call: (body: unknown, headers: Headers) => Promise<TOut>` | Field name + signature say it |
| 48-52 | `successRedirect?: (output: TOut) => string` | Field name + signature say it |
| 60-65 | `mapApiError?: (err: APIError) => ApiErrorMapping<TIn> \| null` | **Reclassify**: this is "why" (rethrow semantics) — move to `007-condense-define-form-action-why-jsdocs.md` for condensation, do NOT delete raw |
| 66 | `onSuccess?: (output: TOut) => Promise<void>` | Field name + signature say it |
| 70-74 | `FormActionBundle<TIn>` type | Field names (`action`, `initialState`, `hasError`, `State`) enumerate purpose |
| 87-91 | `formDataToRecord` private helper | Helper name + body say it; PRD user story 10 |
| 102-106 | `zodIssuesToFieldErrors` private helper | Helper name + body say it |
| 218 | trailing `// Re-export z namespace for callers that need it without a second import.` | `export type { z }` is self-documenting |

### Touched by other slices — DO NOT TOUCH here

| Line | Status |
|---|---|
| 10-18 (`FormActionState` JSDoc) | `007-condense-define-form-action-why-jsdocs.md` rewrites to 3 lines |
| 60-65 (`mapApiError` JSDoc) | `007-...` rewrites to 2 lines |
| 120-132 (`defineFormAction` factory JSDoc) | `007-...` rewrites to 3 lines |
| 154-158 (inline `// Pre-fill missing keys`) | `007-...` deletes |

## Acceptance criteria

- [ ] JSDoc at line 27 (above `ApiErrorMapping`) deleted
- [ ] JSDoc at line 43 (above `schema` field) deleted
- [ ] JSDoc at line 44 (above `buildBody` field) deleted
- [ ] JSDoc at line 46 (above `call` field) deleted
- [ ] JSDoc at lines 48-52 (above `successRedirect` field) deleted
- [ ] JSDoc at line 66 (above `onSuccess` field) deleted
- [ ] JSDoc at lines 70-74 (above `FormActionBundle`) deleted
- [ ] JSDoc at lines 87-91 (above `formDataToRecord`) deleted
- [ ] JSDoc at lines 102-106 (above `zodIssuesToFieldErrors`) deleted
- [ ] Trailing `// Re-export z...` at line 218 deleted
- [ ] JSDoc at lines 10-18, 60-65, 120-132, and inline at 154-158 **untouched** (slice 007 owns)
- [ ] `bun run check` green
- [ ] `bun run test` green
- [ ] `rg "^\s*/\*\*" lib/forms/define-form-action.ts` returns only the 3 "why" blocks named above

## Blocked by

None — can start immediately.

## User stories addressed

- User story 9 (no JSDoc on `DefineFormActionOptions` fields when signature says it)
- User story 10 (no JSDoc on private helpers)
- User story 11 (no JSDoc on `FormActionBundle` when field names enumerate purpose)
