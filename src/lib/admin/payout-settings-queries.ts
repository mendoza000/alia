import { prisma } from "@/lib/db";

const SETTINGS_ID = "singleton";

export async function getPayoutSettings() {
    const settings = await prisma.payoutSettings.findUnique({
        where: { id: SETTINGS_ID },
    });

    return {
        newClientRatePercent: settings?.newClientRatePercent ?? 27,
        recurringClientRatePercent: settings?.recurringClientRatePercent ?? 54,
        loyalRatePercent: settings?.loyalRatePercent ?? 54,
        loyalNewRatePercent: settings?.loyalNewRatePercent ?? 27,
    };
}

export type PayoutSettings = Awaited<ReturnType<typeof getPayoutSettings>>;
