import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { CARACAS_TZ, toCaracasDate } from "@/lib/availability";

function caracasDateKey(date: Date): string {
    return format(new TZDate(date, CARACAS_TZ), "yyyy-MM-dd");
}

export function groupAppointmentsByDate<T extends { dateTime: Date }>(
    appointments: T[],
): Record<string, T[]> {
    const result: Record<string, T[]> = {};
    for (const appointment of appointments) {
        const key = caracasDateKey(appointment.dateTime);
        (result[key] ??= []).push(appointment);
    }
    return result;
}

export function getTimeOffBlocksForDate<
    T extends { startsAt: Date; endsAt: Date },
>(timeOffs: T[], dateStr: string): T[] {
    const dayStart = toCaracasDate(dateStr, "00:00");
    const dayEnd = toCaracasDate(dateStr, "23:59");
    return timeOffs.filter(t => t.startsAt <= dayEnd && t.endsAt >= dayStart);
}

export function isWholeDayBlocked(
    timeOffs: { startsAt: Date; endsAt: Date }[],
    dateStr: string,
): boolean {
    const dayStart = toCaracasDate(dateStr, "00:00");
    const dayEnd = toCaracasDate(dateStr, "23:59");
    return timeOffs.some(t => t.startsAt <= dayStart && t.endsAt >= dayEnd);
}

/** Distinguishes a whole-day(s) TimeOff (created via "Marcar todo el día
 * libre" or the multi-day TimeOffEditor, both of which start at Caracas
 * 00:00 and end at Caracas 23:59[:59]) from an hour-level block — the
 * calendar renders the former as an all-day banner and the latter as a
 * timed block, same distinction Google Calendar makes. */
export function isFullDayTimeOff(timeOff: {
    startsAt: Date;
    endsAt: Date;
}): boolean {
    const start = new TZDate(timeOff.startsAt, CARACAS_TZ);
    const end = new TZDate(timeOff.endsAt, CARACAS_TZ);
    const startsAtMidnight = start.getHours() === 0 && start.getMinutes() === 0;
    const endsAtEndOfDay = end.getHours() === 23 && end.getMinutes() === 59;
    return startsAtMidnight && endsAtEndOfDay;
}
