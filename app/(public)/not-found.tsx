import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function PublicNotFound() {
	return (
		<section className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
			<p className="font-mono text-muted-foreground text-sm">404</p>
			<h2 className="font-semibold text-xl tracking-tight">No encontrado</h2>
			<p className="text-muted-foreground text-sm">
				La página pública que buscás no existe.
			</p>
			<Link href="/" className="w-full">
				<Button className="w-full">Volver al inicio</Button>
			</Link>
		</section>
	);
}
