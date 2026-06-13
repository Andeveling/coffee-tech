"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Per-group error boundary for the private surface (dashboard, settings).
 * Preserves the private chrome so the user can retry without bouncing to
 * the public layout.
 */
export default function PrivateError({
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
		<div className="flex flex-1 items-center justify-center p-6">
			<section className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
				<header className="flex flex-col gap-1 text-center">
					<h1 className="font-semibold text-2xl tracking-tight">
						Error en la app
					</h1>
					<p className="text-muted-foreground text-sm">
						No pudimos cargar esta vista. Reintentá o volvé al dashboard.
					</p>
				</header>
				<Button onClick={reset} className="w-full">
					Reintentar
				</Button>
			</section>
		</div>
	);
}
