import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config. Tests live under `e2e/` and are excluded from the
 * Vitest suite (see `vitest.config.ts` `exclude`) — the `.e2e.test.ts`
 * suffix makes the boundary greppable.
 *
 * Run with: `bun run test:e2e` (boots the dev server automatically).
 */
export default defineConfig({
	testDir: "./e2e",
	testMatch: /.*\.e2e\.test\.ts$/,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command: "bun run dev",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
	},
});
