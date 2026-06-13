import "server-only";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ZodError, ZodObject, ZodRawShape, z } from "zod";

import { isSafeNextPath } from "@/lib/forms/is-safe-next-path";

/**
 * Discriminated union consumed by `useActionState` on the client.
 *
 * The "idle" arm is what `useActionState` expects as the initial state;
 * the "error" arm carries a form-level message and per-field errors.
 * The state type is parameterised on `TIn` so the `fieldErrors` keys
 * are inferred from the schema passed to the factory — adding a field
 * to the schema updates the state type without manual changes.
 */
export type FormActionState<TIn extends Record<string, unknown>> =
	| { status: "idle" }
	| {
			status: "error";
			formError: string | null;
			fieldErrors: Partial<Record<keyof TIn, string>>;
	  };

/** What the caller can return from `mapApiError` to override the default. */
export type ApiErrorMapping<TIn> = {
	formError?: string | null;
	fieldErrors?: Partial<Record<keyof TIn, string>>;
};

export type DefineFormActionOptions<
	TIn extends Record<string, unknown>,
	TOut,
> = {
	/**
	 * Zod schema. The factory validates form data with it and reads its
	 * shape to know which fields to pre-fill. The caller can declare an
	 * explicit generic on the factory to lock the type of the
	 * `buildBody` / `call` inputs to the schema's inferred type.
	 */
	schema: ZodObject<ZodRawShape>;
	/** Map the parsed form values to whatever the underlying call expects. */
	buildBody: (values: TIn) => unknown;
	/** The business call. Headers come from the active request. */
	call: (body: unknown, headers: Headers) => Promise<TOut>;
	/**
	 * Where to send the user on success. Defaults to a function that
	 * returns "/dashboard". Receives the call's output for dynamic
	 * redirects (e.g. role-based).
	 */
	successRedirect?: (output: TOut) => string;
	/**
	 * Default form-level error when an `APIError` is raised and no
	 * `mapApiError` is provided. Ignored when `mapApiError` returns a
	 * value (including the explicit "no message" mapping).
	 */
	defaultFormError: string;
	/**
	 * Map a better-auth `APIError` to a form-level message and/or field
	 * errors. Return `null` to rethrow the original error so the error
	 * boundary can handle it. Non-`APIError` exceptions always rethrow.
	 */
	mapApiError?: (err: APIError) => ApiErrorMapping<TIn> | null;
	/** Optional pre-success side effect (analytics, audit log). */
	onSuccess?: (output: TOut) => Promise<void>;
};

/**
 * What the client form imports. Bundles the action (for useActionState),
 * the initial state, the type guard, and the state type — so the form
 * does not have to import the state machinery from a sibling file.
 */
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

/**
 * Read a `FormData` payload as a flat `Record<string, string>`, dropping
 * any non-string entries (uploaded files, etc.) so the values can be
 * passed directly to a Zod schema whose fields are all strings.
 */
const formDataToRecord = (formData: FormData): Record<string, string> => {
	const result: Record<string, string> = {};
	for (const [key, value] of formData.entries()) {
		if (typeof value === "string") {
			result[key] = value;
		}
	}
	return result;
};

/**
 * Project a `ZodError` down to a `{ field: firstMessage }` map, keeping
 * only the first message per field so the UI never shows two errors
 * stacked under the same input.
 */
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
 * The factory. Hides the full parse→dispatch→map-error→redirect sequence
 * and returns a bundle the client form can consume directly. The factory
 * is server-only (`import "server-only"`) and pulls `next/headers` and
 * `next/navigation` in at the boundary so caller action files do not have
 * to import them.
 *
 * Usage: the caller can pin `TIn` with the explicit generic and pass the
 * schema's inferred type, e.g. `defineFormAction<z.infer<typeof loginSchema>>({...})`.
 * If the generic is omitted, both generics default to a permissive
 * `Record<string, unknown>` / `unknown` pair, which is useful in tests
 * and in one-off forms.
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

		// Pre-fill missing keys with "" so the schema's own messages
		// surface (e.g. "Password requerido") instead of Zod's default
		// "Invalid input: expected string, received undefined". For
		// optional fields, "" is still a valid string so the schema
		// accepts it; callers strip client-only fields via `buildBody`.
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

// Re-export z namespace for callers that need it without a second import.
export type { z };
