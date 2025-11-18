import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

// Public routes that don't require authentication
const publicRoutes = [
	"/auth/login",
	"/auth/register",
	"/auth/forgot-password",
	"/auth/reset-password",
	"/login",
	"/register",
	"/api/auth",
];

export function middleware(request: NextRequest) {
	const url = request.nextUrl.clone();
	const pathname = url.pathname;

	// Allow public routes and API routes
	if (
		publicRoutes.some((route) => pathname.startsWith(route)) ||
		pathname.startsWith("/api/")
	) {
		return NextResponse.next();
	}

	// Check for session cookie
	const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

	// For root and protected routes, check authentication
	if (
		pathname === "/" ||
		pathname.startsWith("/dashboard") ||
		pathname.startsWith("/finance") ||
		pathname.startsWith("/crm") ||
		pathname.startsWith("/projects") ||
		pathname.startsWith("/hr") ||
		pathname.startsWith("/settings") ||
		pathname.startsWith("/vault") ||
		pathname.startsWith("/profile")
	) {
		// If no session cookie, redirect to login
		if (!sessionCookie) {
			const loginUrl = new URL("/auth/login", request.url);
			// Preserve the original URL as redirect parameter
			if (pathname !== "/") {
				loginUrl.searchParams.set("redirect", pathname);
			}
			return NextResponse.redirect(loginUrl);
		}

		// Authenticated - handle root redirect
		if (pathname === "/") {
			url.pathname = "/dashboard";
			return NextResponse.redirect(url);
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/", "/dashboard/:path*", "/(protected)/:path*", "/auth/:path*"],
};
