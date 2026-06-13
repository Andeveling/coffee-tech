/**
 * Validate and normalize a `next` search-param value before using it as
 * a `redirect()` target.
 *
 * Accepts only internal paths to prevent open-redirect attacks (a
 * malicious link like `/login?next=https://evil.example` must not be
 * honored). The accepted shape is `/` followed by an optional path
 * component — no protocol, no host, no scheme-relative URLs.
 */
export const isSafeNextPath = (value: unknown): value is string => {
	if (typeof value !== "string" || value.length === 0) return false;
	if (value.length > 2048) return false;
	if (!value.startsWith("/")) return false;
	if (value.startsWith("//")) return false;
	if (value.startsWith("/\\")) return false;
	return true;
};
