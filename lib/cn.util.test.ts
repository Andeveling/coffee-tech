import { describe, expect, it } from "vitest";

import { cn } from "@/lib/cn.utils";

describe("cn", () => {
	it("merges class names", () => {
		expect(cn("foo", "bar")).toBe("foo bar");
	});

	it("drops falsy values", () => {
		expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
	});

	it("lets tailwind-merge resolve conflicts (later wins)", () => {
		expect(cn("px-2", "px-4")).toBe("px-4");
	});

	it("returns empty string when all inputs are falsy", () => {
		expect(cn(false, null, undefined)).toBe("");
	});
});
