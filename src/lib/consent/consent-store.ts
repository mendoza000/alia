import {
    CONSENT_COOKIE_MAX_AGE_DAYS,
    CONSENT_COOKIE_NAME,
    CONSENT_VERSION,
    parseConsentCookie,
    serializeConsentCookie,
} from "./consent-cookie";
import type { ConsentCategories, ConsentRecord } from "./types";

export const CONSENT_UPDATED_EVENT = "alia:consent-updated";
export const REOPEN_CONSENT_BANNER_EVENT = "alia:reopen-consent-banner";

function readCookieValue(name: string): string | null {
    if (typeof document === "undefined") return null;

    const match = document.cookie
        .split("; ")
        .find(row => row.startsWith(`${name}=`));

    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function getClientConsent(): ConsentRecord | null {
    if (typeof document === "undefined") return null;
    return parseConsentCookie(readCookieValue(CONSENT_COOKIE_NAME));
}

export function setConsent(categories: ConsentCategories): void {
    if (typeof document === "undefined" || typeof window === "undefined") {
        return;
    }

    const record: ConsentRecord = {
        ...categories,
        v: CONSENT_VERSION,
        ts: new Date().toISOString(),
    };

    const secure = window.location.protocol === "https:" ? " Secure;" : "";
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
        serializeConsentCookie(record),
    )}; Path=/; Max-Age=${CONSENT_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60}; SameSite=Lax;${secure}`;

    window.gtag?.("consent", "update", {
        analytics_storage: categories.analytics ? "granted" : "denied",
        ad_storage: categories.marketing ? "granted" : "denied",
        ad_user_data: categories.marketing ? "granted" : "denied",
        ad_personalization: categories.marketing ? "granted" : "denied",
    });

    window.dispatchEvent(
        new CustomEvent(CONSENT_UPDATED_EVENT, { detail: categories }),
    );
}

export function hasMarketingConsent(): boolean {
    return getClientConsent()?.marketing ?? false;
}
