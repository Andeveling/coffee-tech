import { LoginForm } from "@/features/auth";

/**
 * The `next` search param is honored by the login flow: after a successful
 * sign-in, the action redirects to `next` (validated as an internal path)
 * instead of the default `/dashboard`. The proxy already sets `next` when
 * bouncing unauthenticated users away from private routes, so deep links
 * survive the auth flow end-to-end.
 */
export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ next?: string }>;
}) {
	const { next } = await searchParams;
	return <LoginForm next={next ?? null} />;
}
