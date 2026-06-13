## Parent PRD

`prds/003-template-readiness.md`

## What to build

Add an MIT `LICENSE` file at the repo root. Single-file deliverable, no production-code touch, no test needed for the license text itself.

The MIT license text is the standard 18-line version with:
- Copyright line: `Copyright (c) 2026 Andeveling` (or whatever year + name — the implementer confirms with the maintainer before committing).
- Permission notice (use, copy, modify, merge, publish, distribute, sublicense, sell).
- "AS IS" warranty disclaimer.

The file is plain text, no Markdown formatting. Filename is `LICENSE` (uppercase, no extension — GitHub convention).

The vertical seam: **after this slice, a stranger can legally use the code**. This is the smallest possible slice, but it is a hard blocker for adoption (no license = "all rights reserved" by default in most jurisdictions).

The README's "License" line (slice 012) will link to this file. The `CODEOWNERS` (slice 015) will require maintainer review on this file.

## Acceptance criteria

- [ ] `LICENSE` file exists at repo root.
- [ ] File content is the standard MIT license text.
- [ ] First line contains `Copyright (c) <year> <owner>` with the correct year and owner name (implementer confirms with maintainer before commit).
- [ ] File contains the string `MIT` (or `Permission is hereby granted, free of charge` — the standard MIT preamble).
- [ ] `bun run check` passes.
- [ ] `bun run test` passes (no test added for this slice — license text is a static artifact).
- [ ] `git log` shows the commit; the file is tracked.

## Blocked by

None — can start immediately. Independent of slice 010 (different file).

## User stories addressed

- User story 1 (LICENSE file at repo root, legal permission to use)
- User story 2 (MIT license, industry standard)
