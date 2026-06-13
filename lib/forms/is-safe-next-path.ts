/**
 * Validate and normalize a `next` search-param value before using it as
 * a `redirect()` target.
 *
 * Accepts only internal paths to prevent open-redirect attacks (a
 * malicious link like `/login?next=https://evil.example` must not be
 * honored). The accepted shape is `/` followed by an optional path
 * component — no protocol, no host, no scheme-relative URLs.
 *
 * This is a **security primitive**, not orchestration. It is kept as a
 * standalone, white-box-tested module so its guarantee is independent
 * of the form-action factory that calls into it. A future test suite
 * can mock the factory; this utility's tests are a property test of
 * the open-redirect defense.
 */
export const isSafeNextPath = (value: unknown): value is string => {
	if (typeof value !== "string" || value.length === 0) return false;
	if (value.length > 2048) return false;
	if (!value.startsWith("/")) return false;
	if (value.startsWith("//")) return false;
	if (value.startsWith("/\\")) return false;
	return true;
};
