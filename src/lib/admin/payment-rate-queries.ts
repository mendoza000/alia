import { prisma } from "@/lib/db";
import { suggestCurrencyFromCountry } from "@/lib/currency";
import type { RateKind } from "@/generated/prisma/enums";

export async function getAllRates() {
    return prisma.paymentRate.findMany({
        orderBy: [{ kind: "asc" }, { currency: "asc" }],
    });
}

export type PaymentRateRow = Awaited<ReturnType<typeof getAllRates>>[number];

export async function getRate(currency: string, kind: RateKind = "INDIVIDUAL") {
    return prisma.paymentRate.findUnique({
        where: { currency_kind: { currency, kind } },
    });
}

/**
 * Public-facing price display, geolocated by the visitor's country.
 * Falls back suggested currency -> USD -> COP (the business's home currency),
 * skipping whichever of those has no configured rate. Defaults to the
 * INDIVIDUAL rate (every existing call site keeps working unchanged); the
 * modality-picker step (Fase 7.2) passes "COUPLE" explicitly once the
 * patient picks that modality in /agendar.
 */
export async function getPublicDisplayRate(
    country: string | null,
    kind: RateKind = "INDIVIDUAL",
): Promise<{ amount: number; currency: string } | null> {
    const suggested = suggestCurrencyFromCountry(country);
    const candidates = [...new Set([suggested, "USD", "COP"])];

    const rates = await prisma.paymentRate.findMany({
        where: { currency: { in: candidates }, kind },
    });

    for (const currency of candidates) {
        const match = rates.find(r => r.currency === currency);
        if (match) return { amount: match.amount, currency: match.currency };
    }

    return null;
}
