// No-op stub for the `server-only` package. The real module throws when
// imported from a client bundle — but vitest runs in plain Node, so we
// short-circuit the import to keep server-only-tagged modules unit-testable.
export {};
