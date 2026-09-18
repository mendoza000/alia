import { prisma } from "@/lib/db";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { CARACAS_TZ } from "@/lib/availability";

export async function getConfirmedCountsByDate(
    psychologistId: string,
    timeMin: Date,
    timeMax: Date,
    excludeAppointmentId?: string,
): Promise<Record<string, number>> {
    const appointments = await prisma.appointment.findMany({
        where: {
            psychologistId,
            status: "CONFIRMED",
            dateTime: { gte: timeMin, lte: timeMax },
            ...(excludeAppointmentId
                ? { id: { not: excludeAppointmentId } }
                : {}),
        },
        select: { dateTime: true },
    });

    const counts: Record<string, number> = {};
    for (const a of appointments) {
        const dateStr = format(
            new TZDate(a.dateTime, CARACAS_TZ),
            "yyyy-MM-dd",
        );
        counts[dateStr] = (counts[dateStr] ?? 0) + 1;
    }
    return counts;
}

export async function getBlockingAppointments(
    psychologistId: string,
    timeMin: Date,
    timeMax: Date,
    excludeAppointmentId?: string,
) {
    const now = new Date();

    return prisma.appointment.findMany({
        where: {
            psychologistId,
            dateTime: { lt: timeMax },
            endTime: { gt: timeMin },
            ...(excludeAppointmentId
                ? { id: { not: excludeAppointmentId } }
                : {}),
            OR: [
                { status: "CONFIRMED" },
                {
                    status: "PENDING_FORM",
                    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                },
            ],
        },
        select: { dateTime: true, endTime: true },
    });
}

/** Batched sibling of getConfirmedCountsByDate — one query for N candidates
 * instead of N queries, for the Fase 7.1 match engine's aggregated
 * calendar/load-balancing (same "collect IDs, one findMany({in}), group in
 * memory" pattern as approval-queries.ts's getApprovals). */
export async function getConfirmedCountsByDateForPsychologists(
    psychologistIds: string[],
    timeMin: Date,
    timeMax: Date,
): Promise<Map<string, Record<string, number>>> {
    if (psychologistIds.length === 0) return new Map();

    const appointments = await prisma.appointment.findMany({
        where: {
            psychologistId: { in: psychologistIds },
            status: "CONFIRMED",
            dateTime: { gte: timeMin, lte: timeMax },
        },
        select: { psychologistId: true, dateTime: true },
    });

    const map = new Map<string, Record<string, number>>();
    for (const a of appointments) {
        const dateStr = format(
            new TZDate(a.dateTime, CARACAS_TZ),
            "yyyy-MM-dd",
        );
        const counts = map.get(a.psychologistId) ?? {};
        counts[dateStr] = (counts[dateStr] ?? 0) + 1;
        map.set(a.psychologistId, counts);
    }
    return map;
}

/** Batched sibling of getBlockingAppointments — same rationale as above. */
export async function getBlockingAppointmentsForPsychologists(
    psychologistIds: string[],
    timeMin: Date,
    timeMax: Date,
): Promise<Map<string, { dateTime: Date; endTime: Date }[]>> {
    if (psychologistIds.length === 0) return new Map();

    const now = new Date();
    const appointments = await prisma.appointment.findMany({
        where: {
            psychologistId: { in: psychologistIds },
            dateTime: { lt: timeMax },
            endTime: { gt: timeMin },
            OR: [
                { status: "CONFIRMED" },
                {
                    status: "PENDING_FORM",
                    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                },
            ],
        },
        select: { psychologistId: true, dateTime: true, endTime: true },
    });

    const map = new Map<string, { dateTime: Date; endTime: Date }[]>();
    for (const a of appointments) {
        const list = map.get(a.psychologistId) ?? [];
        list.push({ dateTime: a.dateTime, endTime: a.endTime });
        map.set(a.psychologistId, list);
    }
    return map;
}
