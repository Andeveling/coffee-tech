import { describe, expect, it } from "vitest";

import { isSafeNextPath } from "@/features/auth/_utils/safe-next-path.util";

describe("isSafeNextPath", () => {
	it("accepts a simple root path", () => {
		expect(isSafeNextPath("/")).toBe(true);
	});

	it("accepts a nested internal path", () => {
		expect(isSafeNextPath("/dashboard/settings")).toBe(true);
	});

	it("accepts a path with a query string", () => {
		expect(isSafeNextPath("/dashboard?tab=profile")).toBe(true);
	});

	it("rejects an empty string", () => {
		expect(isSafeNextPath("")).toBe(false);
	});

	it("rejects a non-string value", () => {
		expect(isSafeNextPath(undefined)).toBe(false);
		expect(isSafeNextPath(null)).toBe(false);
		expect(isSafeNextPath(42)).toBe(false);
	});

	it("rejects a fully-qualified external URL", () => {
		expect(isSafeNextPath("https://evil.example/path")).toBe(false);
		expect(isSafeNextPath("http://evil.example/path")).toBe(false);
	});

	it("rejects a protocol-relative URL", () => {
		expect(isSafeNextPath("//evil.example/path")).toBe(false);
	});

	it("rejects a backslash-escaped protocol-relative URL", () => {
		expect(isSafeNextPath("/\\evil.example/path")).toBe(false);
	});

	it("rejects a relative path without leading slash", () => {
		expect(isSafeNextPath("dashboard")).toBe(false);
		expect(isSafeNextPath("./dashboard")).toBe(false);
		expect(isSafeNextPath("../dashboard")).toBe(false);
	});

	it("rejects an absurdly long value", () => {
		expect(isSafeNextPath(`/${"a".repeat(3000)}`)).toBe(false);
	});
});
