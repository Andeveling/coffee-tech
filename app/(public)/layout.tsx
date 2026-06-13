/**
 * Public layout — pure chrome. Session gating (logged-in users hitting
 * `/login` or `/register` → `/dashboard`) is handled by `proxy.ts`, the
 * single source of truth for the public/private decision. This layout
 * stays sync and free of `auth` imports so it remains a thin shell that
 * does not pay a DB round-trip on every render.
 */
export default function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<main className="flex min-h-dvh flex-1 items-center justify-center bg-background p-6">
			<section className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
				<header className="flex flex-col gap-1 text-center">
					<h1 className="font-semibold text-2xl tracking-tight">Coffee Tech</h1>
					<p className="text-muted-foreground text-sm">
						Ingresá o creá tu cuenta para continuar
					</p>
				</header>
				{children}
			</section>
		</main>
	);
}
