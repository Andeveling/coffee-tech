import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/features/auth/server";

export default async function PrivateLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Defense in depth: the proxy redirects unauthenticated users away from
	// the private group, but we re-check the session server-side so a
	// misconfigured proxy never leaks private routes.
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/login");
	}

	return (
		<main className="flex min-h-dvh flex-1 flex-col bg-background">
			<header className="border-b border-border bg-card px-6 py-3">
				<p className="font-semibold text-sm tracking-tight">Coffee Tech</p>
			</header>
			<div className="flex flex-1 flex-col">{children}</div>
		</main>
	);
}
