"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { PaymentRow } from "@/lib/admin/payment-queries";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PaymentStatus } from "@/generated/prisma/enums";

const formatCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => {
            const config = statusConfig[p.status];
            return (
              <TableRow key={p.id}>
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
                      {formatCOP.format(p.amount)}
                    </span>
                  ) : (
                    formatCOP.format(p.amount)
                  )}
                </TableCell>
                <TableCell className="text-sm text-emerald-600">
                  {p.discountAmount > 0
                    ? `−${formatCOP.format(p.discountAmount)}`
                    : "—"}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {formatCOP.format(p.finalAmount)}
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
