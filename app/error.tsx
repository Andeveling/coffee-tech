"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log to the browser console; production observability hooks go here.
		console.error(error);
	}, [error]);

	return (
		<main className="flex min-h-dvh flex-1 items-center justify-center bg-background p-6">
			<section className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
				<header className="flex flex-col gap-1 text-center">
					<h1 className="font-semibold text-2xl tracking-tight">
						Algo salió mal
					</h1>
					<p className="text-muted-foreground text-sm">
						Ocurrió un error inesperado. Podés intentar de nuevo.
					</p>
				</header>
				{error.digest ? (
					<p className="text-center text-muted-foreground text-xs">
						Código: <code className="font-mono">{error.digest}</code>
					</p>
				) : null}
				<Button onClick={reset} className="w-full">
					Reintentar
				</Button>
			</section>
		</main>
	);
}
