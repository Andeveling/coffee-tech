import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<main className="flex min-h-dvh flex-1 items-center justify-center bg-background p-6">
			<section className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
				<p className="font-mono text-muted-foreground text-sm">404</p>
				<h1 className="font-semibold text-2xl tracking-tight">
					Página no encontrada
				</h1>
				<p className="text-muted-foreground text-sm">
					La ruta que buscás no existe o fue movida.
				</p>
				<Link href="/" className="w-full">
					<Button className="w-full">Volver al inicio</Button>
				</Link>
			</section>
		</main>
	);
}
