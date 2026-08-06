import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";
import { RouteTracker } from "@/components/analytics/route-tracker";
import { CookieConsentBanner } from "@/components/consent/cookie-consent-banner";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { WhatsAppButton } from "@/components/landing/whatsapp-button";
import { Toaster } from "@/components/ui/sonner";
import { getSiteSettings } from "@/lib/admin/site-settings-queries";
import { getConsentFromCookies } from "@/lib/consent/server";

export default async function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [settings, initialConsent] = await Promise.all([
        getSiteSettings(),
        getConsentFromCookies(),
    ]);

    return (
        <div className="flex min-h-svh flex-col">
            <AnalyticsScripts initialConsent={initialConsent} />
            <RouteTracker />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer settings={settings} />
            <WhatsAppButton whatsappNumber={settings.whatsappNumber} />
            <Toaster position="top-right" richColors />
            <CookieConsentBanner initialConsent={initialConsent} />
        </div>
    );
}
