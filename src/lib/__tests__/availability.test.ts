import { describe, it, expect } from "vitest";
import { TZDate } from "@date-fns/tz";
import {
    getScheduleForDay,
    generateTimeSlots,
    subtractBusyPeriods,
    filterPastSlots,
    appointmentsToBusyPeriods,
    computeMonthAvailability,
} from "../availability";
import type { Schedule } from "@/generated/prisma/client";

function makeSchedule(
    overrides: Partial<Schedule> & {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    },
): Schedule {
    return {
        id: "sched-1",
        psychologistId: "psy-1",
        isActive: true,
        ...overrides,
    };
}

/**
 * Create a plain Date that matches how subtractBusyPeriods builds slot dates
 * internally (using TZDate string constructor).
 */
function slotDate(dateStr: string, time: string): Date {
    return new Date(
        new TZDate(`${dateStr}T${time}:00`, "America/Bogota").getTime(),
    );
}

describe("getScheduleForDay", () => {
    const schedules = [
        makeSchedule({
            id: "s1",
            dayOfWeek: 1,
            startTime: "09:00",
            endTime: "12:00",
        }),
        makeSchedule({
            id: "s2",
            dayOfWeek: 1,
            startTime: "14:00",
            endTime: "18:00",
        }),
        makeSchedule({
            id: "s3",
            dayOfWeek: 2,
            startTime: "09:00",
            endTime: "12:00",
        }),
        makeSchedule({
            id: "s4",
            dayOfWeek: 1,
            startTime: "08:00",
            endTime: "10:00",
            isActive: false,
        }),
    ];

    it("returns only active schedules for the given day", () => {
        const result = getScheduleForDay(schedules, 1);
        expect(result).toHaveLength(2);
        expect(result.map(s => s.id)).toEqual(["s1", "s2"]);
    });

    it("returns empty array for day with no schedules", () => {
        expect(getScheduleForDay(schedules, 5)).toEqual([]);
    });

    it("excludes inactive schedules", () => {
        const result = getScheduleForDay(schedules, 1);
        expect(result.every(s => s.isActive)).toBe(true);
    });
});

describe("generateTimeSlots", () => {
    it("generates correct slots for a single block", () => {
        const blocks = [
            makeSchedule({
                dayOfWeek: 1,
                startTime: "09:00",
                endTime: "12:00",
            }),
        ];
        const slots = generateTimeSlots(blocks, 60);
        expect(slots).toEqual([
            { start: "09:00", end: "10:00" },
            { start: "10:00", end: "11:00" },
            { start: "11:00", end: "12:00" },
        ]);
    });

    it("does not generate partial slots", () => {
        const blocks = [
            makeSchedule({
                dayOfWeek: 1,
                startTime: "09:00",
                endTime: "10:30",
            }),
        ];
        const slots = generateTimeSlots(blocks, 60);
        expect(slots).toEqual([{ start: "09:00", end: "10:00" }]);
    });

    it("handles multiple blocks", () => {
        const blocks = [
            makeSchedule({
                id: "s1",
                dayOfWeek: 1,
                startTime: "09:00",
                endTime: "11:00",
            }),
            makeSchedule({
                id: "s2",
                dayOfWeek: 1,
                startTime: "14:00",
                endTime: "16:00",
            }),
        ];
        const slots = generateTimeSlots(blocks, 60);
        expect(slots).toHaveLength(4);
        expect(slots[0].start).toBe("09:00");
        expect(slots[2].start).toBe("14:00");
    });

    it("handles 45-minute sessions", () => {
        const blocks = [
            makeSchedule({
                dayOfWeek: 1,
                startTime: "09:00",
                endTime: "12:00",
            }),
        ];
        const slots = generateTimeSlots(blocks, 45);
        expect(slots).toHaveLength(4);
    });
});

describe("subtractBusyPeriods", () => {
    const dateStr = "2026-07-06"; // A future date to avoid "today" issues

    it("returns all slots when no busy periods", () => {
        const slots = [
            { start: "09:00", end: "10:00" },
            { start: "10:00", end: "11:00" },
        ];
        expect(subtractBusyPeriods(slots, [], dateStr)).toEqual(slots);
    });

    it("removes slot overlapping with busy period", () => {
        const slots = [
            { start: "09:00", end: "10:00" },
            { start: "10:00", end: "11:00" },
            { start: "11:00", end: "12:00" },
        ];
        // Block 10:00-11:00
        const busyPeriods = [
            {
                start: slotDate("2026-07-06", "10:00"),
                end: slotDate("2026-07-06", "11:00"),
            },
        ];
        const result = subtractBusyPeriods(slots, busyPeriods, dateStr);
        expect(result).toHaveLength(2);
        expect(result.map(s => s.start)).toEqual(["09:00", "11:00"]);
    });

    it("removes multiple slots overlapping a long busy period", () => {
        const slots = [
            { start: "09:00", end: "10:00" },
            { start: "10:00", end: "11:00" },
            { start: "11:00", end: "12:00" },
        ];
        // Block 09:00-11:00
        const busyPeriods = [
            {
                start: slotDate("2026-07-06", "09:00"),
                end: slotDate("2026-07-06", "11:00"),
            },
        ];
        const result = subtractBusyPeriods(slots, busyPeriods, dateStr);
        expect(result).toHaveLength(1);
        expect(result[0].start).toBe("11:00");
    });
});

describe("filterPastSlots", () => {
    it("filters out past slots on today", () => {
        const slots = [
            { start: "09:00", end: "10:00" },
            { start: "10:00", end: "11:00" },
            { start: "14:00", end: "15:00" },
            { start: "16:00", end: "17:00" },
        ];
        // Simulate "now" as 14:30 Bogota
        const now = new Date(
            new TZDate(2026, 6, 6, 14, 30, 0, "America/Bogota").getTime(),
        );
        const result = filterPastSlots(slots, "2026-07-06", now);
        expect(result).toHaveLength(1);
        expect(result[0].start).toBe("16:00");
    });

    it("returns all slots for a future date", () => {
        const slots = [
            { start: "09:00", end: "10:00" },
            { start: "10:00", end: "11:00" },
        ];
        const now = new Date(
            new TZDate(2026, 6, 6, 14, 30, 0, "America/Bogota").getTime(),
        );
        const result = filterPastSlots(slots, "2026-07-07", now);
        expect(result).toEqual(slots);
    });

    it("returns empty when all slots are past", () => {
        const slots = [
            { start: "09:00", end: "10:00" },
            { start: "10:00", end: "11:00" },
        ];
        const now = new Date(
            new TZDate(2026, 6, 6, 17, 0, 0, "America/Bogota").getTime(),
        );
        const result = filterPastSlots(slots, "2026-07-06", now);
        expect(result).toEqual([]);
    });
});

describe("appointmentsToBusyPeriods", () => {
    it("maps appointment shape to busy period shape", () => {
        const d1 = slotDate("2026-07-06", "09:00");
        const d2 = slotDate("2026-07-06", "10:00");
        const d3 = slotDate("2026-07-06", "11:00");
        const d4 = slotDate("2026-07-06", "12:00");
        const appointments = [
            { dateTime: d1, endTime: d2 },
            { dateTime: d3, endTime: d4 },
        ];
        const result = appointmentsToBusyPeriods(appointments);
        expect(result).toEqual([
            { start: d1, end: d2 },
            { start: d3, end: d4 },
        ]);
    });

    it("returns empty for empty input", () => {
        expect(appointmentsToBusyPeriods([])).toEqual([]);
    });
});

describe("computeMonthAvailability", () => {
    // Use July 2026 — far enough in the future to avoid "today" filtering
    const year = 2026;
    const month = 7;

    // Monday (dayOfWeek=1) schedules only
    const schedules = [
        makeSchedule({
            id: "s1",
            dayOfWeek: 1,
            startTime: "09:00",
            endTime: "12:00",
        }),
    ];

    it("marks days with no schedule as no_schedule", () => {
        const result = computeMonthAvailability(schedules, [], year, month, 60);
        // July 1 2026 is Wednesday — no Monday schedule
        expect(result["2026-07-01"].status).toBe("no_schedule");
    });

    it("marks days with schedule as available when no busy periods", () => {
        const result = computeMonthAvailability(schedules, [], year, month, 60);
        // July 6 2026 is Monday
        expect(result["2026-07-06"].status).toBe("available");
        expect(result["2026-07-06"].slots.length).toBeGreaterThan(0);
    });

    it("marks day as fully_booked when all slots are busy", () => {
        const busyPeriods = [
            {
                start: slotDate("2026-07-06", "09:00"),
                end: slotDate("2026-07-06", "12:00"),
            },
        ];
        const result = computeMonthAvailability(
            schedules,
            busyPeriods,
            year,
            month,
            60,
        );
        expect(result["2026-07-06"].status).toBe("fully_booked");
        expect(result["2026-07-06"].slots).toHaveLength(0);
    });

    it("returns entries for every day of the month", () => {
        const result = computeMonthAvailability(schedules, [], year, month, 60);
        // July has 31 days
        expect(Object.keys(result)).toHaveLength(31);
    });
});
