# Project History

This file is the table of contents for the project's architectural history.
PRDs document the "what and why" of a change; issues document the
tracer-bullet slices that implemented it. Read in the order below if you
are new to the repo.

## PRDs

| PRD | Tag | Summary |
| --- | --- | --- |
| `prds/001-apply-architecture-to-boilerplate.md` | `v0.1.0` | Apply the 12-architectural-decision feature-first split to the existing boilerplate: `app/` thin routes, `features/` domain, `lib/` generic infra, `proxy.ts` middleware, `lib/env.ts` zod validation, per-feature `db/schema/`, split server/client barrels, Vitest + Playwright. |
| `prds/002-prune-code-comments.md` | `v0.1.0` | Apply the "why-only" comment rule: drop file-purpose headers, inline "what" comments, and JSDoc on private fields; condense the four long "why" blocks (open-redirect defense, `"use server"` quirk, FormActionState contract, proxy matcher) to 1-3 lines each. |
| `prds/003-template-readiness.md` | `v0.2.0` | Turn the MVP into a template: `LICENSE`, `.env.example` + structural test, `scripts/setup.ts` (idempotent scaffold), README rewrite, `WELCOME.md`, `prds/000-index.md` (this file), `package.json` rename + new scripts, CI workflow, CODEOWNERS, PR template. |

## Issues — Implemented (shipped in v0.1.0)

| Issue | Summary |
| --- | --- |
| `issues/001-define-form-action.md` | Build the `defineFormAction` factory + `isSafeNextPath` security primitive + the discriminated `FormActionState` union. |
| `issues/002-purge-file-purpose-headers.md` | Drop the stock file-purpose headers from non-test files. |
| `issues/003-purge-inline-what-comments.md` | Drop the inline "what" comments in `login.action.ts`, `register.action.ts`, `proxy.ts`. |
| `issues/004-purge-what-jsdoc-in-define-form-action.md` | Drop the JSDoc on `DefineFormActionOptions` fields, private helpers, and `FormActionBundle` when the signature says it. |
| `issues/005-condense-is-safe-next-path-jsdoc.md` | Condense the 15-line JSDoc on the open-redirect defense to 1 line. |
| `issues/006-condense-action-state-jsdocs.md` | Condense the 10-line "use server quirk" JSDoc on the action-state files to 1 line. |
| `issues/007-condense-define-form-action-why-jsdocs.md` | Condense the 3 "why" JSDocs in `define-form-action.ts` (FormActionState, mapApiError, factory) and delete the inline pre-fill block. |
| `issues/008-condense-proxy-matcher-jsdoc.md` | Condense the 8-line proxy matcher JSDoc to 2 lines. |
| `issues/009-purge-test-what-comments.md` | Drop the "what" comments in the e2e and schema tests; keep the "why" comments. |

## Issues — Implemented (shipping in v0.2.0)

| Issue | Summary |
| --- | --- |
| `issues/010-setup-scaffold-vertical-slice.md` | `.env.example` + `scripts/setup.ts` (idempotent scaffold) + structural test. The heart of the template-ready slice. |
| `issues/011-mit-license.md` | MIT `LICENSE` file at the repo root. |
| `issues/012-onboarding-docs-and-structural-tests.md` | `README.md` rewrite + `WELCOME.md` + `prds/000-index.md` (this file) + 3 structural tests. |
| `issues/013-package-json-rename-and-scripts.md` | Rename `package.json` `name` to `next-feature-first-template`, bump to `0.2.0`, add `setup` / `db:reset` / `test:ci` scripts. |
| `issues/014-ci-workflow.md` | `.github/workflows/ci.yml`: lint+unit on every PR/push, e2e on `main` only. |
| `issues/015-codeowners-and-pr-template.md` | `.github/CODEOWNERS` (load-bearing files require maintainer review) + `.github/pull_request_template.md` (standard PR checklist). |
| `issues/016-e2e-template-smoke-test.md` | E2E smoke test: clone + setup + dev → `/register` renders. The integration proof that all upstream slices compose. |
