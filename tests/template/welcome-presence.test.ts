import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(__dirname, "../..");

describe("WELCOME.md", () => {
	const welcomePath = resolve(repoRoot, "WELCOME.md");

	test("exists at repo root", () => {
		expect(existsSync(welcomePath)).toBe(true);
	});

	test("is a short orientation (≤ 50 lines)", () => {
		const content = readFileSync(welcomePath, "utf8");
		const lineCount = content.split("\n").length;
		expect(lineCount).toBeLessThanOrEqual(50);
	});

	test("mentions bun run setup", () => {
		const content = readFileSync(welcomePath, "utf8");
		expect(content).toContain("bun run setup");
	});

	test("mentions bun run dev", () => {
		const content = readFileSync(welcomePath, "utf8");
		expect(content).toContain("bun run dev");
	});

	test("uses the word boilerplate or starter", () => {
		const content = readFileSync(welcomePath, "utf8");
		expect(content.toLowerCase()).toMatch(/boilerplate|starter/);
	});
});
