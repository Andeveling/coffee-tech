# Next.js Feature-First Boilerplate

A Next.js 16 feature-first boilerplate with auth, E2E tests, and form
orchestration. Use it as a starting point for new apps — every piece of code
is meant to be deleted and rewritten for your use case.

## What you get

- **Next.js 16 App Router** with `proxy.ts` middleware (public/private routing)
- **better-auth** with email/password, session cookies, server-action cookie
  wiring via `nextCookies`
- **Drizzle ORM + libsql** (SQLite for dev, Postgres-ready for prod)
- **Zod 4** schemas shared between client and server
- **Feature-first layout** — `features/<x>/` for domain, `app/` for routes,
  `lib/` for generic infra
- **Form orchestration factory** (`defineFormAction`) with discriminated-union
  action results, consumed via `useActionState`
- **shadcn/ui** on `@base-ui/react` (base-maia style) — primitives live in
  `components/ui/`, customised copies in `features/<x>/_components/`
- **Biome 2** for lint + format (no ESLint, no Prettier)
- **Vitest** for unit tests, **Playwright** for E2E

## Quick start

```bash
git clone <your-fork-url> my-app
cd my-app
bun install
bun run setup
bun run dev
```

Then open `http://localhost:3000/register` and create a test account. The
`bun run setup` step copies `.env.example` to `.env`, generates a
`BETTER_AUTH_SECRET`, pushes the schema, and verifies the build.

If you only need to re-run setup (e.g. after pulling new commits):

```bash
bun run setup
```

It is idempotent — running it twice does not break the repo.

## Architecture

The repo follows a **feature-first** layout. `app/` is a thin routing surface
(`page.tsx`, `layout.tsx`, route handlers); domain logic lives under
`features/<name>/` (auth, billing, settings, etc.). Generic, framework-agnostic
infrastructure lives in `lib/`. The two key conventions:

- **Slice folders** inside a feature are prefixed with `_` (`_actions/`,
  `_schemas/`, `_queries/`, `_components/`, etc.). They are private to the
  feature. The public surface is the feature's `index.ts` (client-safe barrel)
  and `server.ts` (server-only barrel).
- **Auth boundary** is `proxy.ts` (Edge runtime, single source of truth for
  public vs private routing) with a defense-in-depth server-side re-check in
  `app/(private)/layout.tsx`.

Full conventions: see [AGENTS.md](./AGENTS.md) and
[`.agents/skills/project-architecture/SKILL.md`](./.agents/skills/project-architecture/SKILL.md).

## Project history

The architectural decisions are documented as PRDs in `prds/`. Read
[`prds/000-index.md`](./prds/000-index.md) for a table of contents and the
recommended reading order.

## Replace me

Before shipping to production, work through this checklist:

- [ ] **Rename the project.** `package.json` `name` is currently
      `next-feature-first-template`; replace it with your app's name.
- [ ] **Regenerate `BETTER_AUTH_SECRET`** with a fresh 32-byte random value
      (`openssl rand -base64 32`). The one in `.env` is for local dev.
- [ ] **Swap the SQLite dev DB for Postgres** in production. Update
      `DATABASE_URL` to your connection string and review the schema in
      `db/schema/`.
- [ ] **Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL`** to your deployed
      URL.
- [ ] **Add a `SECURITY.md`** describing how to report vulnerabilities.
- [ ] **Deploy.** Vercel is the fastest path for Next.js 16; any platform
      that runs `bun run build` + `bun run start` works.
- [ ] **Enable Dependabot** in the GitHub repo settings (1-click).
- [ ] **Wire a real issue tracker** if you outgrow the `prds/` + `issues/`
      folder convention.

## License

[MIT](./LICENSE) — Copyright (c) 2026 Andeveling.
