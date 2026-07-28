import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { WhatsAppButton } from "@/components/landing/whatsapp-button";
import { Toaster } from "@/components/ui/sonner";
import { getSiteSettings } from "@/lib/admin/site-settings-queries";

export default async function PatientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await getSiteSettings();

    return (
        <div className="flex min-h-svh flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer settings={settings} />
            <WhatsAppButton whatsappNumber={settings.whatsappNumber} />
            <Toaster position="top-right" richColors />
        </div>
    );
}
