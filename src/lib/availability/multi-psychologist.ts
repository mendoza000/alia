import {
    startOfISOWeek,
    endOfISOWeek,
    startOfMonth,
    endOfMonth,
    getDay,
} from "date-fns";
import { TZDate } from "@date-fns/tz";
import type { Schedule } from "@/generated/prisma/client";
import type { SessionType } from "@/generated/prisma/enums";
import {
    CARACAS_TZ,
    DAILY_CONFIRMED_APPOINTMENT_CAP,
    getScheduleForDay,
    generateTimeSlots,
    subtractBusyPeriods,
    appointmentsToBusyPeriods,
    timeOffToBusyPeriods,
    toCaracasDate,
    getSessionDuration,
    computeMonthAvailability,
    type MonthAvailability,
    type TimeSlot,
} from "@/lib/availability";
import { getBookablePsychologists } from "@/lib/queries/psychologists";
import {
    getBlockingAppointmentsForPsychologists,
    getConfirmedCountsByDateForPsychologists,
} from "@/lib/queries/appointments";
import { getTimeOffOverlappingForPsychologists } from "@/lib/queries/time-off";
import { getFreeBusyPeriodsForCalendars } from "@/lib/google-calendar";

// ---------------------------------------------------------------------------
// Pure functions (no Prisma import — this is the part unit-tested directly).
// ---------------------------------------------------------------------------

export type MatchCandidateInput = {
    psychologistId: string;
    offeredSessionTypes: SessionType[];
    schedules: Schedule[];
    /** Calendar freebusy + existing appointments + TimeOff, already merged
     * by the caller. */
    busyPeriods: { start: Date; end: Date }[];
    confirmedCountByDate: Record<string, number>;
    /** Already resolved via getSessionDuration(candidate, sessionType) by
     * the caller — this module never reads sessionDuration/
     * coupleSessionDuration directly. */
    sessionDuration: number;
};

/**
 * Whether a candidate can take this exact modality/date/time slot. Reuses
 * src/lib/availability.ts's pure functions unchanged, once per candidate —
 * this file never rewrites the single-psychologist availability logic.
 */
export function isCandidateEligible(
    candidate: MatchCandidateInput,
    sessionType: SessionType,
    dateStr: string,
    timeStr: string,
): boolean {
    if (!candidate.offeredSessionTypes.includes(sessionType)) return false;

    if (
        (candidate.confirmedCountByDate[dateStr] ?? 0) >=
        DAILY_CONFIRMED_APPOINTMENT_CAP
    ) {
        return false;
    }

    const dayOfWeek = getDay(toCaracasDate(dateStr, timeStr));
    const daySchedules = getScheduleForDay(candidate.schedules, dayOfWeek);
    const allSlots = generateTimeSlots(daySchedules, candidate.sessionDuration);
    const slot = allSlots.find(s => s.start === timeStr);
    if (!slot) return false;

    const free = subtractBusyPeriods([slot], candidate.busyPeriods, dateStr);
    return free.length > 0;
}

export type LoadInput = {
    psychologistId: string;
    confirmedCountThisWeek: number;
    confirmedCountThisMonth: number;
};

/**
 * Least-CONFIRMED-sessions-in-the-ISO-week wins (client-closed balancing
 * rule); tie → least this month; tie → randomFn (injectable for
 * deterministic tests, defaults to Math.random). A preferredPsychologistId
 * present in the list short-circuits everything else — the recurring-
 * patient "always your assigned specialist" rule.
 */
export function pickLeastLoadedPsychologist(
    candidates: LoadInput[],
    opts: { preferredPsychologistId?: string; randomFn?: () => number } = {},
): string | null {
    if (candidates.length === 0) return null;

    if (
        opts.preferredPsychologistId &&
        candidates.some(c => c.psychologistId === opts.preferredPsychologistId)
    ) {
        return opts.preferredPsychologistId;
    }

    const minWeek = Math.min(...candidates.map(c => c.confirmedCountThisWeek));
    const weekTier = candidates.filter(
        c => c.confirmedCountThisWeek === minWeek,
    );

    const minMonth = Math.min(...weekTier.map(c => c.confirmedCountThisMonth));
    const monthTier = weekTier.filter(
        c => c.confirmedCountThisMonth === minMonth,
    );

    const randomFn = opts.randomFn ?? Math.random;
    const index = Math.floor(randomFn() * monthTier.length);
    return monthTier[index].psychologistId;
}

/** Caracas-local ISO week bounds (Monday 00:00 – Sunday 23:59:59.999) — used
 * to bucket "confirmed sessions this week" the same way
 * getConfirmedCountsByDateForPsychologists already buckets by Caracas
 * calendar day. Never build these bounds on a raw UTC Date — always through
 * toCaracasDate, same gotcha as the rest of availability.ts. */
export function caracasIsoWeekBounds(dateStr: string): {
    start: Date;
    end: Date;
} {
    const day = toCaracasDate(dateStr, "00:00");
    return { start: startOfISOWeek(day), end: endOfISOWeek(day) };
}

/** A day is "available" if ANY candidate has it available (slots unioned,
 * de-duplicated by start+end); else "fully_booked" if any candidate does;
 * else "no_schedule". Purely a calendar-rendering view — never consulted by
 * the matcher itself, same as a single-psychologist calendar is advisory
 * relative to createAppointment's own re-verification. */
export function unionMonthAvailability(
    perCandidate: MonthAvailability[],
): MonthAvailability {
    const result: MonthAvailability = {};
    const allDates = new Set<string>();
    for (const m of perCandidate) {
        for (const date of Object.keys(m)) allDates.add(date);
    }

    for (const date of allDates) {
        const dayEntries = perCandidate
            .map(m => m[date])
            .filter((d): d is NonNullable<typeof d> => Boolean(d));

        const availableEntries = dayEntries.filter(
            d => d.status === "available",
        );
        if (availableEntries.length > 0) {
            const seen = new Set<string>();
            const slots: TimeSlot[] = [];
            for (const entry of availableEntries) {
                for (const slot of entry.slots) {
                    const key = `${slot.start}-${slot.end}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        slots.push(slot);
                    }
                }
            }
            result[date] = { date, status: "available", slots };
        } else if (dayEntries.some(d => d.status === "fully_booked")) {
            result[date] = { date, status: "fully_booked", slots: [] };
        } else {
            result[date] = { date, status: "no_schedule", slots: [] };
        }
    }

    return result;
}

// ---------------------------------------------------------------------------
// DB-touching orchestration — Prisma only via the query modules above.
// ---------------------------------------------------------------------------

type BookableCandidate = Awaited<
    ReturnType<typeof getBookablePsychologists>
>[number];

function mergeBusyPeriods(
    candidate: BookableCandidate,
    freebusyMap: Map<string, { start: Date; end: Date }[]>,
    blockingMap: Map<string, { dateTime: Date; endTime: Date }[]>,
    timeOffMap: Map<string, { startsAt: Date; endsAt: Date }[]>,
) {
    return [
        ...(candidate.calendarId
            ? (freebusyMap.get(candidate.calendarId) ?? [])
            : []),
        ...appointmentsToBusyPeriods(blockingMap.get(candidate.id) ?? []),
        ...timeOffToBusyPeriods(timeOffMap.get(candidate.id) ?? []),
    ];
}

function uniqueCalendarIds(candidates: BookableCandidate[]): string[] {
    return [
        ...new Set(
            candidates
                .map(c => c.calendarId)
                .filter((id): id is string => Boolean(id)),
        ),
    ];
}

export async function getAvailabilityForAllPsychologists(
    sessionType: SessionType,
    year: number,
    month: number,
): Promise<{ psychologistId: string; availability: MonthAvailability }[]> {
    const candidates = await getBookablePsychologists(sessionType);
    if (candidates.length === 0) return [];

    const firstDay = new TZDate(year, month - 1, 1, CARACAS_TZ);
    const timeMin = startOfMonth(firstDay);
    const timeMax = endOfMonth(firstDay);

    const ids = candidates.map(c => c.id);
    const calendarIds = uniqueCalendarIds(candidates);

    const [freebusyMap, blockingMap, timeOffMap, confirmedMap] =
        await Promise.all([
            getFreeBusyPeriodsForCalendars(calendarIds, timeMin, timeMax),
            getBlockingAppointmentsForPsychologists(ids, timeMin, timeMax),
            getTimeOffOverlappingForPsychologists(ids, timeMin, timeMax),
            getConfirmedCountsByDateForPsychologists(ids, timeMin, timeMax),
        ]);

    return candidates.map(candidate => {
        const sessionDuration = getSessionDuration(candidate, sessionType);
        const busyPeriods = mergeBusyPeriods(
            candidate,
            freebusyMap,
            blockingMap,
            timeOffMap,
        );
        const availability = computeMonthAvailability(
            candidate.schedules,
            busyPeriods,
            year,
            month,
            sessionDuration,
            confirmedMap.get(candidate.id) ?? {},
        );
        return { psychologistId: candidate.id, availability };
    });
}

export async function getAggregatedMonthAvailability(
    sessionType: SessionType,
    year: number,
    month: number,
): Promise<MonthAvailability> {
    const perCandidate = await getAvailabilityForAllPsychologists(
        sessionType,
        year,
        month,
    );
    return unionMonthAvailability(perCandidate.map(c => c.availability));
}

function sumCounts(counts: Record<string, number> | undefined): number {
    return counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
}

export async function matchPsychologistForSlot(
    sessionType: SessionType,
    dateStr: string,
    timeStr: string,
    opts: { preferredPsychologistId?: string; randomFn?: () => number } = {},
): Promise<{ psychologistId: string } | null> {
    const candidates = await getBookablePsychologists(sessionType);
    if (candidates.length === 0) return null;

    const dayStart = toCaracasDate(dateStr, "00:00");
    const dayEnd = toCaracasDate(dateStr, "23:59");

    const ids = candidates.map(c => c.id);
    const calendarIds = uniqueCalendarIds(candidates);

    const [freebusyMap, blockingMap, timeOffMap, confirmedMap] =
        await Promise.all([
            getFreeBusyPeriodsForCalendars(calendarIds, dayStart, dayEnd),
            getBlockingAppointmentsForPsychologists(ids, dayStart, dayEnd),
            getTimeOffOverlappingForPsychologists(ids, dayStart, dayEnd),
            getConfirmedCountsByDateForPsychologists(ids, dayStart, dayEnd),
        ]);

    const eligible = candidates.filter(candidate => {
        const input: MatchCandidateInput = {
            psychologistId: candidate.id,
            offeredSessionTypes: candidate.offeredSessionTypes,
            schedules: candidate.schedules,
            busyPeriods: mergeBusyPeriods(
                candidate,
                freebusyMap,
                blockingMap,
                timeOffMap,
            ),
            confirmedCountByDate: confirmedMap.get(candidate.id) ?? {},
            sessionDuration: getSessionDuration(candidate, sessionType),
        };
        return isCandidateEligible(input, sessionType, dateStr, timeStr);
    });

    if (eligible.length === 0) return null;

    const eligibleIds = eligible.map(c => c.id);
    const { start: weekStart, end: weekEnd } = caracasIsoWeekBounds(dateStr);
    const monthDay = toCaracasDate(dateStr, "00:00");
    const monthStart = startOfMonth(monthDay);
    const monthEnd = endOfMonth(monthDay);

    const [weekCounts, monthCounts] = await Promise.all([
        getConfirmedCountsByDateForPsychologists(
            eligibleIds,
            weekStart,
            weekEnd,
        ),
        getConfirmedCountsByDateForPsychologists(
            eligibleIds,
            monthStart,
            monthEnd,
        ),
    ]);

    const loadInputs: LoadInput[] = eligible.map(c => ({
        psychologistId: c.id,
        confirmedCountThisWeek: sumCounts(weekCounts.get(c.id)),
        confirmedCountThisMonth: sumCounts(monthCounts.get(c.id)),
    }));

    const psychologistId = pickLeastLoadedPsychologist(loadInputs, opts);
    return psychologistId ? { psychologistId } : null;
}
