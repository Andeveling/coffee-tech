import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(__dirname, "../..");

const readDirNames = (relPath: string): string[] => {
	const abs = resolve(repoRoot, relPath);
	if (!existsSync(abs)) return [];
	return readdirSync(abs)
		.filter((name) => !name.startsWith("."))
		.sort();
};

const readText = (relPath: string): string => {
	const abs = resolve(repoRoot, relPath);
	if (!existsSync(abs)) {
		throw new Error(`Required file missing: ${relPath}`);
	}
	return readFileSync(abs, "utf8");
};

describe("prds/000-index.md coverage", () => {
	const index = readText("prds/000-index.md");
	const prdFiles = readDirNames("prds").filter(
		(n) => n.endsWith(".md") && n !== "000-index.md",
	);
	const issueFiles = readDirNames("issues").filter((n) => n.endsWith(".md"));

	test("index references every PRD file", () => {
		for (const prd of prdFiles) {
			expect(index).toContain(prd);
		}
	});

	test("index references every issue file", () => {
		for (const issue of issueFiles) {
			expect(index).toContain(issue);
		}
	});

	test("index exists and is non-empty", () => {
		expect(index.length).toBeGreaterThan(100);
	});
});
