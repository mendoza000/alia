import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/auth/permissions";
import {
    CONSENT_COOKIE_MAX_AGE_DAYS,
    CONSENT_COOKIE_NAME,
    CONSENT_VERSION,
    serializeConsentCookie,
} from "@/lib/consent/consent-cookie";
import type { ConsentRecord } from "@/lib/consent/types";

// If GPC is signaled and the user has no consent cookie yet, pre-write a
// denied consent record into the request cookies so the same request's
// Server Components (getConsentFromCookies) see it immediately.
function applyGpcConsent(request: NextRequest): string | null {
    if (request.cookies.has(CONSENT_COOKIE_NAME)) return null;
    if (request.headers.get("sec-gpc") !== "1") return null;

    const record: ConsentRecord = {
        necessary: true,
        analytics: false,
        marketing: false,
        v: CONSENT_VERSION,
        ts: new Date().toISOString(),
    };
    const value = serializeConsentCookie(record);
    request.cookies.set(CONSENT_COOKIE_NAME, value);
    return value;
}

function withConsentCookie(
    response: NextResponse,
    consentValue: string | null,
    request: NextRequest,
) {
    if (consentValue) {
        response.cookies.set(CONSENT_COOKIE_NAME, consentValue, {
            path: "/",
            maxAge: CONSENT_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
            sameSite: "lax",
            secure: request.nextUrl.protocol === "https:",
        });
    }
    return response;
}

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const gpcConsentValue = applyGpcConsent(request);

    if (pathname.startsWith("/admin") || pathname.startsWith("/mi-cuenta")) {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        // Admin login: redirect to dashboard if already authenticated as staff
        if (pathname === "/admin/login") {
            if (isStaffRole(session?.user?.role)) {
                return withConsentCookie(
                    NextResponse.redirect(new URL("/admin", request.url)),
                    gpcConsentValue,
                    request,
                );
            }
            return withConsentCookie(
                NextResponse.next({ request }),
                gpcConsentValue,
                request,
            );
        }

        // Admin routes: require a staff role (admin/assistant/psychologist).
        // Fine-grained gating between those three lives in the pages and
        // server actions themselves (see src/lib/auth/permissions.ts), not
        // here — this is only the outer "are you staff at all" gate.
        if (pathname.startsWith("/admin")) {
            if (!session?.user || !isStaffRole(session.user.role)) {
                return withConsentCookie(
                    NextResponse.redirect(new URL("/admin/login", request.url)),
                    gpcConsentValue,
                    request,
                );
            }
        }

        // Patient account: require any session
        if (pathname.startsWith("/mi-cuenta")) {
            if (!session?.user) {
                return withConsentCookie(
                    NextResponse.redirect(new URL("/", request.url)),
                    gpcConsentValue,
                    request,
                );
            }
        }
    }

    return withConsentCookie(
        NextResponse.next({ request }),
        gpcConsentValue,
        request,
    );
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/mi-cuenta/:path*",
        "/((?!_next/static|_next/image|favicon.ico|api/).*)",
    ],
};
