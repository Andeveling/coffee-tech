## Parent PRD

`prds/002-prune-code-comments.md`

## What to build

Replace 8-line JSDoc at `proxy.ts:57-64` (above `matcher` array) with 2-line JSDoc. Preserve the load-bearing exclusion: `api/auth/*` must not run through proxy.

### Exact replacement

DELETE lines 57-64 (current JSDoc):

```ts
/**
 * Matcher excludes:
 *   - _next/static, _next/image (static assets)
 *   - favicon.ico, *.svg, *.png, *.jpg, *.jpeg, *.webp, *.ico (public files)
 *   - api/auth/* (better-auth handler — must run server-side without proxy)
 *
 * Everything else passes through the proxy.
 */
```

INSERT (2 lines):

```ts
/**
 * Excludes static assets, public files, and `api/auth/*`. The `api/auth`
 * exclusion is load-bearing: better-auth's handler must not run through the proxy.
 */
```

### Note: file header at lines 4-8

`proxy.ts:4-8` file-purpose header is owned by **slice 002** (`002-purge-file-purpose-headers.md`). This slice (008) only touches the matcher JSDoc. If running in parallel, agent must read full file state first to confirm line numbers haven't shifted.

## Acceptance criteria

- [ ] Old 8-line matcher JSDoc deleted
- [ ] New 2-line matcher JSDoc present
- [ ] `matcher` regex array (line 66) unchanged
- [ ] `proxy.ts:4-8` file header **untouched** (slice 002 owns)
- [ ] `proxy.ts:33`, `:40` numbered comments **untouched** (slice 003 owns)
- [ ] E2E tests in `e2e/login.e2e.test.ts` still green (auth redirect flow depends on matcher)
- [ ] `bun run check` green
- [ ] `bun run test` green
- [ ] `bun run test:e2e` green (optional, recommended — auth boundary test verifies matcher behavior end-to-end)

## Blocked by

None logically, but **operationally serialize** with 002 (file header) and 003 (body comments) — all touch `proxy.ts`. Order: 002 → 003 → 008.

## User stories addressed

- User story 12 (matcher JSDoc compresses to 1-2 lines naming load-bearing exclusion)
