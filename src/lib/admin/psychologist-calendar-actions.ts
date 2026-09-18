"use server";

import { requireActor, requireScheduleAccess } from "@/lib/auth/require";
import { getPsychologistCalendarMonth } from "@/lib/admin/psychologist-calendar-queries";

export async function getPsychologistCalendarMonthAction(
    psychologistId: string,
    year: number,
    month: number,
) {
    const actor = await requireActor();
    await requireScheduleAccess(actor, psychologistId);

    return getPsychologistCalendarMonth(psychologistId, year, month);
}
