import { prisma } from "@/lib/db";
import { getPaymentAmountUsd, getUsdRateMap } from "@/lib/exchange-rates";
import { resolveDateRange, type DateFilterPeriod, type DateRange } from "@/lib/admin/date-range";

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
  return Array.from(totals.entries()).map(([currency, amount]) => ({ currency, amount }));
}

export async function getFinanceByPsychologist(range: FinanceDateRange) {
  const [psychologists, rates] = await Promise.all([
    prisma.psychologist.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        specialty: true,
        appointments: {
          where: {
            status: { in: ["CONFIRMED", "COMPLETED"] },
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
              },
            },
          },
        },
      },
    }),
    getUsdRateMap(),
  ]);

  return psychologists
    .map((p) => {
      const approvedPayments = p.appointments
        .map((a) => a.payment)
        .filter((pay): pay is NonNullable<typeof pay> => pay?.status === "APPROVED");

      const totalRevenueByCurrency = groupByCurrency(approvedPayments);
      const totalRevenueUsd = approvedPayments.reduce(
        (sum, p) => sum + getPaymentAmountUsd(p, rates),
        0,
      );
      const totalOwedUsd = approvedPayments.reduce(
        (sum, p) => sum + (p.payoutAmountUsd ?? 0),
        0,
      );
      const totalStripeFeeUsd = approvedPayments.reduce(
        (sum, p) => sum + (p.stripeFeeUsd ?? 0),
        0,
      );
      const sessionCount = approvedPayments.length;

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
      };
    })
    .sort((a, b) => b.totalRevenueUsd - a.totalRevenueUsd);
}

export type FinancePsychologist = Awaited<ReturnType<typeof getFinanceByPsychologist>>[number];

export function getFinanceSummary(psychologists: FinancePsychologist[]) {
  const totalRevenueUsd = psychologists.reduce((sum, p) => sum + p.totalRevenueUsd, 0);
  const totalOwedUsd = psychologists.reduce((sum, p) => sum + p.totalOwedUsd, 0);
  const totalStripeFeeUsd = psychologists.reduce((sum, p) => sum + p.totalStripeFeeUsd, 0);
  const totalSessions = psychologists.reduce((sum, p) => sum + p.sessionCount, 0);
  const netRevenueUsd = totalRevenueUsd - totalOwedUsd - totalStripeFeeUsd;

  const currencyTotals = new Map<string, number>();
  for (const p of psychologists) {
    for (const c of p.totalRevenueByCurrency) {
      currencyTotals.set(c.currency, (currencyTotals.get(c.currency) ?? 0) + c.amount);
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
  };
}
