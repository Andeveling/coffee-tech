"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { LoginActionState } from "@/features/auth/_actions/login.action-state";
import {
	type LoginInput,
	loginSchema,
} from "@/features/auth/_schemas/login.schema";
import { formDataToRecord } from "@/features/auth/_utils/form-data.util";
import { isSafeNextPath } from "@/features/auth/_utils/safe-next-path.util";
import { zodIssuesToFieldErrors } from "@/features/auth/_utils/zod-issues.util";
import { auth } from "@/features/auth/server";

/**
 * Server Action used by `useActionState` in `features/auth/_components/login-form.tsx`.
 * The `"use server"` directive at the top of this file makes each exported
 * function a Server Action — `useActionState` calls it via the framework's
 * RPC; we never bundle the body into the client.
 *
 * On success the action redirects (throws NEXT_REDIRECT) — the returned
 * `state` is irrelevant in that path.
 *
 * This file is restricted to async function exports: types and the
 * initial-state constant live in `./login.action-state` so that
 * `"use server"` does not see them.
 */
export const loginAction = async (
	_prevState: LoginActionState,
	formData: FormData,
): Promise<LoginActionState> => {
	const raw = formDataToRecord(formData);
	const values = {
		email: raw.email ?? "",
		password: raw.password ?? "",
	};

	const parsed = loginSchema.safeParse(values);
	if (!parsed.success) {
		return {
			status: "error",
			fieldErrors: zodIssuesToFieldErrors<LoginInput>(parsed.error),
			formError: null,
		};
	}

	try {
		await auth.api.signInEmail({
			body: parsed.data,
			headers: await headers(),
		});
	} catch (err) {
		if (err instanceof APIError) {
			return {
				status: "error",
				fieldErrors: {},
				formError: "Email o contraseña incorrectos",
			};
		}
		throw err; // let Next.js render the error boundary for unexpected failures
	}

	// `redirect` throws a `NEXT_REDIRECT` error that Next.js handles; this
	// line is intentionally unreachable from a TypeScript perspective.
	const rawNext = raw.next;
	redirect(isSafeNextPath(rawNext) ? rawNext : "/dashboard");
};
