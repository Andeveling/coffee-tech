---
name: project-architecture
description: Feature-first folder layout, kebab + dotted role suffix naming, split server/client barrels, `app/` as thin routing surface. Auto-invoke when creating a new feature/route, adding a server action/query/schema/component, or deciding where a file belongs.
---

# project-architecture

This skill is the AI-readable companion to the "Folder & File Conventions" section of `AGENTS.md`. It is the source of truth for *where* a new file goes, *how* it is named, and *which* export style to use. Human docs live in AGENTS; the agent-runtime copy lives here. Both must stay in sync — drift between them is a bug.

## 1. Three zones

| Zone        | Path             | Purpose                                                                 |
| ----------- | ---------------- | ----------------------------------------------------------------------- |
| Infrastructure | `lib/`         | Generic, framework-agnostic helpers. No domain code. Sub-folders allowed for cross-cutting concerns (e.g. `lib/forms/` for form-orchestration primitives). |

## 2. `app/` — routing only

- `app/(public)/<route>/page.tsx` — public surface (no session). Layout = `app/(public)/layout.tsx` (pure chrome, no session check).
- `app/(private)/<route>/page.tsx` — private surface (session required). Layout = `app/(private)/layout.tsx` re-checks the session server-side (defense in depth).
- `app/api/<path>/route.ts` — Route Handlers. `app/api/auth/[...all]/route.ts` is the better-auth handler and stays in `app/api/`, outside any group.
- `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` — global boundaries.
- `app/<group>/error.tsx`, `app/<group>/not-found.tsx` — per-group boundaries (preserve group chrome).
- `app/<group>/loading.tsx` — per-group route transition skeleton.

> **Exception — `export default` in route files.** Next requires `export default` from `page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, `loading.tsx`, `global-error.tsx`, and `route.ts`. The "named exports only" rule below applies to **components in `features/_components/`**, not to Next's route file contract.

## 3. `features/<x>/` — domain

```
features/<x>/
├── index.ts          ← client-safe barrel (re-exports components, schemas, utils, types, hooks)
├── server.ts         ← server-only barrel (re-exports anything that imports "server-only")
├── client.ts         ← client-only surface (better-auth createAuthClient etc., no server imports)
├── _actions/         ← <name>.action.ts          — server actions, "use server", import "server-only"
├── _schemas/         ← <name>.schema.ts          — Zod schemas (client-safe, no DB)
├── _queries/         ← <name>.query.ts           — Drizzle queries (server-only)
├── _hooks/           ← <name>.hook.ts            — React hooks (client)
├── _types/           ← <name>.type.ts            — TS types/interfaces
├── _utils/           — <name>.util.ts            — pure helpers (both sides)
├── _config/          — <name>.config.ts          — feature-local config
└── _components/      — <name>.tsx                — components (arrow + named export)
```

### Slice folders are `_`-prefixed — and **only** slice folders

- Files **inside** a feature use the prefix `_` only when they live in a slice folder (`_actions/`, `_schemas/`, …).
- Files **at the feature root** (`index.ts`, `server.ts`, `client.ts`) do **not** use the `_` prefix. Reserve the leading underscore for slice folders, period. A file at the feature root whose name starts with `_` and that the barrel re-exports is a naming smell — rename it.

### Barrel rule

- `index.ts` is **client-safe**. Anything that imports `"server-only"`, `next/headers`, `@/db`, or reads `process.env` server-side is **banned** from this barrel. Re-export from `./server` instead.
- `server.ts` is the **only** place to re-export server-only modules. Client code that imports it will fail the build (because of `import "server-only"` in the chain).
- Feature surface is consumed via `@/features/<x>` (resolves to `index.ts`). Do not import from `_actions/login.action` directly across features.

## 4. File naming

- **kebab-case** everywhere (Linux is case-sensitive).
- **Dotted role suffix** for slices: `login.action.ts`, `login.schema.ts`, `get-user.query.ts`, `use-session.hook.ts`, `session.type.ts`, `format-roast.util.ts`, `routes.config.ts`.
- **Components skip the suffix** — `.tsx` already identifies them. `login-form.tsx` exports `LoginForm`.

## 5. Component export style

- **Arrow functions only**: `export const LoginForm = (...) => { ... }`.
- **Named exports only** (route files excepted — see §2).
- Re-exports in barrels are explicit: `export { LoginForm } from "./_components/login-form"`.

## 6. `lib/` — generic infra only

- `lib/cn.utils.ts` — `cn()` helper (clsx + tailwind-merge).
- `lib/env.ts` — server env validation. `import "server-only"`. Exports frozen `env` object.
- `lib/public-env.ts` — client env validation. Exports frozen `publicEnv` object. **Separate file** from `lib/env.ts` so the server-only boundary is clean (an env module marked `import "server-only"` cannot also export client-safe values).
- `lib/` must not grow a domain layer. If two features need the same thing, it usually belongs in `lib/` only when it is **framework-agnostic**; otherwise extract a new feature.

> **`features/_shared/` is forbidden** — it becomes a junk drawer.

## 7. `db/` — persistence

- Schema lives in `db/schema/<feature>.ts`. The barrel `db/schema/index.ts` re-exports every table. Drizzle config and queries import from the barrel.
- Queries live in `features/<x>/_queries/<name>.query.ts`. `db/` exports only the schema, the drizzle client, and seed scripts.
- **Edge runtime rule**: `db/` is server-only (libsql uses Node APIs). Never import `db/` from `proxy.ts` or any other Edge-only file.

## 8. Env validation

- `lib/env.ts` parses `process.env` with zod at module load. Missing/invalid → throw with a copy-pasteable fix message.
- Server-only vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NODE_ENV`.
- Public vars (`NEXT_PUBLIC_*`): live in `lib/public-env.ts`, validated separately, accessible to client code.
- `.env.example` mirrors both schemas.

## 9. Form orchestration — `lib/forms/`

Cross-feature helpers for the "form + action" flow consumed by `useActionState`. The factory **is the only way new forms should be wired** — there is no ad-hoc pattern.

### `lib/forms/define-form-action.ts`

Factory that hides the full `parse → call → map error → redirect` sequence and returns a `FormActionBundle` (`{ action, initialState, hasError, State }`). Marked `import "server-only"` because it pulls in `next/headers` and `next/navigation`.

### `lib/forms/is-safe-next-path.ts`

Open-redirect validator. Kept as a standalone, white-box-tested security primitive — **not** absorbed into the factory. The primitive's guarantee is independent of the form flow; tests assert on the contract, not the orchestrator.

### When to use `defineFormAction`

For every form that posts to a server action. Schema lives in `features/<x>/_schemas/`, the action file in `features/<x>/_actions/<name>.action.ts`, the form component in `features/<x>/_components/`. The action file is restricted to async function exports (per `"use server"` rules); the state type, initial state, and type guard live in a sibling `<name>.action-state.ts` file.

### Usage shape

```ts
// features/<x>/_actions/<name>.action.ts
"use server";
export const xAction = defineFormAction<z.infer<typeof xSchema>>({
  schema: xSchema,
  buildBody: (v) => v,                       // optional shape transform
  call: (body, headers) => api.do(x, body, headers),
  defaultFormError: "default error message",
  mapApiError: (err) => /* optional { formError, fieldErrors } | null */,
}).action;
```

### Action result shape — depends on the consumer

- **For `useActionState` consumers** (forms): `{ status: "idle" } | { status: "error"; formError: string | null; fieldErrors: Partial<Record<keyof TIn, string>> }`. Derived from the schema passed to the factory — `fieldErrors` keys are auto-inferred.
- **For programmatic consumers** (server-to-server, fire-and-forget): `{ ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> }`. Define a separate thin action for that surface; do not reuse the form action.

## 10. Auth boundary — `proxy.ts`

- `proxy.ts` at the repo root is the **single source of truth** for the public/private path decision. Runs on Edge.
- **Whitelist** of public path prefixes; everything else is private. New routes are private by default.
- Reads session via `auth.api.getSessionCookie()` (Edge-safe, no DB hit). Never import `db/` or `lib/env.ts` from `proxy.ts` — Drizzle is Node-only.
- Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, image extensions, and `api/auth/*`.
- Defense in depth: `app/(private)/layout.tsx` re-checks the session server-side. The public layout does **not** re-check — the proxy already covers it.

## 11. Tests
