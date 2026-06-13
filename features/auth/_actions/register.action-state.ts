import type { z } from "zod";
import type { registerSchema } from "@/features/auth/_schemas/register.schema";
import type { FormActionState } from "@/lib/forms/define-form-action";

/**
 * Action state shape consumed by `useActionState` in the register form.
 *
 * Lives in its own file (no `"use server"` directive) so that the type
 * alias, the initial-state constant, and the type guard do not violate
 * Next's `"use server"` rule, which only permits async function exports
 * from a server action file. The shape is derived from the factory's
 * generic and the schema's inferred type, so adding a field to the
 * schema updates `fieldErrors` keys automatically.
 */
export type RegisterActionState = FormActionState<
	z.infer<typeof registerSchema>
>;

export const REGISTER_INITIAL_STATE: RegisterActionState = { status: "idle" };

export const registerHasError = (
	state: RegisterActionState,
): state is Extract<RegisterActionState, { status: "error" }> =>
	state.status === "error";
