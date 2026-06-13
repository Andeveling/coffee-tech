import "dotenv/config";

import { auth } from "@/features/auth/server";

const SEED_USER = {
	name: "Demo User",
	email: "[email protected]",
	password: "hunter22",
};
const main = async (): Promise<void> => {
	try {
		await auth.api.signUpEmail({
			body: SEED_USER,
		});
		console.log(`Seeded demo user: ${SEED_USER.email}`);
	} catch (err) {
		// better-auth throws USER_ALREADY_EXISTS when the user is already in
		// the DB. That is the expected idempotent outcome of re-running the
		// seed script.
		const message = err instanceof Error ? err.message : String(err);
		if (message.includes("USER_ALREADY_EXISTS")) {
			console.log(
				`Skipping seed: ${SEED_USER.email} already exists in the database.`,
			);
			return;
		}
		throw err;
	}
};

main().catch((err: unknown) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
