import { describe, it, expect } from "vitest";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import {
    isCandidateEligible,
    pickLeastLoadedPsychologist,
    caracasIsoWeekBounds,
    unionMonthAvailability,
    type MatchCandidateInput,
    type LoadInput,
} from "../availability/multi-psychologist";
import { toCaracasDate, CARACAS_TZ } from "../availability";
import type { Schedule } from "@/generated/prisma/client";
import type { MonthAvailability } from "../availability";

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

// 2026-07-29 is a Wednesday (dayOfWeek 3) — far enough in the future to
// avoid "today"/lead-time filtering interference, same choice as
// availability.test.ts.
function makeCandidate(
    overrides: Partial<MatchCandidateInput> = {},
): MatchCandidateInput {
    return {
        psychologistId: "psy-1",
        offeredSessionTypes: ["INDIVIDUAL"],
        schedules: [
            makeSchedule({
                dayOfWeek: 3,
                startTime: "09:00",
                endTime: "17:00",
            }),
        ],
        busyPeriods: [],
        confirmedCountByDate: {},
        sessionDuration: 60,
        ...overrides,
    };
}

function caracasDateStr(d: Date): string {
    return format(new TZDate(d, CARACAS_TZ), "yyyy-MM-dd");
}

describe("isCandidateEligible", () => {
    it("returns true when the slot is within schedule and free", () => {
        expect(
            isCandidateEligible(
                makeCandidate(),
                "INDIVIDUAL",
                "2026-07-29",
                "10:00",
            ),
        ).toBe(true);
    });

    it("returns false when the psychologist doesn't offer the requested sessionType", () => {
        const candidate = makeCandidate({
            offeredSessionTypes: ["INDIVIDUAL"],
        });
        expect(
            isCandidateEligible(candidate, "COUPLE", "2026-07-29", "10:00"),
        ).toBe(false);
    });

    it("returns false when no schedule covers that day/time", () => {
        // Schedule only covers Wednesday — Thursday (dayOfWeek 4) has none.
        expect(
            isCandidateEligible(
                makeCandidate(),
                "INDIVIDUAL",
                "2026-07-30",
                "10:00",
            ),
        ).toBe(false);
    });

    it("excludes a couple (120min) slot that overlaps an existing individual appointment's busy period", () => {
        const candidate = makeCandidate({
            offeredSessionTypes: ["INDIVIDUAL", "COUPLE"],
            sessionDuration: 120,
            busyPeriods: [
                {
                    start: toCaracasDate("2026-07-29", "10:30"),
                    end: toCaracasDate("2026-07-29", "11:00"),
                },
            ],
        });
        // A 120-min slot at 10:00 spans 10:00-12:00, overlapping the 10:30-11:00 busy period.
        expect(
            isCandidateEligible(candidate, "COUPLE", "2026-07-29", "10:00"),
        ).toBe(false);
    });

    it("excludes a slot covered by a TimeOff-derived busy period", () => {
        const candidate = makeCandidate({
            busyPeriods: [
                {
                    start: toCaracasDate("2026-07-29", "09:00"),
                    end: toCaracasDate("2026-07-29", "17:00"),
                },
            ],
        });
        expect(
            isCandidateEligible(candidate, "INDIVIDUAL", "2026-07-29", "10:00"),
        ).toBe(false);
    });

    it("excludes a candidate who already hit the daily confirmed-appointment cap", () => {
        const candidate = makeCandidate({
            confirmedCountByDate: { "2026-07-29": 5 },
        });
        expect(
            isCandidateEligible(candidate, "INDIVIDUAL", "2026-07-29", "10:00"),
        ).toBe(false);
    });
});

describe("pickLeastLoadedPsychologist", () => {
    it("returns null for an empty candidate list", () => {
        expect(pickLeastLoadedPsychologist([])).toBeNull();
    });

    it("returns the single candidate regardless of load", () => {
        const candidates: LoadInput[] = [
            {
                psychologistId: "psy-1",
                confirmedCountThisWeek: 5,
                confirmedCountThisMonth: 20,
            },
        ];
        expect(pickLeastLoadedPsychologist(candidates)).toBe("psy-1");
    });

    it("breaks a weekly tie by monthly load", () => {
        const candidates: LoadInput[] = [
            {
                psychologistId: "psy-1",
                confirmedCountThisWeek: 2,
                confirmedCountThisMonth: 10,
            },
            {
                psychologistId: "psy-2",
                confirmedCountThisWeek: 2,
                confirmedCountThisMonth: 5,
            },
        ];
        expect(pickLeastLoadedPsychologist(candidates)).toBe("psy-2");
    });

    it("breaks a full tie deterministically via the injected randomFn", () => {
        const candidates: LoadInput[] = [
            {
                psychologistId: "psy-1",
                confirmedCountThisWeek: 1,
                confirmedCountThisMonth: 1,
            },
            {
                psychologistId: "psy-2",
                confirmedCountThisWeek: 1,
                confirmedCountThisMonth: 1,
            },
        ];
        expect(
            pickLeastLoadedPsychologist(candidates, { randomFn: () => 0 }),
        ).toBe("psy-1");
        expect(
            pickLeastLoadedPsychologist(candidates, { randomFn: () => 0.99 }),
        ).toBe("psy-2");
    });

    it("always returns preferredPsychologistId when present, even if not least-loaded", () => {
        const candidates: LoadInput[] = [
            {
                psychologistId: "psy-1",
                confirmedCountThisWeek: 0,
                confirmedCountThisMonth: 0,
            },
            {
                psychologistId: "psy-2",
                confirmedCountThisWeek: 9,
                confirmedCountThisMonth: 9,
            },
        ];
        expect(
            pickLeastLoadedPsychologist(candidates, {
                preferredPsychologistId: "psy-2",
            }),
        ).toBe("psy-2");
    });

    it("falls back to normal selection when preferredPsychologistId isn't in the candidate list", () => {
        const candidates: LoadInput[] = [
            {
                psychologistId: "psy-1",
                confirmedCountThisWeek: 0,
                confirmedCountThisMonth: 0,
            },
            {
                psychologistId: "psy-2",
                confirmedCountThisWeek: 9,
                confirmedCountThisMonth: 9,
            },
        ];
        expect(
            pickLeastLoadedPsychologist(candidates, {
                preferredPsychologistId: "psy-not-in-list",
            }),
        ).toBe("psy-1");
    });
});

describe("caracasIsoWeekBounds", () => {
    it("resolves a mid-week date to its Monday-Sunday ISO week bounds in Caracas time", () => {
        const bounds = caracasIsoWeekBounds("2026-07-29"); // Wednesday
        expect(bounds.start.getTime()).toBe(
            toCaracasDate("2026-07-27", "00:00").getTime(),
        );
        expect(caracasDateStr(bounds.start)).toBe("2026-07-27"); // Monday
        expect(caracasDateStr(bounds.end)).toBe("2026-08-02"); // Sunday
    });

    it("resolves a Sunday to the ISO week ending that same day, not the next one", () => {
        const bounds = caracasIsoWeekBounds("2026-08-02"); // Sunday
        expect(caracasDateStr(bounds.start)).toBe("2026-07-27");
        expect(caracasDateStr(bounds.end)).toBe("2026-08-02");
    });

    it("resolves a Monday to a week starting on itself, not the previous week", () => {
        const bounds = caracasIsoWeekBounds("2026-08-03"); // Monday
        expect(bounds.start.getTime()).toBe(
            toCaracasDate("2026-08-03", "00:00").getTime(),
        );
        expect(caracasDateStr(bounds.start)).toBe("2026-08-03");
        expect(caracasDateStr(bounds.end)).toBe("2026-08-09");
    });
});

describe("unionMonthAvailability", () => {
    function day(
        status: "available" | "fully_booked" | "no_schedule",
        slots: { start: string; end: string }[] = [],
    ) {
        return { date: "2026-07-29", status, slots };
    }

    it("returns an empty map for an empty input array", () => {
        expect(unionMonthAvailability([])).toEqual({});
    });

    it("unions two candidates available on different dates", () => {
        const a: MonthAvailability = {
            "2026-07-27": day("available", [{ start: "09:00", end: "10:00" }]),
        };
        const b: MonthAvailability = {
            "2026-07-28": day("available", [{ start: "09:00", end: "10:00" }]),
        };
        const result = unionMonthAvailability([a, b]);
        expect(result["2026-07-27"].status).toBe("available");
        expect(result["2026-07-28"].status).toBe("available");
    });

    it("prefers available over fully_booked/no_schedule on the same date", () => {
        const a: MonthAvailability = {
            "2026-07-29": day("available", [{ start: "09:00", end: "10:00" }]),
        };
        const b: MonthAvailability = { "2026-07-29": day("fully_booked") };
        const result = unionMonthAvailability([a, b]);
        expect(result["2026-07-29"].status).toBe("available");
    });

    it("resolves to fully_booked when no candidate is available but at least one is fully_booked", () => {
        const a: MonthAvailability = { "2026-07-29": day("fully_booked") };
        const b: MonthAvailability = { "2026-07-29": day("no_schedule") };
        const result = unionMonthAvailability([a, b]);
        expect(result["2026-07-29"].status).toBe("fully_booked");
    });

    it("concatenates disjoint slot sets from two available candidates", () => {
        const a: MonthAvailability = {
            "2026-07-29": day("available", [{ start: "09:00", end: "10:00" }]),
        };
        const b: MonthAvailability = {
            "2026-07-29": day("available", [{ start: "14:00", end: "15:00" }]),
        };
        const result = unionMonthAvailability([a, b]);
        expect(result["2026-07-29"].slots).toEqual([
            { start: "09:00", end: "10:00" },
            { start: "14:00", end: "15:00" },
        ]);
    });

    it("deduplicates identical slots from two available candidates", () => {
        const a: MonthAvailability = {
            "2026-07-29": day("available", [{ start: "09:00", end: "10:00" }]),
        };
        const b: MonthAvailability = {
            "2026-07-29": day("available", [{ start: "09:00", end: "10:00" }]),
        };
        const result = unionMonthAvailability([a, b]);
        expect(result["2026-07-29"].slots).toEqual([
            { start: "09:00", end: "10:00" },
        ]);
    });
});
