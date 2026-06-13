import type { RegisterInput } from "@/features/auth/_schemas/register.schema";

/**
 * Action state shape consumed by `useActionState` in the register form.
 *
 * Lives in its own file (no `"use server"` directive) so that non-function
 * exports — the type alias and the initial-state constant — do not
 * violate Next's `"use server"` rule, which only permits async function
 * exports from a server action file.
 */
export type RegisterActionState =
	| { status: "idle" }
	| {
			status: "error";
			formError: string | null;
			fieldErrors: Partial<Record<keyof RegisterInput, string>>;
	  };

export const REGISTER_INITIAL_STATE: RegisterActionState = { status: "idle" };
