import { redirect } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { WhatsAppButton } from "@/components/landing/whatsapp-button";
import { Toaster } from "@/components/ui/sonner";
import { getSiteSettings } from "@/lib/admin/site-settings-queries";
import { getConsentFromCookies } from "@/lib/consent/server";
import { requireActor } from "@/lib/auth/require";

export default async function PatientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // src/proxy.ts already gates every /mi-cuenta/** request to "has a
    // session" — this is defense in depth, same reasoning as the admin
    // layout's own requireActor() call.
    try {
        await requireActor();
    } catch {
        redirect("/");
    }

    const [settings, initialConsent] = await Promise.all([
        getSiteSettings(),
        getConsentFromCookies(),
    ]);

    return (
        <div className="flex min-h-svh flex-col">
            <Header />
            {/* Header is fixed — same top offset convention as the booking
             * flow's pages (agendar/[slug]/page.tsx, confirmacion/page.tsx,
             * etc.) so content doesn't render underneath it. */}
            <main className="flex-1 mt-10 lg:mt-20">{children}</main>
            <Footer settings={settings} />
            <WhatsAppButton
                whatsappNumber={settings.whatsappNumber}
                initialConsent={initialConsent}
            />
            <Toaster position="top-right" richColors />
        </div>
    );
}
