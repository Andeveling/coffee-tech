import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
	throw new Error(
		"DATABASE_URL is not set. Copy .env.example to .env and set it (e.g. DATABASE_URL=file:./local.db).",
	);
}

declare global {
	// eslint-disable-next-line no-var
	var __coffeeTechDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const client = drizzle({
	schema,
	connection: { url },
});

export const db = globalThis.__coffeeTechDb ?? client;
if (process.env.NODE_ENV !== "production") {
	globalThis.__coffeeTechDb = db;
}

export { schema };
