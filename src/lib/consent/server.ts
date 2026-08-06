import { cookies } from "next/headers";
import { CONSENT_COOKIE_NAME, parseConsentCookie } from "./consent-cookie";
import type { ConsentRecord } from "./types";

export async function getConsentFromCookies(): Promise<ConsentRecord | null> {
    const store = await cookies();
    return parseConsentCookie(store.get(CONSENT_COOKIE_NAME)?.value);
}
