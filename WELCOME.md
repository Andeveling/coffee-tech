# Welcome

You just cloned a **Next.js 16 feature-first boilerplate**.

The app is **not a product**. It is a **starting point**: every piece of code
is meant to be deleted and rewritten for your use case. What you are looking
at is a working example of the conventions this template enforces.

## 30-second orientation

1. Run `bun run setup` to scaffold the repo (install deps, copy env, generate
   a session secret, push the DB, verify the build).
2. Run `bun run dev` and open `http://localhost:3000/register` to see the
   template alive.
3. Read the docs in this order:
   - **`prds/000-index.md`** — what shipped in each release.
   - **`AGENTS.md`** — the folder, file, and code conventions.
   - **`prds/001-…`** — how the feature-first architecture was built (good
     example of what a real architectural decision looks like in this repo).
4. Rename, customize, delete what does not fit. The conventions in
   `AGENTS.md` outlive the code; the code is disposable.

## When you are ready to ship

The README's **Replace me** checklist has the production path: rename the
project, regenerate `BETTER_AUTH_SECRET` for prod, swap the SQLite dev DB
for Postgres, set up `SECURITY.md`, deploy.
