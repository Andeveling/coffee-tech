import { RegisterForm } from "@/features/auth";

/**
 * The `next` search param is honored by the register flow: after a
 * successful sign-up, the action redirects to `next` (validated as an
 * internal path) instead of the default `/dashboard`.
 */
export default async function RegisterPage({
	searchParams,
}: {
	searchParams: Promise<{ next?: string }>;
}) {
	const { next } = await searchParams;
	return <RegisterForm next={next ?? null} />;
}
