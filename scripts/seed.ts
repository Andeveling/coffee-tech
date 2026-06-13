import "dotenv/config";
import { count } from "drizzle-orm";
import { db, schema } from "@/db";

const main = async (): Promise<void> => {
	const [{ userCount }] = await db
		.select({ userCount: count() })
		.from(schema.users);

	if (userCount > 0) {
		console.log(`Skipping seed: users table already has ${userCount} row(s).`);
		return;
	}

	await db.insert(schema.users).values({
		id: "seed-user-1",
		email: "[email protected]",
		name: "Demo User",
		emailVerified: true,
	});

	console.log("Seeded 1 demo user.");
};

main().catch((err: unknown) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
