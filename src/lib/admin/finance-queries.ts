import { prisma } from "@/lib/db";
import { getUsdRateMap, paymentToUsd } from "@/lib/exchange-rates";

export type FinancePeriod = "month" | "3months" | "6months" | "year" | "all";

export type FinanceDateRange = { since: Date | null; until: Date | null };

function getPeriodStart(period: FinancePeriod): Date | null {
  const now = new Date();
  switch (period) {
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "3months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 2);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "6months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 5);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    case "all":
      return null;
  }
}

export function resolveFinanceRange(
  period: FinancePeriod,
  dateFrom?: string,
  dateTo?: string,
): FinanceDateRange {
  const since = dateFrom ? new Date(dateFrom) : getPeriodStart(period);
  const until = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
  return { since, until };
}

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
            dateTime: {
              ...(range.since ? { gte: range.since } : {}),
              ...(range.until ? { lte: range.until } : {}),
            },
          },
          select: {
            payment: {
              select: {
                finalAmount: true,
                currency: true,
                status: true,
                exchangeRateToUsd: true,
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
        (sum, p) => sum + paymentToUsd(p.finalAmount, p.currency, p.exchangeRateToUsd, rates),
        0,
      );
      const totalOwedUsd = approvedPayments.reduce(
        (sum, p) => sum + (p.payoutAmountUsd ?? 0),
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
        sessionCount,
      };
    })
    .sort((a, b) => b.totalRevenueUsd - a.totalRevenueUsd);
}

export type FinancePsychologist = Awaited<ReturnType<typeof getFinanceByPsychologist>>[number];

export async function getFinanceSummary(range: FinanceDateRange) {
  const [payments, rates] = await Promise.all([
    prisma.payment.findMany({
      where: {
        status: "APPROVED",
        paidAt: {
          ...(range.since ? { gte: range.since } : {}),
          ...(range.until ? { lte: range.until } : {}),
        },
      },
      select: {
        currency: true,
        finalAmount: true,
        discountAmount: true,
        exchangeRateToUsd: true,
        payoutAmountUsd: true,
      },
    }),
    getUsdRateMap(),
  ]);

  const totalRevenueByCurrency = groupByCurrency(payments);
  const totalRevenueUsd = payments.reduce(
    (sum, p) => sum + paymentToUsd(p.finalAmount, p.currency, p.exchangeRateToUsd, rates),
    0,
  );
  const totalSessions = payments.length;
  const totalDiscountsUsd = payments.reduce(
    (sum, p) => sum + paymentToUsd(p.discountAmount, p.currency, p.exchangeRateToUsd, rates),
    0,
  );
  const totalOwedUsd = payments.reduce((sum, p) => sum + (p.payoutAmountUsd ?? 0), 0);
  const netRevenueUsd = totalRevenueUsd - totalOwedUsd;

  return {
    totalRevenueByCurrency,
    totalRevenueUsd,
    totalSessions,
    totalDiscountsUsd,
    totalOwedUsd,
    netRevenueUsd,
  };
}
