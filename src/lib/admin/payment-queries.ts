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
        const dateFilter = {
            ...(filters.range.since ? { gte: filters.range.since } : {}),
            ...(filters.range.until ? { lte: filters.range.until } : {}),
        };
        // paidAt for settled payments so the date filter matches when the money
        // actually moved; createdAt only as a fallback for PENDING payments
        // (which never got a paidAt) so they still show up under "Hoy" etc.
        where.OR = [
            { paidAt: dateFilter },
            { status: "PENDING", createdAt: dateFilter },
        ];
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
                    status: true,
                    agreedAmount: true,
                    agreedCurrency: true,
                    agreedPayoutType: true,
                    user: { select: { name: true, email: true } },
                    psychologist: { select: { name: true } },
                },
            },
        },
    });
}

export type PaymentRow = Awaited<ReturnType<typeof getAllPayments>>[number];
