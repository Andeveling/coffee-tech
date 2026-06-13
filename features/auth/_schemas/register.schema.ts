import { z } from "zod";

export const registerSchema = z
	.object({
		name: z.string().min(1, { error: "Nombre requerido" }).max(100),
		email: z.email({ error: "Email inválido" }),
		password: z
			.string()
			.min(8, { error: "La contraseña debe tener al menos 8 caracteres" }),
		confirmPassword: z.string().min(1, {
			error: "Confirmá la contraseña",
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Las contraseñas no coinciden",
		path: ["confirmPassword"],
	});

export type RegisterInput = z.infer<typeof registerSchema>;
