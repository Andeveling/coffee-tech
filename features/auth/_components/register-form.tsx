"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { registerAction } from "@/features/auth/_actions/register.action";
import {
	REGISTER_INITIAL_STATE,
	registerHasError,
} from "@/features/auth/_actions/register.action-state";

export const RegisterForm = ({ next }: { next: string | null }) => {
	const [state, formAction, isPending] = useActionState(
		registerAction,
		REGISTER_INITIAL_STATE,
	);
	const err = registerHasError(state) ? state : null;

	return (
		<form action={formAction} className="flex flex-col gap-4">
			{next ? <input type="hidden" name="next" value={next} /> : null}
			<Field data-invalid={Boolean(err?.fieldErrors.name) || undefined}>
				<FieldLabel htmlFor="name">Nombre</FieldLabel>
				<Input
					id="name"
					name="name"
					autoComplete="name"
					disabled={isPending}
					aria-invalid={Boolean(err?.fieldErrors.name)}
				/>
				<FieldError>{err?.fieldErrors.name}</FieldError>
			</Field>
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
					autoComplete="new-password"
					disabled={isPending}
					aria-invalid={Boolean(err?.fieldErrors.password)}
				/>
				<FieldError>{err?.fieldErrors.password}</FieldError>
			</Field>
			<Field
				data-invalid={Boolean(err?.fieldErrors.confirmPassword) || undefined}
			>
				<FieldLabel htmlFor="confirmPassword">Confirmar contraseña</FieldLabel>
				<Input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					autoComplete="new-password"
					disabled={isPending}
					aria-invalid={Boolean(err?.fieldErrors.confirmPassword)}
				/>
				<FieldError>{err?.fieldErrors.confirmPassword}</FieldError>
			</Field>
			{err?.formError ? (
				<p className="text-destructive text-xs" role="alert">
					{err.formError}
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
};
