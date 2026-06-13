import type { z } from "zod";
import type { registerSchema } from "@/features/auth/_schemas/register.schema";
import type { FormActionState } from "@/lib/forms/define-form-action";

/** Action state shape for `useActionState`. Split from the action file because Next's `"use server"` rule only allows async function exports — types and constants must live outside. */
export type RegisterActionState = FormActionState<
	z.infer<typeof registerSchema>
>;

export const REGISTER_INITIAL_STATE: RegisterActionState = { status: "idle" };

export const registerHasError = (
	state: RegisterActionState,
): state is Extract<RegisterActionState, { status: "error" }> =>
	state.status === "error";
