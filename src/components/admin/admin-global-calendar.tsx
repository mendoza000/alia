"use client";

import "temporal-polyfill/global";
import type {} from "temporal-spec/global";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import {
    createViewDay,
    createViewWeek,
    createViewMonthGrid,
    createViewMonthAgenda,
    type CalendarEvent,
} from "@schedule-x/calendar";
import { createCurrentTimePlugin } from "@schedule-x/current-time";
import "@schedule-x/theme-default/dist/index.css";
import "./psychologist-day-calendar.css";
import { CARACAS_TZ, toCaracasDate } from "@/lib/availability";
import { cn } from "@/lib/utils";
import {
    caracasDateKey,
    toZonedDateTime,
    formatCaracasTime,
    buildTimedEventContent,
} from "@/lib/admin/schedule-x-mapping";
import { AppointmentStatusBadge } from "@/components/admin/appointment-status-badge";
import { AppointmentDetailSheet } from "@/components/admin/appointment-detail-sheet";
import { getGlobalCalendarRangeAction } from "@/lib/admin/global-calendar-actions";
import type {
    GlobalCalendarAppointment,
    PsychologistColorEntry,
} from "@/lib/admin/global-calendar-queries";
import { groupAppointmentsByDate } from "@/lib/admin/psychologist-calendar";
import { buildPsychologistCalendars } from "@/lib/admin/psychologist-color-slots";

type RangeData = { appointments: GlobalCalendarAppointment[] };

function mapToCalendarEvents(
    data: RangeData,
    hiddenPsychologistIds: Set<string>,
): CalendarEvent[] {
    return data.appointments
        .filter(
            a =>
                a.status !== "CANCELLED" &&
                !hiddenPsychologistIds.has(a.psychologistId),
        )
        .map(a => {
            const title = `${a.patientName} · ${a.psychologistName}`;
            return {
                id: a.id,
                title,
                start: toZonedDateTime(a.dateTime),
                end: toZonedDateTime(a.endTime),
                calendarId: a.psychologistId,
                _customContent: buildTimedEventContent(
                    title,
                    a.dateTime,
                    a.endTime,
                ),
            };
        });
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
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<
        string | null
    >(null);
    const [hiddenPsychologistIds, setHiddenPsychologistIds] = useState<
        Set<string>
    >(new Set());
    // fetchEvents is captured once by useCalendarApp at mount, so it would
    // otherwise always see the empty Set from that first render — this ref
    // lets it read the current filter on every navigation.
    const hiddenIdsRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        hiddenIdsRef.current = hiddenPsychologistIds;
    }, [hiddenPsychologistIds]);

    function togglePsychologist(id: string) {
        setHiddenPsychologistIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

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

    // See the same note in psychologist-day-calendar.tsx — the week/day
    // view's date header has no built-in click handler (onClickDate only
    // covers month-grid day cells).
    useEffect(() => {
        const container = calendarContainerRef.current;
        if (!container) return;
        function handleClick(e: MouseEvent) {
            const target = (e.target as HTMLElement).closest(
                ".sx__week-grid__date",
            );
            const date = target?.getAttribute("data-date");
            if (date) setSelectedDateStr(date);
        }
        container.addEventListener("click", handleClick);
        return () => container.removeEventListener("click", handleClick);
    }, []);

    const calendarApp = useCalendarApp(
        {
            // Week/month grids need horizontal room Schedule-X won't give
            // them on a phone (it auto-restricts the view picker to
            // hasSmallScreenCompat views there) — month-agenda is its
            // mobile-friendly stand-in so "Vista" isn't stuck on Día alone.
            views: [
                createViewWeek(),
                createViewDay(),
                createViewMonthGrid(),
                createViewMonthAgenda(),
            ],
            defaultView: "week",
            selectedDate: Temporal.PlainDate.from(caracasDateKey(new Date())),
            locale: "es-ES",
            firstDayOfWeek: 1,
            timezone: CARACAS_TZ,
            dayBoundaries: { start: "06:00", end: "22:00" },
            weekOptions: {
                timeAxisFormatOptions: { hour: "numeric", hour12: true },
                gridHeight: 900,
            },
            calendars: buildPsychologistCalendars(roster),
            callbacks: {
                fetchEvents: async ({ start, end }) => {
                    const data = await getGlobalCalendarRangeAction(
                        new Date(start.epochMilliseconds),
                        new Date(end.epochMilliseconds),
                    );
                    setRangeData(data);
                    return mapToCalendarEvents(data, hiddenIdsRef.current);
                },
                onClickDate: date => setSelectedDateStr(date.toString()),
                onClickDateTime: dateTime =>
                    setSelectedDateStr(dateTime.toPlainDate().toString()),
                onEventClick: event =>
                    setSelectedAppointmentId(String(event.id)),
                // In day view the visible range IS a single day — select it
                // automatically on navigation instead of requiring a click.
                onRangeUpdate: range => {
                    const spanMs =
                        range.end.epochMilliseconds -
                        range.start.epochMilliseconds;
                    if (spanMs <= 24 * 60 * 60 * 1000) {
                        setSelectedDateStr(
                            range.start.toPlainDate().toString(),
                        );
                    }
                },
            },
        },
        [createCurrentTimePlugin()],
    );

    // Toggling the legend doesn't trigger a range fetch — push the
    // re-filtered events straight to the calendar's own event list.
    useEffect(() => {
        calendarApp?.events.set(
            mapToCalendarEvents(rangeData, hiddenPsychologistIds),
        );
    }, [calendarApp, rangeData, hiddenPsychologistIds]);

    const appointmentsByDate = useMemo(
        () => groupAppointmentsByDate(rangeData.appointments),
        [rangeData],
    );
    const dayAppointments = (appointmentsByDate[selectedDateStr] ?? []).filter(
        a => !hiddenPsychologistIds.has(a.psychologistId),
    );
    const selectedDateLabel = format(
        toCaracasDate(selectedDateStr, "00:00"),
        "EEEE d 'de' MMMM",
        { locale: es },
    );

    return (
        <div className="sx-alia-theme space-y-4">
            <div>
                <p className="mb-1.5 text-xs text-muted-foreground">
                    Haz clic en el color para mostrar u ocultar sus citas, o en
                    el nombre para ir a su calendario.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {roster.map((p, index) => {
                        const isHidden = hiddenPsychologistIds.has(p.id);
                        return (
                            <div
                                key={p.id}
                                className="flex items-center gap-1.5 text-xs"
                            >
                                <button
                                    type="button"
                                    onClick={() => togglePsychologist(p.id)}
                                    title={
                                        isHidden
                                            ? "Mostrar en el calendario"
                                            : "Ocultar del calendario"
                                    }
                                    className="size-2.5 rounded-full transition-opacity"
                                    style={{
                                        backgroundColor: `var(--sx-color-psy-${index % 8})`,
                                        opacity: isHidden ? 0.25 : 1,
                                    }}
                                />
                                <Link
                                    href={`/admin/psicologos/${p.id}/calendario?from=calendario`}
                                    className={cn(
                                        "hover:text-foreground hover:underline",
                                        isHidden
                                            ? "text-muted-foreground/50"
                                            : "text-muted-foreground",
                                    )}
                                >
                                    {p.name}
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:h-[calc(100vh-330px)] lg:min-h-[520px] lg:grid-cols-[1fr_320px]">
                <div ref={calendarContainerRef} className="h-[620px] lg:h-full">
                    <ScheduleXCalendar calendarApp={calendarApp} />
                </div>

                <div className="space-y-3 overflow-y-auto rounded-lg border border-border bg-card p-4 lg:h-full">
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
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() =>
                                        setSelectedAppointmentId(a.id)
                                    }
                                    className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                                >
                                    <p className="font-medium">
                                        {formatCaracasTime(a.dateTime)} —{" "}
                                        {a.patientName}
                                        <span className="ml-1.5 text-muted-foreground">
                                            con {a.psychologistName}
                                        </span>
                                    </p>
                                    <AppointmentStatusBadge status={a.status} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AppointmentDetailSheet
                appointmentId={selectedAppointmentId}
                onOpenChange={open => !open && setSelectedAppointmentId(null)}
            />
        </div>
    );
}
