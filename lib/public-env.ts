import { z } from "zod";

const publicEnvSchema = z.object({
	NEXT_PUBLIC_APP_URL: z.url({
		error: "NEXT_PUBLIC_APP_URL debe ser una URL válida",
	}),
});

const parsed = publicEnvSchema.safeParse({
	NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});
if (!parsed.success) {
	const issues = parsed.error.issues
		.map((i) => `  - ${i.path.join(".")}: ${i.message}`)
		.join("\n");
	throw new Error(
		`Invalid public environment variables:\n${issues}\n\nCopy .env.example to .env and set the missing values.`,
	);
}

export const publicEnv = Object.freeze(parsed.data);
