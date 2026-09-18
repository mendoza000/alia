import { describe, it, expect } from "vitest";
import {
    groupAppointmentsByDate,
    getTimeOffBlocksForDate,
    isWholeDayBlocked,
    isFullDayTimeOff,
} from "../admin/psychologist-calendar";

describe("groupAppointmentsByDate", () => {
    it("groups appointments by their Caracas-local calendar day", () => {
        const result = groupAppointmentsByDate([
            { id: "a", dateTime: new Date("2026-01-15T02:00:00Z") }, // 2026-01-14 22:00 Caracas
            { id: "b", dateTime: new Date("2026-01-14T18:00:00Z") }, // 2026-01-14 14:00 Caracas
            { id: "c", dateTime: new Date("2026-01-15T14:00:00Z") }, // 2026-01-15 10:00 Caracas
        ]);
        expect(Object.keys(result).sort()).toEqual([
            "2026-01-14",
            "2026-01-15",
        ]);
        expect(result["2026-01-14"].map(a => a.id).sort()).toEqual(["a", "b"]);
        expect(result["2026-01-15"].map(a => a.id)).toEqual(["c"]);
    });

    it("returns an empty object for an empty list", () => {
        expect(groupAppointmentsByDate([])).toEqual({});
    });
});

describe("getTimeOffBlocksForDate", () => {
    const timeOffs = [
        {
            id: "t1",
            startsAt: new Date("2026-01-14T18:00:00Z"), // 14:00 Caracas
            endsAt: new Date("2026-01-14T20:00:00Z"), // 16:00 Caracas
        },
        {
            id: "t2",
            startsAt: new Date("2026-01-20T04:00:00Z"),
            endsAt: new Date("2026-01-20T20:00:00Z"),
        },
    ];

    it("returns only the TimeOff rows overlapping the given date", () => {
        const result = getTimeOffBlocksForDate(timeOffs, "2026-01-14");
        expect(result.map(t => t.id)).toEqual(["t1"]);
    });

    it("returns an empty array when nothing overlaps", () => {
        expect(getTimeOffBlocksForDate(timeOffs, "2026-01-15")).toEqual([]);
    });
});

describe("isWholeDayBlocked", () => {
    it("is true when a TimeOff row covers the entire Caracas day", () => {
        const timeOffs = [
            {
                id: "t1",
                startsAt: new Date("2026-01-14T04:00:00Z"), // 2026-01-14 00:00 Caracas
                endsAt: new Date("2026-01-15T03:59:00Z"), // 2026-01-14 23:59 Caracas
            },
        ];
        expect(isWholeDayBlocked(timeOffs, "2026-01-14")).toBe(true);
    });

    it("is false when a TimeOff row only blocks part of the day", () => {
        const timeOffs = [
            {
                id: "t1",
                startsAt: new Date("2026-01-14T18:00:00Z"), // 14:00 Caracas
                endsAt: new Date("2026-01-14T20:00:00Z"), // 16:00 Caracas
            },
        ];
        expect(isWholeDayBlocked(timeOffs, "2026-01-14")).toBe(false);
    });

    it("is false when there are no TimeOff rows for that day", () => {
        expect(isWholeDayBlocked([], "2026-01-14")).toBe(false);
    });
});

describe("isFullDayTimeOff", () => {
    it("is true for a Caracas 00:00-23:59 block (whole day)", () => {
        expect(
            isFullDayTimeOff({
                startsAt: new Date("2026-01-14T04:00:00Z"), // 00:00 Caracas
                endsAt: new Date("2026-01-15T03:59:00Z"), // 23:59 Caracas
            }),
        ).toBe(true);
    });

    it("is true for a multi-day vacation range (also 00:00-23:59 boundaries)", () => {
        expect(
            isFullDayTimeOff({
                startsAt: new Date("2026-01-14T04:00:00Z"), // 00:00 Caracas
                endsAt: new Date("2026-01-20T03:59:59Z"), // 2026-01-19 23:59:59 Caracas
            }),
        ).toBe(true);
    });

    it("is false for an hour-level block", () => {
        expect(
            isFullDayTimeOff({
                startsAt: new Date("2026-01-14T18:00:00Z"), // 14:00 Caracas
                endsAt: new Date("2026-01-14T20:00:00Z"), // 16:00 Caracas
            }),
        ).toBe(false);
    });
});
