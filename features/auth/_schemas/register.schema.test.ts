import { describe, expect, it } from "vitest";

import {
	type RegisterInput,
	registerSchema,
} from "@/features/auth/_schemas/register.schema";

const email = (local: string): string => `${local}@example.test`;

describe("registerSchema", () => {
	const valid = {
		name: "Ada",
		email: email("ada"),
		password: "supersecret",
		confirmPassword: "supersecret",
	};

	it("accepts matching passwords", () => {
		const parsed = registerSchema.safeParse(valid);
		expect(parsed.success).toBe(true);
	});

	it("rejects when password and confirmPassword differ", () => {
		const parsed = registerSchema.safeParse({
			...valid,
			confirmPassword: "different",
		});
		expect(parsed.success).toBe(false);
		if (!parsed.success) {
			expect(
				parsed.error.issues.some((i) => i.path[0] === "confirmPassword"),
			).toBe(true);
		}
	});

	it("rejects a password shorter than 8 chars", () => {
		const parsed = registerSchema.safeParse({
			...valid,
			password: "short",
			confirmPassword: "short",
		});
		expect(parsed.success).toBe(false);
	});

	it("rejects an empty name", () => {
		const parsed = registerSchema.safeParse({ ...valid, name: "" });
		expect(parsed.success).toBe(false);
	});

	it("rejects an empty confirmPassword", () => {
		const parsed = registerSchema.safeParse({
			...valid,
			confirmPassword: "",
		});
		expect(parsed.success).toBe(false);
	});

	it("infers the RegisterInput type from the schema", () => {
		const sample: RegisterInput = { ...valid };
		expect(sample).toBeDefined();
	});
});
