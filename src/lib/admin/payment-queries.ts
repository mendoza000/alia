import { prisma } from "@/lib/db";
import type { PaymentStatus } from "@/generated/prisma/enums";
import type { DateRange } from "@/lib/admin/date-range";

export type PaymentFilters = {
  status?: PaymentStatus;
  psychologistId?: string;
  range?: DateRange;
};

export async function getAllPayments(filters: PaymentFilters = {}) {
  const where: Record<string, unknown> = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.range?.since || filters.range?.until) {
    // createdAt (not paidAt) so PENDING payments — which never got a paidAt —
    // still show up under a date filter like the default "Hoy".
    where.createdAt = {
      ...(filters.range.since ? { gte: filters.range.since } : {}),
      ...(filters.range.until ? { lte: filters.range.until } : {}),
    };
  }

  if (filters.psychologistId) {
    where.appointment = { psychologistId: filters.psychologistId };
  }

  return prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      coupon: { select: { code: true, discountPercent: true } },
      appointment: {
        select: {
          id: true,
          dateTime: true,
          user: { select: { name: true, email: true } },
          psychologist: { select: { name: true } },
        },
      },
    },
  });
}

export type PaymentRow = Awaited<ReturnType<typeof getAllPayments>>[number];

export type RevenueFilters = {
  range?: DateRange;
  psychologistId?: string;
};

// Canonical "recaudado" definition, shared with /admin/finanzas: paid within
// range and tied to an appointment that wasn't cancelled, so a refunded or
// cancelled session's payment doesn't count as collected revenue.
export async function getApprovedRevenuePayments(filters: RevenueFilters = {}) {
  const where: Record<string, unknown> = {
    status: "APPROVED",
    appointment: {
      status: { in: ["CONFIRMED", "COMPLETED"] },
      ...(filters.psychologistId ? { psychologistId: filters.psychologistId } : {}),
    },
  };

  if (filters.range?.since || filters.range?.until) {
    where.paidAt = {
      ...(filters.range.since ? { gte: filters.range.since } : {}),
      ...(filters.range.until ? { lte: filters.range.until } : {}),
    };
  }

  return prisma.payment.findMany({
    where,
    select: {
      finalAmount: true,
      currency: true,
      discountAmount: true,
      exchangeRateToUsd: true,
      stripeSettledAmountUsd: true,
      stripeFeeUsd: true,
      payoutAmountUsd: true,
    },
  });
}
