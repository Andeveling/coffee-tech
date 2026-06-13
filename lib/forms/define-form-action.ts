import "server-only";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ZodError, ZodObject, ZodRawShape, z } from "zod";

import { isSafeNextPath } from "@/lib/forms/is-safe-next-path";

/**
 * Discriminated union for `useActionState`. The "idle" arm is the initial
 * state; the "error" arm carries a form-level message and per-field
 * errors. Parameterised on `TIn` so `fieldErrors` keys are inferred from
 * the schema.
 */
export type FormActionState<TIn extends Record<string, unknown>> =
	| { status: "idle" }
	| {
			status: "error";
			formError: string | null;
			fieldErrors: Partial<Record<keyof TIn, string>>;
	  };

export type ApiErrorMapping<TIn> = {
	formError?: string | null;
	fieldErrors?: Partial<Record<keyof TIn, string>>;
};

export type DefineFormActionOptions<
	TIn extends Record<string, unknown>,
	TOut,
> = {
	schema: ZodObject<ZodRawShape>;
	buildBody: (values: TIn) => unknown;
	call: (body: unknown, headers: Headers) => Promise<TOut>;
	successRedirect?: (output: TOut) => string;
	/**
	 * Default form-level error when an `APIError` is raised and no
	 * `mapApiError` is provided. Ignored when `mapApiError` returns a
	 * value (including the explicit "no message" mapping).
	 */
	defaultFormError: string;
	/**
	 * Map a better-auth `APIError` to a form-level message and/or field
	 * errors. Return `null` to rethrow. Non-`APIError` exceptions always rethrow.
	 */
	mapApiError?: (err: APIError) => ApiErrorMapping<TIn> | null;
	onSuccess?: (output: TOut) => Promise<void>;
};

export type FormActionBundle<TIn extends Record<string, unknown>> = {
	action: (
		prev: FormActionState<TIn>,
		formData: FormData,
	) => Promise<FormActionState<TIn>>;
	initialState: FormActionState<TIn>;
	hasError: (
		state: FormActionState<TIn>,
	) => state is Extract<FormActionState<TIn>, { status: "error" }>;
	State: FormActionState<TIn>;
};

const formDataToRecord = (formData: FormData): Record<string, string> => {
	const result: Record<string, string> = {};
	for (const [key, value] of formData.entries()) {
		if (typeof value === "string") {
			result[key] = value;
		}
	}
	return result;
};

const zodIssuesToFieldErrors = <T extends Record<string, unknown>>(
	error: ZodError,
): Partial<Record<keyof T, string>> => {
	const fieldErrors: Partial<Record<keyof T, string>> = {};
	for (const issue of error.issues) {
		const field = issue.path[0] as keyof T | undefined;
		if (field && !fieldErrors[field]) {
			fieldErrors[field] = issue.message;
		}
	}
	return fieldErrors;
};

/**
 * Hides the parse→dispatch→map-error→redirect sequence and returns a
 * bundle the form consumes directly. Server-only — pulls `next/headers`
 * and `next/navigation` so caller actions do not import them. The
 * explicit generic on the factory pins `TIn` to the schema's inferred type.
 */
export const defineFormAction = <
	TIn extends Record<string, unknown> = Record<string, unknown>,
	TOut = unknown,
>(
	opts: DefineFormActionOptions<TIn, TOut>,
): FormActionBundle<TIn> => {
	const successRedirect = opts.successRedirect ?? ((): string => "/dashboard");

	const initialState: FormActionState<TIn> = { status: "idle" };

	const hasError = (
		state: FormActionState<TIn>,
	): state is Extract<FormActionState<TIn>, { status: "error" }> =>
		state.status === "error";

	const action = async (
		_prev: FormActionState<TIn>,
		formData: FormData,
	): Promise<FormActionState<TIn>> => {
		const raw = formDataToRecord(formData);

		const values: Record<string, string> = {};
		for (const key of Object.keys(opts.schema.shape)) {
			values[key] = raw[key] ?? "";
		}

		const parsed = opts.schema.safeParse(values);
		if (!parsed.success) {
			return {
				status: "error",
				fieldErrors: zodIssuesToFieldErrors<TIn>(parsed.error),
				formError: null,
			};
		}

		const built = opts.buildBody(parsed.data as TIn);
		const requestHeaders = await headers();

		let output: TOut;
		try {
			output = await opts.call(built, requestHeaders);
		} catch (err) {
			if (err instanceof APIError) {
				if (opts.mapApiError) {
					const mapped = opts.mapApiError(err);
					if (mapped) {
						return {
							status: "error",
							formError: mapped.formError ?? null,
							fieldErrors: mapped.fieldErrors ?? {},
						};
					}
					// mapApiError returned null → rethrow so the error
					// boundary catches it. Distinct from "no mapApiError
					// provided", which falls back to the default form error.
					throw err;
				}
				return {
					status: "error",
					formError: opts.defaultFormError,
					fieldErrors: {},
				};
			}
			throw err;
		}

		if (opts.onSuccess) {
			await opts.onSuccess(output);
		}

		// `redirect` throws a `NEXT_REDIRECT` error that Next handles; the
		// line below is intentionally unreachable from TypeScript's perspective.
		const target = successRedirect(output);
		const rawNext = raw.next;
		redirect(target || (isSafeNextPath(rawNext) ? rawNext : "/dashboard"));
	};

	return { action, initialState, hasError, State: initialState };
};

export type { z };
