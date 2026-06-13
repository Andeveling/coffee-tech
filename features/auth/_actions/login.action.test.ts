import { APIError } from "better-auth/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mock fixtures — `vi.mock` factories are hoisted above all imports,
// so the variables they reference must also be hoisted via vi.hoisted.
const mocks = vi.hoisted(() => ({
	signInEmail: vi.fn(),
	headers: vi.fn(() => Promise.resolve(new Headers())),
	redirect: vi.fn((url: string) => {
		throw new Error(`NEXT_REDIRECT:${url}`);
	}),
}));

vi.mock("@/features/auth/server", () => ({
	auth: {
		api: {
			signInEmail: mocks.signInEmail,
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
	LOGIN_INITIAL_STATE,
	loginAction,
} from "@/features/auth/_actions/login.action";
import { auth } from "@/features/auth/server";

const asFormData = (record: Record<string, string>): FormData => {
	const fd = new FormData();
	for (const [k, v] of Object.entries(record)) fd.append(k, v);
	return fd;
};

const email = (local: string): string => `${local}@example.test`;

describe("loginAction", () => {
	beforeEach(() => {
		mocks.signInEmail.mockReset();
		mocks.redirect.mockClear();
	});

	afterEach(() => {
		mocks.signInEmail.mockReset();
		mocks.redirect.mockClear();
	});

	it("returns the idle initial state by default", () => {
		expect(LOGIN_INITIAL_STATE).toEqual({ status: "idle" });
	});

	it("returns a field error state when the payload fails schema validation", async () => {
		const state = await loginAction(LOGIN_INITIAL_STATE, asFormData({}));
		expect(state.status).toBe("error");
		if (state.status === "error") {
			expect(state.formError).toBeNull();
			expect(Object.keys(state.fieldErrors).length).toBeGreaterThan(0);
		}
	});

	it("returns a generic formError when auth.api.signInEmail throws an APIError", async () => {
		mocks.signInEmail.mockRejectedValueOnce(
			new APIError("UNAUTHORIZED", {
				code: "INVALID_EMAIL_OR_PASSWORD",
				message: "bad creds",
			}),
		);
		const state = await loginAction(
			LOGIN_INITIAL_STATE,
			asFormData({ email: email("ada"), password: "wrong" }),
		);
		expect(state).toEqual({
			status: "error",
			fieldErrors: {},
			formError: "Email o contraseña incorrectos",
		});
	});

	it("redirects to /dashboard on successful sign-in", async () => {
		mocks.signInEmail.mockResolvedValueOnce({} as never);
		await expect(
			loginAction(
				LOGIN_INITIAL_STATE,
				asFormData({ email: email("ada"), password: "right" }),
			),
		).rejects.toThrow(/NEXT_REDIRECT:\/dashboard/);
		expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
	});

	it("rethrows unexpected errors so Next can render the error boundary", async () => {
		const boom = new Error("db is down");
		mocks.signInEmail.mockRejectedValueOnce(boom);
		await expect(
			loginAction(
				LOGIN_INITIAL_STATE,
				asFormData({ email: email("ada"), password: "right" }),
			),
		).rejects.toBe(boom);
	});

	// Keep a reference to the imported `auth` so the mock stays linked.
	void auth;
});
