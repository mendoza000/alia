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

export function matchTimezoneOption(iana: string): {
    value: string;
    label: string;
} {
    const known = TIMEZONE_OPTIONS.find(o => o.value === iana);
    if (known) return known;
    return { value: iana, label: formatOffsetLabel(iana) };
}
