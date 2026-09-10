"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require";
import { siteSettingsSchema } from "@/lib/validators/site-settings";
import type { SiteSettingsFormData } from "@/lib/validators/site-settings";

const SETTINGS_ID = "singleton";

type ActionResult = { success: true } | { success: false; error: string };

export async function updateSiteSettings(
    data: SiteSettingsFormData,
): Promise<ActionResult> {
    try {
        await requirePermission("settings.write");

        const validated = await siteSettingsSchema.validate(data, {
            abortEarly: false,
        });

        await prisma.siteSettings.upsert({
            where: { id: SETTINGS_ID },
            create: {
                id: SETTINGS_ID,
                whatsappNumber: validated.whatsappNumber ?? null,
                instagramUrl: validated.instagramUrl ?? null,
                contactEmail: validated.contactEmail ?? null,
            },
            update: {
                whatsappNumber: validated.whatsappNumber ?? null,
                instagramUrl: validated.instagramUrl ?? null,
                contactEmail: validated.contactEmail ?? null,
            },
        });

        revalidatePath("/admin/contacto");
        revalidatePath("/", "layout");
        return { success: true };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return {
            success: false,
            error: "Error al actualizar la configuración",
        };
    }
}
