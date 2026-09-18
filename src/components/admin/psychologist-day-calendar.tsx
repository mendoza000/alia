"use client";

import "temporal-polyfill/global";
import type {} from "temporal-spec/global";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import {
    createViewDay,
    createViewWeek,
    createViewMonthGrid,
    type CalendarEvent,
} from "@schedule-x/calendar";
import "@schedule-x/theme-default/dist/index.css";
import "./psychologist-day-calendar.css";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CARACAS_TZ, toCaracasDate } from "@/lib/availability";
import {
    caracasDateKey,
    toZonedDateTime,
    formatCaracasTime,
} from "@/lib/admin/schedule-x-mapping";
import { AppointmentStatusBadge } from "@/components/admin/appointment-status-badge";
import { createTimeOff, deleteTimeOff } from "@/lib/admin/time-off-actions";
import { getPsychologistCalendarRangeAction } from "@/lib/admin/psychologist-calendar-actions";
import type { PsychologistCalendarAppointment } from "@/lib/admin/psychologist-calendar-queries";
import {
    groupAppointmentsByDate,
    getTimeOffBlocksForDate,
    isWholeDayBlocked,
    isFullDayTimeOff,
} from "@/lib/admin/psychologist-calendar";

type TimeOffRow = {
    id: string;
    startsAt: Date;
    endsAt: Date;
    reason: string | null;
};

type RangeData = {
    appointments: PsychologistCalendarAppointment[];
    timeOffs: TimeOffRow[];
};

function mapToCalendarEvents(data: RangeData): CalendarEvent[] {
    const appointmentEvents: CalendarEvent[] = data.appointments
        .filter(a => a.status !== "CANCELLED")
        .map(a => ({
            id: `appt-${a.id}`,
            title: a.patientName,
            start: toZonedDateTime(a.dateTime),
            end: toZonedDateTime(a.endTime),
            calendarId: "appointment",
        }));

    const timeOffEvents: CalendarEvent[] = data.timeOffs.map(t => {
        const title = t.reason ? `Bloqueado — ${t.reason}` : "Bloqueado";
        if (isFullDayTimeOff(t)) {
            return {
                id: `off-${t.id}`,
                title: t.reason ? `Día libre — ${t.reason}` : "Día libre",
                start: Temporal.PlainDate.from(caracasDateKey(t.startsAt)),
                end: Temporal.PlainDate.from(caracasDateKey(t.endsAt)),
                calendarId: "blocked",
            };
        }
        return {
            id: `off-${t.id}`,
            title,
            start: toZonedDateTime(t.startsAt),
            end: toZonedDateTime(t.endsAt),
            calendarId: "blocked",
        };
    });

    return [...appointmentEvents, ...timeOffEvents];
}

export function PsychologistDayCalendar({
    psychologistId,
    initialRangeStart,
    initialRangeEnd,
    initialData,
}: {
    psychologistId: string;
    initialRangeStart: Date;
    initialRangeEnd: Date;
    initialData: RangeData;
}) {
    const [rangeData, setRangeData] = useState<RangeData>(initialData);
    const [selectedDateStr, setSelectedDateStr] = useState(() =>
        caracasDateKey(new Date()),
    );
    const [isPending, setIsPending] = useState(false);
    const [pendingTimeOffId, setPendingTimeOffId] = useState<string | null>(
        null,
    );
    const [blockStart, setBlockStart] = useState("14:00");
    const [blockEnd, setBlockEnd] = useState("16:00");
    const lastRangeRef = useRef<{ start: Date; end: Date } | null>(null);
    const calendarContainerRef = useRef<HTMLDivElement>(null);

    // Schedule-X has no built-in "selected date" visual state for an
    // onClickDate/onClickDateTime click (unlike its own date-picker input) —
    // it renders its grid outside React's tree, so this reapplies our own
    // highlight class by matching the library's own `data-date` attribute
    // whenever the selection or the visible range changes.
    useEffect(() => {
        const container = calendarContainerRef.current;
        if (!container) return;
        for (const el of container.querySelectorAll(".sx-alia-selected")) {
            el.classList.remove("sx-alia-selected");
        }
        for (const el of container.querySelectorAll(
            `[data-date="${selectedDateStr}"]`,
        )) {
            el.classList.add("sx-alia-selected");
        }
    }, [selectedDateStr, rangeData]);

    async function loadRange(start: Date, end: Date) {
        lastRangeRef.current = { start, end };
        const data = await getPsychologistCalendarRangeAction(
            psychologistId,
            start,
            end,
        );
        setRangeData(data);
        return data;
    }

    const calendarApp = useCalendarApp({
        views: [createViewWeek(), createViewDay(), createViewMonthGrid()],
        defaultView: "week",
        selectedDate: Temporal.PlainDate.from(caracasDateKey(new Date())),
        locale: "es-ES",
        firstDayOfWeek: 1,
        timezone: CARACAS_TZ,
        dayBoundaries: { start: "06:00", end: "22:00" },
        /* Colors come purely from CSS (psychologist-day-calendar.css defines
         * --sx-color-appointment and --sx-color-blocked directly) rather
         * than lightColors/darkColors here — the library resolves those in
         * JS to generate contrast-safe variants, which silently fails on a
         * var(--accent)-style reference instead of a literal color. */
        calendars: {
            appointment: { colorName: "appointment" },
            blocked: { colorName: "blocked" },
        },
        callbacks: {
            fetchEvents: async ({ start, end }) => {
                const data = await loadRange(
                    new Date(start.epochMilliseconds),
                    new Date(end.epochMilliseconds),
                );
                return mapToCalendarEvents(data);
            },
            onClickDate: date => {
                setSelectedDateStr(date.toString());
            },
            onClickDateTime: dateTime => {
                setSelectedDateStr(dateTime.toPlainDate().toString());
            },
        },
    });

    const appointmentsByDate = useMemo(
        () => groupAppointmentsByDate(rangeData.appointments),
        [rangeData],
    );
    const dayAppointments = appointmentsByDate[selectedDateStr] ?? [];
    const dayTimeOffs = getTimeOffBlocksForDate(
        rangeData.timeOffs,
        selectedDateStr,
    );
    const wholeDayBlocked = isWholeDayBlocked(
        rangeData.timeOffs,
        selectedDateStr,
    );
    const selectedDateLabel = format(
        toCaracasDate(selectedDateStr, "00:00"),
        "EEEE d 'de' MMMM",
        { locale: es },
    );

    async function refreshCurrentRange() {
        const range = lastRangeRef.current;
        if (!range) return;
        const data = await loadRange(range.start, range.end);
        calendarApp?.events.set(mapToCalendarEvents(data));
    }

    function handleMarkDayOff() {
        setIsPending(true);
        createTimeOff(psychologistId, {
            startsAt: toCaracasDate(selectedDateStr, "00:00"),
            endsAt: toCaracasDate(selectedDateStr, "23:59"),
        })
            .then(async () => {
                toast.success("Día marcado como libre");
                await refreshCurrentRange();
            })
            .catch(e => {
                toast.error(
                    e instanceof Error ? e.message : "Error al guardar",
                );
            })
            .finally(() => setIsPending(false));
    }

    function handleBlockHours() {
        if (blockEnd <= blockStart) {
            toast.error("La hora de fin debe ser posterior a la de inicio");
            return;
        }
        setIsPending(true);
        createTimeOff(psychologistId, {
            startsAt: toCaracasDate(selectedDateStr, blockStart),
            endsAt: toCaracasDate(selectedDateStr, blockEnd),
        })
            .then(async () => {
                toast.success("Horario bloqueado");
                await refreshCurrentRange();
            })
            .catch(e => {
                toast.error(
                    e instanceof Error ? e.message : "Error al guardar",
                );
            })
            .finally(() => setIsPending(false));
    }

    function handleDeleteTimeOff(id: string) {
        setPendingTimeOffId(id);
        deleteTimeOff(id)
            .then(async () => {
                toast.success("Bloqueo eliminado");
                await refreshCurrentRange();
            })
            .catch(() => toast.error("Error al eliminar"))
            .finally(() => setPendingTimeOffId(null));
    }

    return (
        <div className="space-y-4">
            <div ref={calendarContainerRef} className="sx-alia-theme h-[700px]">
                <ScheduleXCalendar calendarApp={calendarApp} />
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                <h3 className="font-heading text-sm font-semibold capitalize">
                    {selectedDateLabel}
                </h3>

                {dayAppointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Sin citas este día.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {dayAppointments.map(a => (
                            <div
                                key={a.id}
                                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                            >
                                <p className="font-medium">
                                    {formatCaracasTime(a.dateTime)} —{" "}
                                    {a.patientName}
                                </p>
                                <AppointmentStatusBadge status={a.status} />
                            </div>
                        ))}
                    </div>
                )}

                <div className="space-y-3 border-t border-border pt-3">
                    {wholeDayBlocked ? (
                        <p className="text-sm text-muted-foreground">
                            Día libre.
                        </p>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                isLoading={isPending}
                                onClick={handleMarkDayOff}
                            >
                                Marcar todo el día libre
                            </Button>
                            <div className="flex flex-wrap items-end gap-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="block-start">Desde</Label>
                                    <Input
                                        id="block-start"
                                        type="time"
                                        value={blockStart}
                                        onChange={e =>
                                            setBlockStart(e.target.value)
                                        }
                                        className="w-28"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="block-end">Hasta</Label>
                                    <Input
                                        id="block-end"
                                        type="time"
                                        value={blockEnd}
                                        onChange={e =>
                                            setBlockEnd(e.target.value)
                                        }
                                        className="w-28"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    isLoading={isPending}
                                    onClick={handleBlockHours}
                                >
                                    Bloquear un horario
                                </Button>
                            </div>
                        </>
                    )}

                    {dayTimeOffs.length > 0 && (
                        <div className="space-y-1.5">
                            {dayTimeOffs.map(t => (
                                <div
                                    key={t.id}
                                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs"
                                >
                                    <span>
                                        {wholeDayBlocked
                                            ? "Todo el día"
                                            : `${formatCaracasTime(t.startsAt)} - ${formatCaracasTime(t.endsAt)}`}
                                        {t.reason ? ` · ${t.reason}` : ""}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        disabled={pendingTimeOffId === t.id}
                                        onClick={() =>
                                            handleDeleteTimeOff(t.id)
                                        }
                                    >
                                        <Trash2 className="size-3.5 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
