"use client";

import { useState } from "react";
import { signIn, signOut, signUp, useSession } from "@/lib/auth-client";

export default function Home() {
	const { data: session, isPending, refetch } = useSession();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);

	if (isPending) {
		return (
			<main className="flex flex-1 items-center justify-center">
				<p>Loading…</p>
			</main>
		);
	}

	if (session) {
		return (
			<main className="flex flex-1 flex-col items-center justify-center gap-4">
				<p>Signed in as {session.user.email}</p>
				<button
					type="button"
					className="rounded border px-4 py-2"
					onClick={async () => {
						await signOut();
						await refetch();
					}}
				>
					Sign out
				</button>
			</main>
		);
	}

	async function handleSignUp() {
		setError(null);
		const res = await signUp.email({ email, password, name });
		if (res.error) {
			setError(res.error.message ?? "Sign up failed");
			return;
		}
		await refetch();
	}

	async function handleSignIn() {
		setError(null);
		const res = await signIn.email({ email, password });
		if (res.error) {
			setError(res.error.message ?? "Sign in failed");
			return;
		}
		await refetch();
	}

	return (
		<main className="flex flex-1 flex-col items-center justify-center gap-3">
			<h1 className="text-2xl font-semibold">Better Auth · smoke test</h1>
			<input
				className="rounded border px-3 py-2"
				placeholder="name"
				value={name}
				onChange={(e) => setName(e.target.value)}
			/>
			<input
				className="rounded border px-3 py-2"
				placeholder="email"
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
			/>
			<input
				className="rounded border px-3 py-2"
				placeholder="password"
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
			/>
			<div className="flex gap-2">
				<button
					type="button"
					className="rounded border px-4 py-2"
					onClick={handleSignUp}
				>
					Sign up
				</button>
				<button
					type="button"
					className="rounded border px-4 py-2"
					onClick={handleSignIn}
				>
					Sign in
				</button>
			</div>
			{error ? <p className="text-red-500">{error}</p> : null}
		</main>
	);
}
