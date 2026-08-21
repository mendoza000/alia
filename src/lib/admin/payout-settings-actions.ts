"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { payoutSettingsSchema } from "@/lib/validators/payout-settings";
import type { PayoutSettingsFormData } from "@/lib/validators/payout-settings";

const SETTINGS_ID = "singleton";

type ActionResult = { success: true } | { success: false; error: string };

export async function updatePayoutSettings(
    data: PayoutSettingsFormData,
): Promise<ActionResult> {
    try {
        const validated = await payoutSettingsSchema.validate(data, {
            abortEarly: false,
        });

        await prisma.payoutSettings.upsert({
            where: { id: SETTINGS_ID },
            create: {
                id: SETTINGS_ID,
                newClientRatePercent: validated.newClientRatePercent,
                recurringClientRatePercent: validated.recurringClientRatePercent,
                loyalRatePercent: validated.loyalRatePercent,
                loyalNewRatePercent: validated.loyalNewRatePercent,
            },
            update: {
                newClientRatePercent: validated.newClientRatePercent,
                recurringClientRatePercent: validated.recurringClientRatePercent,
                loyalRatePercent: validated.loyalRatePercent,
                loyalNewRatePercent: validated.loyalNewRatePercent,
            },
        });

        revalidatePath("/admin/finanzas");
        return { success: true };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return {
            success: false,
            error: "Error al actualizar los porcentajes de pago",
        };
    }
}
