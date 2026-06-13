/** Security primitive: rejects non-internal paths to prevent open-redirect via `?next=https://…`. Standalone so its guarantee is testable in isolation — do not inline into the form-action factory. */
export const isSafeNextPath = (value: unknown): value is string => {
	if (typeof value !== "string" || value.length === 0) return false;
	if (value.length > 2048) return false;
	if (!value.startsWith("/")) return false;
	if (value.startsWith("//")) return false;
	if (value.startsWith("/\\")) return false;
	return true;
};
