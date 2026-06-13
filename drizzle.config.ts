import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;
if (!url) {
	throw new Error(
		"DATABASE_URL is not set. Copy .env.example to .env and set it (e.g. DATABASE_URL=file:./local.db).",
	);
}

export default defineConfig({
	schema: "./db/schema.ts",
	out: "./migrations",
	dialect: "sqlite",
	dbCredentials: {
		url,
	},
	strict: true,
	verbose: true,
});
