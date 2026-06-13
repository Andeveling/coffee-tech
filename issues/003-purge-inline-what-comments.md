## Parent PRD

`prds/002-prune-code-comments.md`

## What to build

Delete inline "what" comments from non-test files. Each restates line below. One "why" inline stays (`features/auth/server.ts:25`).

### DELETE these inline comments exactly

| File:Line | Comment text |
|---|---|
| `features/auth/_actions/login.action.ts:16` | `// schema shape already matches the call input` |
| `features/auth/_actions/register.action.ts:20` | `// Strip the client-only confirmPassword before hitting the API.` |
| `proxy.ts:33` | `// 1. Logged-in users hitting the auth UI get bounced to /dashboard.` |
| `proxy.ts:40` | `// 2. Unauthenticated users hitting a private path get bounced to /login.` |

### KEEP these inline comments exactly

| File:Line | Comment text | Why |
|---|---|---|
| `features/auth/server.ts:25` | `// must be the last plugin — wires set-cookie into next/headers for server actions` | Reorder breaks better-auth cookies silently; type system can't catch |
| `lib/forms/define-form-action.ts:154-158` | `// Pre-fill missing keys with "" so the schema's own messages surface...` | **Out of this slice** — Round 2 territory, lives in `007-condense-define-form-action-why-jsdocs.md` |

## Acceptance criteria

- [ ] `login.action.ts:16` comment deleted; line above kept verbatim
- [ ] `register.action.ts:20` comment deleted; destructuring line kept verbatim
- [ ] `proxy.ts:33` comment deleted; `if (isLoggedIn && isAuthUiPath(pathname))` stays
- [ ] `proxy.ts:40` comment deleted; `if (!isLoggedIn && !isPublicPath(pathname))` stays
- [ ] `features/auth/server.ts:25` comment **untouched** (load-bearing)
- [ ] `lib/forms/define-form-action.ts:154-158` block **untouched** (Round 2 slice owns it)
- [ ] `bun run check` green
- [ ] `bun run test` green
- [ ] `rg "^\s*//" features/auth/_actions/login.action.ts features/auth/_actions/register.action.ts proxy.ts` returns 0 matches in the touched files (only the protected comment in `proxy.ts` body, if any survives)

## Blocked by

None — can start immediately.

Note: `002-purge-file-purpose-headers.md` touches `proxy.ts:4-8`. This slice touches `proxy.ts:33` and `proxy.ts:40`. No line overlap; can run in parallel with 002 only if last agent re-reads file before/after to confirm no other edits crept in. Sequential is safer.

## User stories addressed

- User story 2 (no paraphrase of next line)
- User story 13 (`proxy.ts` numbered `// 1.` `// 2.`)
- User story 14 (`login.action.ts` identity fn comment)
- User story 15 (`register.action.ts` destructure comment)
- User story 17 (KEEP `server.ts:25` — load-bearing plugin order)
