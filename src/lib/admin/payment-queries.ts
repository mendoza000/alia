import { prisma } from "@/lib/db";
import type { PaymentStatus } from "@/generated/prisma/enums";

export type PaymentFilters = {
  status?: PaymentStatus;
  psychologistId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function getAllPayments(filters: PaymentFilters = {}) {
  const where: Record<string, unknown> = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.paidAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(`${filters.dateTo}T23:59:59`) } : {}),
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
