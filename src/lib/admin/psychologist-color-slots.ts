/** Fixed 8-hue categorical palette (dataviz skill's validated default —
 * blue/orange/aqua/yellow/magenta/green/violet/red, fixed order, CVD-checked
 * against ALIA's card surface in both modes) used to color-code
 * psychologists on the admin's global calendar. With more than 8 active
 * psychologists the order wraps — an explicit, documented tradeoff rather
 * than an unbounded hue generator. */
const COLOR_SLOT_COUNT = 8;

/** Keyed by psychologistId so a fetched appointment's calendarId can be set
 * to its psychologistId directly, with no separate id -> slot lookup. */
export function buildPsychologistCalendars(
    roster: { id: string }[],
): Record<string, { colorName: string }> {
    const calendars: Record<string, { colorName: string }> = {};
    roster.forEach((p, index) => {
        const slot = index % COLOR_SLOT_COUNT;
        calendars[p.id] = { colorName: `psy-${slot}` };
    });
    return calendars;
}
