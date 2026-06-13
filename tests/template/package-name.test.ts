import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(__dirname, "../..");

const readPackageJson = (): { name: string; version: string } => {
	const abs = resolve(repoRoot, "package.json");
	if (!existsSync(abs)) {
		throw new Error("package.json missing at repo root");
	}
	const raw = readFileSync(abs, "utf8");
	return JSON.parse(raw) as { name: string; version: string };
};

describe("package.json template identity", () => {
	const pkg = readPackageJson();

	test("name is not the product origin (coffee-tech)", () => {
		expect(pkg.name).not.toBe("coffee-tech");
	});

	test("name follows the template convention (kebab-case, generic)", () => {
		expect(pkg.name).toMatch(/^[a-z][a-z0-9-]+$/);
	});

	test("version is 0.2.0 (template-ready milestone)", () => {
		expect(pkg.version).toBe("0.2.0");
	});
});
