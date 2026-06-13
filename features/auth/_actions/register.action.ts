"use server";

import type { APIError } from "better-auth/api";
import type { z } from "zod";
import { registerSchema } from "@/features/auth/_schemas/register.schema";
import { auth } from "@/features/auth/server";
import { defineFormAction } from "@/lib/forms/define-form-action";

type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Server Action consumed by `useActionState` in
 * `features/auth/_components/register-form.tsx`. The orchestration
 * (parse→call→map errors→redirect) lives in the factory; this file
 * is the auth-specific wiring (schema, body shape, USER_ALREADY_EXISTS
 * → field-level error, default message).
 */
export const registerAction = defineFormAction<RegisterInput>({
	schema: registerSchema,
	// Strip the client-only confirmPassword before hitting the API.
	buildBody: ({ confirmPassword: _confirm, ...rest }: RegisterInput) => rest,
	call: (body, headers) =>
		auth.api.signUpEmail({
			body: body as Omit<RegisterInput, "confirmPassword">,
			headers: headers as Headers,
		}),
	defaultFormError: "No se pudo crear la cuenta",
	mapApiError: (err: APIError) =>
		err.body?.code === "USER_ALREADY_EXISTS"
			? { fieldErrors: { email: "Este email ya está registrado" } }
			: { formError: err.body?.message ?? null },
}).action;
