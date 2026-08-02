import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { toBogotaDate } from "@/lib/availability";

export const TIMEZONE_OPTIONS = [
    { value: "America/Bogota", label: "Colombia" },
    { value: "America/Mexico_City", label: "México" },
    { value: "America/New_York", label: "Estados Unidos (Este)" },
    { value: "America/Chicago", label: "Estados Unidos (Centro)" },
    { value: "America/Denver", label: "Estados Unidos (Montaña)" },
    { value: "America/Los_Angeles", label: "Estados Unidos (Pacífico)" },
    { value: "America/Lima", label: "Perú" },
    { value: "America/Santiago", label: "Chile" },
    { value: "America/Argentina/Buenos_Aires", label: "Argentina" },
    { value: "America/Caracas", label: "Venezuela" },
    { value: "Europe/Madrid", label: "España" },
];

export function detectBrowserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function formatOffsetLabel(iana: string): string {
    const parts = new Intl.DateTimeFormat("es", {
        timeZone: iana,
        timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const offset = parts.find(p => p.type === "timeZoneName")?.value ?? "";
    const city = iana.split("/").pop()?.replace(/_/g, " ") ?? iana;
    return `${city} (${offset})`;
}

// Converts a Bogota-based date + time (as stored/scheduled in the system)
// into the wall-clock time the patient sees in their own timezone.
export function formatInTimezone(
    dateStr: string,
    time: string,
    timezone: string,
): string {
    const bogotaInstant = toBogotaDate(dateStr, time);
    return format(new TZDate(bogotaInstant, timezone), "h:mm a");
}

export function matchTimezoneOption(iana: string): {
    value: string;
    label: string;
} {
    const known = TIMEZONE_OPTIONS.find(o => o.value === iana);
    if (known) return known;
    return { value: iana, label: formatOffsetLabel(iana) };
}
