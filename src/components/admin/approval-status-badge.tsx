import { Badge } from "@/components/ui/badge";
import type { ApprovalStatus } from "@/generated/prisma/enums";

const statusConfig: Record<
    ApprovalStatus,
    { label: string; className: string }
> = {
    PENDING: {
        label: "Pendiente",
        className:
            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    APPROVED: {
        label: "Aprobada",
        className:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    REJECTED: {
        label: "Rechazada",
        className:
            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
};

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
    const config = statusConfig[status];
    return (
        <Badge variant="outline" className={config.className}>
            {config.label}
        </Badge>
    );
}
