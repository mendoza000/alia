import { TZDate } from "@date-fns/tz";
import { prisma } from "@/lib/db";
import { CARACAS_TZ } from "@/lib/availability";
import { getTimeOffOverlapping } from "@/lib/admin/time-off-actions";

export type PsychologistCalendarAppointment = {
    id: string;
    dateTime: Date;
    endTime: Date;
    status: string;
    patientName: string;
};

/** Lighter than getAllAppointments's `include` — this only feeds the day
 * panel of the psychologist's own calendar, not the full citas table. */
export async function getPsychologistCalendarMonth(
    psychologistId: string,
    year: number,
    month: number,
): Promise<{
    appointments: PsychologistCalendarAppointment[];
    timeOffs: Awaited<ReturnType<typeof getTimeOffOverlapping>>;
}> {
    const rangeStart = new TZDate(year, month - 1, 1, CARACAS_TZ);
    const rangeEnd = new TZDate(year, month, 1, CARACAS_TZ);

    const [appointments, timeOffs] = await Promise.all([
        prisma.appointment.findMany({
            where: {
                psychologistId,
                dateTime: { gte: rangeStart, lt: rangeEnd },
            },
            orderBy: { dateTime: "asc" },
            select: {
                id: true,
                dateTime: true,
                endTime: true,
                status: true,
                user: { select: { name: true } },
            },
        }),
        getTimeOffOverlapping(psychologistId, rangeStart, rangeEnd),
    ]);

    return {
        appointments: appointments.map(a => ({
            id: a.id,
            dateTime: a.dateTime,
            endTime: a.endTime,
            status: a.status,
            patientName: a.user.name,
        })),
        timeOffs,
    };
}
