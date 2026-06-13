import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function PrivateNotFound() {
	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<section className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
				<p className="font-mono text-muted-foreground text-sm">404</p>
				<h2 className="font-semibold text-xl tracking-tight">
					Página no encontrada
				</h2>
				<p className="text-muted-foreground text-sm">
					La vista que buscás no existe en el panel.
				</p>
				<Link href="/dashboard" className="w-full">
					<Button className="w-full">Volver al dashboard</Button>
				</Link>
			</section>
		</div>
	);
}
