import type { z } from "zod";
import type { loginSchema } from "@/features/auth/_schemas/login.schema";
import type { FormActionState } from "@/lib/forms/define-form-action";

/**
 * Action state shape consumed by `useActionState` in the login form.
 *
 * Lives in its own file (no `"use server"` directive) so that the type
 * alias, the initial-state constant, and the type guard do not violate
 * Next's `"use server"` rule, which only permits async function exports
 * from a server action file. The shape is derived from the factory's
 * generic and the schema's inferred type, so adding a field to the
 * schema updates `fieldErrors` keys automatically.
 */
export type LoginActionState = FormActionState<z.infer<typeof loginSchema>>;

export const LOGIN_INITIAL_STATE: LoginActionState = { status: "idle" };

export const loginHasError = (
	state: LoginActionState,
): state is Extract<LoginActionState, { status: "error" }> =>
	state.status === "error";
