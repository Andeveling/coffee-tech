import { db, schema } from "@/db";

export default async function UsersPage() {
	const users = await db.select().from(schema.users);
	return (
		<main className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
			<h1 className="text-2xl font-semibold">Users (drizzle smoke test)</h1>
			<p className="text-sm opacity-70">Total: {users.length}</p>
			<ul className="flex flex-col gap-1 text-sm">
				{users.map((u) => (
					<li key={u.id}>
						{u.email} — {u.name}
					</li>
				))}
			</ul>
		</main>
	);
}
