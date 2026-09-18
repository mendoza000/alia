"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import type { DayButton } from "react-day-picker";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CARACAS_TZ, toCaracasDate } from "@/lib/availability";
import { AppointmentStatusBadge } from "@/components/admin/appointment-status-badge";
import { createTimeOff, deleteTimeOff } from "@/lib/admin/time-off-actions";
import { getPsychologistCalendarMonthAction } from "@/lib/admin/psychologist-calendar-actions";
import type { PsychologistCalendarAppointment } from "@/lib/admin/psychologist-calendar-queries";
import {
    groupAppointmentsByDate,
    countAppointmentsByDate,
    getTimeOffBlocksForDate,
    isWholeDayBlocked,
} from "@/lib/admin/psychologist-calendar";

type TimeOffRow = {
    id: string;
    startsAt: Date;
    endsAt: Date;
    reason: string | null;
};

type MonthData = {
    appointments: PsychologistCalendarAppointment[];
    timeOffs: TimeOffRow[];
};

function formatCaracasTime(date: Date): string {
    return format(new TZDate(date, CARACAS_TZ), "HH:mm");
}

export function PsychologistDayCalendar({
    psychologistId,
    initialYear,
    initialMonth,
    initialData,
}: {
    psychologistId: string;
    initialYear: number;
    initialMonth: number;
    initialData: MonthData;
}) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        () => new Date(),
    );
    const [displayedMonth, setDisplayedMonth] = useState({
        year: initialYear,
        month: initialMonth,
    });
    const [isPending, startTransition] = useTransition();
    const [pendingTimeOffId, setPendingTimeOffId] = useState<string | null>(
        null,
    );
    const cacheRef = useRef<Map<string, MonthData>>(
        new Map([[`${initialYear}-${initialMonth}`, initialData]]),
    );
    const [monthData, setMonthData] = useState<MonthData>(initialData);
    const [blockStart, setBlockStart] = useState("14:00");
    const [blockEnd, setBlockEnd] = useState("16:00");

    function loadMonth(year: number, month: number) {
        const key = `${year}-${month}`;
        const cached = cacheRef.current.get(key);
        if (cached) {
            setMonthData(cached);
            return;
        }
        startTransition(async () => {
            const data = await getPsychologistCalendarMonthAction(
                psychologistId,
                year,
                month,
            );
            cacheRef.current.set(key, data);
            setMonthData(data);
        });
    }

    function refreshDisplayedMonth() {
        cacheRef.current.delete(
            `${displayedMonth.year}-${displayedMonth.month}`,
        );
        loadMonth(displayedMonth.year, displayedMonth.month);
    }

    function handleMonthChange(month: Date) {
        const year = month.getFullYear();
        const m = month.getMonth() + 1;
        setDisplayedMonth({ year, month: m });
        loadMonth(year, m);
    }

    const appointmentsByDate = useMemo(
        () => groupAppointmentsByDate(monthData.appointments),
        [monthData],
    );
    const countsByDate = useMemo(
        () => countAppointmentsByDate(monthData.appointments),
        [monthData],
    );

    const selectedDateStr = selectedDate
        ? format(selectedDate, "yyyy-MM-dd")
        : null;
    const dayAppointments = selectedDateStr
        ? (appointmentsByDate[selectedDateStr] ?? [])
        : [];
    const dayTimeOffs = selectedDateStr
        ? getTimeOffBlocksForDate(monthData.timeOffs, selectedDateStr)
        : [];
    const wholeDayBlocked = selectedDateStr
        ? isWholeDayBlocked(monthData.timeOffs, selectedDateStr)
        : false;

    function handleMarkDayOff() {
        if (!selectedDateStr) return;
        startTransition(async () => {
            try {
                await createTimeOff(psychologistId, {
                    startsAt: toCaracasDate(selectedDateStr, "00:00"),
                    endsAt: toCaracasDate(selectedDateStr, "23:59"),
                });
                toast.success("Día marcado como libre");
                refreshDisplayedMonth();
            } catch (e) {
                toast.error(
                    e instanceof Error ? e.message : "Error al guardar",
                );
            }
        });
    }

    function handleBlockHours() {
        if (!selectedDateStr) return;
        if (blockEnd <= blockStart) {
            toast.error("La hora de fin debe ser posterior a la de inicio");
            return;
        }
        startTransition(async () => {
            try {
                await createTimeOff(psychologistId, {
                    startsAt: toCaracasDate(selectedDateStr, blockStart),
                    endsAt: toCaracasDate(selectedDateStr, blockEnd),
                });
                toast.success("Horario bloqueado");
                refreshDisplayedMonth();
            } catch (e) {
                toast.error(
                    e instanceof Error ? e.message : "Error al guardar",
                );
            }
        });
    }

    function handleDeleteTimeOff(id: string) {
        setPendingTimeOffId(id);
        startTransition(async () => {
            try {
                await deleteTimeOff(id);
                toast.success("Bloqueo eliminado");
                refreshDisplayedMonth();
            } catch {
                toast.error("Error al eliminar");
            } finally {
                setPendingTimeOffId(null);
            }
        });
    }

    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
                <div className="space-y-4">
                    {!selectedDate ? (
                        <p className="text-sm text-muted-foreground">
                            Selecciona un día para ver el detalle.
                        </p>
                    ) : (
                        <>
                            <h3 className="font-heading text-sm font-semibold">
                                {format(selectedDate, "EEEE d 'de' MMMM", {
                                    locale: es,
                                })}
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
                                            <div>
                                                <p className="font-medium">
                                                    {formatCaracasTime(
                                                        a.dateTime,
                                                    )}{" "}
                                                    — {a.patientName}
                                                </p>
                                            </div>
                                            <AppointmentStatusBadge
                                                status={a.status}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-3 border-t border-border pt-4">
                                {wholeDayBlocked ? (
                                    <p className="text-sm text-muted-foreground">
                                        Día libre.
                                    </p>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        isLoading={isPending}
                                        onClick={handleMarkDayOff}
                                    >
                                        Marcar todo el día libre
                                    </Button>
                                )}

                                {!wholeDayBlocked && (
                                    <div className="flex flex-wrap items-end gap-2">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="block-start">
                                                Desde
                                            </Label>
                                            <Input
                                                id="block-start"
                                                type="time"
                                                value={blockStart}
                                                onChange={e =>
                                                    setBlockStart(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-28"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="block-end">
                                                Hasta
                                            </Label>
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
                                                    {t.reason
                                                        ? ` · ${t.reason}`
                                                        : ""}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    disabled={
                                                        pendingTimeOffId ===
                                                        t.id
                                                    }
                                                    onClick={() =>
                                                        handleDeleteTimeOff(
                                                            t.id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="size-3.5 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div
                    className={cn(
                        "transition-opacity duration-300",
                        isPending && "opacity-50",
                    )}
                >
                    <Calendar
                        mode="single"
                        required
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        onMonthChange={handleMonthChange}
                        locale={es}
                        defaultMonth={new Date(initialYear, initialMonth - 1)}
                        components={{
                            DayButton: props => (
                                <PsychologistCalendarDayButton
                                    countsByDate={countsByDate}
                                    timeOffs={monthData.timeOffs}
                                    {...props}
                                />
                            ),
                        }}
                        className="mx-auto w-fit [--cell-size:--spacing(10)]"
                    />
                </div>
            </div>
        </div>
    );
}

function PsychologistCalendarDayButton({
    countsByDate,
    timeOffs,
    day,
    modifiers,
    className,
    ...props
}: React.ComponentProps<typeof DayButton> & {
    countsByDate: Record<string, number>;
    timeOffs: TimeOffRow[];
}) {
    const dateStr = format(day.date, "yyyy-MM-dd");
    const count = countsByDate[dateStr] ?? 0;
    const blocked = isWholeDayBlocked(timeOffs, dateStr);

    return (
        <Button
            variant="ghost"
            size="icon"
            data-selected-single={
                modifiers.selected &&
                !modifiers.range_start &&
                !modifiers.range_end &&
                !modifiers.range_middle
            }
            className={cn(
                "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col items-center gap-0.5 border-0 leading-none font-normal data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
                blocked && "opacity-60",
                className,
            )}
            {...props}
        >
            {props.children}
            {blocked && (
                <span className="block h-1 w-1 rounded-full bg-destructive" />
            )}
            {!blocked && count > 0 && (
                <span className="block h-1 w-1 rounded-full bg-accent" />
            )}
        </Button>
    );
}
