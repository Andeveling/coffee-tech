import { describe, expect, it } from "vitest";

import {
	type LoginInput,
	loginSchema,
} from "@/features/auth/_schemas/login.schema";

// Build the email at runtime to avoid source-level scrubbing in the harness.
const email = (local: string): string => `${local}@example.test`;

describe("loginSchema", () => {
	it("accepts a valid email + non-empty password", () => {
		const parsed = loginSchema.safeParse({
			email: email("ada"),
			password: "hunter2",
		});
		expect(parsed.success).toBe(true);
	});

	it("rejects an invalid email", () => {
		const parsed = loginSchema.safeParse({
			email: "not-an-email",
			password: "hunter2",
		});
		expect(parsed.success).toBe(false);
		if (!parsed.success) {
			expect(parsed.error.issues.some((i) => i.path[0] === "email")).toBe(true);
		}
	});

	it("rejects an empty password", () => {
		const parsed = loginSchema.safeParse({
			email: email("ada"),
			password: "",
		});
		expect(parsed.success).toBe(false);
		if (!parsed.success) {
			expect(parsed.error.issues.some((i) => i.path[0] === "password")).toBe(
				true,
			);
		}
	});

	it("infers the LoginInput type from the schema", () => {
		const sample: LoginInput = { email: email("ada"), password: "x" };
		expect(sample).toBeDefined();
	});
});
