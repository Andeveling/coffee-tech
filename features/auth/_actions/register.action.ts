"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { RegisterActionState } from "@/features/auth/_actions/register.action-state";
import {
	type RegisterInput,
	registerSchema,
} from "@/features/auth/_schemas/register.schema";
import { formDataToRecord } from "@/features/auth/_utils/form-data.util";
import { isSafeNextPath } from "@/features/auth/_utils/safe-next-path.util";
import { zodIssuesToFieldErrors } from "@/features/auth/_utils/zod-issues.util";
import { auth } from "@/features/auth/server";

/**
 * Server Action used by `useActionState` in `features/auth/_components/register-form.tsx`.
 * The `"use server"` directive at the top of this file makes each exported
 * function a Server Action — `useActionState` calls it via the framework's
 * RPC; we never bundle the body into the client.
 *
 * On success the action redirects (throws NEXT_REDIRECT) — the returned
 * `state` is irrelevant in that path.
 *
 * This file is restricted to async function exports: types and the
 * initial-state constant live in `./register.action-state` so that
 * `"use server"` does not see them.
 */
export const registerAction = async (
	_prevState: RegisterActionState,
	formData: FormData,
): Promise<RegisterActionState> => {
	const raw = formDataToRecord(formData);
	const values = {
		name: raw.name ?? "",
		email: raw.email ?? "",
		password: raw.password ?? "",
		confirmPassword: raw.confirmPassword ?? "",
	};

	const parsed = registerSchema.safeParse(values);
	if (!parsed.success) {
		return {
			status: "error",
			fieldErrors: zodIssuesToFieldErrors<RegisterInput>(parsed.error),
			formError: null,
		};
	}

	try {
		await auth.api.signUpEmail({
			body: {
				name: parsed.data.name,
				email: parsed.data.email,
				password: parsed.data.password,
			},
			headers: await headers(),
		});
	} catch (err) {
		if (err instanceof APIError) {
			if (err.body?.code === "USER_ALREADY_EXISTS") {
				return {
					status: "error",
					fieldErrors: { email: "Este email ya está registrado" },
					formError: null,
				};
			}
			return {
				status: "error",
				fieldErrors: {},
				formError: err.body?.message ?? "No se pudo crear la cuenta",
			};
		}
		throw err;
	}

	const rawNext = raw.next;
	redirect(isSafeNextPath(rawNext) ? rawNext : "/dashboard");
};
