"use server";

import type { z } from "zod";
import { loginSchema } from "@/features/auth/_schemas/login.schema";
import { auth } from "@/features/auth/server";
import { defineFormAction } from "@/lib/forms/define-form-action";

/**
 * Server Action consumed by `useActionState` in
 * `features/auth/_components/login-form.tsx`. The orchestration
 * (parse→call→map errors→redirect) lives in the factory; this file
 * is the auth-specific wiring (schema, call, default error message).
 */
export const loginAction = defineFormAction<z.infer<typeof loginSchema>>({
	schema: loginSchema,
	buildBody: (v) => v,
	call: (body, headers) =>
		auth.api.signInEmail({
			body: body as z.infer<typeof loginSchema>,
			headers: headers as Headers,
		}),
	defaultFormError: "Email o contraseña incorrectos",
}).action;
