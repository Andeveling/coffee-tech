"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Field } from "@/app/(auth)/_components/field";
import {
	REGISTER_INITIAL_STATE,
	registerAction,
} from "@/app/(auth)/register/_actions";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
	const [state, formAction, isPending] = useActionState(
		registerAction,
		REGISTER_INITIAL_STATE,
	);

	return (
		<form action={formAction} className="flex flex-col gap-4">
			<Field
				name="name"
				label="Nombre"
				autoComplete="name"
				disabled={isPending}
				error={state.fieldErrors.name}
			/>
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
				autoComplete="new-password"
				disabled={isPending}
				error={state.fieldErrors.password}
			/>
			<Field
				name="confirmPassword"
				label="Confirmar contraseña"
				type="password"
				autoComplete="new-password"
				disabled={isPending}
				error={state.fieldErrors.confirmPassword}
			/>
			{state.formError ? (
				<p className="text-destructive text-xs" role="alert">
					{state.formError}
				</p>
			) : null}
			<Button type="submit" disabled={isPending} className="mt-2 w-full">
				{isPending ? "Creando cuenta…" : "Crear cuenta"}
			</Button>
			<p className="text-center text-muted-foreground text-sm">
				¿Ya tenés cuenta?{" "}
				<Link
					className="text-foreground underline-offset-4 hover:underline"
					href="/login"
				>
					Iniciar sesión
				</Link>
			</p>
		</form>
	);
}
