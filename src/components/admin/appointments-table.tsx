"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, FileText, MoreHorizontal, UserX, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  cancelAppointment,
  completeAppointment,
  markNoShow,
} from "@/lib/admin/appointment-actions";
import type { AppointmentRow } from "@/lib/admin/appointment-queries";
import { AppointmentStatusBadge } from "@/components/admin/appointment-status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AppointmentRow({ appointment }: { appointment: AppointmentRow }) {
  const [, startTransition] = useTransition();

  const canComplete = appointment.status === "CONFIRMED";
  const canNoShow = appointment.status === "CONFIRMED";
  const canCancel = !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appointment.status);

  function handleAction(
    action: (id: string) => Promise<{ success: boolean; error?: string }>,
    successMsg: string,
  ) {
    startTransition(async () => {
      const result = await action(appointment.id);
      if (result.success) {
        toast.success(successMsg);
      } else {
        toast.error(result.error ?? "Error al realizar la acción");
      }
    });
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            {appointment.user.image && <AvatarImage src={appointment.user.image} />}
            <AvatarFallback className="text-xs">
              {getInitials(appointment.user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">{appointment.user.name}</p>
            <p className="text-xs text-muted-foreground">{appointment.user.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm">{appointment.psychologist.name}</TableCell>
      <TableCell className="text-sm">
        <p className="font-medium capitalize">
          {format(new Date(appointment.dateTime), "d MMM yyyy", { locale: es })}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(appointment.dateTime), "HH:mm")}
        </p>
      </TableCell>
      <TableCell>
        <AppointmentStatusBadge status={appointment.status} />
      </TableCell>
      <TableCell className="text-sm">
        {appointment.payment
          ? formatCOP.format(appointment.payment.finalAmount)
          : "—"}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {appointment.intakeForm && (
              <DropdownMenuItem
                render={<Link href={`/admin/formularios/${appointment.id}`} />}
              >
                <FileText />
                Ver formulario
              </DropdownMenuItem>
            )}
            {(canComplete || canNoShow || canCancel) && appointment.intakeForm && (
              <DropdownMenuSeparator />
            )}
            {canComplete && (
              <DropdownMenuItem
                onClick={() => handleAction(completeAppointment, "Cita marcada como completada")}
              >
                <CheckCircle2 />
                Marcar completada
              </DropdownMenuItem>
            )}
            {canNoShow && (
              <DropdownMenuItem
                onClick={() => handleAction(markNoShow, "Marcada como no asistió")}
              >
                <UserX />
                No se presentó
              </DropdownMenuItem>
            )}
            {canCancel && (
              <>
                {(canComplete || canNoShow) && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handleAction(cancelAppointment, "Cita cancelada")}
                >
                  <XCircle />
                  Cancelar cita
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function AppointmentsTable({
  appointments,
}: {
  appointments: AppointmentRow[];
}) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
        <p className="text-sm text-muted-foreground">No se encontraron citas</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader className="[&_th]:font-semibold">
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>Psicólogo</TableHead>
            <TableHead>Fecha / Hora</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((a) => (
            <AppointmentRow key={a.id} appointment={a} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
