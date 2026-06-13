import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db, schema } from "@/db";

const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL;

if (!BETTER_AUTH_SECRET) {
	throw new Error(
		"Missing BETTER_AUTH_SECRET env var. Generate one with: openssl rand -base64 32",
	);
}
if (!BETTER_AUTH_URL) {
	throw new Error(
		"Missing BETTER_AUTH_URL env var. Example: http://localhost:3000",
	);
}

export const auth = betterAuth({
	secret: BETTER_AUTH_SECRET,
	baseURL: BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications,
		},
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [nextCookies()], // must be the last plugin — wires set-cookie into next/headers for server actions
});

export type Session = typeof auth.$Infer.Session;
