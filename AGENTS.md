# Repository Guidelines

## How to Use This Guide

- Start here for cross-project norms. Prowler is a monorepo with several components.
- Each component has an `AGENTS.md` file with specific guidelines (e.g., `api/AGENTS.md`, `ui/AGENTS.md`).
- Component docs override this file when guidance conflicts.
- No `src` folder — all code is in root, example: `app/`, `lib/`, `db/`.

## Folder & File Conventions

Feature-first structure. `app/` is a thin routing surface (routes, layouts, route handlers). Domain logic lives under `features/<name>/`.

### Slice folders (private to the feature)

Prefix slice folders with `_` to mark them as private/colocated — never import across feature boundaries via these folders. Use the public `index.ts` (barrel) of the feature to expose surface.

| Folder | File pattern | Example |
| --- | --- | --- |
| `_actions/` | `<name>.action.ts` | `features/auth/_actions/login.action.ts` |
| `_schemas/` | `<name>.schema.ts` | `features/auth/_schemas/login.schema.ts` |
| `_queries/` | `<name>.query.ts` | `features/users/_queries/get-user.query.ts` |
| `_hooks/` | `<name>.hook.ts` | `features/auth/_hooks/use-session.hook.ts` |
| `_types/` | `<name>.type.ts` | `features/auth/_types/session.type.ts` |
| `_utils/` | `<name>.util.ts` | `features/coffee/_utils/format-roast.util.ts` |
| `_config/` | `<name>.config.ts` | `features/coffee/_config/routes.config.ts` |
| `_components/` | `<name>.tsx` | `features/auth/_components/login-form.tsx` |

Rules:
- **kebab-case** for every file and folder name (Linux filesystem is case-sensitive; kebab avoids `Foo.tsx` vs `foo.tsx` collisions).
- **Dotted role suffix** identifies the slice type at a glance and is greppable (`rg "\.action\.ts"`).
- **Components skip the suffix** — `.tsx` already identifies them; `login-form.component.tsx` adds noise.
- **One entity per file** when the file represents a discrete unit (action, schema, query, hook, type). Co-locate closely related variants only when they share a non-trivial body.
- **`index.ts` barrel** at the feature root exposes the public surface; import via `@/features/<name>` only.

### Component export style

- **Arrow functions only**: `export const Foo = (...) => { ... }`. No `export function Foo() {}` declarations.
- **Named exports only**: no `export default`. The barrel `index.ts` re-exports explicitly.
- **Export name**: PascalCase. File name kebab-case. `login-form.tsx` exports `LoginForm`.
- **Subfolders**: keep `_components/` flat by default. Promote to subfolders **only when a component group grows genuinely complex** (e.g. a reactive multi-section form: `components/form/sections/inputs/...`). No pre-emptive grouping. Barrel the subfolder if it has 3+ siblings.

### shadcn priority rule

**Always check the shadcn registry first** before writing a UI component. The boilerplate ships shadcn (`components.json` configured for `base-maia` style on `@base-ui/react`).

- Run `bunx --bun shadcn@latest add <component>` to install a primitive. It lands in `components/ui/<kebab>.tsx`.
- `components/ui/` is **shadcn-owned**: don't hand-edit. To customize, copy the file and edit the copy in `features/<x>/_components/`.
- If shadcn covers the need, use it. Build a custom component only when the primitive falls short (compose, don't reinvent).
- Common primitives to favor: `button`, `input`, `field`, `form`, `select`, `dialog`, `dropdown-menu`, `sonner` (toast), `card`, `table`, `tabs`, `sheet`, `popover`, `tooltip`, `avatar`, `badge`, `checkbox`, `radio-group`, `switch`, `textarea`, `label`, `separator`, `skeleton`, `spinner`, `command`, `combobox`, `alert`, `alert-dialog`, `accordion`, `collapsible`, `breadcrumb`, `pagination`, `navigation-menu`, `sidebar`, `chart`.

### `app/` (routing only)

- Top-level route groups split by auth requirement, not by feature:
  - `app/(public)/` — no session required. Marketing, pricing, auth flow (`login`, `register`, `forgot-password`).
  - `app/(private)/` — session required. Dashboard, settings, app surfaces.
  - `app/api/` — route handlers, no group. `api/auth/[...all]/route.ts` is the better-auth handler and must remain public.
- Group name describes the **audience gate**, not the feature. Features live in `features/<x>/`.
- Per-route private slices: `app/(public)/login/_components/...` only for true route-only UI (e.g. page shell, route-specific error boundary). Domain logic never lives here.
- `_components/` inside a route = route-private UI. Distinct from `features/<x>/_components/` = feature UI.

### Auth boundary — `proxy.ts` (Next 16 middleware)

- Single source of truth for public vs private routing decisions. Runs on Edge.
- **Whitelist** of public prefixes: `/`, `/pricing`, `/login`, `/register`, `/forgot-password`, plus `api/auth/*`, `_next/*`, static assets. Everything else = private.
- **Redirects**:
  - No session + private path → `/login?next=<original>`.
  - Session + `/login` or `/register` → `/dashboard` (skip auth UI for logged-in users).
  - Honor `next=` post-login.
- **better-auth wiring**: read session via `auth.api.getSessionCookie()` (Edge-safe, no DB hit). Never call Drizzle from proxy — Edge runtime has no Node APIs.
- **Matcher**: exclude `_next/static`, `_next/image`, `favicon.ico`, and `api/auth/*` from proxy execution; auth routes go straight to the better-auth handler.
- Defense in depth: `app/(private)/layout.tsx` re-checks the session server-side and redirects if missing — proxy is a fast path, not the only gate.

### Layout nesting

```
app/layout.tsx              ← html, body, providers (theme, toaster, query client)
├── app/(public)/layout.tsx ← public chrome (marketing nav, footer)
│   ├── (public)/page.tsx           → /
│   ├── (public)/pricing/page.tsx
│   └── (public)/login/page.tsx
└── app/(private)/layout.tsx ← private chrome (sidebar, topbar, user menu) + auth guard
    ├── (private)/dashboard/page.tsx
    └── (private)/users/page.tsx
```

### Boundaries — `error.tsx` / `loading.tsx` / `not-found.tsx`

- Granularity: **global + per-group fallback**. Per-route only when a route truly needs distinct UX.
  - `app/error.tsx` — global error boundary (client component, uses `reset` prop).
  - `app/global-error.tsx` — catches errors in the root layout itself. Must define its own `<html><body>`.
  - `app/not-found.tsx` — global 404.
  - `app/(public)/error.tsx` and `app/(public)/not-found.tsx` — public-context UX (no sidebar).
  - `app/(private)/error.tsx` and `app/(private)/not-found.tsx` — dashboard-context UX (preserves private chrome).
- **Loading**: hybrid.
  - `app/(<group>)/<route>/loading.tsx` for route transition (consistent skeleton during navigation).
  - `<Suspense>` inside the feature for sub-pieces that fetch in parallel — React 19 makes this cheap.
- **Server Action errors**: discriminated union returned from the action, not thrown across the boundary.
  - Action signature: `async (input): Promise<{ ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> }>`.
  - Client consumes with `useActionState` (React 19) for form-level + field-level errors.
  - Unexpected errors (network, 500) surfaced via a global toast (sonner or similar).

### Form handling + validation flow

- **Library**: `useActionState` (React 19) nativo. No `react-hook-form` ni `conform-to-zod` por default. Upgrade solo si un form lo demanda (formulario público multi-paso, progressive enhancement requerido).
- **Validation pipeline**:
  1. Zod schema en `features/<x>/_schemas/<name>.schema.ts`. Client-safe (no DB, no Node API) → se puede exportar vía `index.ts` (client barrel) si el form lo necesita para validación optimista.
  2. Server action en `_actions/<name>.action.ts`, marcado `import "server-only"`:
     - `schema.safeParse(input)` → si falla, return `{ ok: false, error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }`.
     - Si pasa, ejecutar lógica y return `{ ok: true, data }`.
  3. Client form: `useActionState(action, initialState)` + render de `fieldErrors[name]` por field.
- **Zod schemas** son compartibles client↔server. La única rama server-only es la action que los ejecuta contra DB.

### `lib/` vs `features/`

- `lib/` = generic, framework-agnostic infra (`auth/`, `http/`, `utils/cn.ts`, `env.ts`).
- `lib/env.ts` validates process env with zod at module load. Marked `import "server-only"` so accidental client import fails the build. Public vars (`NEXT_PUBLIC_*`) live in a separate exported `publicEnv` object; server vars never reach the client. `.env.example` mirrors the schema for onboarding.
- `features/<x>/` = domain logic tied to a product capability.
- Cross-feature reuse: prefer extracting a new feature (`features/_shared/` is **forbidden** — it becomes a junk drawer). If two features need the same thing, it usually belongs in `lib/` or becomes its own feature consumed by both.

### `db/` (persistence)

- `db/` is the **only** place that knows about Drizzle/libsql. Features import the schema and the client; they never configure Drizzle themselves.
- **Schema organized by feature**, not by table:
  - `db/schema/auth.ts` — `user`, `session`, `account`, `verification` (better-auth-managed tables).
  - `db/schema/<feature>.ts` — one file per product capability that owns tables.
  - `db/schema/index.ts` — barrel that re-exports every table. `drizzle.config.ts` and queries import from this single path.
- **Queries live in features, not in `db/`**:
  - `features/<x>/_queries/<name>.query.ts` — Drizzle queries that join/filter the schema.
  - `db/` exports only the schema, the drizzle client (`db/index.ts`), and seed scripts. No `db/queries/`.
- **Migrations** (`db/migrations/*.sql`) are generated by `drizzle-kit` from the schema barrel. Never hand-edit; regenerate if the schema changes.
- **Edge runtime rule**: `db/index.ts` imports the libsql client which uses Node APIs. **Never** import `db/` from `proxy.ts` or any Edge-only file. Proxy uses `auth.api.getSessionCookie()` for session checks.

### Tests

- **Location**: colocated for unit/integration; `e2e/` at the repo root for end-to-end.
  - `features/<x>/_actions/login.action.test.ts` lives next to `login.action.ts`.
  - `e2e/<flow>.e2e.test.ts` for Playwright flows.
- **Naming**: double suffix when applicable — `login.action.test.ts`, `user.schema.test.ts`. Greppable by `rg "\.action\.test\.ts"`.
- **Runner**: Vitest. Config at `vitest.config.ts`, setup at `vitest.setup.ts`. Compatible with bun.
- **Component testing**: skip by default. React Server Components complicate RTL setup; cover with E2E instead.
- **E2E**: Playwright. Config at `playwright.config.ts`. Browser flows for critical paths (login, signup, core CRUD).
- **Boilerplate coverage** (initial seed): `lib/env.ts` zod schemas, every feature's zod schemas, server actions (with DB mocked), pure utils. Queries are covered by integration tests against a real DB in CI, not unit tests.

## Available Skills

Use these skills for detailed patterns on-demand:

### Project Skills (this repo)

These skills are specific to this boilerplate. Follow the convention `project-<name>` for new project-specific skills.

| Skill | Description | URL |
|-------|-------------|-----|
| `project-architecture` | Feature-first folder layout, kebab + dotted role suffix naming, split server/client barrels, `app/` as thin routing surface | [SKILL.md](.agents/skills/project-architecture/SKILL.md) |

### Generic Skills (Any Project)

| Skill | Description | URL |
|-------|-------------|-----|
| `typescript` | Const types, flat interfaces, utility types | [SKILL.md](skills/typescript/SKILL.md) |
| `react-19` | No useMemo/useCallback, React Compiler | [SKILL.md](skills/react-19/SKILL.md) |
| `nextjs-16` | App Router, Server Actions, proxy.ts, streaming | [SKILL.md](skills/nextjs-16/SKILL.md) |
| `tailwind-4` | cn() utility, no var() in className | [SKILL.md](skills/tailwind-4/SKILL.md) |
| `zod-4` | New API (z.email(), z.uuid()) | [SKILL.md](skills/zod-4/SKILL.md) |
| `zustand-5` | Persist, selectors, slices | [SKILL.md](skills/zustand-5/SKILL.md) |
| `openspec-explore` | Explore sdd specs | [SKILL.md](skills/openspec-explore/SKILL.md) |
| `openspec-propose` | Propose sdd spec changes | [SKILL.md](skills/openspec-propose/SKILL.md) |
| `openspec-apply-change` | Apply sdd spec changes | [SKILL.md](skills/openspec-apply-change/SKILL.md) |
| `openspec-archive-change` | Archive sdd spec changes | [SKILL.md](skills/openspec-archive-change/SKILL.md) |
| `engram-memory-protocol` | Memory learn protocol | [SKILL.md](skills/engram-memory-protocol/SKILL.md) |



### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|
| App Router / Server Actions | `nextjs-16` |
| Creating Zod schemas | `zod-4` |
| Creating a git commit | `commit` |
| Using Zustand stores | `zustand-5` |
| Working on task | `tdd` |
| Working with Tailwind classes | `tailwind-4` |
| Writing React components | `react-19` |
| Writing TypeScript types/interfaces | `typescript` |
| Creating a new feature/route, adding server action/query/schema/component, deciding where a file belongs | `project-architecture` |

---

## Commit & Pull Request Guidelines

Follow conventional-commit style: `<type>[scope]: <description>`

**Types:** `feat`, `fix`, `docs`, `chore`, `perf`, `refactor`, `style`, `test`

Before creating a PR:
1. Complete checklist in `.github/pull_request_template.md`
2. Run all relevant tests and linters
3. Link screenshots for UI changes

## CLI tools

### mmx search
```bash
mmx search --help

Usage: mmx search <command> [flags]

Commands:
  search query  Search the web via MiniMax
  search web    Search the web via MiniMax
```

### ctx7
```bash
ctx7 --help
Usage: ctx7 [options] [command]
Context7 CLI - Manage AI coding skills and documentation context
Commands:
  library [options] <name> [query]    Resolve a library name to a Context7 library ID
  docs [options] <libraryId> <query>  Query documentation for a library
  skills|skill Manage AI coding skills
```
