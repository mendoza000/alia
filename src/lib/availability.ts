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

const BOGOTA_TZ = "America/Bogota";

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

export function subtractBusyPeriods(
    slots: TimeSlot[],
    busyPeriods: { start: Date; end: Date }[],
    dateStr: string,
): TimeSlot[] {
    if (busyPeriods.length === 0) return slots;

    return slots.filter(slot => {
        const slotStart = new TZDate(`${dateStr}T${slot.start}:00`, BOGOTA_TZ);
        const slotEnd = new TZDate(`${dateStr}T${slot.end}:00`, BOGOTA_TZ);

        return !busyPeriods.some(busy => {
            return slotStart < busy.end && slotEnd > busy.start;
        });
    });
}

export function computeMonthAvailability(
    schedules: Schedule[],
    busyPeriods: { start: Date; end: Date }[],
    year: number,
    month: number,
    sessionDuration: number,
): MonthAvailability {
    const firstDay = new TZDate(year, month - 1, 1, BOGOTA_TZ);
    const lastDay = endOfMonth(firstDay);
    const days = eachDayOfInterval({
        start: startOfMonth(firstDay),
        end: lastDay,
    });

    const now = new TZDate(new Date(), BOGOTA_TZ);
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

        const allSlots = generateTimeSlots(daySchedules, sessionDuration);
        const availableSlots = subtractBusyPeriods(
            allSlots,
            busyPeriods,
            dateStr,
        );

        result[dateStr] = {
            date: dateStr,
            status: availableSlots.length > 0 ? "available" : "fully_booked",
            slots: availableSlots,
        };
    }

    return result;
}
