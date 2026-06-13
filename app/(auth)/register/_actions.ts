"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
	formDataToRecord,
	type RegisterActionState,
	type RegisterInput,
	registerSchema,
	zodIssuesToFieldErrors,
} from "@/lib/auth-schema";

export const REGISTER_INITIAL_STATE: RegisterActionState = {
	fieldErrors: {},
	formError: null,
};

export async function registerAction(
	_prevState: RegisterActionState,
	formData: FormData,
): Promise<RegisterActionState> {
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
					fieldErrors: { email: "Este email ya está registrado" },
					formError: null,
				};
			}
			return {
				fieldErrors: {},
				formError: err.body?.message ?? "No se pudo crear la cuenta",
			};
		}
		throw err;
	}

	redirect("/users");
}
