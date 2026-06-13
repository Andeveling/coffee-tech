import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Public path prefixes. Anything not listed is private.
 * The matcher below already excludes `_next/*`, `favicon.ico`, and `api/auth/*`,
 * so this list only needs to enumerate the application-level public routes.
 */
const PUBLIC_PATH_PREFIXES = [
	"/",
	"/pricing",
	"/login",
	"/register",
	"/forgot-password",
];

const isPublicPath = (pathname: string): boolean => {
	if (pathname === "/") return true;
	return PUBLIC_PATH_PREFIXES.some(
		(prefix) => prefix !== "/" && pathname.startsWith(prefix),
	);
};

const isAuthUiPath = (pathname: string): boolean =>
	pathname.startsWith("/login") || pathname.startsWith("/register");

export const proxy = (request: NextRequest): NextResponse => {
	const { pathname, search } = request.nextUrl;

	const sessionCookie = getSessionCookie(request);
	const isLoggedIn = Boolean(sessionCookie);

	// 1. Logged-in users hitting the auth UI get bounced to /dashboard.
	if (isLoggedIn && isAuthUiPath(pathname)) {
		const next = searchParamsGet(search, "next");
		const target = next?.startsWith("/") ? next : "/dashboard";
		return NextResponse.redirect(new URL(target, request.url));
	}

	// 2. Unauthenticated users hitting a private path get bounced to /login.
	if (!isLoggedIn && !isPublicPath(pathname)) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("next", `${pathname}${search}`);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
};

const searchParamsGet = (search: string, key: string): string | null => {
	if (!search) return null;
	const params = new URLSearchParams(search);
	return params.get(key);
};

export const config = {
	/**
	 * Matcher excludes:
	 *   - _next/static, _next/image (static assets)
	 *   - favicon.ico, *.svg, *.png, *.jpg, *.jpeg, *.webp, *.ico (public files)
	 *   - api/auth/* (better-auth handler — must run server-side without proxy)
	 *
	 * Everything else passes through the proxy.
	 */
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
	],
};
