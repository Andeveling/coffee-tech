"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
	formDataToRecord,
	type LoginActionState,
	type LoginInput,
	loginSchema,
	zodIssuesToFieldErrors,
} from "@/lib/auth-schema";

export const LOGIN_INITIAL_STATE: LoginActionState = {
	fieldErrors: {},
	formError: null,
};

/**
 * Server Action used by `useActionState` in `app/(auth)/login/page.tsx`.
 * Signature `(prevState, formData) => Promise<state>` is what React 19
 * expects — React handles the pending state and re-renders on resolve.
 */
export async function loginAction(
	_prevState: LoginActionState,
	formData: FormData,
): Promise<LoginActionState> {
	const raw = formDataToRecord(formData);
	const values = {
		email: raw.email ?? "",
		password: raw.password ?? "",
	};

	const parsed = loginSchema.safeParse(values);
	if (!parsed.success) {
		return {
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
				fieldErrors: {},
				formError: "Email o contraseña incorrectos",
			};
		}
		throw err; // let Next.js render the error boundary for unexpected failures
	}

	// `redirect` throws a `NEXT_REDIRECT` error that Next.js handles; this
	// line is intentionally unreachable from a TypeScript perspective.
	redirect("/users");
}
