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
import { CARACAS_TZ, toCaracasDate } from "@/lib/availability";
import {
    caracasDateKey,
    toZonedDateTime,
    formatCaracasTime,
} from "@/lib/admin/schedule-x-mapping";
import { AppointmentStatusBadge } from "@/components/admin/appointment-status-badge";
import { getGlobalCalendarRangeAction } from "@/lib/admin/global-calendar-actions";
import type {
    GlobalCalendarAppointment,
    PsychologistColorEntry,
} from "@/lib/admin/global-calendar-queries";
import { groupAppointmentsByDate } from "@/lib/admin/psychologist-calendar";
import { buildPsychologistCalendars } from "@/lib/admin/psychologist-color-slots";

type RangeData = { appointments: GlobalCalendarAppointment[] };

function mapToCalendarEvents(data: RangeData): CalendarEvent[] {
    return data.appointments
        .filter(a => a.status !== "CANCELLED")
        .map(a => ({
            id: a.id,
            title: `${a.patientName} · ${a.psychologistName}`,
            start: toZonedDateTime(a.dateTime),
            end: toZonedDateTime(a.endTime),
            calendarId: a.psychologistId,
        }));
}

export function AdminGlobalCalendar({
    roster,
    initialRangeStart,
    initialRangeEnd,
    initialData,
}: {
    roster: PsychologistColorEntry[];
    initialRangeStart: Date;
    initialRangeEnd: Date;
    initialData: RangeData;
}) {
    const [rangeData, setRangeData] = useState<RangeData>(initialData);
    const [selectedDateStr, setSelectedDateStr] = useState(() =>
        caracasDateKey(new Date()),
    );
    const calendarContainerRef = useRef<HTMLDivElement>(null);

    // See the same note in psychologist-day-calendar.tsx — Schedule-X
    // doesn't visually mark a clicked date itself, so we reapply our own
    // highlight by matching its `data-date` attribute.
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

    const calendarApp = useCalendarApp({
        views: [createViewWeek(), createViewDay(), createViewMonthGrid()],
        defaultView: "week",
        selectedDate: Temporal.PlainDate.from(caracasDateKey(new Date())),
        locale: "es-ES",
        firstDayOfWeek: 1,
        timezone: CARACAS_TZ,
        dayBoundaries: { start: "06:00", end: "22:00" },
        calendars: buildPsychologistCalendars(roster),
        callbacks: {
            fetchEvents: async ({ start, end }) => {
                const data = await getGlobalCalendarRangeAction(
                    new Date(start.epochMilliseconds),
                    new Date(end.epochMilliseconds),
                );
                setRangeData(data);
                return mapToCalendarEvents(data);
            },
            onClickDate: date => setSelectedDateStr(date.toString()),
            onClickDateTime: dateTime =>
                setSelectedDateStr(dateTime.toPlainDate().toString()),
        },
    });

    const appointmentsByDate = useMemo(
        () => groupAppointmentsByDate(rangeData.appointments),
        [rangeData],
    );
    const dayAppointments = appointmentsByDate[selectedDateStr] ?? [];
    const selectedDateLabel = format(
        toCaracasDate(selectedDateStr, "00:00"),
        "EEEE d 'de' MMMM",
        { locale: es },
    );

    return (
        <div className="sx-alia-theme space-y-4">
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {roster.map((p, index) => (
                    <div
                        key={p.id}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                        <span
                            className="size-2.5 rounded-full"
                            style={{
                                backgroundColor: `var(--sx-color-psy-${index % 8})`,
                            }}
                        />
                        {p.name}
                    </div>
                ))}
            </div>

            <div ref={calendarContainerRef} className="h-[700px]">
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
                                    <span className="ml-1.5 text-muted-foreground">
                                        con {a.psychologistName}
                                    </span>
                                </p>
                                <AppointmentStatusBadge status={a.status} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
