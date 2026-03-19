import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const sessionCookie = request.cookies.get("better-auth.session_token");

	// Patient account: require any session cookie
	if (pathname.startsWith("/mi-cuenta")) {
		if (!sessionCookie) {
			return NextResponse.redirect(new URL("/", request.url));
		}
	}

	// Admin routes (except login): verify session + admin role via internal API call
	if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
		if (!sessionCookie) {
			return NextResponse.redirect(new URL("/admin/login", request.url));
		}

		// Verify admin role via better-auth API (runs in Node.js runtime)
		const res = await fetch(
			new URL("/api/auth/get-session", request.url),
			{ headers: { cookie: request.headers.get("cookie") ?? "" } },
		);

		if (!res.ok) {
			return NextResponse.redirect(new URL("/admin/login", request.url));
		}

		const session = await res.json();
		if (session?.user?.role !== "admin") {
			return NextResponse.redirect(new URL("/admin/login", request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/admin/:path*", "/mi-cuenta/:path*"],
};
