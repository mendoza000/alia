"use server";

import { prisma } from "@/lib/db";
import { getCachedFreeBusyPeriods } from "@/lib/google-calendar";
import {
    appointmentsToBusyPeriods,
    computeMonthAvailability,
    type MonthAvailability,
} from "@/lib/availability";
import { getBlockingAppointments } from "@/lib/queries/appointments";
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

    const [calendarBusy, appointments] = await Promise.all([
        psychologist.calendarId
            ? getCachedFreeBusyPeriods(
                  psychologist.calendarId,
                  timeMin,
                  timeMax,
              )
            : Promise.resolve([]),
        getBlockingAppointments(psychologist.id, timeMin, timeMax),
    ]);

    const allBusyPeriods = [
        ...calendarBusy,
        ...appointmentsToBusyPeriods(appointments),
    ];

    return computeMonthAvailability(
        psychologist.schedules,
        allBusyPeriods,
        year,
        month,
        psychologist.sessionDuration,
    );
}
