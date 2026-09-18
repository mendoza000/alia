"use server";

import { requireActor, requireScheduleAccess } from "@/lib/auth/require";
import { getPsychologistCalendarRange } from "@/lib/admin/psychologist-calendar-queries";

export async function getPsychologistCalendarRangeAction(
    psychologistId: string,
    rangeStart: Date,
    rangeEnd: Date,
) {
    const actor = await requireActor();
    await requireScheduleAccess(actor, psychologistId);

    return getPsychologistCalendarRange(psychologistId, rangeStart, rangeEnd);
}
