"use server";

import { prisma } from "@/lib/db";
import { getFreeBusyPeriods } from "@/lib/google-calendar";
import {
    computeMonthAvailability,
    type MonthAvailability,
} from "@/lib/availability";
import { TZDate } from "@date-fns/tz";
import { endOfMonth, startOfMonth } from "date-fns";

export async function getMonthAvailability(
    psychologistId: string,
    year: number,
    month: number,
): Promise<MonthAvailability> {
    const psychologist = await prisma.psychologist.findUnique({
        where: { id: psychologistId },
        include: {
            schedules: { where: { isActive: true } },
        },
    });

    if (!psychologist) return {};

    const firstDay = new TZDate(year, month - 1, 1, "America/Bogota");
    const timeMin = startOfMonth(firstDay);
    const timeMax = endOfMonth(firstDay);

    let busyPeriods: { start: Date; end: Date }[] = [];

    if (psychologist.calendarId) {
        busyPeriods = await getFreeBusyPeriods(
            psychologist.calendarId,
            timeMin,
            timeMax,
        );
    }

    return computeMonthAvailability(
        psychologist.schedules,
        busyPeriods,
        year,
        month,
        psychologist.sessionDuration,
    );
}
