"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
	type RegisterInput,
	registerSchema,
} from "@/features/auth/_schemas/register.schema";
import { formDataToRecord } from "@/features/auth/_utils/form-data.util";
import { zodIssuesToFieldErrors } from "@/features/auth/_utils/zod-issues.util";
import { auth } from "@/features/auth/server";

export type RegisterActionState =
	| { status: "idle" }
	| {
			status: "error";
			formError: string | null;
			fieldErrors: Partial<Record<keyof RegisterInput, string>>;
	  };

export const REGISTER_INITIAL_STATE: RegisterActionState = { status: "idle" };

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

	redirect("/dashboard");
};
