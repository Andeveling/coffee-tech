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
	auth: { api: { signUpEmail: mocks.signUpEmail } },
}));

vi.mock("next/headers", () => ({
	headers: mocks.headers,
}));

vi.mock("next/navigation", () => ({
	redirect: mocks.redirect,
}));

import { registerAction } from "@/features/auth/_actions/register.action";
import { REGISTER_INITIAL_STATE } from "@/features/auth/_actions/register.action-state";

const asFormData = (record: Record<string, string>): FormData => {
	const fd = new FormData();
	for (const [k, v] of Object.entries(record)) fd.append(k, v);
	return fd;
};

const valid = {
	name: "Ada",
	email: "ada@example.test",
	password: "supersecret",
	confirmPassword: "supersecret",
};

describe("registerAction wiring", () => {
	beforeEach(() => {
		mocks.signUpEmail.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("strips confirmPassword before calling auth.api.signUpEmail", async () => {
		mocks.signUpEmail.mockResolvedValueOnce({});

		await expect(
			registerAction(
				REGISTER_INITIAL_STATE,
				asFormData({ ...valid, next: "/dashboard" }),
			),
		).rejects.toThrow(/NEXT_REDIRECT:\/dashboard/);

		expect(mocks.signUpEmail).toHaveBeenCalledTimes(1);
		const [calledWith] = mocks.signUpEmail.mock.calls[0] as [
			{ body: Record<string, string> },
			Headers,
		];
		expect(calledWith.body).toEqual({
			name: valid.name,
			email: valid.email,
			password: valid.password,
		});
	});

	it("maps USER_ALREADY_EXISTS to a field-level email error", async () => {
		mocks.signUpEmail.mockRejectedValueOnce(
			new APIError(409, {
				code: "USER_ALREADY_EXISTS",
				message: "exists",
			}),
		);

		const state = await registerAction(
			REGISTER_INITIAL_STATE,
			asFormData(valid),
		);

		expect(state).toEqual({
			status: "error",
			formError: null,
			fieldErrors: { email: "Este email ya está registrado" },
		});
	});

	it("surfaces the mapped APIError message for other auth failures", async () => {
		mocks.signUpEmail.mockRejectedValueOnce(
			new APIError(500, { code: "BOOM", message: "server down" }),
		);

		const state = await registerAction(
			REGISTER_INITIAL_STATE,
			asFormData(valid),
		);

		expect(state).toEqual({
			status: "error",
			formError: "server down",
			fieldErrors: {},
		});
	});
});
