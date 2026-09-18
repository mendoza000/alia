import type {} from "temporal-spec/global";
import { format } from "date-fns";
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
    return format(new TZDate(date, CARACAS_TZ), "HH:mm");
}
