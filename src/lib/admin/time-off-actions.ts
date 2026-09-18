"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireActor, requireScheduleAccess } from "@/lib/auth/require";
import { createTimeOffEvent, deleteTimeOffEvent } from "@/lib/calendar-events";

export async function getTimeOffForPsychologist(psychologistId: string) {
    return prisma.timeOff.findMany({
        where: { psychologistId },
        orderBy: { startsAt: "asc" },
    });
}

/** Used by every availability call site (public profile, /agendar,
 * manual booking) to fold a psychologist's days off into the same
 * busyPeriods array built from calendar freebusy + existing appointments. */
export async function getTimeOffOverlapping(
    psychologistId: string,
    rangeStart: Date,
    rangeEnd: Date,
) {
    return prisma.timeOff.findMany({
        where: {
            psychologistId,
            startsAt: { lt: rangeEnd },
            endsAt: { gt: rangeStart },
        },
    });
}

export async function createTimeOff(
    psychologistId: string,
    input: { startsAt: Date; endsAt: Date; reason?: string },
): Promise<void> {
    const actor = await requireActor();
    await requireScheduleAccess(actor, psychologistId);

    if (input.endsAt <= input.startsAt) {
        throw new Error("La fecha de fin debe ser posterior a la de inicio");
    }

    const timeOff = await prisma.timeOff.create({
        data: {
            psychologistId,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            reason: input.reason || null,
        },
    });

    await createTimeOffEvent(timeOff.id);

    revalidatePath("/admin/mi-calendario");
}

export async function deleteTimeOff(id: string): Promise<void> {
    const actor = await requireActor();

    // The authorization check must run against the TimeOff row's actual
    // owner, not a psychologistId the client could supply — otherwise a
    // psychologist could pass their own id to pass requireScheduleAccess
    // while deleting a day off that belongs to someone else.
    const timeOff = await prisma.timeOff.findUnique({ where: { id } });
    if (!timeOff) return;
    await requireScheduleAccess(actor, timeOff.psychologistId);

    await deleteTimeOffEvent(id);
    await prisma.timeOff.delete({ where: { id } });

    revalidatePath("/admin/mi-calendario");
}
