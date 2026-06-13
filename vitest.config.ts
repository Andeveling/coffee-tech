import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		include: ["**/*.test.ts", "**/*.test.tsx"],
		exclude: ["node_modules", ".next", "dist", "**/*.e2e.test.ts"],
		setupFiles: ["./vitest.setup.ts"],
	},
	resolve: {
		alias: {
			"@": new URL("./", import.meta.url).pathname.replace(/\/$/, ""),
			// `server-only` is a sentinel for the Next bundler — in vitest
			// (Node) it is not installed; treat the import as a no-op so we
			// can unit-test modules that import it.
			"server-only": fileURLToPath(
				new URL("./test/server-only-stub.ts", import.meta.url),
			),
		},
	},
});
