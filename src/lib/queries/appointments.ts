import { prisma } from "@/lib/db";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { CARACAS_TZ } from "@/lib/availability";

export async function getConfirmedCountsByDate(
    psychologistId: string,
    timeMin: Date,
    timeMax: Date,
): Promise<Record<string, number>> {
    const appointments = await prisma.appointment.findMany({
        where: {
            psychologistId,
            status: "CONFIRMED",
            dateTime: { gte: timeMin, lte: timeMax },
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
) {
    const now = new Date();

    return prisma.appointment.findMany({
        where: {
            psychologistId,
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
        select: { dateTime: true, endTime: true },
    });
}
