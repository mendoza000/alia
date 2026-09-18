import { prisma } from "@/lib/db";
import type { AppointmentStatus } from "@/generated/prisma/enums";
import type { DateRange } from "@/lib/admin/date-range";

export type AppointmentFilters = {
    status?: AppointmentStatus;
    psychologistId?: string;
    range?: DateRange;
};

export async function getAllAppointments(filters: AppointmentFilters = {}) {
    const where: Record<string, unknown> = {};

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.psychologistId) {
        where.psychologistId = filters.psychologistId;
    }

    if (filters.range?.since || filters.range?.until) {
        where.dateTime = {
            ...(filters.range.since ? { gte: filters.range.since } : {}),
            ...(filters.range.until ? { lte: filters.range.until } : {}),
        };
    }

    return prisma.appointment.findMany({
        where,
        orderBy: { dateTime: "desc" },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    intakeForm: { select: { id: true } },
                },
            },
            psychologist: { select: { id: true, name: true, photoUrl: true } },
            payment: {
                select: {
                    id: true,
                    finalAmount: true,
                    currency: true,
                    status: true,
                    couponId: true,
                    stripeCheckoutUrl: true,
                    payoutType: true,
                    payoutRatePercent: true,
                    isNoShowFee: true,
                },
            },
        },
    });
}

export type AppointmentRow = Awaited<
    ReturnType<typeof getAllAppointments>
>[number];

export async function getAppointmentById(id: string) {
    return prisma.appointment.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    intakeForm: true,
                },
            },
            psychologist: {
                select: {
                    id: true,
                    name: true,
                    photoUrl: true,
                    specialty: true,
                },
            },
            payment: true,
        },
    });
}
