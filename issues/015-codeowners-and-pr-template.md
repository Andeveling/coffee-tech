## Parent PRD

`prds/003-template-readiness.md`

## What to build

Two small governance files that ship together because both touch `.github/` and both define "what a good PR looks like":

1. **`.github/CODEOWNERS`** — assigns `@Andeveling` (the repo owner) as the required reviewer for the load-bearing parts of the codebase. The file uses GitHub's CODEOWNERS syntax. Two wildcard blocks:
   - `/AGENTS.md` `/prds/**` `/issues/**` `@Andeveling` — architectural docs.
   - `/proxy.ts` `/lib/env.ts` `/lib/public-env.ts` `/lib/forms/**` `/db/**` `@Andeveling` — security and persistence surface.
   - Default `*` `@Andeveling` — any other change still gets a maintainer review (this is a template, not a public fork; single-owner is fine).

2. **`.github/pull_request_template.md`** — a Markdown template GitHub auto-fills in the PR body. Sections:
   - `## What` (1-3 sentences).
   - `## Why` (1-2 sentences, link to the PRD or issue).
   - `## Acceptance criteria` (checkbox list).
   - `## Tests run` (`bun run check` / `bun run test` / `bun run test:e2e` — implementer checks what they ran).
   - `## AGENTS.md / prds/ updated?` (yes/no, with a "if you touched a convention, update AGENTS.md" reminder).
   - `## Related: prds/NNN-…, issues/NNN-…` (cross-references to the spec and slice).

The vertical seam: **after this slice, every PR gets a structured description, and the maintainer is auto-requested as a reviewer on the load-bearing files**. The CODEOWNERS file is the authority gate; the PR template is the traceability gate. Together they turn "drive-by contribution" into "structured change".

## Acceptance criteria

- [ ] `.github/CODEOWNERS` exists at the exact path `.github/CODEOWNERS` (no extension, no folder).
- [ ] `CODEOWNERS` contains the line `* @Andeveling` (default owner).
- [ ] `CODEOWNERS` contains the architectural-docs wildcard block (AGENTS.md, prds/, issues/).
- [ ] `CODEOWNERS` contains the security/persistence wildcard block (proxy.ts, lib/env.ts, lib/public-env.ts, lib/forms/, db/).
- [ ] `.github/pull_request_template.md` exists.
- [ ] PR template contains the 6 required section headings: `## What`, `## Why`, `## Acceptance criteria`, `## Tests run`, `## AGENTS.md / prds/ updated?`, `## Related`.
- [ ] PR template mentions `bun run check`, `bun run test`, `bun run test:e2e` in the "Tests run" section (any order).
- [ ] `bun run check` passes (biome does not lint `.github/*`).
- [ ] `bun run test` passes (no new test from this slice — the files are static artifacts verified visually + on first PR).

## Blocked by

None — can start immediately. Both files are independent of slices 010-014 (different folder, no functional dependency).

## User stories addressed

- User story 29 (CODEOWNERS assigns maintainer to load-bearing files)
- User story 30 (PR template with standard checklist)
- User story 31 (PR template references PRD and issue filenames)
