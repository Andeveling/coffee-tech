"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Per-group error boundary for the public surface (login, register, etc.).
 * Renders the auth card chrome so the user can recover in-place.
 */
export default function PublicError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<section className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
			<header className="flex flex-col gap-1 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">Coffee Tech</h1>
				<p className="text-destructive text-sm">
					Algo salió mal al cargar la página.
				</p>
			</header>
			<Button onClick={reset} className="w-full">
				Reintentar
			</Button>
		</section>
	);
}
