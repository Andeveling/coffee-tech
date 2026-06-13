import type { LoginInput } from "@/features/auth/_schemas/login.schema";

/**
 * Action state shape consumed by `useActionState` in the login form.
 *
 * Lives in its own file (no `"use server"` directive) so that non-function
 * exports — the type alias and the initial-state constant — do not
 * violate Next's `"use server"` rule, which only permits async function
 * exports from a server action file.
 */
export type LoginActionState =
	| { status: "idle" }
	| {
			status: "error";
			formError: string | null;
			fieldErrors: Partial<Record<keyof LoginInput, string>>;
	  };

export const LOGIN_INITIAL_STATE: LoginActionState = { status: "idle" };
