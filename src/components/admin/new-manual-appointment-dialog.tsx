"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { createManualAppointment } from "@/lib/admin/manual-booking-actions";
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

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      psychologistId: "",
      patientName: "",
      patientEmail: "",
      date: "",
      time: "",
      notes: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const result = await createManualAppointment({
      psychologistId: values.psychologistId,
      patientName: values.patientName,
      patientEmail: values.patientEmail,
      date: values.date,
      time: values.time,
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
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <PlusIcon className="size-4" />
        Nueva cita manual
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
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
                <Select value={field.value} onValueChange={field.onChange}>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                {...register("date", { required: true })}
              />
              {errors.date && (
                <p className="text-xs text-destructive">Obligatorio</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                {...register("time", { required: true })}
              />
              {errors.time && (
                <p className="text-xs text-destructive">Obligatorio</p>
              )}
            </div>
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
