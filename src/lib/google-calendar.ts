import { google } from "googleapis";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CacheEntry = {
    data: { start: Date; end: Date }[];
    expiresAt: number;
};

const freeBusyCache = new Map<string, CacheEntry>();

const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({ version: "v3", auth });

export async function getFreeBusyPeriods(
    calendarId: string,
    timeMin: Date,
    timeMax: Date,
): Promise<{ start: Date; end: Date }[]> {
    try {
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                items: [{ id: calendarId }],
                timeZone: "America/Bogota",
            },
        });

        const busy = response.data.calendars?.[calendarId]?.busy ?? [];

        return busy
            .filter(
                (period): period is { start: string; end: string } =>
                    !!period.start && !!period.end,
            )
            .map(period => ({
                start: new Date(period.start),
                end: new Date(period.end),
            }));
    } catch (error) {
        console.error("FreeBusy API error:", error);
        return [];
    }
}

type CalendarEventInput = {
    summary: string;
    description: string;
    startDateTime: Date;
    endDateTime: Date;
};

export async function createCalendarEvent(
    calendarId: string,
    event: CalendarEventInput,
): Promise<string | null> {
    try {
        const response = await calendar.events.insert({
            calendarId,
            requestBody: {
                summary: event.summary,
                description: event.description,
                start: {
                    dateTime: event.startDateTime.toISOString(),
                    timeZone: "America/Bogota",
                },
                end: {
                    dateTime: event.endDateTime.toISOString(),
                    timeZone: "America/Bogota",
                },
            },
        });
        return response.data.id ?? null;
    } catch (error) {
        console.error("Calendar event creation error:", error);
        return null;
    }
}

export async function deleteCalendarEvent(
    calendarId: string,
    eventId: string,
): Promise<void> {
    try {
        await calendar.events.delete({ calendarId, eventId });
    } catch (error: unknown) {
        // Ignore 404 — event already deleted or never existed
        const status = (error as { code?: number })?.code;
        if (status !== 404) {
            console.error("Calendar event deletion error:", error);
        }
    }
}

export async function updateCalendarEvent(
    calendarId: string,
    eventId: string,
    { startDateTime, endDateTime }: { startDateTime: Date; endDateTime: Date },
): Promise<void> {
    try {
        await calendar.events.patch({
            calendarId,
            eventId,
            requestBody: {
                start: {
                    dateTime: startDateTime.toISOString(),
                    timeZone: "America/Bogota",
                },
                end: {
                    dateTime: endDateTime.toISOString(),
                    timeZone: "America/Bogota",
                },
            },
        });
    } catch (error) {
        console.error("Calendar event update error:", error);
    }
}

export async function getCachedFreeBusyPeriods(
    calendarId: string,
    timeMin: Date,
    timeMax: Date,
): Promise<{ start: Date; end: Date }[]> {
    const key = `${calendarId}:${timeMin.toISOString()}:${timeMax.toISOString()}`;
    const cached = freeBusyCache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    const data = await getFreeBusyPeriods(calendarId, timeMin, timeMax);
    freeBusyCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });

    // Lazy cleanup when cache grows large
    if (freeBusyCache.size > 100) {
        const now = Date.now();
        for (const [k, v] of freeBusyCache) {
            if (v.expiresAt <= now) freeBusyCache.delete(k);
        }
    }

    return data;
}
