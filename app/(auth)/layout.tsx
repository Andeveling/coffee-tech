import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (session) {
		redirect("/users");
	}

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
