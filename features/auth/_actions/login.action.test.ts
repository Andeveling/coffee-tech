import { APIError } from "better-auth/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	signInEmail: vi.fn(),
	headers: vi.fn(() => Promise.resolve(new Headers())),
	redirect: vi.fn((url: string) => {
		throw new Error(`NEXT_REDIRECT:${url}`);
	}),
}));

vi.mock("@/features/auth/server", () => ({
	auth: { api: { signInEmail: mocks.signInEmail } },
}));

vi.mock("next/headers", () => ({
	headers: mocks.headers,
}));

vi.mock("next/navigation", () => ({
	redirect: mocks.redirect,
}));

import { loginAction } from "@/features/auth/_actions/login.action";
import { LOGIN_INITIAL_STATE } from "@/features/auth/_actions/login.action-state";

const asFormData = (record: Record<string, string>): FormData => {
	const fd = new FormData();
	for (const [k, v] of Object.entries(record)) fd.append(k, v);
	return fd;
};

describe("loginAction wiring", () => {
	beforeEach(() => {
		mocks.signInEmail.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("wires the action to auth.api.signInEmail and surfaces the default error message", async () => {
		// The factory's behaviour is covered in lib/forms/define-form-action.test.ts.
		// This test exercises only the auth-specific wiring: which API is called,
		// which default error string is shown, and the schema-shaped payload.

		mocks.signInEmail.mockRejectedValueOnce(
			new APIError(401, { code: "INVALID", message: "bad" }),
		);

		const state = await loginAction(
			LOGIN_INITIAL_STATE,
			asFormData({ email: "ada@example.test", password: "wrong" }),
		);

		expect(state).toEqual({
			status: "error",
			formError: "Email o contraseña incorrectos",
			fieldErrors: {},
		});
		expect(mocks.signInEmail).toHaveBeenCalledTimes(1);
		expect(mocks.signInEmail).toHaveBeenCalledTimes(1);
		const [calledWith] = mocks.signInEmail.mock.calls[0] as [
			{ body: Record<string, string> },
			Headers,
		];
		expect(calledWith.body).toEqual({
			email: "ada@example.test",
			password: "wrong",
		});
	});
});
