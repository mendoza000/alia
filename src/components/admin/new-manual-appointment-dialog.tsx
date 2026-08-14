"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createManualAppointment } from "@/lib/admin/manual-booking-actions";
import { getMonthAvailability } from "@/app/(landing)/psicologos/[slug]/actions";
import type { MonthAvailability } from "@/lib/availability";
import { TIMEZONE_OPTIONS } from "@/lib/timezones";
import { AvailabilityCalendar } from "@/components/availability/availability-calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

type FormValues = {
  psychologistId: string;
  patientName: string;
  patientEmail: string;
  date: string;
  time: string;
  timezone: string;
  notes: string;
};

export function NewManualAppointmentDialog({
  psychologists,
}: {
  psychologists: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availability, setAvailability] = useState<{
    psychologistId: string;
    year: number;
    month: number;
    data: MonthAvailability;
  } | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      psychologistId: "",
      patientName: "",
      patientEmail: "",
      date: "",
      time: "",
      timezone: "America/Bogota",
      notes: "",
    },
  });

  const selectedDate = watch("date");
  const selectedTime = watch("time");

  async function loadAvailability(psychologistId: string) {
    setAvailability(null);
    setLoadingAvailability(true);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const data = await getMonthAvailability(psychologistId, year, month);
    setAvailability({ psychologistId, year, month, data });
    setLoadingAvailability(false);
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const result = await createManualAppointment({
      psychologistId: values.psychologistId,
      patientName: values.patientName,
      patientEmail: values.patientEmail,
      date: values.date,
      time: values.time,
      timezone: values.timezone,
      notes: values.notes || undefined,
    });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    if (result.warning) {
      toast.warning(result.warning);
    }
    toast.success("Cita creada y confirmada");
    reset();
    setAvailability(null);
    setOpen(false);
    router.refresh();
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
      setAvailability(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <PlusIcon className="size-4" />
        Nueva cita manual
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agendar cita manualmente</DialogTitle>
          <DialogDescription>
            Crea y confirma una cita directamente, sin pasar por el flujo de
            pago o formulario. Útil para pacientes con problemas durante el
            agendamiento automático.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Psicólogo</Label>
            <Controller
              control={control}
              name="psychologistId"
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  items={psychologists.map(p => ({ value: p.id, label: p.name }))}
                  value={field.value}
                  onValueChange={value => {
                    field.onChange(value);
                    setValue("date", "");
                    setValue("time", "");
                    if (value) loadAvailability(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un psicólogo" />
                  </SelectTrigger>
                  <SelectContent>
                    {psychologists.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.psychologistId && (
              <p className="text-xs text-destructive">
                Selecciona un psicólogo
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="patientName">Nombre del paciente</Label>
              <Input
                id="patientName"
                {...register("patientName", { required: true })}
              />
              {errors.patientName && (
                <p className="text-xs text-destructive">Obligatorio</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="patientEmail">Correo del paciente</Label>
              <Input
                id="patientEmail"
                type="email"
                {...register("patientEmail", { required: true })}
              />
              {errors.patientEmail && (
                <p className="text-xs text-destructive">Obligatorio</p>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Zona horaria del paciente</Label>
            <Controller
              control={control}
              name="timezone"
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  items={TIMEZONE_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una zona horaria" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Se usa para mostrarle al paciente la hora de su cita en el
              correo de confirmación.
            </p>
          </div>

          <input type="hidden" {...register("date", { required: true })} />
          <input type="hidden" {...register("time", { required: true })} />

          <div className="grid gap-1.5">
            <Label>Disponibilidad</Label>
            {!watch("psychologistId") ? (
              <p className="text-sm text-muted-foreground">
                Selecciona un psicólogo para ver sus horarios disponibles.
              </p>
            ) : loadingAvailability ||
              availability?.psychologistId !== watch("psychologistId") ? (
              <p className="text-sm text-muted-foreground">
                Cargando disponibilidad...
              </p>
            ) : (
              <AvailabilityCalendar
                key={availability.psychologistId}
                psychologistId={availability.psychologistId}
                psychologistSlug=""
                schedules={[]}
                sessionDuration={0}
                initialAvailability={availability.data}
                initialYear={availability.year}
                initialMonth={availability.month}
                onSlotSelect={(date, time) => {
                  setValue("date", date, { shouldValidate: true });
                  setValue("time", time, { shouldValidate: true });
                }}
              />
            )}
            {selectedDate && selectedTime && (
              <p className="text-sm font-medium text-foreground">
                Horario seleccionado:{" "}
                {format(
                  new Date(`${selectedDate}T12:00:00`),
                  "EEEE d 'de' MMMM",
                  { locale: es },
                )}{" "}
                — {selectedTime}
              </p>
            )}
            {(errors.date || errors.time) && (
              <p className="text-xs text-destructive">
                Selecciona un horario disponible
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button type="submit" isLoading={isSubmitting}>
              Crear y confirmar cita
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
