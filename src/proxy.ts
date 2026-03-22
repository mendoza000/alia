import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const session = await auth.api.getSession({
		headers: request.headers,
	});

	// Admin login: redirect to dashboard if already authenticated as admin
	if (pathname === "/admin/login") {
		if (session?.user?.role === "admin") {
			return NextResponse.redirect(new URL("/admin", request.url));
		}
		return NextResponse.next();
	}

	// Admin routes: require admin role
	if (pathname.startsWith("/admin")) {
		if (!session?.user || session.user.role !== "admin") {
			return NextResponse.redirect(new URL("/admin/login", request.url));
		}
	}

	// Patient account: require any session
	if (pathname.startsWith("/mi-cuenta")) {
		if (!session?.user) {
			return NextResponse.redirect(new URL("/", request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/admin/:path*", "/mi-cuenta/:path*"],
};
