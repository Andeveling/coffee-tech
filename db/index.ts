import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

import { env } from "@/lib/env";

import * as schema from "./schema";

type Schema = typeof schema;
type Db = LibSQLDatabase<Schema>;

declare global {
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

export type { Db, Schema };
export { schema };
