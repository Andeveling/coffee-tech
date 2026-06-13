import { z } from "zod";

export const loginSchema = z.object({
	email: z.email({ error: "Email inválido" }),
	password: z.string().min(1, { error: "Contraseña requerida" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
