import type {} from "temporal-spec/global";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { CARACAS_TZ } from "@/lib/availability";

/** Shared by every Schedule-X calendar (psychologist's own, admin's global)
 * so both map Date -> Temporal the same way, against Caracas time. */

export function caracasDateKey(date: Date): string {
    return format(new TZDate(date, CARACAS_TZ), "yyyy-MM-dd");
}

export function toZonedDateTime(date: Date): Temporal.ZonedDateTime {
    return Temporal.Instant.fromEpochMilliseconds(
        date.getTime(),
    ).toZonedDateTimeISO(CARACAS_TZ);
}

export function formatCaracasTime(date: Date): string {
    return format(new TZDate(date, CARACAS_TZ), "h:mm a", { locale: es });
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

/** Schedule-X's own event-time text hardcodes 12h format only for the
 * 'en-US' locale (everything else, including 'es-ES', falls back to 24h) —
 * there's no config knob for it. `_customContent` is the documented escape
 * hatch: a per-event HTML string rendered via dangerouslySetInnerHTML, so
 * user-provided text (patient/psychologist names) MUST be escaped before
 * going in. Mirrors the library's own default markup/classes so the
 * existing CSS (psychologist-day-calendar.css) still applies. */
export function buildTimedEventContent(
    title: string,
    start: Date,
    end: Date,
): { timeGrid: string; monthGrid: string } {
    const safeTitle = escapeHtml(title);
    const safeTime = escapeHtml(
        `${formatCaracasTime(start)} – ${formatCaracasTime(end)}`,
    );
    return {
        timeGrid: `<div class="sx__time-grid-event-inner"><div class="sx__time-grid-event-title">${safeTitle}</div><div class="sx__time-grid-event-time">${safeTime}</div></div>`,
        monthGrid: `<div class="sx__month-grid-event-time">${safeTime}</div><div class="sx__month-grid-event-title">${safeTitle}</div>`,
    };
}
