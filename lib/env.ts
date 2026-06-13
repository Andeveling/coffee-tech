import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
	DATABASE_URL: z
		.string()
		.min(1, { error: "DATABASE_URL es requerido" })
		.refine((v) => v.startsWith("file:") || v.startsWith("libsql:"), {
			message: "DATABASE_URL debe usar el esquema file: o libsql:",
		}),
	BETTER_AUTH_SECRET: z
		.string()
		.min(32, { error: "BETTER_AUTH_SECRET debe tener al menos 32 caracteres" }),
	BETTER_AUTH_URL: z.url({ error: "BETTER_AUTH_URL debe ser una URL válida" }),
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
});

const parsed = serverEnvSchema.safeParse(process.env);
if (!parsed.success) {
	const issues = parsed.error.issues
		.map((i) => `  - ${i.path.join(".")}: ${i.message}`)
		.join("\n");
	throw new Error(
		`Invalid server environment variables:\n${issues}\n\nCopy .env.example to .env and set the missing values.`,
	);
}

export const env = Object.freeze(parsed.data);
