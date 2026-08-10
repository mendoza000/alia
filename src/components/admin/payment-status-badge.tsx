import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/generated/prisma/enums";

const statusConfig: Record<
    PaymentStatus,
    { label: string; className: string }
> = {
    PENDING: {
        label: "Pendiente",
        className:
            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    APPROVED: {
        label: "Pagado",
        className:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    REJECTED: {
        label: "Rechazado",
        className:
            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    VOIDED: {
        label: "Anulado",
        className: "bg-muted text-muted-foreground",
    },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
    const config = statusConfig[status];
    return (
        <Badge variant="outline" className={config.className}>
            {config.label}
        </Badge>
    );
}
