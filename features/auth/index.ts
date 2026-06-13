// Client-safe barrel for the auth feature.
// Anything `import "server-only"` lives in `./server` (or `_actions/`) and
// must NEVER be re-exported from here.

export { LoginForm } from "@/features/auth/_components/login-form";
export { RegisterForm } from "@/features/auth/_components/register-form";
export {
	type LoginInput,
	loginSchema,
} from "@/features/auth/_schemas/login.schema";
export {
	type RegisterInput,
	registerSchema,
} from "@/features/auth/_schemas/register.schema";
export { formDataToRecord } from "@/features/auth/_utils/form-data.util";
export {
	type FormFieldErrors,
	zodIssuesToFieldErrors,
} from "@/features/auth/_utils/zod-issues.util";
export {
	authClient,
	signIn,
	signOut,
	signUp,
	useSession,
} from "@/features/auth/client";
