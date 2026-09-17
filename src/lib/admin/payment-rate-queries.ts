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
 * skipping whichever of those has no configured rate. Always the
 * INDIVIDUAL rate — the public landing shows one reference price, the
 * modality-specific price is resolved once the patient picks one in /agendar.
 */
export async function getPublicDisplayRate(
    country: string | null,
): Promise<{ amount: number; currency: string } | null> {
    const suggested = suggestCurrencyFromCountry(country);
    const candidates = [...new Set([suggested, "USD", "COP"])];

    const rates = await prisma.paymentRate.findMany({
        where: { currency: { in: candidates }, kind: "INDIVIDUAL" },
    });

    for (const currency of candidates) {
        const match = rates.find(r => r.currency === currency);
        if (match) return { amount: match.amount, currency: match.currency };
    }

    return null;
}
