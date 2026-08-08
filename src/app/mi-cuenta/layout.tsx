import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { WhatsAppButton } from "@/components/landing/whatsapp-button";
import { Toaster } from "@/components/ui/sonner";
import { getSiteSettings } from "@/lib/admin/site-settings-queries";
import { getConsentFromCookies } from "@/lib/consent/server";

export default async function PatientLayout({
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
            <Header />
            <main className="flex-1">{children}</main>
            <Footer settings={settings} />
            <WhatsAppButton
                whatsappNumber={settings.whatsappNumber}
                initialConsent={initialConsent}
            />
            <Toaster position="top-right" richColors />
        </div>
    );
}
