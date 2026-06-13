"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/features/auth/_actions/login.action";
import {
	LOGIN_INITIAL_STATE,
	loginHasError,
} from "@/features/auth/_actions/login.action-state";

export const LoginForm = ({ next }: { next: string | null }) => {
	const [state, formAction, isPending] = useActionState(
		loginAction,
		LOGIN_INITIAL_STATE,
	);
	const err = loginHasError(state) ? state : null;

	return (
		<form action={formAction} className="flex flex-col gap-4">
			{next ? <input type="hidden" name="next" value={next} /> : null}
			<Field data-invalid={Boolean(err?.fieldErrors.email) || undefined}>
				<FieldLabel htmlFor="email">Email</FieldLabel>
				<Input
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					disabled={isPending}
					aria-invalid={Boolean(err?.fieldErrors.email)}
				/>
				<FieldError>{err?.fieldErrors.email}</FieldError>
			</Field>
			<Field data-invalid={Boolean(err?.fieldErrors.password) || undefined}>
				<FieldLabel htmlFor="password">Contraseña</FieldLabel>
				<Input
					id="password"
					name="password"
					type="password"
					autoComplete="current-password"
					disabled={isPending}
					aria-invalid={Boolean(err?.fieldErrors.password)}
				/>
				<FieldError>{err?.fieldErrors.password}</FieldError>
			</Field>
			{err?.formError ? (
				<p className="text-destructive text-xs" role="alert">
					{err.formError}
				</p>
			) : null}
			<Button type="submit" disabled={isPending} className="mt-2 w-full">
				{isPending ? "Ingresando…" : "Iniciar sesión"}
			</Button>
			<p className="text-center text-muted-foreground text-sm">
				¿No tenés cuenta?{" "}
				<Link
					className="text-foreground underline-offset-4 hover:underline"
					href="/register"
				>
					Registrate
				</Link>
			</p>
		</form>
	);
};
