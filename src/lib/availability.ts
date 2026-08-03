import type { Schedule } from "@/generated/prisma/client";
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    getDay,
    format,
    isBefore,
    startOfDay,
} from "date-fns";
import { TZDate } from "@date-fns/tz";

export type TimeSlot = { start: string; end: string };

export type DayAvailability = {
    date: string; // "YYYY-MM-DD"
    status: "available" | "fully_booked" | "no_schedule";
    slots: TimeSlot[];
};

export type MonthAvailability = Record<string, DayAvailability>;

// Reference timezone for interpreting a psychologist's Schedule
// (startTime/endTime wall-clock strings) and for "today" cutoffs — the
// psychologists and admin team operate out of Venezuela.
export const CARACAS_TZ = "America/Caracas";

function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function getScheduleForDay(
    schedules: Schedule[],
    dayOfWeek: number,
): Schedule[] {
    return schedules.filter(s => s.isActive && s.dayOfWeek === dayOfWeek);
}

export function generateTimeSlots(
    blocks: Schedule[],
    sessionDuration: number,
): TimeSlot[] {
    const slots: TimeSlot[] = [];

    for (const block of blocks) {
        const blockStart = timeToMinutes(block.startTime);
        const blockEnd = timeToMinutes(block.endTime);

        let current = blockStart;
        while (current + sessionDuration <= blockEnd) {
            slots.push({
                start: minutesToTime(current),
                end: minutesToTime(current + sessionDuration),
            });
            current += sessionDuration;
        }
    }

    return slots;
}

export function appointmentsToBusyPeriods(
    appointments: { dateTime: Date; endTime: Date }[],
): { start: Date; end: Date }[] {
    return appointments.map(a => ({ start: a.dateTime, end: a.endTime }));
}

export function filterPastSlots(
    slots: TimeSlot[],
    dateStr: string,
    now: Date,
): TimeSlot[] {
    const nowInCaracas = new TZDate(now, CARACAS_TZ);
    const todayStr = format(nowInCaracas, "yyyy-MM-dd");

    if (dateStr !== todayStr) return slots;

    const nowMinutes = nowInCaracas.getHours() * 60 + nowInCaracas.getMinutes();
    return slots.filter(slot => timeToMinutes(slot.start) > nowMinutes);
}

// TZDate's string constructor parses the naive string using the runtime's
// system timezone (like `new Date(string)`) — it does NOT interpret it as
// wall-clock time in the given zone. Only the numeric constructor does that.
export function toCaracasDate(dateStr: string, time: string): TZDate {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    return new TZDate(year, month - 1, day, hour, minute, 0, CARACAS_TZ);
}

export function subtractBusyPeriods(
    slots: TimeSlot[],
    busyPeriods: { start: Date; end: Date }[],
    dateStr: string,
): TimeSlot[] {
    if (busyPeriods.length === 0) return slots;

    return slots.filter(slot => {
        const slotStart = toCaracasDate(dateStr, slot.start);
        const slotEnd = toCaracasDate(dateStr, slot.end);

        return !busyPeriods.some(busy => {
            return slotStart < busy.end && slotEnd > busy.start;
        });
    });
}

export const DAILY_CONFIRMED_APPOINTMENT_CAP = 5;

export function computeMonthAvailability(
    schedules: Schedule[],
    busyPeriods: { start: Date; end: Date }[],
    year: number,
    month: number,
    sessionDuration: number,
    confirmedCountByDate: Record<string, number> = {},
): MonthAvailability {
    const firstDay = new TZDate(year, month - 1, 1, CARACAS_TZ);
    const lastDay = endOfMonth(firstDay);
    const days = eachDayOfInterval({
        start: startOfMonth(firstDay),
        end: lastDay,
    });

    const now = new TZDate(new Date(), CARACAS_TZ);
    const todayStart = startOfDay(now);

    const result: MonthAvailability = {};

    for (const day of days) {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayOfWeek = getDay(day);

        // Past days
        if (isBefore(day, todayStart)) {
            result[dateStr] = {
                date: dateStr,
                status: "no_schedule",
                slots: [],
            };
            continue;
        }

        const daySchedules = getScheduleForDay(schedules, dayOfWeek);

        if (daySchedules.length === 0) {
            result[dateStr] = {
                date: dateStr,
                status: "no_schedule",
                slots: [],
            };
            continue;
        }

        if ((confirmedCountByDate[dateStr] ?? 0) >= DAILY_CONFIRMED_APPOINTMENT_CAP) {
            result[dateStr] = {
                date: dateStr,
                status: "fully_booked",
                slots: [],
            };
            continue;
        }

        const allSlots = generateTimeSlots(daySchedules, sessionDuration);
        const afterBusy = subtractBusyPeriods(allSlots, busyPeriods, dateStr);
        const availableSlots = filterPastSlots(afterBusy, dateStr, now);

        result[dateStr] = {
            date: dateStr,
            status: availableSlots.length > 0 ? "available" : "fully_booked",
            slots: availableSlots,
        };
    }

    return result;
}
