"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LOGIN_INITIAL_STATE, loginAction } from "@/app/(auth)/login/_actions";

export default function LoginPage() {
	const [state, formAction, isPending] = useActionState(
		loginAction,
		LOGIN_INITIAL_STATE,
	);

	return (
		<form action={formAction} className="flex flex-col gap-4">
			<Field data-invalid={Boolean(state.fieldErrors.email) || undefined}>
				<FieldLabel htmlFor="email">Email</FieldLabel>
				<Input
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					disabled={isPending}
					aria-invalid={Boolean(state.fieldErrors.email)}
				/>
				<FieldError>{state.fieldErrors.email}</FieldError>
			</Field>
			<Field data-invalid={Boolean(state.fieldErrors.password) || undefined}>
				<FieldLabel htmlFor="password">Contraseña</FieldLabel>
				<Input
					id="password"
					name="password"
					type="password"
					autoComplete="current-password"
					disabled={isPending}
					aria-invalid={Boolean(state.fieldErrors.password)}
				/>
				<FieldError>{state.fieldErrors.password}</FieldError>
			</Field>
			{state.formError ? (
				<p className="text-destructive text-xs" role="alert">
					{state.formError}
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
}
