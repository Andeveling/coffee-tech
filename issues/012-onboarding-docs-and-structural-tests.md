## Parent PRD

`prds/003-template-readiness.md`

## What to build

Replace the stock `README.md` with a template-specific one, add `WELCOME.md` (30-second orientation) and `prds/000-index.md` (project history reading order), and ship 3 new structural tests that pin the docs in place. All three docs reference each other and the `setup` script, so they ship as one vertical slice.

Three doc files:

1. **`README.md`** (replaces the entire current `create-next-app` placeholder):
   - Title: `Next.js Feature-First Boilerplate`.
   - 1-line description (the new `package.json` description from slice 013).
   - Badges row: `bun` version, CI status, license (MIT).
   - **`## What you get`** — bullet list of 8-10 features (auth flow, form factory, E2E tests, biome, shadcn, better-auth, Drizzle, Zod 4, Vitest, Playwright).
   - **`## Quick start`** — 5 commands: `git clone` → `bun install` → `bun run setup` → `bun run db:migrate` (just in case setup didn't push) → `bun run dev`. Every command starts with `bun` (no `npm` / `yarn` / `pnpm`).
   - **`## Architecture`** — 2 paragraphs: feature-first split, slice folders, auth boundary. Link to `AGENTS.md` and `.agents/skills/project-architecture/SKILL.md`.
   - **`## Project history`** — link to `prds/000-index.md`.
   - **`## Replace me`** — checklist of "before shipping to prod" items: rename project, regenerate `BETTER_AUTH_SECRET` for prod, swap SQLite for Postgres, set up `SECURITY.md`, deploy (Vercel recommended), enable Dependabot.
   - **`## License`** — 1 line: `MIT — see [LICENSE](./LICENSE).`

2. **`WELCOME.md`** (new, ~30 lines):
   - "You just cloned a Next.js 16 feature-first boilerplate."
   - "The app is **not** a product. It is a **starting point**: every piece of code is meant to be deleted and rewritten for your use case."
   - 3-line orientation: "Read `prds/000-index.md` for what shipped, `AGENTS.md` for the conventions, then `prds/001-…` to see how the architecture was built."
   - Pointer to `bun run setup` and `bun run dev`.

3. **`prds/000-index.md`** (new):
   - One-line description of the repo's history.
   - Table of all PRDs (`001`, `002`, `003`) with 1-line summaries and the tag they ship.
   - Table of all issues in `issues/`, grouped by status (Implemented, Proposed). The `Implemented` list is what `v0.1.0-mvp` ships; the `Proposed` list is what `v0.2.0-template-ready` is building.
   - One line per issue / PRD is enough — the files themselves have the full text.

Three new structural tests (in `tests/template/`):

4. **`readme-structure.test.ts`** — reads `README.md`, asserts:
   - Contains headings: `## What you get`, `## Quick start`, `## Architecture`, `## Replace me`, `## License`.
   - Every code block under `## Quick start` contains at least one `bun` command.
   - Does NOT contain `npm run` / `yarn ` / `pnpm ` (case-sensitive, with space) anywhere outside a "Replace me" item that might mention them.

5. **`welcome-presence.test.ts`** — reads `WELCOME.md`, asserts it exists, contains the words "boilerplate" or "starter", and points to `bun run setup` (text, not link — the dev needs to see the command).

6. **`prds-index.test.ts`** — reads `prds/000-index.md`, lists files in `prds/`, asserts the index references every PRD file. Same for `issues/`.

The vertical seam: **after this slice, a stranger who lands on the repo has a 30-second orientation (`WELCOME.md`), a 5-minute getting-started (`README.md`), and a self-updating table of contents (`prds/000-index.md`)**. The structural tests prevent future drift (e.g. a contributor adding `npm run` to the README's Quick start fails the test).

## Acceptance criteria

- [ ] `README.md` no longer contains the stock `create-next-app` text (`npm run dev`, `Geist`, `Vercel Platform` deploy section).
- [ ] `README.md` contains all 5 required headings.
- [ ] Every command in the "Quick start" section starts with `bun` (or `git`, which is allowed).
- [ ] `README.md` does NOT contain `npm run` or `yarn ` (with space) outside the "Replace me" section.
- [ ] `WELCOME.md` exists at the repo root.
- [ ] `WELCOME.md` is ≤ 50 lines (orientation, not a manual).
- [ ] `WELCOME.md` mentions `bun run setup` (text).
- [ ] `prds/000-index.md` exists.
- [ ] `prds/000-index.md` lists all 3 PRDs in a table (PRD 001, 002, 003).
- [ ] `prds/000-index.md` lists all 16 issues (001-016) in a table or list, grouped by status.
- [ ] `tests/template/readme-structure.test.ts` passes.
- [ ] `tests/template/welcome-presence.test.ts` passes.
- [ ] `tests/template/prds-index.test.ts` passes.
- [ ] `bun run check` passes.
- [ ] `bun run test` passes.
- [ ] `bun run test:e2e` passes (the existing 6 e2e tests are untouched).

## Blocked by

- Blocked by `issues/010-setup-scaffold-vertical-slice.md`. The README's "Quick start" must mention the real `bun run setup` command, which only exists after slice 010. (Slice 013 wires the `package.json` entry, but the README text references the command, which is in slice 010's script.)

## User stories addressed

- User story 8 (Quick start in 5 commands)
- User story 9 (What you get section with feature list)
- User story 10 (Architecture section linking to AGENTS.md and SKILL.md)
- User story 11 (Replace me checklist at the bottom)
- User story 12 (every command uses `bun`, no npm/yarn/pnpm)
- User story 13 (generic name in README, not `coffee-tech`)
- User story 22 (WELCOME.md for 30-second orientation)
- User story 23 (prds/000-index.md with reading order)
- User story 24 (WELCOME.md points to AGENTS.md + prds/000-index.md + CI)
- User story 35 (single checklist for "from template to project")
- User story 32 (each slice is independent — this one is purely docs + tests, no functional code)
- User story 33 (no product logic touched)
