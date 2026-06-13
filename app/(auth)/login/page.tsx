"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Field } from "@/app/(auth)/_components/field";
import { LOGIN_INITIAL_STATE, loginAction } from "@/app/(auth)/login/_actions";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
	const [state, formAction, isPending] = useActionState(
		loginAction,
		LOGIN_INITIAL_STATE,
	);

	return (
		<form action={formAction} className="flex flex-col gap-4">
			<Field
				name="email"
				label="Email"
				type="email"
				autoComplete="email"
				disabled={isPending}
				error={state.fieldErrors.email}
			/>
			<Field
				name="password"
				label="Contraseña"
				type="password"
				autoComplete="current-password"
				disabled={isPending}
				error={state.fieldErrors.password}
			/>
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
