# PRD 001 — Apply Boilerplate Architecture to Existing Code

## Problem Statement

The coffee-tech Next 16 boilerplate was scaffolded ad-hoc: auth code lives flat in `lib/`, a custom `Field` component re-implements what shadcn already provides, DB schema is a single file, there's no `features/` directory, no server/client boundary enforcement, no env validation, no middleware, and no test setup. The conventions that should govern the codebase exist only as conversation context, not as enforced rules in the repo.

Adding a new feature today means making per-file placement decisions from scratch, with no greppable patterns, no split between server-only and client-safe code, and no way to know whether to colocate a slice next to a route or under `features/`. The `app/(auth)/_components/field.tsx` file is the canonical example of a hand-rolled re-implementation of a shadcn primitive that should never have been written.

The team has finalized 12 architectural decisions (see `AGENTS.md` → "Folder & File Conventions" and `.agents/skills/project-architecture/SKILL.md`). The repo does not yet reflect any of them.

## Solution

Migrate the existing boilerplate to the target architecture in a single coordinated change. The migration moves code, not logic: every existing behavior is preserved. Once shipped, every new file lands in a place dictated by convention, not by judgment.

The migration is decomposed into vertical slices, ordered so each slice leaves the repo in a buildable, type-checked state. No "big bang" rewrite; no half-applied state.

## User Stories

1. As a developer opening the repo for the first time, I want a `features/` directory with at least one example feature, so that I can copy the layout when adding my own feature.
2. As a developer, I want `features/auth/` to contain all auth-related code (schemas, actions, queries, components, hooks, types, utils, config), so that I can find every auth concern with a single `rg "features/auth"`.
3. As a developer, I want `features/auth/index.ts` and `features/auth/server.ts` as split barrels, so that client code importing from the feature cannot accidentally pull in server-only modules.
4. As a developer, I want all slice folders inside a feature prefixed with `_` (`_actions/`, `_schemas/`, `_queries/`, `_components/`, etc.), so that the underscore clearly marks them as private to the feature and unimportable across feature boundaries.
5. As a developer, I want every file outside `components/ui/` to use kebab-case names, so that the repo works consistently on case-sensitive Linux filesystems.
6. As a developer, I want every TypeScript file outside `components/ui/` to use a dotted role suffix (`.action.ts`, `.schema.ts`, `.query.ts`, `.type.ts`, `.util.ts`, `.config.ts`, `.hook.ts`), so that I can grep `rg "\.action\.ts"` to find every server action in the repo.
7. As a developer, I want every component file to use kebab-case name with PascalCase export (`login-form.tsx` → `export const LoginForm`), so that file naming stays consistent with the rest of the repo.
8. As a developer, I want every component to be exported as an arrow function with a named export, so that re-exports in barrels stay predictable and tree-shaking works.
9. As a developer, I want the `Field` form input to come from shadcn's `field` primitive, so that we stop maintaining a hand-rolled duplicate and stay aligned with shadcn updates.
10. As a developer, I want `components/ui/` to be treated as shadcn-owned, so that we never hand-edit a primitive — we copy it into a feature only when we need to customize.
11. As a developer, I want shadcn primitives added via the CLI to land in `components/ui/`, so that the shadcn workflow stays intact.
12. As a developer, I want the current `app/(auth)/` and `app/(dashboard)/` route groups renamed to `app/(public)/` and `app/(private)/` respectively, so that the group name describes the auth gate, not a feature.
13. As a developer, I want `app/(public)/` to contain every route that does not require a session (landing, pricing, login, register, forgot-password), so that the public surface is enumerable at a glance.
14. As a developer, I want `app/(private)/` to contain every route that requires a session (dashboard, settings, app surfaces), so that the private surface is enumerable at a glance.
15. As a developer, I want `app/api/auth/[...all]/route.ts` to stay in `app/api/` outside any route group, so that the better-auth handler remains reachable from the proxy and from external auth requests.
16. As a developer, I want a `proxy.ts` file at the repo root that runs as Next 16 middleware, so that there is a single source of truth for the public vs private path decision.
17. As a developer, I want `proxy.ts` to use an explicit whitelist of public path prefixes, so that any new route is private by default and a maintainer must explicitly opt it in.
18. As a developer, I want `proxy.ts` to redirect unauthenticated requests to private paths to `/login?next=<original>`, so that deep links survive the auth flow.
19. As a developer, I want `proxy.ts` to redirect authenticated users away from `/login` and `/register` to `/dashboard`, so that logged-in users never see the auth UI.
20. As a developer, I want `proxy.ts` to read the session via `auth.api.getSessionCookie()` (Edge-safe, no DB hit), so that we do not import Drizzle into Edge runtime code.
21. As a developer, I want `proxy.ts` to exclude `_next/static`, `_next/image`, `favicon.ico`, and `api/auth/*` from the matcher, so that the proxy never intercepts static assets or the better-auth handler.
22. As a developer, I want `app/(private)/layout.tsx` to re-check the session server-side as a defense-in-depth check, so that a misconfigured proxy does not leak private routes.
23. As a developer, I want every file inside `features/auth/_actions/` to be named `<name>.action.ts`, so that the action's file extension signals its server-only role.
24. As a developer, I want every server action to begin with `import "server-only"`, so that accidental client import fails the build.
25. As a developer, I want every server action to return a discriminated union `{ ok: true, data: T } | { ok: false, error: string, fieldErrors?: Record<string, string[]> }`, so that the client can typecheck the result without `any`.
26. As a developer, I want every client form to use `useActionState` (React 19) to consume the action, so that pending state, errors, and field errors flow through a single hook.
27. As a developer, I want every Zod schema to live in `features/<x>/_schemas/<name>.schema.ts`, so that schemas are co-located with their owning feature.
28. As a developer, I want Zod schemas to be client-safe (no DB, no Node API), so that the client can import them through the feature's `index.ts` barrel for optimistic validation.
29. As a developer, I want the auth Zod schema (`loginSchema`, `registerSchema`, and any future schema) to live under `features/auth/_schemas/`, so that the existing `lib/auth-schema.ts` is retired and its contents re-homed.
30. As a developer, I want `db/schema.ts` to be split into per-feature files (`db/schema/auth.ts`, and any other feature that owns tables), so that schema ownership aligns with feature ownership.
31. As a developer, I want `db/schema/index.ts` to re-export every table as a single barrel, so that `drizzle.config.ts` and queries have one import path.
32. As a developer, I want better-auth's four tables (`user`, `session`, `account`, `verification`) to live in `db/schema/auth.ts`, so that the auth feature owns its persistence.
33. As a developer, I want Drizzle queries to live in `features/<x>/_queries/<name>.query.ts`, so that queries are co-located with the feature that uses them.
34. As a developer, I want `db/` to export only the schema, the drizzle client, and seed scripts — never query functions — so that `db/` stays a thin persistence layer.
35. As a developer, I want `lib/env.ts` to validate `process.env` with zod at module load, so that the app fails fast at startup if a required var is missing.
36. As a developer, I want `lib/env.ts` to be marked `import "server-only"`, so that a client component that imports it accidentally fails the build.
37. As a developer, I want `lib/env.ts` to export two objects — `env` (server) and `publicEnv` (client-safe, `NEXT_PUBLIC_*` only), so that server secrets never reach the client bundle.
38. As a developer, I want `.env.example` to mirror the zod schema, so that onboarding has a working starter file.
39. As a developer, I want `lib/auth.ts` to consume the validated `env` object instead of doing its own `process.env` checks, so that env validation has a single source of truth.
40. As a developer, I want a global `app/error.tsx` (client component, uses `reset` prop) as the last-resort error boundary, so that unhandled errors render a consistent recovery UI.
41. As a developer, I want `app/global-error.tsx` to catch errors in the root layout itself, so that we cover the rare case of an error before any group layout mounts.
42. As a developer, I want `app/not-found.tsx` as the global 404 page, so that every unmatched route renders a consistent 404.
43. As a developer, I want `app/(public)/error.tsx`, `app/(public)/not-found.tsx`, `app/(private)/error.tsx`, and `app/(private)/not-found.tsx` to provide context-appropriate error/404 UIs, so that public and private surfaces keep their distinct chrome even on failure.
44. As a developer, I want every long-running route to ship a `loading.tsx` for the route transition, so that navigation feels instant.
45. As a developer, I want feature components that fetch in parallel to use `<Suspense>` boundaries inside the feature, so that sub-pieces stream independently.
46. As a developer, I want Vitest configured at the repo root with `vitest.config.ts` and `vitest.setup.ts`, so that unit and integration tests run via `bun test` or `vitest`.
47. As a developer, I want unit and integration test files to live next to the source they cover (`features/<x>/_actions/login.action.test.ts` next to `login.action.ts`), so that the test is greppable from the source.
48. As a developer, I want test files to use the double-suffix convention (`<name>.action.test.ts`, `<name>.schema.test.ts`), so that `rg "\.action\.test\.ts"` finds every action test.
49. As a developer, I want component-level tests skipped by default in the boilerplate (no RTL setup), so that we do not pay the cost of mocking RSC; E2E covers the user-visible behavior.
50. As a developer, I want Playwright configured at the repo root with `playwright.config.ts`, so that E2E flows run via a single command.
51. As a developer, I want E2E tests to live under `e2e/` with the `.e2e.test.ts` suffix, so that E2E flows are physically separated from colocated unit tests.
52. As a developer, I want the `e2e/login.e2e.test.ts` and `e2e/register.e2e.test.ts` flows to cover the auth happy paths, so that the critical user journeys are protected from regressions.
53. As a developer, I want the `page.tsx` of every route to stay under ~20 lines and contain no business logic, so that route files stay reviewable in one screen.
54. As a developer, I want `app/(public)/login/page.tsx` to be a thin shell that imports `LoginForm` from `features/auth`, so that the route only handles routing and the feature handles behavior.
55. As a developer, I want the `app/(public)/login/_actions.ts` and `app/(public)/register/_actions.ts` files to be deleted in favor of `features/auth/_actions/login.action.ts` and `features/auth/_actions/register.action.ts`, so that route folders do not hold domain code.
56. As a developer, I want the `app/(auth)/_components/field.tsx` file to be deleted, so that there is no duplicate of shadcn's `field` primitive lingering in the route tree.
57. As a developer, I want `lib/auth-schema.ts` to be deleted after its contents are moved into `features/auth/_schemas/`, so that there is one location for auth Zod schemas.
58. As a developer, I want `lib/auth-client.ts` to be moved into `features/auth/_components/` or `features/auth/hooks/` (as appropriate to what it exports), so that the auth client lives with the feature.
59. As a developer, I want `lib/auth.ts` to become `features/auth/server.ts` (and the small client surface exposed via `features/auth/index.ts`), so that the better-auth setup lives inside the auth feature, not in `lib/`.
60. As a developer, I want `lib/` to be reserved for genuinely generic, framework-agnostic infra (`cn`, future `http`, future `cache`), so that `lib/` does not grow a domain layer by accident.
61. As a developer, I want the AGENTS.md "Folder & File Conventions" section to remain authoritative, so that every new contributor reads the same rules.
62. As a developer, I want the `.agents/skills/project-architecture/SKILL.md` skill to remain in sync with AGENTS.md, so that AI agents apply the same rules humans read.
63. As a developer, I want the "Auto-invoke Skills" table in AGENTS.md to list `project-architecture` for the trigger "creating a new feature/route, adding server action/query/schema/component, deciding where a file belongs", so that the skill is auto-loaded at the right moments.
64. As a developer, I want the migration to be sliced so that the repo passes `bun run build` after every slice, so that I can review each slice in isolation.
65. As a reviewer, I want the migration PR description to enumerate the 12 architectural decisions and link to AGENTS.md, so that the rationale is auditable.

## Implementation Decisions

- **12 architectural decisions** (full text in `AGENTS.md` → "Folder & File Conventions" and `.agents/skills/project-architecture/SKILL.md`):
  1. Feature-first split: `app/` thin routes, `features/<x>/` domain, `lib/` generic infra.
  2. Naming: kebab-case + dotted role suffix; components skip the suffix; export PascalCase.
  3. Shared code: `lib/` only. `features/_shared/` is forbidden.
  4. Barrels: `features/<x>/index.ts` (client-safe) + `features/<x>/server.ts` (server-only).
  5. Route groups: `(public)` vs `(private)` based on auth gate.
  6. Middleware: `proxy.ts` whitelist + better-auth session cookie.
  7. db/: schema by feature, `db/schema/index.ts` barrel, queries in features.
  8. Env: `lib/env.ts` zod, split `env`/`publicEnv`, `import "server-only"`.
  9. Boundaries: global + per-group error/loading/not-found, discriminated-union action errors.
  10. Tests: Vitest colocated, Playwright under `e2e/`, skip RTL.
  11. Components: flat `_components/` with subfolders only when complex; shadcn priority; arrow + named exports.
  12. Forms: `useActionState` + zod, upgrade only when a form demands it.

- **Module moves** (no behavior change, only relocation):
  - `lib/auth.ts` → `features/auth/server.ts` (re-exported for back-compat if needed).
  - `lib/auth-schema.ts` → `features/auth/_schemas/{login,register,...}.schema.ts`.
  - `lib/auth-client.ts` → `features/auth/_client.ts` (or `features/auth/index.ts` re-export).
  - `app/(auth)/_components/field.tsx` → deleted (replaced by shadcn `field`).
  - `app/(auth)/login/_actions.ts` → `features/auth/_actions/login.action.ts`.
  - `app/(auth)/register/_actions.ts` → `features/auth/_actions/register.action.ts`.
  - `app/(auth)/` → renamed to `app/(public)/` (group only).
  - `app/(dashboard)/` → renamed to `app/(private)/` (group only).
  - `db/schema.ts` → split into `db/schema/auth.ts` + barrel `db/schema/index.ts`.

- **New modules created**:
  - `proxy.ts` at repo root (Next 16 middleware). Whitelist of public prefixes. Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, `api/auth/*`. Reads `auth.api.getSessionCookie()`. Redirect rules: no session + private → `/login?next=<path>`; session + `/login`/`/register` → `/dashboard`.
  - `lib/env.ts` with zod schema for `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NODE_ENV`, plus `NEXT_PUBLIC_APP_URL` in the public schema. Marked `import "server-only"`. Exports `env` and `publicEnv`.
  - `features/auth/index.ts` (client barrel) and `features/auth/server.ts` (server barrel).
  - `features/auth/_actions/{login,register}.action.ts` with `import "server-only"`, returning the discriminated union.
  - `features/auth/_schemas/{login,register}.schema.ts`.
  - `features/auth/_components/login-form.tsx`, `features/auth/_components/register-form.tsx` (arrow + named exports).
  - `db/schema/auth.ts` with `user`, `session`, `account`, `verification` tables.
  - `db/schema/index.ts` re-exporting every table.
  - `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`.
  - `app/(public)/error.tsx`, `app/(public)/not-found.tsx`, `app/(public)/layout.tsx`.
  - `app/(private)/error.tsx`, `app/(private)/not-found.tsx`, `app/(private)/layout.tsx` (with server-side session re-check).
  - `vitest.config.ts`, `vitest.setup.ts` (root).
  - `playwright.config.ts` (root).
  - `e2e/login.e2e.test.ts`, `e2e/register.e2e.test.ts`.

- **shadcn primitives added**:
  - `field` (replaces the hand-rolled `Field` in `app/(auth)/_components/`).
  - `sonner` (toast) — referenced for unexpected-error surfacing.
  - `button` (already installed) confirmed in `components/ui/`.

- **Architectural decisions encoded in the codebase**:
  - `_` prefix on slice folders (`_actions/`, `_schemas/`, `_queries/`, `_components/`, `_hooks/`, `_types/`, `_utils/`, `_config/`) — enforced by convention, documented in AGENTS.md.
  - Server boundary — `import "server-only"` at the top of every action, query, and server-only module.
  - Drizzle boundary — `db/` never imported from `proxy.ts` (Edge runtime).
  - Discriminated union result type for every server action: `{ ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> }`.

- **Schema/API contract changes**:
  - No DB schema changes (table shapes stay identical); only the file boundary changes from a single `db/schema.ts` to per-feature files behind a barrel.
  - No HTTP API changes; the better-auth handler at `app/api/auth/[...all]/route.ts` is unchanged.
  - No public env contract changes; `.env.example` is updated to match the new zod schema.

## Testing Decisions

- **What makes a good test** (boilerplate rule): test external behavior, not implementation. For actions: assert the discriminated union shape, not the internal control flow. For schemas: assert accept/reject cases, not the zod internals. For utils: assert input → output, not how.
- **Modules covered**:
  - `lib/env.ts` zod schema (env validation rejects missing/invalid vars, accepts valid ones).
  - `features/auth/_schemas/{login,register}.schema.ts` (field-level and form-level validation).
  - `features/auth/_actions/{login,register}.action.ts` (mock `auth.api.signInEmail`, assert return shape for success / APIError / unexpected).
  - `features/auth/_utils/*` if any pure helpers are added.
  - `lib/cn.util.ts` (small but high-churn — assert it merges classes correctly).
- **Modules explicitly NOT covered by unit tests**:
  - React components (no RTL). E2E covers the user-visible behavior.
  - Drizzle queries (require a real DB; covered by integration tests in CI, not in the local unit suite).
- **E2E flows** (Playwright, under `e2e/`):
  - `e2e/login.e2e.test.ts`: navigate to `/login`, fill valid credentials, assert redirect to `/dashboard` (or to `?next=` target).
  - `e2e/register.e2e.test.ts`: navigate to `/register`, fill new credentials, assert account creation + auto-login.
  - Optional: `e2e/auth-redirect.e2e.test.ts`: hit `/dashboard` unauthenticated, assert redirect to `/login?next=/dashboard`.
- **Prior art in the codebase**: none yet (greenfield). Vitest config will be the template for future feature tests. Playwright config will be the template for future flows.

## Out of Scope

- Building any product feature beyond the existing auth flow. No dashboard widgets, no billing, no settings, no marketing pages beyond what is needed to host the auth UI.
- Migrating to a different state management library (zustand stays as-is, used only where needed).
- Migrating to a different UI library (shadcn stays, base-ui stays).
- Replacing the `lib/cn.util.ts` helper or any other generic utility.
- Adding Storybook or any component-development tool.
- CI pipeline changes (the local test setup is the deliverable; CI wiring is a follow-up).
- Theming, i18n, analytics, observability — none of these are in this PRD.
- Performance work, accessibility audits, SEO, Open Graph — none of these are in this PRD.
- OpenSpec spec changes — this PRD is the source of truth; the `openspec/` workflow is independent.

## Further Notes

- The 12 architectural decisions are pre-validated. The PRD does not re-litigate them; it implements them.
- The migration is sliced so the repo passes `bun run build` after every slice. Suggested slice order: (1) install shadcn `field` and replace the hand-rolled `Field`; (2) create `lib/env.ts` and route all env access through it; (3) split `db/schema.ts` into per-feature files behind `db/schema/index.ts`; (4) create `features/auth/` with barrels, move code, update imports; (5) add `proxy.ts`; (6) rename route groups `(auth)`→`(public)` and `(dashboard)`→`(private)` and update imports; (7) add Vitest + colocated tests for env, schemas, and actions; (8) add Playwright + `e2e/login.e2e.test.ts` and `e2e/register.e2e.test.ts`; (9) add error/not-found/loading boundaries; (10) final cleanup pass — confirm no `app/(auth)`, no `app/(dashboard)`, no custom `Field`, no `lib/auth-schema.ts` survive.
- After the migration lands, future work should be tracked as new PRDs, not appended here.
- The `.agents/skills/project-architecture/SKILL.md` is the AI-readable companion to `AGENTS.md`. Both must stay in sync.
- The "Auto-invoke Skills" table in AGENTS.md already includes `project-architecture` for the right triggers. Future project skills follow the `project-<name>` convention.
