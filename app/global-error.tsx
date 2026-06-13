"use client";

import { useEffect } from "react";

// `global-error.tsx` runs when an error is thrown inside the root `app/layout.tsx`
// itself — at that point, our normal layout chrome is gone, so this component
// must render its own `<html>` and `<body>`.

export default function GlobalError({
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
		<html lang="es">
			<body className="min-h-full bg-background text-foreground antialiased">
				<main className="flex min-h-dvh flex-1 items-center justify-center p-6">
					<section className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
						<header className="flex flex-col gap-1 text-center">
							<h1 className="font-semibold text-2xl tracking-tight">
								Error crítico
							</h1>
							<p className="text-muted-foreground text-sm">
								La aplicación no se pudo cargar. Reintentá o volvé al inicio.
							</p>
						</header>
						<button
							type="button"
							onClick={reset}
							className="w-full rounded-md border border-input bg-input/30 px-3 py-2 text-sm font-medium hover:bg-input/50"
						>
							Reintentar
						</button>
					</section>
				</main>
			</body>
		</html>
	);
}
