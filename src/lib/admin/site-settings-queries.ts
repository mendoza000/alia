import { prisma } from "@/lib/db";

const SETTINGS_ID = "singleton";

export async function getSiteSettings() {
    const settings = await prisma.siteSettings.findUnique({
        where: { id: SETTINGS_ID },
    });

    return {
        whatsappNumber: settings?.whatsappNumber ?? null,
        instagramUrl: settings?.instagramUrl ?? null,
        contactEmail: settings?.contactEmail ?? null,
    };
}

export type SiteSettings = Awaited<ReturnType<typeof getSiteSettings>>;
