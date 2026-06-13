"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	REGISTER_INITIAL_STATE,
	registerAction,
} from "@/app/(auth)/register/_actions";

export default function RegisterPage() {
	const [state, formAction, isPending] = useActionState(
		registerAction,
		REGISTER_INITIAL_STATE,
	);

	return (
		<form action={formAction} className="flex flex-col gap-4">
			<Field data-invalid={Boolean(state.fieldErrors.name) || undefined}>
				<FieldLabel htmlFor="name">Nombre</FieldLabel>
				<Input
					id="name"
					name="name"
					autoComplete="name"
					disabled={isPending}
					aria-invalid={Boolean(state.fieldErrors.name)}
				/>
				<FieldError>{state.fieldErrors.name}</FieldError>
			</Field>
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
					autoComplete="new-password"
					disabled={isPending}
					aria-invalid={Boolean(state.fieldErrors.password)}
				/>
				<FieldError>{state.fieldErrors.password}</FieldError>
			</Field>
			<Field
				data-invalid={Boolean(state.fieldErrors.confirmPassword) || undefined}
			>
				<FieldLabel htmlFor="confirmPassword">Confirmar contraseña</FieldLabel>
				<Input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					autoComplete="new-password"
					disabled={isPending}
					aria-invalid={Boolean(state.fieldErrors.confirmPassword)}
				/>
				<FieldError>{state.fieldErrors.confirmPassword}</FieldError>
			</Field>
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
