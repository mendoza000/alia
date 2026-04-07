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
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
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
