#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
/**
 * First-run scaffold for the template. Idempotent: safe to re-run after
 * pulling new commits or after a partial setup. Exits 1 on any failure
 * with a numbered list of what broke.
 *
 * Steps (in order):
 *   1. Verify bun is installed.
 *   2. bun install (skip if node_modules + bun.lock both present).
 *   3. Copy .env.example → .env if .env is missing.
 *   4. Regenerate BETTER_AUTH_SECRET if it is still the placeholder.
 *   5. Run bun run db:push to materialise the schema.
 *   6. Run bun run check to confirm biome is clean.
 *   7. Print success summary.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const PLACEHOLDER_SECRET = "replace-me-with-openssl-rand-base64-32";
const failures: string[] = [];

const log = (msg: string): void => {
	process.stdout.write(`${msg}\n`);
};

const fail = (step: number, msg: string): never => {
	log(`✗ Step ${step} failed: ${msg}`);
	if (failures.length > 0) {
		log("");
		log("Failure summary:");
		for (const f of failures) log(`  - ${f}`);
	}
	process.exit(1);
};

const run = (
	cmd: string,
	args: string[],
	cwd: string,
	step: number,
	label: string,
): void => {
	log(`→ ${label} (${cmd} ${args.join(" ")})`);
	const result = spawnSync(cmd, args, {
		cwd,
		stdio: "inherit",
		env: process.env,
	});
	if (result.status !== 0) {
		failures.push(`${label} (exit ${result.status ?? "unknown"})`);
		fail(step, `${label} exited with non-zero status`);
	}
};

const main = (): void => {
	const cwd = process.cwd();

	// Step 1: verify bun
	log("[1/7] Verifying bun is installed...");
	const bunCheck = spawnSync("bun", ["--version"], { stdio: "pipe" });
	if (bunCheck.status !== 0) {
		fail(
			1,
			"bun is not installed or not on PATH. Install it from https://bun.sh",
		);
	}
	log(`  bun ${bunCheck.stdout.toString().trim()}`);

	// Step 2: bun install (skip if already done)
	log("[2/7] Installing dependencies...");
	const hasNodeModules = existsSync(`${cwd}/node_modules`);
	const hasLock =
		existsSync(`${cwd}/bun.lock`) || existsSync(`${cwd}/bun.lockb`);
	if (hasNodeModules && hasLock) {
		log("  Skipping: node_modules + bun.lock present");
	} else {
		run("bun", ["install"], cwd, 2, "bun install");
	}

	// Step 3: copy .env.example → .env
	log("[3/7] Setting up .env...");
	const envExamplePath = `${cwd}/.env.example`;
	const envPath = `${cwd}/.env`;
	if (!existsSync(envExamplePath)) {
		fail(3, ".env.example not found at repo root");
	}
	if (existsSync(envPath)) {
		log("  Skipping: .env already exists");
	} else {
		const example = readFileSync(envExamplePath, "utf8");
		writeFileSync(envPath, example);
		log("  Copied .env.example → .env");
	}

	// Step 4: regenerate placeholder secret
	log("[4/7] Checking BETTER_AUTH_SECRET...");
	const envContent = readFileSync(envPath, "utf8");
	const secretRegex = /^BETTER_AUTH_SECRET=(.*)$/m;
	const match = envContent.match(secretRegex);
	if (!match) {
		fail(4, "BETTER_AUTH_SECRET not found in .env");
	}
	const currentSecret = match[1].trim();
	if (currentSecret === PLACEHOLDER_SECRET) {
		const newSecret = randomBytes(32).toString("base64");
		const updated = envContent.replace(
			secretRegex,
			`BETTER_AUTH_SECRET=${newSecret}`,
		);
		writeFileSync(envPath, updated);
		log("  Generated new BETTER_AUTH_SECRET (32-byte base64)");
	} else if (currentSecret.length < 32) {
		failures.push(
			`BETTER_AUTH_SECRET is ${currentSecret.length} chars; lib/env.ts requires ≥32`,
		);
		fail(
			4,
			"BETTER_AUTH_SECRET too short — generate a fresh one with: openssl rand -base64 32",
		);
	} else {
		log("  Skipping: BETTER_AUTH_SECRET looks valid");
	}

	// Step 5: db:push
	log("[5/7] Pushing database schema...");
	run("bun", ["run", "db:push"], cwd, 5, "db:push");

	// Step 6: biome check
	log("[6/7] Running biome check...");
	run("bun", ["run", "check"], cwd, 6, "biome check");

	// Step 7: success
	log("");
	log("✓ Setup complete. Next: bun run dev");
};

main();
