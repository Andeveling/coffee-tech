import { LibSQLDatabase, drizzle } from "drizzle-orm/libsql";

import { env } from "@/lib/env";

import * as schema from "./schema";

type Schema = typeof schema;
type Db = LibSQLDatabase<Schema>;

declare global {
	// eslint-disable-next-line no-var
	var __coffeeTechDb: Db | undefined;
}

const client = drizzle({
	schema,
	connection: { url: env.DATABASE_URL },
});

export const db: Db = globalThis.__coffeeTechDb ?? client;
if (env.NODE_ENV !== "production") {
	globalThis.__coffeeTechDb = db;
}

export { schema };
export type { Db, Schema };
