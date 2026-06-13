## Parent PRD

`prds/002-prune-code-comments.md`

## What to build

Condense 3 "why" JSDoc blocks in `lib/forms/define-form-action.ts` and delete 1 inline "what" block. These are the 4 surviving "why" comments in the file. **Cannot run in parallel with slice 004** — same file, different lines, agent edit collisions likely.

### Block 1 — `FormActionState` JSDoc (lines 10-18)

DELETE:

```ts
/**
 * Discriminated union consumed by `useActionState` on the client.
 *
 * The "idle" arm is what `useActionState` expects as the initial state;
 * the "error" arm carries a form-level message and per-field errors.
 * The state type is parameterised on `TIn` so the `fieldErrors` keys
 * are inferred from the schema passed to the factory — adding a field
 * to the schema updates the state type without manual changes.
 */
```

INSERT (3 lines):

```ts
/**
 * Discriminated union for `useActionState`. The "idle" arm is the initial
 * state; the "error" arm carries a form-level message and per-field
 * errors. Parameterised on `TIn` so `fieldErrors` keys are inferred from
 * the schema.
 */
```

### Block 2 — `mapApiError` JSDoc (lines 60-65, option field)

DELETE:

```ts
/**
 * Map a better-auth `APIError` to a form-level message and/or field
 * errors. Return `null` to rethrow the original error so the error
 * boundary can handle it. Non-`APIError` exceptions always rethrow.
 */
```

INSERT (2 lines):

```ts
/**
 * Map a better-auth `APIError` to a form-level message and/or field
 * errors. Return `null` to rethrow. Non-`APIError` exceptions always rethrow.
 */
```

### Block 3 — `defineFormAction` factory JSDoc (lines 120-132)

DELETE:

```ts
/**
 * The factory. Hides the full parse→dispatch→map-error→redirect sequence
 * and returns a bundle the client form can consume directly. The factory
 * is server-only (`import "server-only"`) and pulls `next/headers` and
 * `next/navigation` in at the boundary so caller action files do not have
 * to import them.
 *
 * Usage: the caller can pin `TIn` with the explicit generic and pass the
 * schema's inferred type, e.g. `defineFormAction<z.infer<typeof loginSchema>>({...})`.
 * If the generic is omitted, both generics default to a permissive
 * `Record<string, unknown>` / `unknown` pair, which is useful in tests
 * and in one-off forms.
 */
```

INSERT (3 lines):

```ts
/**
 * Hides the parse→dispatch→map-error→redirect sequence and returns a
 * bundle the form consumes directly. Server-only — pulls `next/headers`
 * and `next/navigation` so caller actions do not import them. The
 * explicit generic on the factory pins `TIn` to the schema's inferred type.
 */
```

### Block 4 — inline `// Pre-fill missing keys` (lines 154-158)

DELETE the 4-line `//` block:

```ts
// Pre-fill missing keys with "" so the schema's own messages
// surface (e.g. "Password requerido") instead of Zod's default
// "Invalid input: expected string, received undefined". For
// optional fields, "" is still a valid string so the schema
// accepts it; callers strip client-only fields via `buildBody`.
```

Rationale: describes *what* the next 4 lines do; `_values[key] = raw[key] ?? ""` is small enough to read in place. (Per PRD Round 2 — reclassified from "why" to "what" during audit.)

## Acceptance criteria

- [ ] Block 1 (FormActionState): old 8 lines deleted, new 4 lines present
- [ ] Block 2 (mapApiError): old 4 lines deleted, new 3 lines present
- [ ] Block 3 (defineFormAction factory): old 12 lines deleted, new 5 lines present
- [ ] Block 4 (inline `// Pre-fill`): 5 lines deleted, blank line gap cleaned if any
- [ ] Function bodies of `formDataToRecord`, `zodIssuesToFieldErrors`, `defineFormAction` unchanged
- [ ] `lib/forms/define-form-action.test.ts` 8 boundary cases still green
- [ ] `bun run check` green
- [ ] `bun run test` green
- [ ] `rg "^\s*//|^\s*/\*\*" lib/forms/define-form-action.ts` returns exactly: 3 condensed JSDoc blocks (10-18 → 4 lines, 60-65 → 3 lines, 120-132 → 5 lines)

## Blocked by

None — but **must run sequentially with slice 004** (same file, different line ranges, agent-edit collisions). 004 first (pure deletion), 007 second (condensation).

## User stories addressed

- User story 8 (FormActionState JSDoc keeps 1-3 line summary of union + `TIn` generic)
- User story 17 (load-bearing ordering — preserved: this slice touches factory JSDoc, not the `// must be last` plugin comment in `features/auth/server.ts`)
