"use server";

import { requirePermission } from "@/lib/auth/require";
import { getGlobalCalendarRange } from "@/lib/admin/global-calendar-queries";

export async function getGlobalCalendarRangeAction(
    rangeStart: Date,
    rangeEnd: Date,
) {
    await requirePermission("appointment.read.all");
    return getGlobalCalendarRange(rangeStart, rangeEnd);
}
