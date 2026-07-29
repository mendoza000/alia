export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
export const GOOGLE_ADS_BOOKING_LABEL =
    process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL;

declare global {
    interface Window {
        dataLayer: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

export function gtagEvent(name: string, params?: Record<string, unknown>) {
    if (typeof window === "undefined" || !window.gtag) return;
    window.gtag("event", name, params);
}
