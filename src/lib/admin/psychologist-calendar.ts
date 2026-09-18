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

/** Excludes CANCELLED so the month-view badge isn't noisy with sessions that
 * no longer need the psychologist's attention. */
export function countAppointmentsByDate(
    appointments: { dateTime: Date; status: string }[],
): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const appointment of appointments) {
        if (appointment.status === "CANCELLED") continue;
        const key = caracasDateKey(appointment.dateTime);
        counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
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
