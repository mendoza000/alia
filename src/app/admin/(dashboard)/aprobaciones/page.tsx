import { requireActor } from "@/lib/auth/require";
import { can } from "@/lib/auth/permissions";
import { getApprovals } from "@/lib/admin/approval-queries";
import { ApprovalsTable } from "@/components/admin/approvals-table";

export default async function AprobacionesPage() {
    const actor = await requireActor();
    const approvals = await getApprovals(actor);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-2xl font-semibold">
                    Aprobaciones
                </h1>
                <p className="text-sm text-muted-foreground">
                    Montos personalizados y solicitudes de reembolso pendientes
                    de decisión
                </p>
            </div>

            <ApprovalsTable
                approvals={approvals}
                canDecide={can(actor.role, "approval.decide")}
            />
        </div>
    );
}
