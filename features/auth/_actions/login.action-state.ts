import type { z } from "zod";
import type { loginSchema } from "@/features/auth/_schemas/login.schema";
import type { FormActionState } from "@/lib/forms/define-form-action";

/** Action state shape for `useActionState`. Split from the action file because Next's `"use server"` rule only allows async function exports — types and constants must live outside. */
export type LoginActionState = FormActionState<z.infer<typeof loginSchema>>;

export const LOGIN_INITIAL_STATE: LoginActionState = { status: "idle" };

export const loginHasError = (
	state: LoginActionState,
): state is Extract<LoginActionState, { status: "error" }> =>
	state.status === "error";
