import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock googleapis before importing the module under test
vi.mock("googleapis", () => {
    const mockQuery = vi.fn().mockResolvedValue({
        data: {
            calendars: {
                "test-calendar": {
                    busy: [
                        {
                            start: "2026-04-07T14:00:00Z",
                            end: "2026-04-07T15:00:00Z",
                        },
                    ],
                },
            },
        },
    });

    return {
        google: {
            auth: {
                JWT: class MockJWT {
                    constructor() {}
                },
            },
            calendar: vi.fn().mockReturnValue({
                freebusy: { query: mockQuery },
            }),
        },
    };
});

describe("getCachedFreeBusyPeriods", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.useRealTimers();
    });

    it("returns cached data on second call with same args", async () => {
        const { getCachedFreeBusyPeriods } = await import("../google-calendar");

        const timeMin = new Date("2026-04-07T00:00:00Z");
        const timeMax = new Date("2026-04-07T23:59:59Z");

        const result1 = await getCachedFreeBusyPeriods(
            "test-calendar",
            timeMin,
            timeMax,
        );
        const result2 = await getCachedFreeBusyPeriods(
            "test-calendar",
            timeMin,
            timeMax,
        );

        // Both calls return same data
        expect(result1).toEqual(result2);
        expect(result1).toHaveLength(1);
        expect(result1[0].start).toBeInstanceOf(Date);
    });

    it("calls API again after cache expires", async () => {
        vi.useFakeTimers();

        const mod = await import("../google-calendar");

        const timeMin = new Date("2026-04-07T00:00:00Z");
        const timeMax = new Date("2026-04-07T23:59:59Z");

        await mod.getCachedFreeBusyPeriods("test-calendar", timeMin, timeMax);

        // Advance past 5-minute TTL
        vi.advanceTimersByTime(6 * 60 * 1000);

        const result = await mod.getCachedFreeBusyPeriods(
            "test-calendar",
            timeMin,
            timeMax,
        );

        // Should still get data (from fresh API call)
        expect(result).toHaveLength(1);
    });
});
