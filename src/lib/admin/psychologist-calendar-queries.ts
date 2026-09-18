import { prisma } from "@/lib/db";
import type { AppointmentStatus } from "@/generated/prisma/enums";
import { getTimeOffOverlapping } from "@/lib/admin/time-off-actions";

export type PsychologistCalendarAppointment = {
    id: string;
    dateTime: Date;
    endTime: Date;
    status: AppointmentStatus;
    patientName: string;
};

/** Lighter than getAllAppointments's `include` — this only feeds the
 * psychologist's own Schedule-X calendar, not the full citas table.
 * `rangeStart`/`rangeEnd` are whatever visible range the calendar is
 * currently showing (a month, a week, or a day). */
export async function getPsychologistCalendarRange(
    psychologistId: string,
    rangeStart: Date,
    rangeEnd: Date,
): Promise<{
    appointments: PsychologistCalendarAppointment[];
    timeOffs: Awaited<ReturnType<typeof getTimeOffOverlapping>>;
}> {
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
