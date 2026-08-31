import { TZDate } from "@date-fns/tz";
import { CARACAS_TZ } from "@/lib/availability";

export type DateFilterPeriod =
    | "today"
    | "month"
    | "3months"
    | "6months"
    | "year"
    | "all";

export type DateRange = { since: Date | null; until: Date | null };

// Boundaries are computed in Caracas wall-clock time — the psychologists and
// admin team operate out of Venezuela — then converted to the underlying UTC
// instant. Using the server's local time here (e.g. UTC on Vercel) would
// shift the "today" cutoff by Venezuela's -04:00 offset, silently excluding
// appointments in the last hours of the Caracas day.
function caracasNow(): TZDate {
    return new TZDate(new Date(), CARACAS_TZ);
}

function dayStart(year: number, month: number, day: number): Date {
    return new TZDate(year, month, day, 0, 0, 0, 0, CARACAS_TZ);
}

function dayEnd(year: number, month: number, day: number): Date {
    return new TZDate(year, month, day, 23, 59, 59, 999, CARACAS_TZ);
}

// TZDate's string constructor parses using the runtime's system timezone,
// not the given zone — so "YYYY-MM-DD" must be split into numeric parts
// before being passed to the numeric constructor (see toCaracasDate).
function parseDateStr(dateStr: string): [number, number, number] {
    const [year, month, day] = dateStr.split("-").map(Number);
    return [year, month - 1, day];
}

function getPeriodStart(period: DateFilterPeriod): Date | null {
    const now = caracasNow();
    const year = now.getFullYear();
    const month = now.getMonth();
    switch (period) {
        case "today":
            return dayStart(year, month, now.getDate());
        case "month":
            return dayStart(year, month, 1);
        case "3months":
            return dayStart(year, month - 2, 1);
        case "6months":
            return dayStart(year, month - 5, 1);
        case "year":
            return dayStart(year, 0, 1);
        case "all":
            return null;
    }
}

export function resolveDateRange(
    period: DateFilterPeriod,
    dateFrom?: string,
    dateTo?: string,
): DateRange {
    const since = dateFrom
        ? dayStart(...parseDateStr(dateFrom))
        : getPeriodStart(period);

    let until: Date | null = null;
    if (dateTo) {
        until = dayEnd(...parseDateStr(dateTo));
    } else if (period === "today" && !dateFrom) {
        const now = caracasNow();
        until = dayEnd(now.getFullYear(), now.getMonth(), now.getDate());
    }

    return { since, until };
}
