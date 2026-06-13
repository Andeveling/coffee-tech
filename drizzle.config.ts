import "dotenv/config";
import { defineConfig } from "drizzle-kit";

import { env } from "@/lib/env";

export default defineConfig({
	schema: "./db/schema/index.ts",
	out: "./migrations",
	dialect: "sqlite",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
	strict: true,
	verbose: true,
});
