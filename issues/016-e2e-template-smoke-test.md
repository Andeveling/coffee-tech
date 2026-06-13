## Parent PRD

`prds/003-template-readiness.md`

## What to build

An E2E smoke test that proves the **end-to-end "clone and run" workflow** the whole PRD is in service of. This is the **highest seam** in PRD 003: a 10-line Playwright test that exercises the entire stack (Next dev server, proxy, env validation, register page) and proves the template is alive.

The test is added to the existing `e2e/` folder and joins the 6 existing Playwright tests. It runs as part of `bun run test:e2e` locally, and as part of the `e2e` job in the CI workflow (slice 014).

**`e2e/template-smoke.e2e.test.ts`** — three assertions, ~10 lines:

1. `await page.goto("/")` — hits the home page.
2. `await expect(page).toHaveURL(/\/login|\/register/)` — asserts the proxy redirected (because `/` is not authenticated and the home route either renders the landing or redirects to auth; for this template, `/` is in the public whitelist, so the test will land on `/` itself, not a redirect. Adjust the assertion to `await expect(page.locator("body")).toBeVisible()` if the landing page renders, OR add `/` to the public-but-redirects list. **The implementer verifies the actual behavior in dev and writes the assertion to match.**)
3. `await page.goto("/register")` — hits the register page.
4. `await expect(page.getByRole("button", { name: /crear cuenta|registr/i })).toBeVisible()` — asserts the register form's submit button is visible (proves the form factory, shadcn `field`, and auth wiring all work).

That's the whole test. The point is **not** to cover the auth flow (the existing 6 E2E tests do that) — the point is to prove that **a fresh clone + setup + dev produces a working app**, in one fast Playwright run.

The vertical seam: **after this slice, a single `bun run test:e2e` invocation proves the template boots, the proxy works, the register page renders, and the form factory wires to a real action**. This is the test that gets added to the CI workflow (slice 014) as the last gate before `v0.2.0-template-ready` can be cut.

## Acceptance criteria

- [ ] `e2e/template-smoke.e2e.test.ts` exists at the path `e2e/template-smoke.e2e.test.ts` (matches the existing `*.e2e.test.ts` glob in `playwright.config.ts`).
- [ ] Test imports `{ expect, test }` from `@playwright/test` (same pattern as the existing 6 tests).
- [ ] Test does NOT register a user or interact with auth (those are covered by the existing tests; this test only proves the template boots).
- [ ] Test hits `/` and asserts the page renders (no 500, no crash).
- [ ] Test hits `/register` and asserts the register form's submit button is visible.
- [ ] Test does not depend on the dev server being seeded with a user.
- [ ] Test runs in under 5 seconds (fast — it is a smoke, not a flow).
- [ ] `bun run test:e2e` passes — all 7 tests (6 existing + 1 new) green.
- [ ] `bun run check` passes.
- [ ] `bun run test` passes (the new file is `*.e2e.test.ts`, not picked up by vitest — verify with `rg "test" e2e/template-smoke.e2e.test.ts` that vitest ignores it).
- [ ] Manual verification: in a clean checkout, `bun run setup` → `bun run dev` → `bun run test:e2e e2e/template-smoke.e2e.test.ts` → green. Document in the issue's "Verification" comment.

## Blocked by

- Blocked by `issues/010-setup-scaffold-vertical-slice.md` (the setup script must exist and produce a working repo for the smoke test to be meaningful).
- Blocked by `issues/013-package-json-rename-and-scripts.md` (the `package.json` `setup` script entry must be wired so `bun run setup` actually invokes `scripts/setup.ts`).
- Blocked by `issues/014-ci-workflow.md` (the CI workflow runs this test on every push to `main`; without the workflow, the test runs only locally and is not protected from regressions).

## User stories addressed

- User story 32 (each slice is independently verifiable — this one is the integration test that proves all upstream slices compose)
- User story 34 (the `v0.2.0-template-ready` tag is cut after this test is green in CI)
- Implicit coverage of user stories 3, 8, 19, 25, 26 (the smoke test is the end-to-end proof that the README, the env file, the setup script, and the CI workflow all work together)
