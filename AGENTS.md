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
- **kebab-case** for every file and folder name.
- **Dotted role suffix** identifies the slice type at a glance and is greppable (`rg "\.action\.ts"`).
- **Components skip the suffix** — `.tsx` already identifies them; `login-form.component.tsx` adds noise.
- **One entity per file** when the file represents a discrete unit (action, schema, query, hook, type). Co-locate closely related variants only when they share a non-trivial body.
- **`index.ts` barrel** at the feature root exposes the public surface; import via `@/features/<name>` only.

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

### `lib/` vs `features/`

- `lib/` = generic, framework-agnostic infra (`auth/`, `http/`, `utils/cn.ts`, `env.ts`).
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
