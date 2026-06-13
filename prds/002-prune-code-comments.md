# PRD 002 — Prune Code Comments to "Why-Only"

## Problem Statement

The codebase carries 33 inline comment blocks across 19 files. The repo's own convention (AGENTS.md → "Folder & File Conventions" + project-architecture SKILL.md) establishes that the source of truth is the code: kebab-case + dotted role suffix naming, arrow + named exports, split server/client barrels, JSDoc above public exports. Comments that **repeat the code** ("what" comments) violate that principle: they add maintenance surface, rot when the code moves, and never catch a bug.

Worse, the mix of "what" and "why" comments dilutes the signal of the rare "why" comments that actually protect invariants. Today, the **security primitive** that defends against open-redirect (`lib/forms/is-safe-next-path.ts`) and the **"`use server` quirk"** that splits `login.action-state.ts` from `login.action.ts` are visually indistinguishable from comments like `// 1. Logged-in users...` in `proxy.ts` (which restates the `if` immediately below). A maintainer cleaning the latter "for consistency" eventually cleans the former, and the invariant is gone.

The "out" list is concrete: 0 `TODO:`, 0 `FIXME:`, 0 `// biome-ignore*`, 0 `// eslint-disable*` exist in the repo today. The list the user gave is aspirational — by the time we finish, the file headers, inline "what" comments, and JSDoc on private fields are all candidates for pruning. Without a written rule, each future contributor re-litigates the case.

## Solution

Apply a single, greppable rule: **comments are kept only when they encode a reason the code does not express — security invariants, framework quirks that the type system cannot enforce, bypasses, or load-bearing ordering**. Everything else (file-purpose headers, "what" comments that paraphrase the next line, JSDoc on fields whose type signature already says it) is removed or condensed to a single line.

The cleanup is sliced into three independent rounds so the repo stays green at every gate (`bun run check`, `bun run test`):

1. **Round 1 — "what" purges**: drop file-purpose headers and inline "what" comments. ~21 files lose 1–10 lines each.
2. **Round 2 — "why" rewrites**: condense the four long "why" blocks (15, 10, 10, 8 lines) to 1–3 lines each. Two of them document load-bearing invariants (open-redirect defense, `"use server"` quirk); collapsing them too far would lose the signal.
3. **Round 3 — test "why" purges**: drop the four "what" comments in `e2e/login.e2e.test.ts`, keep the three "why" comments (Playwright `role="alert"` ambiguity, factory-vs-auth test boundary, harness email scrubbing).

The "must be last plugin" inline comment in `features/auth/server.ts` is the only inline comment that survives — reordering that line silently breaks better-auth's cookie wiring in server actions, and the type system does not catch it.

The check command (`bun run check` = biome check --write) is the only verification needed. No new test files. No behavior change.

## User Stories

1. As a maintainer, I want every comment in the repo to encode a "why" the code cannot express, so that comments carry signal, not noise.
2. As a maintainer, I want no comment to paraphrase the next line of code, so that a rename in the code does not silently rot the comment.
3. As a maintainer, I want no file-purpose header above files whose name and first lines already say what the file is, so that the header does not drift from the file's actual purpose.
4. As a security-conscious maintainer, I want the `is-safe-next-path` module to keep a 1–3 line JSDoc that names the invariant ("rejects non-internal paths to prevent open-redirect") and the architectural reason it is standalone ("testable in isolation — do not inline"), so that a future "cleanup" PR does not fold it into the factory and break the defense.
5. As a framework-aware maintainer, I want the `login.action-state.ts` and `register.action-state.ts` files to keep a 1–3 line JSDoc that names the Next `"use server"` quirk (only async function exports allowed in a server action file; types and constants must live outside), so that a future "consolidation" PR does not move the type alias into the action file and break the build.
6. As a maintainer, I want the `features/auth/index.ts` barrel to keep a 1–3 line header that names the invariant (this barrel is **client-safe**; anything `import "server-only"` must NEVER be re-exported from here), so that a future re-export does not silently leak server-only code into the client bundle.
7. As a maintainer, I want the `test/server-only-stub.ts` file to keep a 1–3 line header that names the bypass (vitest's Node runtime does not enforce the `server-only` sentinel; this stub keeps server-only-tagged modules unit-testable), so that a future "remove dead code" PR does not delete a load-bearing test infrastructure file.
8. As a maintainer, I want the `lib/forms/define-form-action.ts` `FormActionState` JSDoc to keep a 1–3 line summary of the discriminated union contract and the "why" of the `TIn` generic, so that a future schema extension updates `fieldErrors` keys automatically.
9. As a maintainer, I want no JSDoc on the `DefineFormActionOptions` fields (`schema`, `buildBody`, `call`, `successRedirect`, `mapApiError`, `onSuccess`) when the field name and type signature already say what the field is, so that renaming a field does not produce stale docs.
10. As a maintainer, I want no JSDoc on the private helpers `formDataToRecord` and `zodIssuesToFieldErrors` when the helper name and body already say what they do, so that the file shrinks to its decision-rich parts.
11. As a maintainer, I want no JSDoc on the `FormActionBundle` type when the field names (`action`, `initialState`, `hasError`, `State`) already enumerate its purpose, so that the type reads as a table of contents.
12. As a maintainer, I want the `proxy.ts` matcher JSDoc to compress from 8 lines to 1–2 lines that name the load-bearing exclusion (`api/auth/*` must not run through the proxy), so that the matcher is reviewable in one screen but the better-auth invariant is still explicit.
13. As a maintainer, I want the `proxy.ts` body comments `// 1. ...` and `// 2. ...` removed, because the `if` conditions immediately below them restate the comment, so that the function body reads as control flow, not as a numbered lecture.
14. As a maintainer, I want the `login.action.ts` inline comment `// schema shape already matches the call input` removed, because the `buildBody: (v) => v` identity function is the comment, so that the wiring stays free of noise.
15. As a maintainer, I want the `register.action.ts` inline comment `// Strip the client-only confirmPassword before hitting the API.` removed, because the destructuring `({ confirmPassword: _confirm, ...rest })` with the `_confirm` convention already conveys intent, so that the wiring reads as code, not as commentary.
16. As a maintainer, I want the `db/index.ts` `eslint-disable-next-line no-var` line removed if it exists, and the surrounding `declare global` block to keep its purpose clear without a linter leftover, so that the file does not carry a foreign linter's footprint.
17. As a maintainer, I want the `features/auth/server.ts` inline comment `// must be the last plugin — wires set-cookie into next/headers for server actions` to survive, because reordering that line silently breaks better-auth's cookie wiring in server actions and the type system does not catch it, so that the load-bearing ordering is explicit.
18. As a maintainer, I want the `vitest.setup.ts` file header (currently 5 lines describing the file's purpose and the test env vars) removed, because the file's name and the env-record literal below already say what it does, so that the setup file is greppable as a single artifact.
19. As a maintainer, I want the `playwright.config.ts` file header removed, because the `testDir` and `testMatch` fields and the `Run with:` line at the bottom already document the config, so that the config file has no marketing copy.
20. As a maintainer, I want the `e2e/login.e2e.test.ts` "self-contained user" comment kept as a 2-line "why" explaining why each test generates its own user (no pre-seeded user dependency), so that the next maintainer does not "optimize" the setup into a shared fixture and break test isolation.
21. As a Playwright-aware maintainer, I want the `e2e/login.e2e.test.ts` "scope to the form-level alert" comment kept as a 2-line "why" explaining the `getByRole("alert")` ambiguity (Next's route announcer is also `role="alert"`), so that the next maintainer does not "simplify" the selector and break the test in a non-obvious way.
22. As a test-architect, I want the `features/auth/_actions/login.action.test.ts` "factory's behaviour is covered in lib/forms/define-form-action.test.ts" comment kept as a 2-line "why" that names the test boundary (this test exercises wiring, not the factory's parsing/dispatch), so that the next maintainer does not duplicate 8 boundary cases into this file.
23. As a maintainer, I want the `features/auth/_schemas/login.schema.test.ts` "Build the email at runtime" comment kept as a 1-line "why" naming the harness invariant, so that the next maintainer does not "clean up" the dynamic construction and break the test runner.
24. As a maintainer, I want all other "what" comments in `e2e/login.e2e.test.ts` (`// Sign out by clearing cookies...`, `// Direct visit to a private path with next=...`, `// next= is preserved through the form...`) removed, because the `it(...)` description and the assertion below already say the same thing, so that the test file reads as a sequence of steps, not as commentary.
25. As a maintainer, I want the `scripts/seed.ts` `// better-auth throws USER_ALREADY_EXISTS...` comment kept as a 2-line "why" explaining the idempotent seed behavior, so that the next maintainer does not "fix" the catch block by rethrowing.
26. As a maintainer, I want the `features/auth/_schemas/login.schema.test.ts` "Compile-time check: the literal must satisfy LoginInput." removed, because the `const sample: LoginInput = ...` annotation IS the compile-time check, so that the test loses its noise.
27. As a maintainer, I want the cleanup sliced into 3 rounds with `bun run check` between each, so that any biome formatting drift introduced by hand-edits is caught and fixed before the next round.
28. As a maintainer, I want no new test files added (this is a comment-only refactor), so that the test surface stays exactly as it is today.
29. As a maintainer, I want no documentation file (no `CHANGELOG.md`, no new section in AGENTS.md) added, so that the refactor's "documentation" is the resulting code itself.
30. As a future contributor, I want to be able to grep `rg "^\s*//"` or `rg "^\s*/\*\*"` in any feature folder and find only comments that name a "why" the code does not express, so that adding a new comment in the future follows the same rule by example.

## Implementation Decisions

- **The rule itself, made greppable**:
  - KEEP: a comment when it (a) names a security invariant the type system does not enforce, (b) names a framework quirk the type system does not enforce (e.g. `"use server"` allowing only async function exports), (c) names a load-bearing ordering or position, (d) names a bypass or test infrastructure role, or (e) names a "why" the test's `it(...)` description does not cover.
  - REMOVE: a comment when it (a) paraphrases the next line of code, (b) restates a field name and type, (c) describes a file whose name and first 10 lines already describe it, or (d) is a numbered step that the `if` condition already enumerates.

- **Round 1 — "what" purges (in dependency order, with `bun run check` between each)**:
  - DELETE the file-purpose headers above `vitest.setup.ts`, `test/server-only-stub.ts`, `features/auth/index.ts`, `playwright.config.ts`, `proxy.ts:4-8`.
  - DELETE the inline "what" comments at `login.action.ts:16`, `register.action.ts:20`, `proxy.ts:33`, `proxy.ts:40`, `e2e/login.e2e.test.ts:30`, `e2e/login.e2e.test.ts:68`, `e2e/login.e2e.test.ts:74`, `login.schema.test.ts:45`.
  - DELETE the file-purpose header at `scripts/seed.ts:17-19` — wait, this is a "why" (USER_ALREADY_EXISTS is the idempotent outcome). KEEP. (Reclassified during Round 1 audit; the rule applies uniformly.)
  - KEEP the inline comment at `features/auth/server.ts:25` (`// must be the last plugin — ...`). Reordering silently breaks cookies.
  - KEEP the JSDoc above the `defineFormAction` factory in `lib/forms/define-form-action.ts` (the function body hides the full sequence; the JSDoc is the "why" of the bundle shape).
  - KEEP the JSDoc on private helpers `formDataToRecord` and `zodIssuesToFieldErrors` and `ApiErrorMapping` and `FormActionBundle` — *no, decision revision*: these are "what" comments restating names and bodies. Apply Round 2's condensation rule uniformly and REMOVE them in Round 2.

- **Round 2 — "why" rewrites** (the four long blocks compress to 1–3 lines each):
  - **`lib/forms/is-safe-next-path.ts:1-15`** (15 lines → 1 line):
    `/** Security primitive: rejects non-internal paths to prevent open-redirect via \`?next=https://…\`. Standalone so its guarantee is testable in isolation — do not inline into the form-action factory. */`
  - **`features/auth/_actions/login.action-state.ts:5-14`** and **`register.action-state.ts:5-14`** (10 lines each, identical text → 1 line, kept identical for independence — no cross-file reference link):
    `/** Action state shape for \`useActionState\`. Split from the action file because Next's \`"use server"\` rule only allows async function exports — types and constants must live outside. */`
  - **`lib/forms/define-form-action.ts:10-18`** (the `FormActionState` JSDoc, 8 lines → 3 lines):
    `/** Discriminated union for \`useActionState\`. The "idle" arm is the initial state; the "error" arm carries a form-level message and per-field errors. Parameterised on \`TIn\` so \`fieldErrors\` keys are inferred from the schema. */`
  - **`lib/forms/define-form-action.ts:60-65`** (the `mapApiError` JSDoc, 6 lines → 2 lines):
    `/** Map a better-auth \`APIError\` to a form-level message and/or field errors. Return \`null\` to rethrow. Non-\`APIError\` exceptions always rethrow. */`
  - **`lib/forms/define-form-action.ts:120-132`** (the `defineFormAction` factory JSDoc, 13 lines → 3 lines):
    `/** Hides the parse→dispatch→map-error→redirect sequence and returns a bundle the form consumes directly. Server-only — pulls \`next/headers\` and \`next/navigation\` so caller actions do not import them. The explicit generic on the factory pins \`TIn\` to the schema's inferred type. */`
  - **`proxy.ts:57-64`** (the matcher JSDoc, 8 lines → 2 lines):
    `/** Excludes static assets, public files, and \`api/auth/*\`. The \`api/auth\` exclusion is load-bearing: better-auth's handler must not run through the proxy. */`
  - **DELETE** the JSDoc at `lib/forms/define-form-action.ts:27` (above `ApiErrorMapping`), `:43` (above `schema`), `:44` (above `buildBody`), `:46` (above `call`), `:48-52` (above `successRedirect`), `:60-65` REPLACES (above `mapApiError`), `:66` (above `onSuccess`), `:70-74` (above `FormActionBundle`), `:87-91` (above `formDataToRecord`), `:102-106` (above `zodIssuesToFieldErrors`).
  - **DELETE** the trailing `// Re-export z namespace for callers that need it without a second import.` at `define-form-action.ts:218` — the `export type { z }` line is self-documenting.
  - **DELETE** the inline `// Pre-fill missing keys with "" so the schema's own messages surface...` block at `define-form-action.ts:154-158` — this is a 4-line "why" but it describes *what the next 4 lines do*, not a non-obvious invariant. The `_values[key] = raw[key] ?? ""` line is small enough to read in place.

- **Round 3 — test "what" purges**:
  - DELETE the "what" comments in `e2e/login.e2e.test.ts` at lines `:30`, `:68`, `:74`.
  - KEEP the "why" comments in `e2e/login.e2e.test.ts` at lines `:17-18` (self-contained user), `:45-46` (Playwright `role="alert"` ambiguity).
  - KEEP the "why" comment in `login.action.test.ts:43-45` (factory boundary).
  - KEEP the "why" comment in `login.schema.test.ts:8` (harness email scrubbing).
  - DELETE the "what" comment in `login.schema.test.ts:45` (`// Compile-time check...`).
  - KEEP the "why" comment in `scripts/seed.ts:17-19` (USER_ALREADY_EXISTS idempotent).

- **Verification gate**: `bun run check` (biome check --write) between rounds. Biome may auto-format lines that grow past the wrap threshold; the agent re-reads the affected files and confirms the format change is mechanical (whitespace only) before moving to the next round.

- **What the refactor explicitly does not do**:
  - Does not add new test files.
  - Does not modify the discriminated union, the factory signature, the bundle shape, or any runtime behavior.
  - Does not add a "comments policy" section to AGENTS.md (the rule is captured by the resulting code itself, not by doc).
  - Does not introduce `TODO:`/`FIXME:`/`biome-ignore` comments to "mark" something; the refactor's only writes are deletions and condensed rewrites.

- **Files touched (final count, after all 3 rounds)**: ~19 files lose comments, 5 files gain condensed rewrites, 0 files are created, 0 files are deleted.

## Testing Decisions

- **What makes a good test** (boilerplate rule, unchanged): test external behavior, not implementation. This refactor changes zero observable behavior, so the *existing* test suite is the only verification needed.
- **No new tests written** for this PRD. Adding tests that assert "this file has fewer comments" would be testing the refactor itself, not the code's behavior. The vitest suite (`bun run test`) and biome's formatter/linter (`bun run check`) are the only gates.
- **Modules covered (by existing tests, unchanged)**:
  - `lib/forms/define-form-action.ts` — already covered by `lib/forms/define-form-action.test.ts` (8 boundary cases per PRD 001).
  - `lib/forms/is-safe-next-path.ts` — already covered by `lib/forms/is-safe-next-path.test.ts` (10 cases per PRD 001).
  - `features/auth/_actions/login.action.ts` — already covered by `features/auth/_actions/login.action.test.ts` (1 wiring case).
  - `features/auth/_actions/register.action.ts` — already covered by `features/auth/_actions/register.action.test.ts`.
  - `features/auth/_schemas/{login,register}.schema.ts` — already covered.
  - Auth end-to-end — already covered by `e2e/login.e2e.test.ts` and `e2e/register.e2e.test.ts`.
- **Gates** (run in this order, all must pass at every round boundary):
  1. `bun run check` — biome lint + format + organizer. The `--write` flag is acceptable because it is the project's standard invocation; if biome rewrites a comment's wrapping, the agent inspects the diff and confirms it is whitespace-only.
  2. `bun run test` — vitest unit suite. The `bun run test:e2e` gate is not required for this refactor since no E2E behavior changes; running it is optional but recommended at the end of Round 3 to confirm the cleanup did not accidentally touch a test or a form.
- **Prior art for the rule itself** (in the codebase): the AGENTS.md section "Folder & File Conventions" already encodes the principle that "the source of truth is the code" via kebab-case + dotted role suffix + arrow + named exports. This PRD applies the same principle to comments. No new convention document is needed.

## Out of Scope

- Adding a "Comment Policy" section to AGENTS.md or any skill file. The refactor is self-documenting: the surviving comments *are* the policy.
- Adding new test files or modifying existing tests beyond deleting the four "what" test comments.
- Refactoring the JSDoc style guide (e.g. switching to TSDoc, switching to `//` line comments, adding `@example` blocks). The repo's 100%-JSDoc convention is preserved.
- Modifying biome.json to add a "no what comments" lint rule. Biome has no such rule, and adding a custom one is out of scope for a comment-only cleanup.
- Removing the `is-safe-next-path` module's standalone test file. The test file is the property test of the open-redirect defense; it stays.
- Renaming any file, moving any file, or splitting any file. The refactor is text-only.
- Touching `components/ui/*` (shadcn-owned, ignored by biome per the existing `files.includes` in biome.json).
- Touching `app/globals.css` (ignored by biome per the same includes list).
- Touching `migrations/*` (generated by drizzle-kit, never hand-edited).
- Adding a CHANGELOG entry. The refactor is invisible to users.
- Touching the OpenSpec workflow. No `openspec/changes/*` artifact is created; the cleanup does not warrant a multi-artifact change.

## Further Notes

- **The list the user gave (`TODO:`, `FIXME:`, `// biome-ignore*`) is aspirational — none of those markers exist in the repo today.** By the end of the refactor, the list of surviving comments will be: a handful of 1–3 line JSDoc blocks on security primitives, framework quirks, and load-bearing ordering, plus three test "why" comments. The user's principle ("comments are only useful when the code does not do what is expected") is applied; their specific marker list is not, because there is nothing for those markers to do.
- **The "must be last plugin" comment in `features/auth/server.ts:25` is the only inline `//` comment that survives.** This is intentional and load-bearing: reordering the line silently breaks better-auth's cookie wiring in server actions, the type system does not catch it, and the existing E2E test would still pass (the redirect just wouldn't carry the session cookie on the first try in some browsers). This is exactly the "code does not do what is expected" category the user named.
- **The split between `login.action.ts` and `login.action-state.ts` is itself a comment-worthy invariant** (Next's `"use server"` rule only allows async function exports). The condensed JSDoc on the action-state files keeps that signal alive.
- **No issue tracker is configured for this repo.** The PRD is written to `prds/002-prune-code-comments.md` matching the existing `prds/001-…` convention. The `ready-for-agent` triage label that the to-prd skill mentions has no label vocabulary in this project (no `.github/`, no `.openspec/`, no label config). If the project later wires an issue tracker, this PRD is ready to be imported verbatim with that label applied; until then, the file is the artifact.
- **The cleanup is sliced into 3 rounds with `bun run check` between each** so a single bad edit cannot cascade. The agent re-reads any file that biome reformats and confirms the change is mechanical (whitespace) before proceeding.
- **PRD 001 (defineFormAction) is the architectural precedent** for this PRD: it showed that condensing 6 orchestration files into a deep module + 2 thin configs left the repo with a few high-signal comments instead of many low-signal ones. This PRD applies the same idea to the comment layer of the same code.
