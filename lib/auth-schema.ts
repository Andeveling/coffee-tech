import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                Login schema                                */
/* -------------------------------------------------------------------------- */

export const loginSchema = z.object({
	email: z.email({ error: "Email inválido" }),
	password: z.string().min(1, { error: "Contraseña requerida" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

/* -------------------------------------------------------------------------- */
/*                              Register schema                               */
/* -------------------------------------------------------------------------- */

export const registerSchema = z
	.object({
		name: z.string().min(1, { error: "Nombre requerido" }).max(100),
		email: z.email({ error: "Email inválido" }),
		password: z
			.string()
			.min(8, { error: "La contraseña debe tener al menos 8 caracteres" }),
		confirmPassword: z.string().min(1, {
			error: "Confirmá la contraseña",
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Las contraseñas no coinciden",
		path: ["confirmPassword"],
	});

export type RegisterInput = z.infer<typeof registerSchema>;

/* -------------------------------------------------------------------------- */
/*                    useActionState shapes (React 19 / Next 16)              */
/* -------------------------------------------------------------------------- */

/**
 * Map of field name -> error message. `Partial` so fields without an error
 * are simply absent from the object (no `undefined` noise in JSX).
 */
export type FormFieldErrors<T> = Partial<Record<keyof T, string>>;

export type LoginActionState = {
	fieldErrors: FormFieldErrors<LoginInput>;
	formError: string | null;
};

export type RegisterActionState = {
	fieldErrors: FormFieldErrors<RegisterInput>;
	formError: string | null;
};

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

/**
 * Read a `FormData` payload as a flat `Record<string, string>`, dropping any
 * non-string entries (e.g. uploaded files) so the values can be passed
 * directly to a Zod schema whose fields are all strings.
 */
export function formDataToRecord(formData: FormData): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, value] of formData.entries()) {
		if (typeof value === "string") {
			result[key] = value;
		}
	}
	return result;
}

/**
 * Project a `ZodError` down to a `{ field: firstMessage }` map, keeping only
 * the first message per field so the UI never shows two errors stacked under
 * the same input.
 */
export function zodIssuesToFieldErrors<T extends Record<string, unknown>>(
	error: z.ZodError,
): FormFieldErrors<T> {
	const fieldErrors: FormFieldErrors<T> = {};
	for (const issue of error.issues) {
		const field = issue.path[0] as keyof T | undefined;
		if (field && !fieldErrors[field]) {
			fieldErrors[field] = issue.message;
		}
	}
	return fieldErrors;
}
