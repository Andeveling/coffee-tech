/**
 * Read a `FormData` payload as a flat `Record<string, string>`, dropping any
 * non-string entries (e.g. uploaded files) so the values can be passed
 * directly to a Zod schema whose fields are all strings.
 */
export const formDataToRecord = (
	formData: FormData,
): Record<string, string> => {
	const result: Record<string, string> = {};
	for (const [key, value] of formData.entries()) {
		if (typeof value === "string") {
			result[key] = value;
		}
	}
	return result;
};
