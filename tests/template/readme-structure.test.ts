import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(__dirname, "../..");

const readReadme = (): string => {
	const abs = resolve(repoRoot, "README.md");
	if (!existsSync(abs)) {
		throw new Error("README.md missing at repo root");
	}
	return readFileSync(abs, "utf8");
};

describe("README structure", () => {
	const readme = readReadme();

	test("contains the 5 required headings", () => {
		const required = [
			"## What you get",
			"## Quick start",
			"## Architecture",
			"## Replace me",
			"## License",
		];
		for (const heading of required) {
			expect(readme).toContain(heading);
		}
	});

	test("does not contain the stock create-next-app text", () => {
		expect(readme).not.toContain("create-next-app");
		expect(readme).not.toContain("Geist");
	});

	test("Quick start does not contain npm/yarn/pnpm", () => {
		const quickStartMatch = readme.match(/## Quick start([\s\S]*?)(?=\n## )/);
		expect(quickStartMatch).not.toBeNull();
		const quickStart = quickStartMatch?.[1] ?? "";
		expect(quickStart).not.toMatch(/npm run/);
		expect(quickStart).not.toMatch(/yarn (?!.*Replace me)/);
	});

	test("Quick start mentions `bun run setup`", () => {
		expect(readme).toMatch(/bun run setup/);
	});

	test("README links to LICENSE", () => {
		expect(readme).toMatch(/\[.*\]\(\.\/LICENSE\)|MIT/);
	});
});
