import { hasMarketingConsent } from "@/lib/consent/consent-store";

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
    }
}

export function fbqTrack(event: string, params?: Record<string, unknown>) {
    if (typeof window === "undefined" || !window.fbq) return;
    if (!hasMarketingConsent()) return;
    window.fbq("track", event, params);
}
