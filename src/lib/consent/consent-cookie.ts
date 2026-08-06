import type { ConsentCategories, ConsentRecord } from "./types";

export const CONSENT_COOKIE_NAME = "alia_cookie_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_COOKIE_MAX_AGE_DAYS = 180;

export const DEFAULT_DENIED: ConsentCategories = {
    necessary: true,
    analytics: false,
    marketing: false,
};

export function parseConsentCookie(
    raw: string | undefined | null,
): ConsentRecord | null {
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        if (
            typeof parsed !== "object" ||
            parsed === null ||
            parsed.v !== CONSENT_VERSION ||
            typeof parsed.analytics !== "boolean" ||
            typeof parsed.marketing !== "boolean" ||
            typeof parsed.ts !== "string"
        ) {
            return null;
        }

        return {
            necessary: true,
            analytics: parsed.analytics,
            marketing: parsed.marketing,
            v: CONSENT_VERSION,
            ts: parsed.ts,
        };
    } catch {
        return null;
    }
}

export function serializeConsentCookie(record: ConsentRecord): string {
    return JSON.stringify(record);
}
