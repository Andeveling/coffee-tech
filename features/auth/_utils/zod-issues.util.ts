import type { z } from "zod";

export type FormFieldErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Project a `ZodError` down to a `{ field: firstMessage }` map, keeping only
 * the first message per field so the UI never shows two errors stacked under
 * the same input.
 */
export const zodIssuesToFieldErrors = <T extends Record<string, unknown>>(
	error: z.ZodError,
): FormFieldErrors<T> => {
	const fieldErrors: FormFieldErrors<T> = {};
	for (const issue of error.issues) {
		const field = issue.path[0] as keyof T | undefined;
		if (field && !fieldErrors[field]) {
			fieldErrors[field] = issue.message;
		}
	}
	return fieldErrors;
};
