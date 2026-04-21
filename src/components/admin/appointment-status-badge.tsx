import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/generated/prisma/enums";

const statusConfig: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  PENDING_FORM: {
    label: "Formulario pendiente",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  PENDING_PAYMENT: {
    label: "Pago pendiente",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  CONFIRMED: {
    label: "Confirmada",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  CANCELLED: {
    label: "Cancelada",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  COMPLETED: {
    label: "Completada",
    className: "bg-secondary text-muted-foreground",
  },
  NO_SHOW: {
    label: "No se presentó",
    className: "bg-muted text-muted-foreground",
  },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
