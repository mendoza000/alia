"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { toast } from "sonner";
import { rescheduleMyAppointment } from "@/lib/patient/appointment-actions";
import { CARACAS_TZ, toCaracasDate } from "@/lib/availability";
import { formatInTimezone, matchTimezoneOption } from "@/lib/timezones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";

/**
 * Patient-facing counterpart to the admin's RescheduleAppointmentDialog —
 * same date/time picker and preview, but no "¿Es una excepción?" toggle
 * (rescheduleMyAppointment never accepts isException) and it enforces a
 * minimum notice window the admin path doesn't.
 */
export function RescheduleAppointmentDialog({
    appointmentId,
    psychologistName,
    currentDateTime,
    patientTimezone,
    open,
    onOpenChange,
}: {
    appointmentId: string;
    psychologistName: string;
    currentDateTime: Date;
    patientTimezone: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const router = useRouter();
    const tz = patientTimezone ?? CARACAS_TZ;
    const [date, setDate] = useState(() =>
        format(new TZDate(currentDateTime, CARACAS_TZ), "yyyy-MM-dd"),
    );
    const [time, setTime] = useState(() =>
        format(new TZDate(currentDateTime, CARACAS_TZ), "HH:mm"),
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reagendar sesión</DialogTitle>
                    <DialogDescription>
                        Elige la nueva fecha y hora para tu sesión con{" "}
                        {psychologistName}. Debe ser con al menos 24 horas de
                        anticipación.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor="my-reschedule-date">Fecha</Label>
                            <Input
                                id="my-reschedule-date"
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="my-reschedule-time">Hora</Label>
                            <Input
                                id="my-reschedule-time"
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                            />
                        </div>
                    </div>

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
