"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, MoreHorizontal, X } from "lucide-react";
import { formatCurrencyAmount } from "@/lib/currency";
import { PAYOUT_TYPE_LABELS } from "@/lib/payout-type";
import type { ApprovalRow } from "@/lib/admin/approval-queries";
import { ApprovalStatusBadge } from "@/components/admin/approval-status-badge";
import { DecideApprovalDialog } from "@/components/admin/decide-approval-dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableShell } from "@/components/admin/data-table-shell";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const TYPE_LABELS: Record<ApprovalRow["type"], string> = {
    CUSTOM_PAYMENT_AMOUNT: "Monto personalizado",
    REFUND_REQUEST: "Reembolso",
};

function describePayload(row: ApprovalRow): string {
    if (row.type === "CUSTOM_PAYMENT_AMOUNT") {
        const payload = row.payload as {
            amount?: number;
            currency?: string;
            payoutType?: keyof typeof PAYOUT_TYPE_LABELS;
        };
        if (payload.amount == null || !payload.currency) return "—";
        const amountLabel = formatCurrencyAmount(
            payload.amount,
            payload.currency,
        );
        return payload.payoutType
            ? `${amountLabel} (${PAYOUT_TYPE_LABELS[payload.payoutType]})`
            : amountLabel;
    }
    const payload = row.payload as { reason?: string };
    return payload.reason ?? "—";
}

export function ApprovalsTable({
    approvals,
    canDecide,
}: {
    approvals: ApprovalRow[];
    /** approval.decide — admin/assistant. A psychologist only sees their own
     * requests, read-only. */
    canDecide: boolean;
}) {
    const [decidingApproval, setDecidingApproval] = useState<{
        id: string;
        mode: "approve" | "reject";
    } | null>(null);

    if (approvals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
                <p className="text-sm text-muted-foreground">
                    No hay solicitudes de aprobación
                </p>
            </div>
        );
    }

    return (
        <>
            <DataTableShell items={approvals} getKey={a => a.id}>
                <Table>
                    <TableHeader className="[&_th]:font-semibold">
                        <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Solicitado por</TableHead>
                            <TableHead>Detalle</TableHead>
                            <TableHead>Sesión</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha</TableHead>
                            {canDecide && <TableHead className="w-10" />}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {approvals.map(row => (
                            <TableRow key={row.id}>
                                <TableCell>{TYPE_LABELS[row.type]}</TableCell>
                                <TableCell>{row.requestedBy.name}</TableCell>
                                <TableCell>{describePayload(row)}</TableCell>
                                <TableCell>
                                    {row.patientName ? (
                                        <div>
                                            <p className="text-sm">
                                                {row.patientName}
                                            </p>
                                            {row.psychologistName && (
                                                <p className="text-xs text-muted-foreground">
                                                    {row.psychologistName}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            Sesión eliminada
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <ApprovalStatusBadge status={row.status} />
                                    {row.status !== "PENDING" &&
                                        row.decisionNote && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {row.decisionNote}
                                            </p>
                                        )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {format(row.createdAt, "d MMM, HH:mm", {
                                        locale: es,
                                    })}
                                </TableCell>
                                {canDecide && (
                                    <TableCell>
                                        {row.status === "PENDING" && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    render={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                        </Button>
                                                    }
                                                />
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            setDecidingApproval(
                                                                {
                                                                    id: row.id,
                                                                    mode: "approve",
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <Check />
                                                        Aprobar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() =>
                                                            setDecidingApproval(
                                                                {
                                                                    id: row.id,
                                                                    mode: "reject",
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <X />
                                                        Rechazar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DataTableShell>

            {decidingApproval && (
                <DecideApprovalDialog
                    approvalId={decidingApproval.id}
                    mode={decidingApproval.mode}
                    open={!!decidingApproval}
                    onOpenChange={v => !v && setDecidingApproval(null)}
                />
            )}
        </>
    );
}
