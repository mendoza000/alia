"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Mail, MoreHorizontal, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
    sendPaymentLinkEmail,
    updatePaymentCommission,
    voidPayment,
} from "@/lib/admin/payment-actions";
import { formatCurrencyAmount, formatUSD } from "@/lib/currency";
import { getPsychologistShareUsd } from "@/lib/payment-math";
import {
    PAYOUT_TYPES,
    PAYOUT_TYPE_LABELS,
    getPayoutTypeRate,
} from "@/lib/payout-type";
import type { PayoutSettings } from "@/lib/admin/payout-settings-queries";
import type { PaymentRow } from "@/lib/admin/payment-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DataTableShell } from "@/components/admin/data-table-shell";
import type { PaymentStatus, PayoutType } from "@/generated/prisma/enums";

type PaymentRowWithUsd = PaymentRow & { finalAmountUsd: number };

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
        label: "Aprobado",
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

/** Shared by the desktop row and the mobile card — each mounts its own
 * instance (only one is visible per breakpoint via CSS), so they can't
 * share a single hook call, but the handler logic itself stays in one
 * place. */
function usePaymentRowActions(p: PaymentRowWithUsd) {
    const [isPending, startTransition] = useTransition();
    const [isSavingCommission, startCommissionTransition] = useTransition();

    function handleResend() {
        startTransition(async () => {
            const result = await sendPaymentLinkEmail(
                p.appointmentId,
                p.currency,
            );
            if (result.success) {
                toast.success("Correo enviado");
            } else {
                toast.error(result.error);
            }
        });
    }

    function handleVoid() {
        startTransition(async () => {
            const result = await voidPayment(p.id);
            if (result.success) {
                toast.success("Pago anulado");
            } else {
                toast.error(result.error);
            }
        });
    }

    function handleCommissionChange(payoutType: PayoutType) {
        startCommissionTransition(async () => {
            const result = await updatePaymentCommission(p.id, payoutType);
            if (result.success) {
                toast.success("Comisión actualizada");
            } else {
                toast.error(result.error);
            }
        });
    }

    return {
        isPending,
        isSavingCommission,
        handleResend,
        handleVoid,
        handleCommissionChange,
    };
}

function CommissionSelect({
    payment: p,
    commissionRates,
    disabled,
    onChange,
    className,
}: {
    payment: PaymentRowWithUsd;
    commissionRates: PayoutSettings;
    disabled: boolean;
    onChange: (payoutType: PayoutType) => void;
    className?: string;
}) {
    return (
        <Select
            items={PAYOUT_TYPES.map(t => ({
                value: t,
                label: `${PAYOUT_TYPE_LABELS[t]} (${getPayoutTypeRate(commissionRates, t)}%)`,
            }))}
            value={p.payoutType ?? undefined}
            onValueChange={value => value && onChange(value as PayoutType)}
            disabled={disabled}
        >
            <SelectTrigger className={className ?? "h-7 w-full text-xs"}>
                <SelectValue placeholder="Sin comisión" />
            </SelectTrigger>
            <SelectContent>
                {PAYOUT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>
                        {PAYOUT_TYPE_LABELS[t]} (
                        {getPayoutTypeRate(commissionRates, t)}%)
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function PaymentTableRow({
    payment: p,
    commissionRates,
}: {
    payment: PaymentRowWithUsd;
    commissionRates: PayoutSettings;
}) {
    const {
        isPending,
        isSavingCommission,
        handleResend,
        handleVoid,
        handleCommissionChange,
    } = usePaymentRowActions(p);
    const config = statusConfig[p.status];
    const hasUsableLink = p.status === "PENDING" && p.stripeCheckoutUrl;

    const psychologistShareUsd = getPsychologistShareUsd(p, p.finalAmountUsd);
    const companyShareUsd =
        psychologistShareUsd != null
            ? p.finalAmountUsd - psychologistShareUsd - (p.stripeFeeUsd ?? 0)
            : null;
    const countsAsRevenue =
        p.status === "APPROVED" &&
        (p.appointment.status === "CONFIRMED" ||
            p.appointment.status === "COMPLETED");

    return (
        <TableRow>
            <TableCell>
                <p className="text-sm font-medium">{p.appointment.user.name}</p>
                <p className="text-xs text-muted-foreground">
                    {p.appointment.user.email}
                </p>
            </TableCell>
            <TableCell className="text-sm">
                {p.appointment.psychologist.name}
            </TableCell>
            <TableCell className="text-sm">
                {format(new Date(p.appointment.dateTime), "d MMM yyyy", {
                    locale: es,
                })}
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
            <TableCell className="text-sm text-muted-foreground">
                <span
                    title={
                        p.stripeSettledAmountUsd != null
                            ? "Monto real liquidado por Stripe"
                            : "Monto estimado con tasa de referencia"
                    }
                >
                    {formatUSD.format(p.finalAmountUsd)}
                    {p.stripeSettledAmountUsd == null && (
                        <sup className="ml-0.5 text-[10px]">~</sup>
                    )}
                </span>
                {!countsAsRevenue && p.status === "APPROVED" && (
                    <p className="text-xs text-muted-foreground">
                        No cuenta como recaudado
                    </p>
                )}
            </TableCell>
            <TableCell className="text-sm">
                <div className="space-y-1">
                    <p className="font-medium">
                        {psychologistShareUsd != null
                            ? formatUSD.format(psychologistShareUsd)
                            : "—"}
                    </p>
                    <CommissionSelect
                        payment={p}
                        commissionRates={commissionRates}
                        disabled={isSavingCommission}
                        onChange={handleCommissionChange}
                    />
                </div>
            </TableCell>
            <TableCell className="text-sm">
                <div className="space-y-0.5">
                    <p>
                        {companyShareUsd != null
                            ? formatUSD.format(companyShareUsd)
                            : "—"}
                    </p>
                    {p.stripeFeeUsd != null && p.stripeFeeUsd > 0 && (
                        <p className="text-xs text-muted-foreground">
                            −{formatUSD.format(p.stripeFeeUsd)} Stripe
                        </p>
                    )}
                </div>
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
                    ? format(new Date(p.paidAt), "d MMM yyyy HH:mm", {
                          locale: es,
                      })
                    : "—"}
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1">
                    {hasUsableLink && (
                        <>
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
                        </>
                    )}
                    {p.status === "PENDING" && (
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        disabled={isPending}
                                    >
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                }
                            />
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={handleVoid}
                                >
                                    <XCircle />
                                    Anular pago
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}

/** Mobile card — same 13 columns as the desktop row don't fit a phone width,
 * so this prioritizes Persona, Total (USD) and Estado (the plan's explicit
 * call) plus the commission control and the same actions, everything else
 * folds into a compact key/value grid. */
function PaymentCard({
    payment: p,
    commissionRates,
}: {
    payment: PaymentRowWithUsd;
    commissionRates: PayoutSettings;
}) {
    const {
        isPending,
        isSavingCommission,
        handleResend,
        handleVoid,
        handleCommissionChange,
    } = usePaymentRowActions(p);
    const config = statusConfig[p.status];
    const hasUsableLink = p.status === "PENDING" && p.stripeCheckoutUrl;
    const psychologistShareUsd = getPsychologistShareUsd(p, p.finalAmountUsd);

    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                        {p.appointment.user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        {p.appointment.user.email}
                    </p>
                </div>
                <Badge variant="outline" className={config.className}>
                    {config.label}
                </Badge>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                    <dt className="text-muted-foreground">Psicólogo</dt>
                    <dd>{p.appointment.psychologist.name}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Fecha sesión</dt>
                    <dd>
                        {format(
                            new Date(p.appointment.dateTime),
                            "d MMM yyyy",
                            {
                                locale: es,
                            },
                        )}
                    </dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Total</dt>
                    <dd className="font-medium">
                        {formatCurrencyAmount(p.finalAmount, p.currency)}
                    </dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Total (USD)</dt>
                    <dd>
                        {formatUSD.format(p.finalAmountUsd)}
                        {p.stripeSettledAmountUsd == null && (
                            <sup className="ml-0.5 text-[10px]">~</sup>
                        )}
                    </dd>
                </div>
                {p.coupon && (
                    <div>
                        <dt className="text-muted-foreground">Cupón</dt>
                        <dd>
                            <Badge
                                variant="secondary"
                                className="font-mono text-[10px]"
                            >
                                {p.coupon.code}
                            </Badge>
                        </dd>
                    </div>
                )}
                {p.paidAt && (
                    <div>
                        <dt className="text-muted-foreground">Fecha pago</dt>
                        <dd>
                            {format(new Date(p.paidAt), "d MMM yyyy HH:mm", {
                                locale: es,
                            })}
                        </dd>
                    </div>
                )}
            </dl>

            <div className="mt-3 space-y-1 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                    Debido al psicólogo:{" "}
                    <span className="font-medium text-foreground">
                        {psychologistShareUsd != null
                            ? formatUSD.format(psychologistShareUsd)
                            : "—"}
                    </span>
                </p>
                <CommissionSelect
                    payment={p}
                    commissionRates={commissionRates}
                    disabled={isSavingCommission}
                    onChange={handleCommissionChange}
                    className="h-8 w-full text-xs"
                />
            </div>

            {(hasUsableLink || p.status === "PENDING") && (
                <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                    {hasUsableLink && (
                        <>
                            <CopyLinkButton text={p.stripeCheckoutUrl ?? ""} />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResend}
                                disabled={isPending}
                            >
                                <Mail />
                                Reenviar
                            </Button>
                        </>
                    )}
                    {p.status === "PENDING" && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={handleVoid}
                            disabled={isPending}
                        >
                            <XCircle />
                            Anular
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

export function PaymentTable({
    payments,
    commissionRates,
}: {
    payments: PaymentRowWithUsd[];
    commissionRates: PayoutSettings;
}) {
    if (payments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
                <p className="text-sm text-muted-foreground">
                    No se encontraron pagos
                </p>
            </div>
        );
    }

    return (
        <DataTableShell
            items={payments}
            getKey={p => p.id}
            mobileRender={p => (
                <PaymentCard payment={p} commissionRates={commissionRates} />
            )}
        >
            <Table>
                <TableHeader className="[&_th]:font-semibold">
                    <TableRow>
                        <TableHead>Persona</TableHead>
                        <TableHead>Psicólogo</TableHead>
                        <TableHead>Fecha sesión</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead>Descuento</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Total (USD)</TableHead>
                        <TableHead>Debido al psicólogo</TableHead>
                        <TableHead>Para la empresa</TableHead>
                        <TableHead>Cupón</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha pago</TableHead>
                        <TableHead className="w-20" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map(p => (
                        <PaymentTableRow
                            key={p.id}
                            payment={p}
                            commissionRates={commissionRates}
                        />
                    ))}
                </TableBody>
            </Table>
        </DataTableShell>
    );
}
