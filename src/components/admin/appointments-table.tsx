"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle2,
  CreditCard,
  FileText,
  Mail,
  MoreHorizontal,
  UserX,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  cancelAppointment,
  completeAppointment,
  markNoShow,
} from "@/lib/admin/appointment-actions";
import { sendPaymentLinkEmail } from "@/lib/admin/payment-actions";
import { formatCurrencyAmount } from "@/lib/currency";
import type { AppointmentRow } from "@/lib/admin/appointment-queries";
import { AppointmentStatusBadge } from "@/components/admin/appointment-status-badge";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { GeneratePaymentLinkDialog } from "@/components/admin/generate-payment-link-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
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


function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AppointmentRow({
  appointment,
  hasAvailableCurrencies,
  onGenerateLink,
}: {
  appointment: AppointmentRow;
  hasAvailableCurrencies: boolean;
  onGenerateLink: (appointment: AppointmentRow) => void;
}) {
  const [, startTransition] = useTransition();

  const canComplete = appointment.status === "CONFIRMED";
  const canNoShow = appointment.status === "CONFIRMED";
  const canCancel = !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appointment.status);
  const canGenerateLink = ["CONFIRMED", "COMPLETED", "NO_SHOW"].includes(
    appointment.status,
  );
  const hasUsableLink =
    appointment.payment?.stripeCheckoutUrl &&
    appointment.payment.status === "PENDING";

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

  function handleGenerateLinkClick() {
    if (!hasAvailableCurrencies) {
      toast.error("Configura al menos una tarifa en /admin/tarifas primero");
      return;
    }
    onGenerateLink(appointment);
  }

  function handleSendEmail() {
    if (!appointment.payment) return;
    startTransition(async () => {
      const result = await sendPaymentLinkEmail(
        appointment.id,
        appointment.payment?.currency ?? "COP",
      );
      if (result.success) {
        toast.success("Correo enviado");
      } else {
        toast.error(result.error);
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
        <div className="flex items-center gap-1">
          <span>
            {appointment.payment
              ? formatCurrencyAmount(appointment.payment.finalAmount, appointment.payment.currency)
              : "—"}
          </span>
          {hasUsableLink && (
            <CopyLinkButton text={appointment.payment?.stripeCheckoutUrl ?? ""} />
          )}
        </div>
      </TableCell>
      <TableCell>
        {appointment.payment ? (
          <PaymentStatusBadge status={appointment.payment.status} />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
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
            {(canComplete || canNoShow || canCancel || canGenerateLink) &&
              appointment.intakeForm && <DropdownMenuSeparator />}
            {canGenerateLink && (
              <>
                <DropdownMenuItem onClick={handleGenerateLinkClick}>
                  <CreditCard />
                  {hasUsableLink ? "Regenerar link de pago" : "Generar link de pago"}
                </DropdownMenuItem>
                {hasUsableLink && (
                  <DropdownMenuItem onClick={handleSendEmail}>
                    <Mail />
                    Enviar por correo
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            {canComplete && (
              <DropdownMenuItem
                onClick={() => handleAction(completeAppointment, "Sesión marcada como completada")}
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
                  onClick={() => handleAction(cancelAppointment, "Sesión cancelada")}
                >
                  <XCircle />
                  Cancelar sesión
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
  availableCurrencies,
}: {
  appointments: AppointmentRow[];
  availableCurrencies: string[];
}) {
  const [activeAppointment, setActiveAppointment] = useState<AppointmentRow | null>(
    null,
  );

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
        <p className="text-sm text-muted-foreground">No se encontraron sesiones</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader className="[&_th]:font-semibold">
          <TableRow>
            <TableHead>Persona</TableHead>
            <TableHead>Psicólogo</TableHead>
            <TableHead>Fecha / Hora</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((a) => (
            <AppointmentRow
              key={a.id}
              appointment={a}
              hasAvailableCurrencies={availableCurrencies.length > 0}
              onGenerateLink={setActiveAppointment}
            />
          ))}
        </TableBody>
      </Table>

      {activeAppointment && (
        <GeneratePaymentLinkDialog
          appointmentId={activeAppointment.id}
          patientCountry={activeAppointment.patientCountry}
          availableCurrencies={availableCurrencies}
          open={!!activeAppointment}
          onOpenChange={(v) => !v && setActiveAppointment(null)}
        />
      )}
    </div>
  );
}
