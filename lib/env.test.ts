import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type * as EnvMod from "@/lib/env";
import type * as PublicEnvMod from "@/lib/public-env";

const ORIGINAL_ENV = { ...process.env };

const reloadEnv = async (): Promise<{
	envMod: typeof EnvMod;
	publicEnvMod: typeof PublicEnvMod;
}> => {
	vi.resetModules();
	const envMod = await import("@/lib/env");
	const publicEnvMod = await import("@/lib/public-env");
	return { envMod, publicEnvMod };
};

const resetEnv = () => {
	for (const key of Object.keys(process.env)) {
		if (!(key in ORIGINAL_ENV)) {
			delete process.env[key];
		}
	}
	for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
		if (value !== undefined) process.env[key] = value;
	}
};

describe("env schema", () => {
	beforeAll(() => {
		process.env.DATABASE_URL = "file:./local.db";
		process.env.BETTER_AUTH_SECRET =
			"test-secret-must-be-at-least-32-chars-long-x";
		process.env.BETTER_AUTH_URL = "http://localhost:3000";
		process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
	});

	afterAll(() => {
		resetEnv();
	});

	it("exports frozen env and publicEnv with the expected keys", async () => {
		const { envMod, publicEnvMod } = await reloadEnv();
		expect(Object.isFrozen(envMod.env)).toBe(true);
		expect(Object.isFrozen(publicEnvMod.publicEnv)).toBe(true);
		expect(envMod.env.DATABASE_URL).toBe("file:./local.db");
		expect(publicEnvMod.publicEnv.NEXT_PUBLIC_APP_URL).toBe(
			"http://localhost:3000",
		);
	});

	it("rejects DATABASE_URL with a non-file scheme", async () => {
		const original = process.env.DATABASE_URL;
		process.env.DATABASE_URL = "postgres://example";
		await expect(reloadEnv()).rejects.toThrow(/DATABASE_URL/);
		process.env.DATABASE_URL = original;
	});

	it("rejects a too-short BETTER_AUTH_SECRET", async () => {
		const original = process.env.BETTER_AUTH_SECRET;
		process.env.BETTER_AUTH_SECRET = "short";
		await expect(reloadEnv()).rejects.toThrow(/BETTER_AUTH_SECRET/);
		process.env.BETTER_AUTH_SECRET = original;
	});

	it("rejects an invalid BETTER_AUTH_URL", async () => {
		const original = process.env.BETTER_AUTH_URL;
		process.env.BETTER_AUTH_URL = "not-a-url";
		await expect(reloadEnv()).rejects.toThrow(/BETTER_AUTH_URL/);
		process.env.BETTER_AUTH_URL = original;
	});

	it("rejects an invalid NEXT_PUBLIC_APP_URL", async () => {
		const original = process.env.NEXT_PUBLIC_APP_URL;
		process.env.NEXT_PUBLIC_APP_URL = "not-a-url";
		await expect(reloadEnv()).rejects.toThrow(/NEXT_PUBLIC_APP_URL/);
		process.env.NEXT_PUBLIC_APP_URL = original;
	});
});
