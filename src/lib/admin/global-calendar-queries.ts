import { prisma } from "@/lib/db";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export type GlobalCalendarAppointment = {
    id: string;
    dateTime: Date;
    endTime: Date;
    status: AppointmentStatus;
    patientName: string;
    psychologistId: string;
    psychologistName: string;
};

/** Cross-psychologist counterpart to getPsychologistCalendarRange, for the
 * admin's global calendar (/admin/calendario) — same lightweight select,
 * just without the psychologistId filter. */
export async function getGlobalCalendarRange(
    rangeStart: Date,
    rangeEnd: Date,
): Promise<{ appointments: GlobalCalendarAppointment[] }> {
    const appointments = await prisma.appointment.findMany({
        where: {
            dateTime: { gte: rangeStart, lt: rangeEnd },
        },
        orderBy: { dateTime: "asc" },
        select: {
            id: true,
            dateTime: true,
            endTime: true,
            status: true,
            user: { select: { name: true } },
            psychologist: { select: { id: true, name: true } },
        },
    });

    return {
        appointments: appointments.map(a => ({
            id: a.id,
            dateTime: a.dateTime,
            endTime: a.endTime,
            status: a.status,
            patientName: a.user.name,
            psychologistId: a.psychologist.id,
            psychologistName: a.psychologist.name,
        })),
    };
}

export type PsychologistColorEntry = { id: string; name: string };

/** Stable, fixed roster used to assign each psychologist a distinct
 * categorical color slot in the global calendar — ordered by name so the
 * assignment stays predictable across sessions, not by insertion order. */
export async function getActivePsychologistRoster(): Promise<
    PsychologistColorEntry[]
> {
    return prisma.psychologist.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
    });
}
