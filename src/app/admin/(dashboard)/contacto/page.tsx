import { getSiteSettings } from "@/lib/admin/site-settings-queries";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";

export default async function ContactoPage() {
    const settings = await getSiteSettings();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-2xl font-semibold">
                    Contacto
                </h1>
                <p className="text-sm text-muted-foreground">
                    WhatsApp, Instagram y email mostrados en el sitio público
                    (botón flotante y footer)
                </p>
            </div>

            <SiteSettingsForm settings={settings} />
        </div>
    );
}
