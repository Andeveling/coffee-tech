import { APIError } from "better-auth/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
	headers: vi.fn(() => Promise.resolve(new Headers())),
	redirect: vi.fn((url: string) => {
		throw new Error(`NEXT_REDIRECT:${url}`);
	}),
}));

vi.mock("next/headers", () => ({
	headers: mocks.headers,
}));

vi.mock("next/navigation", () => ({
	redirect: mocks.redirect,
}));

const { defineFormAction } = await import("@/lib/forms/define-form-action");

type TestInput = {
	email: string;
	password: string;
	nickname?: string;
};

const testSchema = z.object({
	email: z.string().min(1, { error: "Email requerido" }),
	password: z.string().min(1, { error: "Password requerido" }),
	nickname: z.string().optional(),
});

const asFormData = (record: Record<string, string>): FormData => {
	const fd = new FormData();
	for (const [k, v] of Object.entries(record)) fd.append(k, v);
	return fd;
};

const makeBundle = (
	overrides: Partial<
		Parameters<typeof defineFormAction<TestInput, unknown>>[0]
	> = {},
) =>
	defineFormAction<TestInput, unknown>({
		schema: testSchema,
		buildBody: (v) => v,
		call: vi.fn().mockResolvedValue({ ok: true }),
		defaultFormError: "default error",
		...overrides,
	});

describe("defineFormAction", () => {
	beforeEach(() => {
		mocks.headers.mockClear();
		mocks.redirect.mockClear();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns the idle initial state and a hasError type guard on the bundle", () => {
		const bundle = makeBundle();
		expect(bundle.initialState).toEqual({ status: "idle" });
		expect(bundle.hasError(bundle.initialState)).toBe(false);
		const errState: Extract<typeof bundle.State, { status: "error" }> = {
			status: "error",
			formError: null,
			fieldErrors: { email: "x" },
		};
		expect(bundle.hasError(errState)).toBe(true);
	});

	it("happy path: valid form data invokes call with the body and headers, then redirects to the default", async () => {
		const call = vi.fn().mockResolvedValue({ id: "user-1" });
		const bundle = makeBundle({ call });

		await expect(
			bundle.action(
				bundle.initialState,
				asFormData({ email: "ada", password: "x" }),
			),
		).rejects.toThrow(/NEXT_REDIRECT:\/dashboard/);

		expect(call).toHaveBeenCalledWith(
			{ email: "ada", password: "x", nickname: "" },
			expect.any(Headers),
		);
		expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
	});

	it("happy path: successRedirect receives the call output", async () => {
		const successRedirect = vi.fn((_out: unknown) => "/dashboard/welcome");
		const bundle = makeBundle({ successRedirect });

		await expect(
			bundle.action(
				bundle.initialState,
				asFormData({ email: "ada", password: "x" }),
			),
		).rejects.toThrow(/NEXT_REDIRECT:\/dashboard\/welcome/);

		expect(successRedirect).toHaveBeenCalledWith({ ok: true });
	});

	it("Zod failure: invalid form data does not invoke call and returns field errors", async () => {
		const call = vi.fn();
		const bundle = makeBundle({ call });

		const state = await bundle.action(
			bundle.initialState,
			asFormData({ email: "", password: "" }),
		);

		expect(state).toEqual({
			status: "error",
			formError: null,
			fieldErrors: {
				email: "Email requerido",
				password: "Password requerido",
			},
		});
		expect(call).not.toHaveBeenCalled();
	});

	it("Zod failure with optional field missing: only the required field surfaces in fieldErrors", async () => {
		const call = vi.fn();
		const bundle = makeBundle({ call });

		const state = await bundle.action(
			bundle.initialState,
			asFormData({ email: "ada" }),
		);

		expect(state).toEqual({
			status: "error",
			formError: null,
			fieldErrors: { password: "Password requerido" },
		});
	});

	it("mapApiError mapping: APIError with a specific code returns the mapped fieldErrors", async () => {
		const apiErr = new APIError(409, {
			code: "USER_ALREADY_EXISTS",
			message: "exists",
		});
		const call = vi.fn().mockRejectedValueOnce(apiErr);
		const mapApiError = vi.fn((err: APIError) =>
			err.body?.code === "USER_ALREADY_EXISTS"
				? {
						formError: null,
						fieldErrors: { email: "Este email ya está registrado" },
					}
				: { formError: err.body?.message ?? "" },
		);
		const bundle = makeBundle({ call, mapApiError });

		const state = await bundle.action(
			bundle.initialState,
			asFormData({ email: "ada", password: "x" }),
		);

		expect(state).toEqual({
			status: "error",
			formError: null,
			fieldErrors: { email: "Este email ya está registrado" },
		});
		expect(call).toHaveBeenCalledTimes(1);
	});

	it("mapApiError returns null: the original error is rethrown for the error boundary", async () => {
		const apiErr = new APIError(500, { code: "INTERNAL", message: "boom" });
		const call = vi.fn().mockRejectedValueOnce(apiErr);
		const mapApiError = vi.fn(() => null);
		const bundle = makeBundle({ call, mapApiError });

		await expect(
			bundle.action(
				bundle.initialState,
				asFormData({ email: "ada", password: "x" }),
			),
		).rejects.toBe(apiErr);
	});

	it("APIError with no mapApiError: returns the default form error", async () => {
		const apiErr = new APIError(401, { code: "INVALID", message: "bad" });
		const call = vi.fn().mockRejectedValueOnce(apiErr);
		const bundle = makeBundle({ call });

		const state = await bundle.action(
			bundle.initialState,
			asFormData({ email: "ada", password: "x" }),
		);

		expect(state).toEqual({
			status: "error",
			formError: "default error",
			fieldErrors: {},
		});
	});

	it("non-APIError: the error is rethrown for the error boundary", async () => {
		const boom = new Error("db is down");
		const call = vi.fn().mockRejectedValueOnce(boom);
		const bundle = makeBundle({ call });

		await expect(
			bundle.action(
				bundle.initialState,
				asFormData({ email: "ada", password: "x" }),
			),
		).rejects.toBe(boom);
	});

	it("onSuccess runs after call succeeds and before redirect, receiving the call output", async () => {
		const onSuccess = vi.fn();
		const call = vi.fn().mockResolvedValue({ ok: true, traceId: "t-1" });
		const bundle = makeBundle({ call, onSuccess });

		await expect(
			bundle.action(
				bundle.initialState,
				asFormData({ email: "ada", password: "x" }),
			),
		).rejects.toThrow(/NEXT_REDIRECT:/);

		expect(onSuccess).toHaveBeenCalledTimes(1);
		expect(onSuccess).toHaveBeenCalledWith({ ok: true, traceId: "t-1" });
	});

	it("buildBody can strip fields before the call", async () => {
		const call = vi.fn().mockResolvedValue({});
		const buildBody = vi.fn(
			({ password: _pw, ...rest }: TestInput): unknown => rest,
		);
		const bundle = makeBundle({ buildBody, call });

		await expect(
			bundle.action(
				bundle.initialState,
				asFormData({ email: "ada", password: "x" }),
			),
		).rejects.toThrow(/NEXT_REDIRECT:/);

		expect(buildBody).toHaveBeenCalledTimes(1);
		expect(call).toHaveBeenCalledWith(
			{ email: "ada", nickname: "" },
			expect.any(Headers),
		);
	});

	it("fieldErrors keys are typed from the schema (type-level)", () => {
		const bundle = makeBundle();
		const err: typeof bundle.State = {
			status: "error",
			formError: null,
			fieldErrors: { email: "x" },
		};
		expect(err.status).toBe("error");
	});
});
