import { APIError } from "better-auth/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	signUpEmail: vi.fn(),
	headers: vi.fn(() => Promise.resolve(new Headers())),
	redirect: vi.fn((url: string) => {
		throw new Error(`NEXT_REDIRECT:${url}`);
	}),
}));

vi.mock("@/features/auth/server", () => ({
	auth: {
		api: {
			signUpEmail: mocks.signUpEmail,
		},
	},
}));

vi.mock("next/headers", () => ({
	headers: mocks.headers,
}));

vi.mock("next/navigation", () => ({
	redirect: mocks.redirect,
}));

import {
	REGISTER_INITIAL_STATE,
	registerAction,
} from "@/features/auth/_actions/register.action";
import { auth } from "@/features/auth/server";

const asFormData = (record: Record<string, string>): FormData => {
	const fd = new FormData();
	for (const [k, v] of Object.entries(record)) fd.append(k, v);
	return fd;
};

const email = (local: string): string => `${local}@example.test`;

const valid = {
	name: "Ada",
	email: email("ada"),
	password: "supersecret",
	confirmPassword: "supersecret",
};

describe("registerAction", () => {
	beforeEach(() => {
		mocks.signUpEmail.mockReset();
		mocks.redirect.mockClear();
	});

	afterEach(() => {
		mocks.signUpEmail.mockReset();
		mocks.redirect.mockClear();
	});

	it("returns the idle initial state by default", () => {
		expect(REGISTER_INITIAL_STATE).toEqual({ status: "idle" });
	});

	it("returns field errors when the payload fails schema validation", async () => {
		const state = await registerAction(
			REGISTER_INITIAL_STATE,
			asFormData({ email: "x", password: "y", confirmPassword: "z", name: "" }),
		);
		expect(state.status).toBe("error");
		if (state.status === "error") {
			expect(state.formError).toBeNull();
		}
	});

	it("returns a field-level email error when USER_ALREADY_EXISTS", async () => {
		mocks.signUpEmail.mockRejectedValueOnce(
			new APIError("CONFLICT", { code: "USER_ALREADY_EXISTS", message: "dup" }),
		);
		const state = await registerAction(
			REGISTER_INITIAL_STATE,
			asFormData(valid),
		);
		expect(state).toEqual({
			status: "error",
			fieldErrors: { email: "Este email ya está registrado" },
			formError: null,
		});
	});

	it("returns the APIError message in formError for other auth failures", async () => {
		mocks.signUpEmail.mockRejectedValueOnce(
			new APIError("BAD_REQUEST", {
				code: "SOMETHING_ELSE",
				message: "rate-limited",
			}),
		);
		const state = await registerAction(
			REGISTER_INITIAL_STATE,
			asFormData(valid),
		);
		expect(state.status).toBe("error");
		if (state.status === "error") {
			expect(state.fieldErrors).toEqual({});
			expect(state.formError).toBe("rate-limited");
		}
	});

	it("redirects to /dashboard on successful sign-up", async () => {
		mocks.signUpEmail.mockResolvedValueOnce({} as never);
		await expect(
			registerAction(REGISTER_INITIAL_STATE, asFormData(valid)),
		).rejects.toThrow(/NEXT_REDIRECT:\/dashboard/);
		expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
	});

	it("rethrows unexpected errors so Next can render the error boundary", async () => {
		const boom = new Error("db is down");
		mocks.signUpEmail.mockRejectedValueOnce(boom);
		await expect(
			registerAction(REGISTER_INITIAL_STATE, asFormData(valid)),
		).rejects.toBe(boom);
	});

	void auth;
});
