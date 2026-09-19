"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { toast } from "sonner";
import { rescheduleMyAppointment } from "@/lib/patient/appointment-actions";
import { getMonthAvailability } from "@/app/(landing)/psicologos/[slug]/actions";
import {
    CARACAS_TZ,
    MIN_RESCHEDULE_NOTICE_MINUTES,
    toCaracasDate,
    type MonthAvailability,
} from "@/lib/availability";
import { formatInTimezone, matchTimezoneOption } from "@/lib/timezones";
import { AvailabilityCalendar } from "@/components/availability/availability-calendar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";

/** A slot the booking flow would offer (>= 2h lead) can still be too soon
 * for a reschedule (>= 24h notice) — downgrades days whose slots don't
 * clear that bar instead of showing them as pickable then rejecting them
 * server-side. */
function withMinNotice(
    availability: MonthAvailability,
    minNoticeMinutes: number,
): MonthAvailability {
    const cutoff = new Date(Date.now() + minNoticeMinutes * 60 * 1000);
    const result: MonthAvailability = {};
    for (const [dateStr, day] of Object.entries(availability)) {
        const slots = day.slots.filter(
            slot => toCaracasDate(dateStr, slot.start) >= cutoff,
        );
        result[dateStr] = {
            ...day,
            slots,
            status:
                slots.length > 0
                    ? day.status
                    : day.status === "available"
                      ? "fully_booked"
                      : day.status,
        };
    }
    return result;
}

/**
 * Patient-facing counterpart to the admin's RescheduleAppointmentDialog —
 * same date/time picker and preview, but no "¿Es una excepción?" toggle
 * (rescheduleMyAppointment never accepts isException) and it enforces a
 * minimum notice window the admin path doesn't.
 */
export function RescheduleAppointmentDialog({
    appointmentId,
    psychologistId,
    psychologistName,
    currentDateTime,
    patientTimezone,
    open,
    onOpenChange,
}: {
    appointmentId: string;
    psychologistId: string;
    psychologistName: string;
    currentDateTime: Date;
    patientTimezone: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const router = useRouter();
    const tz = patientTimezone ?? CARACAS_TZ;
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availability, setAvailability] = useState<{
        year: number;
        month: number;
        data: MonthAvailability;
    } | null>(null);

    useEffect(() => {
        if (!open) return;
        setDate("");
        setTime("");
        let cancelled = false;
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        getMonthAvailability(psychologistId, year, month).then(data => {
            if (cancelled) return;
            setAvailability({
                year,
                month,
                data: withMinNotice(data, MIN_RESCHEDULE_NOTICE_MINUTES),
            });
        });
        return () => {
            cancelled = true;
        };
    }, [open, psychologistId]);

    const psychologistPreview =
        date && time
            ? format(toCaracasDate(date, time), "EEEE d 'de' MMMM, HH:mm", {
                  locale: es,
              })
            : null;

    const patientPreview =
        date && time ? formatInTimezone(date, time, tz) : null;
    const patientTzLabel = matchTimezoneOption(tz).label;

    async function handleSubmit() {
        if (!date || !time) {
            toast.error("Selecciona una fecha y hora");
            return;
        }
        setIsSubmitting(true);
        const result = await rescheduleMyAppointment(appointmentId, date, time);
        setIsSubmitting(false);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        toast.success("Sesión reagendada");
        onOpenChange(false);
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Reagendar sesión</DialogTitle>
                    <DialogDescription>
                        Elige la nueva fecha y hora para tu sesión con{" "}
                        {psychologistName}. Debe ser con al menos 24 horas de
                        anticipación.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <p className="text-sm text-muted-foreground">
                        Sesión actual:{" "}
                        <span className="font-medium text-foreground">
                            {format(
                                new TZDate(currentDateTime, CARACAS_TZ),
                                "EEEE d 'de' MMMM, HH:mm",
                                { locale: es },
                            )}
                        </span>
                    </p>

                    {availability ? (
                        <AvailabilityCalendar
                            fetchMonth={(y, m) =>
                                getMonthAvailability(psychologistId, y, m).then(
                                    data =>
                                        withMinNotice(
                                            data,
                                            MIN_RESCHEDULE_NOTICE_MINUTES,
                                        ),
                                )
                            }
                            initialAvailability={availability.data}
                            initialYear={availability.year}
                            initialMonth={availability.month}
                            patientTimezone={tz}
                            onSlotSelect={(d, t) => {
                                setDate(d);
                                setTime(t);
                            }}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Cargando disponibilidad...
                        </p>
                    )}

                    {(psychologistPreview || patientPreview) && (
                        <div className="grid gap-1.5 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
                            {patientPreview && (
                                <p>
                                    <span className="font-medium">
                                        Nueva fecha ({patientTzLabel}):
                                    </span>{" "}
                                    {patientPreview}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <DialogClose
                        render={<Button type="button" variant="outline" />}
                    >
                        Cancelar
                    </DialogClose>
                    <Button onClick={handleSubmit} isLoading={isSubmitting}>
                        Reagendar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
