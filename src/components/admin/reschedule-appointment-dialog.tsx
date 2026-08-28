"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { toast } from "sonner";
import { rescheduleAppointment } from "@/lib/admin/appointment-actions";
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
  const tz = patientTimezone ?? "America/Bogota";
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

  const patientPreview = date && time ? formatInTimezone(date, time, tz) : null;
  const patientTzLabel = matchTimezoneOption(tz).label;

  async function handleSubmit() {
    if (!date || !time) {
      toast.error("Selecciona una fecha y hora");
      return;
    }
    setIsSubmitting(true);
    const result = await rescheduleAppointment(appointmentId, date, time);
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
            Elige la nueva fecha y hora para la sesión con {psychologistName}.
            Se notificará por correo al psicólogo y al paciente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="reschedule-date">Fecha</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="reschedule-time">Hora (Venezuela)</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
          </div>

          {(psychologistPreview || patientPreview) && (
            <div className="grid gap-1.5 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
              {psychologistPreview && (
                <p>
                  <span className="font-medium">Para el psicólogo:</span>{" "}
                  {psychologistPreview}
                </p>
              )}
              {patientPreview && (
                <p>
                  <span className="font-medium">
                    Para el paciente ({patientTzLabel}):
                  </span>{" "}
                  {patientPreview}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
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
