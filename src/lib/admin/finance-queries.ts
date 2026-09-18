import { prisma } from "@/lib/db";
import { getUsdRateMap } from "@/lib/exchange-rates";
import {
    getPaymentAmountUsd,
    getPsychologistShareUsd,
    sumUsd,
} from "@/lib/payment-math";
import {
    resolveDateRange,
    type DateFilterPeriod,
    type DateRange,
} from "@/lib/admin/date-range";

export type FinancePeriod = DateFilterPeriod;

export type FinanceDateRange = DateRange;

export const resolveFinanceRange = resolveDateRange;

export type FinanceCurrencyTotal = { currency: string; amount: number };

function groupByCurrency(
    payments: Array<{ finalAmount: number; currency: string }>,
): FinanceCurrencyTotal[] {
    const totals = new Map<string, number>();
    for (const p of payments) {
        totals.set(p.currency, (totals.get(p.currency) ?? 0) + p.finalAmount);
    }
    return Array.from(totals.entries()).map(([currency, amount]) => ({
        currency,
        amount,
    }));
}

export async function getFinanceByPsychologist(range: FinanceDateRange) {
    const [psychologists, rates] = await Promise.all([
        prisma.psychologist.findMany({
            select: {
                id: true,
                name: true,
                photoUrl: true,
                specialty: true,
                appointments: {
                    where: {
                        status: { in: ["CONFIRMED", "COMPLETED", "NO_SHOW"] },
                        payment: {
                            status: "APPROVED",
                            paidAt: {
                                ...(range.since ? { gte: range.since } : {}),
                                ...(range.until ? { lte: range.until } : {}),
                            },
                        },
                    },
                    select: {
                        payment: {
                            select: {
                                finalAmount: true,
                                currency: true,
                                status: true,
                                exchangeRateToUsd: true,
                                stripeSettledAmountUsd: true,
                                stripeFeeUsd: true,
                                payoutAmountUsd: true,
                                payoutRatePercent: true,
                                isNoShowFee: true,
                            },
                        },
                    },
                },
            },
        }),
        getUsdRateMap(),
    ]);

    return psychologists
        .map(p => {
            const approvedPayments = p.appointments
                .map(a => a.payment)
                .filter(
                    (pay): pay is NonNullable<typeof pay> =>
                        pay?.status === "APPROVED",
                );

            const totalRevenueByCurrency = groupByCurrency(approvedPayments);
            const paymentsWithUsd = approvedPayments.map(p => ({
                ...p,
                finalAmountUsd: getPaymentAmountUsd(p, rates),
            }));
            const totalRevenueUsd = sumUsd(
                paymentsWithUsd.map(p => p.finalAmountUsd),
            );
            const totalOwedUsd = sumUsd(
                paymentsWithUsd.map(p =>
                    getPsychologistShareUsd(p, p.finalAmountUsd),
                ),
            );
            const totalStripeFeeUsd = sumUsd(
                paymentsWithUsd.map(p => p.stripeFeeUsd),
            );
            const sessionPayments = approvedPayments.filter(
                p => !p.isNoShowFee,
            );
            const noShowFeePayments = approvedPayments.filter(
                p => p.isNoShowFee,
            );
            const noShowFeePaymentsWithUsd = paymentsWithUsd.filter(
                p => p.isNoShowFee,
            );
            const sessionCount = sessionPayments.length;
            const noShowFeeCount = noShowFeePayments.length;
            const totalNoShowFeeRevenueUsd = sumUsd(
                noShowFeePaymentsWithUsd.map(p => p.finalAmountUsd),
            );

            return {
                id: p.id,
                name: p.name,
                photoUrl: p.photoUrl,
                specialty: p.specialty,
                totalRevenueByCurrency,
                totalRevenueUsd,
                totalOwedUsd,
                totalStripeFeeUsd,
                sessionCount,
                noShowFeeCount,
                totalNoShowFeeRevenueUsd,
            };
        })
        .sort((a, b) => b.totalRevenueUsd - a.totalRevenueUsd);
}

export type FinancePsychologist = Awaited<
    ReturnType<typeof getFinanceByPsychologist>
>[number];

export function getFinanceSummary(psychologists: FinancePsychologist[]) {
    const totalRevenueUsd = sumUsd(psychologists.map(p => p.totalRevenueUsd));
    const totalOwedUsd = sumUsd(psychologists.map(p => p.totalOwedUsd));
    const totalStripeFeeUsd = sumUsd(
        psychologists.map(p => p.totalStripeFeeUsd),
    );
    const totalSessions = psychologists.reduce(
        (sum, p) => sum + p.sessionCount,
        0,
    );
    const totalNoShowFeeCount = psychologists.reduce(
        (sum, p) => sum + p.noShowFeeCount,
        0,
    );
    const totalNoShowFeeRevenueUsd = sumUsd(
        psychologists.map(p => p.totalNoShowFeeRevenueUsd),
    );
    const netRevenueUsd = sumUsd([
        totalRevenueUsd,
        -totalOwedUsd,
        -totalStripeFeeUsd,
    ]);

    const currencyTotals = new Map<string, number>();
    for (const p of psychologists) {
        for (const c of p.totalRevenueByCurrency) {
            currencyTotals.set(
                c.currency,
                (currencyTotals.get(c.currency) ?? 0) + c.amount,
            );
        }
    }
    const totalRevenueByCurrency: FinanceCurrencyTotal[] = Array.from(
        currencyTotals.entries(),
    ).map(([currency, amount]) => ({ currency, amount }));

    return {
        totalRevenueByCurrency,
        totalRevenueUsd,
        totalSessions,
        totalOwedUsd,
        totalStripeFeeUsd,
        netRevenueUsd,
        totalNoShowFeeCount,
        totalNoShowFeeRevenueUsd,
    };
}
