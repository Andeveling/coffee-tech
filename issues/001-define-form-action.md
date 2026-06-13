# RFC 001 — Deepen form-action orchestration with `defineFormAction`

## Problem

The "form + action" flow in `features/auth` is not a module — it is **five files coordinated by convention, not by type**. To add a single field to the login form today, an engineer must touch:

1. `features/auth/_schemas/login.schema.ts` (Zod shape, Spanish messages)
2. `features/auth/_actions/login.action-state.ts` (state type, initial state)
3. `features/auth/_actions/login.action.ts` (the action body — manual `raw.email ?? ""` destructuring, manual schema invocation, manual `zodIssuesToFieldErrors<LoginInput>` call, manual `APIError` instanceof check, manual `redirect(isSafeNextPath(raw.next) ? raw.next : "/dashboard")`)
4. `features/auth/_components/login-form.tsx` (the `<Field>` + `<Input>` + `<FieldError>` block per field)
5. `features/auth/index.ts` (any new re-export)

The compiler does not enforce the cross-file consistency. Add a field to the schema and forget step 2 or 3, and the bug is silent until a form submit shows a stale field.

The cluster of pure utilities — `formDataToRecord`, `zodIssuesToFieldErrors`, `isSafeNextPath` — exist today **only to be testable in isolation**. The actual bugs live in the **sequence** in which they are called inside the action:

- What if `FormData` arrives without the `email` key? (Current answer: silently coerced to `""`, which then trips the schema with a "Required" message — masking the real `ZodError` shape.)
- What if `confirmPassword` is empty and the `refine` fails? (Current answer: `formDataToRecord` drops non-strings, so the refine runs with `""` and the message is the refine's, not the schema's. Subtle.)
- What if the caller passes a `next` like `https://evil.example`? (Current answer: `isSafeNextPath` catches it. This is the one piece of logic that *correctly* lives in a primitive — it is security-sensitive and tested with 10 cases.)

### Architectural friction

- **Information hiding is shallow.** The form imports the action, the action imports the state, the state imports the schema, the schema is duplicated knowledge between step 1 and step 2. Each file exposes what the next file needs to know.
- **The action is the seam between 4 layers** (HTTP boundary, validation, business logic, security) and is currently a 70-line procedural script. The boundary is the right place to test, but today the boundary is a closed-over function with no seam.
- **6 orchestration files** (login.action, login.action-state, register.action, register.action-state, plus the 3 utils) collapse to **1 factory + 2 thin configs** with the deepened interface.

## Proposed Interface

`lib/forms/define-form-action.ts` exports a single function with a deep surface. The factory takes a config and returns a **bundle** that the form consumes directly — no separate state imports, no separate type-guard imports.

### Signature

```ts
// lib/forms/define-form-action.ts
import "server-only";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { type z, type ZodError, type ZodObject, type ZodRawShape } from "zod";

import { formDataToRecord } from "@/lib/forms/form-data-to-record";
import { isSafeNextPath } from "@/lib/forms/is-safe-next-path";
import { zodIssuesToFieldErrors } from "@/lib/forms/zod-issues-to-field-errors";

export type FormActionState<TIn extends Record<string, unknown>> =
  | { status: "idle" }
  | {
      status: "error";
      formError: string | null;
      fieldErrors: Partial<Record<keyof TIn, string>>;
    };

export type ApiErrorMapping<TIn> =
  | { formError: string; fieldErrors?: Partial<Record<keyof TIn, string>> }
  | { formError?: string; fieldErrors: Partial<Record<keyof TIn, string>> };

export type DefineFormActionOptions<TIn extends Record<string, unknown>, TOut> = {
  /** Zod schema — its key set defines `TIn`, and `fieldErrors` are auto-derived from it. */
  schema: ZodObject<ZodRawShape>;
  /** Map the parsed form values to whatever the underlying API call expects. */
  buildBody: (values: TIn) => unknown;
  /** The business call. Better-auth (`auth.api.signInEmail`) is the default; the interface does not name it. */
  call: (body: unknown, headers: Headers) => Promise<TOut>;
  /** Where to send the user on success. Optional override of the default `/dashboard`. */
  successRedirect?: (output: TOut) => string;
  /** Default form-level error if the error is not an `APIError` or the map returns null. */
  defaultFormError: string;
  /** Map a better-auth `APIError` to a form-level message and/or field errors. Returning `null` rethrows. */
  mapApiError?: (err: APIError) => ApiErrorMapping<TIn> | null;
  /** Optional pre-success side effect (analytics, audit log, etc.) — runs before redirect. */
  onSuccess?: (output: TOut) => Promise<void>;
};

export type FormActionBundle<TIn extends Record<string, unknown>> = {
  /** Use as the first arg to `useActionState` on the client. */
  action: (prev: FormActionState<TIn>, formData: FormData) => Promise<FormActionState<TIn>>;
  /** The "idle" arm of the state. Pass to `useActionState` as `initialState`. */
  initialState: FormActionState<TIn>;
  /** Type guard narrowing the state to the "error" arm. */
  hasError: (state: FormActionState<TIn>) => state is Extract<FormActionState<TIn>, { status: "error" }>;
  /** The state type, inferred from the schema. Re-export so consumers do not import from the module. */
  State: FormActionState<TIn>;
};

export const defineFormAction = <TIn extends Record<string, unknown>, TOut>(
  opts: DefineFormActionOptions<TIn, TOut>,
): FormActionBundle<TIn> => {
  // ... internal orchestration ...
};
```

### Usage

**Login action** (`features/auth/_actions/login.action.ts`) — 4 lines of orchestration:

```ts
"use server";
import { auth } from "@/features/auth/server";
import { defineFormAction } from "@/lib/forms/define-form-action";
import { loginSchema } from "@/features/auth/_schemas/login.schema";

export const loginAction = defineFormAction({
  schema: loginSchema,
  buildBody: (v) => v, // shape matches — passthrough
  call: (body, headers) => auth.api.signInEmail({ body, headers }),
  defaultFormError: "Email o contraseña incorrectos",
}).action;
```

**Register action** — same shape, with custom `mapApiError` for the `USER_ALREADY_EXISTS` case:

```ts
"use server";
import { auth } from "@/features/auth/server";
import { defineFormAction } from "@/lib/forms/define-form-action";
import { registerSchema } from "@/features/auth/_schemas/register.schema";

export const registerAction = defineFormAction({
  schema: registerSchema,
  buildBody: ({ confirmPassword, ...rest }) => rest, // strip the client-only confirm field
  call: (body, headers) => auth.api.signUpEmail({ body, headers }),
  defaultFormError: "No se pudo crear la cuenta",
  mapApiError: (err) =>
    err.body?.code === "USER_ALREADY_EXISTS"
      ? { fieldErrors: { email: "Este email ya está registrado" } }
      : { formError: err.body?.message ?? null },
}).action;
```

**Login form** — bundle import collapses 3 imports to 1:

```tsx
"use client";
import { useActionState } from "react";
import { loginAction } from "@/features/auth/_actions/login.action";

export const LoginForm = ({ next }: { next: string | null }) => {
  const { action, initialState, hasError, State } = loginAction.bundle;
  // ... (also possible: keep the bundle separate and have the form take it as a prop)
};
```

> Open question for the issue: how does the form get the bundle? Option A — the action is no longer a bare function; it carries the bundle as a sibling export. Option B — the form imports the bundle and the action separately. The current sketch picks A; the consumer research below is a precondition for the implementation.

### What it hides internally

- `formDataToRecord` — moves inside the factory as a private helper.
- `zodIssuesToFieldErrors` — moves inside. Now parameterized on `TIn` automatically (the type is inferred from the schema).
- `isSafeNextPath` — **stays as an independent primitive** (see "Dependency Strategy").
- The state type union, the initial state, the type guard `hasError` — derived from the schema and re-exported via the bundle.
- The `try { call } catch (err) { if (err instanceof APIError) ... }` pattern — collapsed into the factory's error dispatcher with `mapApiError` and `defaultFormError`.
- The `redirect(safeNext ?? "/dashboard")` postamble — `safeNext` is read from FormData by name (a convention), validated, and passed to the factory's `successRedirect` (default `"/dashboard"`).
- The `import { headers } from "next/headers"` and `import { redirect } from "next/navigation"` are pulled into the factory — caller actions no longer import `next/headers` or `next/navigation` directly.

## Dependency Strategy

**In-process** for the orchestration (Zod parsing, error mapping, state union derivation).
**In-process** for the `next/headers` and `next/navigation` integration — these are framework-level imports the factory owns once.
**Local-substitutable** for the security primitive `isSafeNextPath`. It is small, pure, and security-sensitive; it stays as a standalone, white-box tested utility (10 cases) because **its security guarantee must not depend on a factory's internal logic.** A future test suite can still mock the factory, but the primitive's tests are a property test of the open-redirect defense, not of the form flow.

The factory itself imports `next/headers` and `next/navigation` at module top. It is `import "server-only"` to make accidental client bundling fail the build. The factory is **not** ported for non-Next runtimes — that is an explicit decision. If a second runtime ever needs the same orchestration, extract the Next glue behind a port and reuse the validation/dispatch core.

No mocks. No ports & adapters. The factory has one direct dependency (Zod) and one framework dependency (Next). Both are first-party in this project.

## Testing Strategy

### New boundary tests to write

A single new file `lib/forms/define-form-action.test.ts` covers the deep module's behavior end-to-end with mocked `headers` and `redirect`:

1. **Happy path** — valid form data → `call` is invoked with the body and headers → `redirect` is called with the `successRedirect` result → state is the initial state (the action throws before returning).
2. **Zod failure** — invalid form data → `call` is **not** invoked → state has `status: "error"`, `fieldErrors` populated from the `ZodError`, `formError: null`.
3. **`mapApiError` mapping** — `call` throws an `APIError` matching a specific code → the mapped `fieldErrors`/`formError` is returned, `call` is invoked exactly once.
4. **`mapApiError` returns null** — `call` throws an `APIError` with no map → the error is rethrown for the error boundary.
5. **Non-APIError rethrow** — `call` throws a `TypeError` → rethrown.
6. **Custom `successRedirect`** — output of `call` is fed to the redirect function and used as the target.
7. **`onSuccess` side effect** — runs after `call` succeeds, before `redirect`. Receives the `TOut`.
8. **Field-error type propagation** — a schema with a `username: z.string()` field makes `fieldErrors.username` typed as `string | undefined` in the bundle. (Type-level test.)

### Old tests to delete

- `features/auth/_utils/form-data.util.test.ts` (does not exist today — no test was ever written for this util).
- `features/auth/_utils/zod-issues.util.test.ts` (does not exist today).
- The current `features/auth/_actions/login.action.test.ts` and `features/auth/_actions/register.action.test.ts` get **rewritten** to test the same behaviors but through the factory's bundle, not by importing the action and the state separately. Their **assertions** stay (login: 7 cases; register: 6 cases), but the imports and the mock surface shrink.
- `features/auth/_actions/login.action-state.ts` and `register.action-state.ts` get **deleted** — the bundle owns the state type and the initial state. The two files become re-exports of the bundle for back-compat, or (preferred) the consumers update their imports to read from the bundle.

### Old tests to keep

- `features/auth/_utils/safe-next-path.util.test.ts` — 10 cases, security primitive. Unchanged. **The factory calls into it; the test exercises the contract, not the orchestrator.**

### Test environment needs

- Vitest with the existing `server-only` stub alias.
- A schema with at least 3 different field types (string, refined-string, optional) to exercise the field-error type inference.
- A mock `call` (vi.fn) — no real better-auth dependency in unit tests. Integration tests for the real auth flow remain the E2E suite.

## Implementation Recommendations

Durable architectural guidance, decoupled from current file paths:

### What the module owns (`lib/forms/define-form-action.ts`)

- The `FormActionState<TIn>` discriminated union and the `hasError` type guard.
- The `formDataToRecord` (private) helper, since the boundary of `FormData → Record<string,string>` is internal.
- The `zodIssuesToFieldErrors` (private) helper, since the projection of `ZodError → fieldErrors` is internal.
- The Next glue: `headers()`, `redirect()`, `import "server-only"`.
- The error dispatch: `mapApiError` is the only domain hook; everything else is framework.

### What it hides

- The five-step orchestration: `parse FormData → safeParse schema → dispatch call → map errors → redirect`. This is the part the engineer should never have to write again.
- The coercion `raw.email ?? ""` foot-gun. The factory reads from FormData by the schema's own key set; missing keys surface as the schema's own error message, not as a synthesized "Required".

### What it exposes

- A single factory: `defineFormAction({ schema, buildBody, call, defaultFormError, successRedirect?, mapApiError?, onSuccess? })`.
- A bundle: `{ action, initialState, hasError, State }`.
- A type: `FormActionState<TIn>` for callers that need it.

### What it explicitly does not expose

- `formDataToRecord`, `zodIssuesToFieldErrors` — these were utilities that existed only to be tested in isolation. They are now tested as part of the factory's boundary.
- Direct imports of `next/headers` or `next/navigation` from caller action files — those are framework concerns the factory owns.
- The `next=` FormData field name — it is a convention the factory owns. If a future caller needs a different name, the factory accepts a `getNextPath?: (formData: FormData) => string | null` option. Today, `next` is fine.

### Migration plan

1. Land `lib/forms/define-form-action.ts` with the bundle and the `lib/forms/is-safe-next-path.ts` re-export (keeping the security-primitive test).
2. Land `lib/forms/define-form-action.test.ts` with the 8 boundary tests above.
3. Migrate `login.action.ts` and `register.action.ts` to the new factory. Keep the public symbol names `loginAction` and `registerAction` so the form's `useActionState(loginAction, ...)` is unchanged.
4. Update the form components to import the bundle from the action and stop importing `LOGIN_INITIAL_STATE` and `hasError` from the action-state files.
5. Delete `features/auth/_actions/login.action-state.ts` and `register.action-state.ts` (or, if the migration is conservative, leave them as re-exports of the bundle for one release).
6. Delete `features/auth/_utils/form-data.util.ts` and `zod-issues.util.ts` (logic moved into the factory; their tests never existed).
7. Update `features/auth/index.ts` to remove the re-exports of `formDataToRecord` and `zodIssuesToFieldErrors`.
8. Update `AGENTS.md` and `.agents/skills/project-architecture/SKILL.md` to document `lib/forms/` as the home for cross-feature form orchestration and to remove the references to the now-deleted utils.
9. Run the full gate: `bun run check && bun run test && bun run build && bun run test:e2e`. All 6 E2E tests and all 45 unit tests stay green.

### Acceptance criteria

- Adding a new field to `loginSchema` requires editing **only** the schema and the form. The action recompiles without changes; the bundle's `fieldErrors` key type is correct without manual updates.
- A new form in a different feature (e.g. `features/settings/_actions/change-password.action.ts`) can use `defineFormAction` with no changes to `lib/forms/`.
- The 10-case `isSafeNextPath` test passes unchanged.
- The boundary test file exercises 8 scenarios end-to-end and is the single place a future engineer goes to understand the contract.
- The 4 action-test files become 1, and their assertions live in the boundary test or in the integration test (E2E) — never both.
