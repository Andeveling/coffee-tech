import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(__dirname, "../..");

const readText = (relPath: string): string => {
	const abs = resolve(repoRoot, relPath);
	if (!existsSync(abs)) {
		throw new Error(`Required file missing: ${relPath}`);
	}
	return readFileSync(abs, "utf8");
};

/**
 * Extract the keys of a `z.object({...})` literal in a TypeScript source file
 * by matching `KEY:` inside the outermost `z.object({...})` block. This is a
 * best-effort regex, not a real parser — the schemas are stable and small.
 */
const extractZodKeys = (source: string): string[] => {
	const start = source.indexOf("z.object({");
	if (start === -1) return [];
	const open = source.indexOf("{", start);
	let depth = 1;
	let i = open + 1;
	while (i < source.length && depth > 0) {
		const ch = source[i];
		if (ch === "{") depth++;
		else if (ch === "}") depth--;
		i++;
	}
	const body = source.slice(open + 1, i - 1);
	const keys = new Set<string>();
	const keyRegex = /^\s*([A-Z][A-Z0-9_]*)\s*:/gm;
	let m: RegExpExecArray | null = keyRegex.exec(body);
	while (m !== null) {
		keys.add(m[1]);
		m = keyRegex.exec(body);
	}
	return [...keys].sort();
};

describe("env example contract", () => {
	const envExample = readText(".env.example");
	const serverEnvSource = readText("lib/env.ts");
	const publicEnvSource = readText("lib/public-env.ts");

	const serverKeys = extractZodKeys(serverEnvSource);
	const publicKeys = extractZodKeys(publicEnvSource);
	const allSchemaKeys = new Set([...serverKeys, ...publicKeys]);

	test(".env.example exists at repo root", () => {
		expect(existsSync(resolve(repoRoot, ".env.example"))).toBe(true);
	});

	test("zod schemas are parsed", () => {
		expect(serverKeys).toContain("DATABASE_URL");
		expect(serverKeys).toContain("BETTER_AUTH_SECRET");
		expect(serverKeys).toContain("BETTER_AUTH_URL");
		expect(publicKeys).toContain("NEXT_PUBLIC_APP_URL");
	});

	test("every key in lib/env.ts and lib/public-env.ts appears in .env.example", () => {
		const exampleKeys = new Set<string>();
		for (const line of envExample.split("\n")) {
			const m = line.match(/^([A-Z][A-Z0-9_]*)=/);
			if (m) exampleKeys.add(m[1]);
		}
		for (const schemaKey of allSchemaKeys) {
			expect(exampleKeys.has(schemaKey)).toBe(true);
		}
	});

	test("every key in .env.example is declared in lib/env.ts or lib/public-env.ts", () => {
		const exampleKeys: string[] = [];
		for (const line of envExample.split("\n")) {
			const m = line.match(/^([A-Z][A-Z0-9_]*)=/);
			if (m) exampleKeys.push(m[1]);
		}
		for (const key of exampleKeys) {
			expect(allSchemaKeys.has(key)).toBe(true);
		}
	});

	test("every key in .env.example has a non-empty comment line above it", () => {
		const lines = envExample.split("\n");
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const keyMatch = line.match(/^([A-Z][A-Z0-9_]*)=/);
			if (!keyMatch) continue;
			let j = i - 1;
			while (j >= 0 && lines[j].trim() === "") j--;
			const commentLine = j >= 0 ? lines[j].trim() : "";
			expect(commentLine.startsWith("#")).toBe(true);
			expect(commentLine.length).toBeGreaterThan(1);
		}
	});

	test("BETTER_AUTH_SECRET is a placeholder, not a real secret", () => {
		expect(envExample).toMatch(/BETTER_AUTH_SECRET=replace-me/);
		expect(envExample).toMatch(/openssl rand -base64 32/);
	});
});
