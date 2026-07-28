"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { sendPaymentLinkEmail } from "@/lib/admin/payment-actions";
import { formatCurrencyAmount } from "@/lib/currency";
import type { PaymentRow } from "@/lib/admin/payment-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PaymentStatus } from "@/generated/prisma/enums";

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  APPROVED: {
    label: "Aprobado",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Rechazado",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  VOIDED: {
    label: "Anulado",
    className: "bg-muted text-muted-foreground",
  },
};

function PaymentTableRow({ payment: p }: { payment: PaymentRow }) {
  const [isPending, startTransition] = useTransition();
  const config = statusConfig[p.status];
  const hasUsableLink = p.status === "PENDING" && p.stripeCheckoutUrl;

  function handleResend() {
    startTransition(async () => {
      const result = await sendPaymentLinkEmail(p.appointmentId, p.currency);
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
        <p className="text-sm font-medium">{p.appointment.user.name}</p>
        <p className="text-xs text-muted-foreground">{p.appointment.user.email}</p>
      </TableCell>
      <TableCell className="text-sm">
        {p.appointment.psychologist.name}
      </TableCell>
      <TableCell className="text-sm">
        {format(new Date(p.appointment.dateTime), "d MMM yyyy", { locale: es })}
      </TableCell>
      <TableCell className="text-sm">
        {p.discountAmount > 0 ? (
          <span className="line-through text-muted-foreground">
            {formatCurrencyAmount(p.amount, p.currency)}
          </span>
        ) : (
          formatCurrencyAmount(p.amount, p.currency)
        )}
      </TableCell>
      <TableCell className="text-sm text-emerald-600">
        {p.discountAmount > 0
          ? `−${formatCurrencyAmount(p.discountAmount, p.currency)}`
          : "—"}
      </TableCell>
      <TableCell className="text-sm font-medium">
        {formatCurrencyAmount(p.finalAmount, p.currency)}
      </TableCell>
      <TableCell>
        {p.coupon ? (
          <Badge variant="secondary" className="font-mono text-xs">
            {p.coupon.code}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {p.paidAt
          ? format(new Date(p.paidAt), "d MMM yyyy HH:mm", { locale: es })
          : "—"}
      </TableCell>
      <TableCell>
        {hasUsableLink && (
          <div className="flex items-center gap-1">
            <CopyLinkButton text={p.stripeCheckoutUrl ?? ""} />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleResend}
              disabled={isPending}
              title="Reenviar por correo"
            >
              <Mail />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

export function PaymentTable({ payments }: { payments: PaymentRow[] }) {
  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
        <p className="text-sm text-muted-foreground">No se encontraron pagos</p>
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
            <TableHead>Fecha cita</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead>Descuento</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Cupón</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha pago</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <PaymentTableRow key={p.id} payment={p} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
