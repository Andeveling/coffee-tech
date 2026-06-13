// Vitest setup file — runs before every test file.
// Used to reset module state and mock side-effectful modules (env validation,
// server-only imports) without polluting individual test bodies.

// Ensure env validation has the values it needs at module-load time when any
// test imports `lib/env.ts` or `lib/public-env.ts`. These are *test* values
// only — real values come from `.env` at runtime.
const requiredEnv: Record<string, string> = {
	DATABASE_URL: "file:./local.db",
	BETTER_AUTH_SECRET: "test-secret-must-be-at-least-32-chars-long-x",
	BETTER_AUTH_URL: "http://localhost:3000",
	NODE_ENV: "test",
	NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};

for (const [key, value] of Object.entries(requiredEnv)) {
	if (process.env[key] === undefined) {
		process.env[key] = value;
	}
}
