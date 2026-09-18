"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Mail, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
    sendPaymentLinkEmail,
    updatePaymentCommission,
    voidPayment,
} from "@/lib/admin/payment-actions";
import { formatCurrencyAmount, formatUSD } from "@/lib/currency";
import { getPsychologistShareUsd } from "@/lib/payment-math";
import { getPaymentActionFlags } from "@/lib/admin/payment-action-flags";
import type { PayoutSettings } from "@/lib/admin/payout-settings-queries";
import type { PaymentRow } from "@/lib/admin/payment-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    CommissionSelect,
    PaymentActionsMenuItems,
} from "@/components/admin/payment-actions-menu";
import { GeneratePaymentLinkDialog } from "@/components/admin/generate-payment-link-dialog";
import { EditAppointmentPriceDialog } from "@/components/admin/edit-appointment-price-dialog";
import { RequestCustomAmountDialog } from "@/components/admin/request-custom-amount-dialog";
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

type PaymentActionsProps = {
    payment: PaymentRowWithUsd;
    commissionRates: PayoutSettings;
    hasAvailableCurrencies: boolean;
    onGenerateLink: (payment: PaymentRowWithUsd) => void;
};

/** Shared by the desktop row and the mobile card — each mounts its own
 * instance (only one is visible per breakpoint via CSS), so they can't
 * share a single hook call, but the handler logic itself stays in one
 * place. */
function usePaymentRowActions(
    p: PaymentRowWithUsd,
    hasAvailableCurrencies: boolean,
    onGenerateLink: (payment: PaymentRowWithUsd) => void,
) {
    const [isPending, startTransition] = useTransition();
    const [isSavingCommission, startCommissionTransition] = useTransition();

    function handleGenerateLinkClick() {
        if (!hasAvailableCurrencies) {
            toast.error(
                "Configura al menos una tarifa en /admin/tarifas primero",
            );
            return;
        }
        onGenerateLink(p);
    }

    function handleSendEmail() {
        startTransition(async () => {
            const result = await sendPaymentLinkEmail(p.appointment.id);
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
        handleGenerateLinkClick,
        handleSendEmail,
        handleVoid,
        handleCommissionChange,
    };
}

function PaymentTableRow({
    payment: p,
    commissionRates,
    hasAvailableCurrencies,
    onGenerateLink,
}: PaymentActionsProps) {
    const {
        isPending,
        isSavingCommission,
        handleGenerateLinkClick,
        handleSendEmail,
        handleVoid,
        handleCommissionChange,
    } = usePaymentRowActions(p, hasAvailableCurrencies, onGenerateLink);
    const config = statusConfig[p.status];
    const { canGenerateLink, hasUsableLink, canVoid } = getPaymentActionFlags({
        appointmentStatus: p.appointment.status,
        paymentStatus: p.status,
        stripeCheckoutUrl: p.stripeCheckoutUrl,
    });

    const psychologistShareUsd = getPsychologistShareUsd(p, p.finalAmountUsd);
    const companyShareUsd =
        psychologistShareUsd != null
            ? p.finalAmountUsd - psychologistShareUsd - (p.stripeFeeUsd ?? 0)
            : null;
    const countsAsRevenue =
        p.status === "APPROVED" &&
        (p.appointment.status === "CONFIRMED" ||
            p.appointment.status === "COMPLETED" ||
            p.appointment.status === "NO_SHOW");

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
                        payoutType={p.payoutType}
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
                <div className="flex flex-wrap items-center gap-1">
                    <Badge variant="outline" className={config.className}>
                        {config.label}
                    </Badge>
                    {p.isNoShowFee && (
                        <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        >
                            Multa
                        </Badge>
                    )}
                </div>
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
                                onClick={handleSendEmail}
                                disabled={isPending}
                                title="Reenviar por correo"
                            >
                                <Mail />
                            </Button>
                        </>
                    )}
                    {(canGenerateLink || canVoid) && (
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
                                <PaymentActionsMenuItems
                                    canGenerateLink={canGenerateLink}
                                    hasUsableLink={hasUsableLink}
                                    canVoid={canVoid}
                                    onGenerateLinkClick={
                                        handleGenerateLinkClick
                                    }
                                    onSendEmail={handleSendEmail}
                                    onVoid={handleVoid}
                                />
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
    hasAvailableCurrencies,
    onGenerateLink,
}: PaymentActionsProps) {
    const {
        isPending,
        isSavingCommission,
        handleGenerateLinkClick,
        handleSendEmail,
        handleVoid,
        handleCommissionChange,
    } = usePaymentRowActions(p, hasAvailableCurrencies, onGenerateLink);
    const config = statusConfig[p.status];
    const { canGenerateLink, hasUsableLink, canVoid } = getPaymentActionFlags({
        appointmentStatus: p.appointment.status,
        paymentStatus: p.status,
        stripeCheckoutUrl: p.stripeCheckoutUrl,
    });
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
                <div className="flex flex-wrap items-center gap-1">
                    <Badge variant="outline" className={config.className}>
                        {config.label}
                    </Badge>
                    {p.isNoShowFee && (
                        <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        >
                            Multa
                        </Badge>
                    )}
                </div>
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
                    payoutType={p.payoutType}
                    commissionRates={commissionRates}
                    disabled={isSavingCommission}
                    onChange={handleCommissionChange}
                    className="h-8 w-full text-xs"
                />
            </div>

            {(hasUsableLink || canGenerateLink || canVoid) && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    {hasUsableLink && (
                        <>
                            <CopyLinkButton text={p.stripeCheckoutUrl ?? ""} />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSendEmail}
                                disabled={isPending}
                            >
                                <Mail />
                                Reenviar
                            </Button>
                        </>
                    )}
                    {canGenerateLink && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateLinkClick}
                            disabled={isPending}
                        >
                            {hasUsableLink ? "Regenerar link" : "Generar link"}
                        </Button>
                    )}
                    {canVoid && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={handleVoid}
                            disabled={isPending}
                        >
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
    availableCurrencies,
    canEditPrice,
    canRequestApproval,
}: {
    payments: PaymentRowWithUsd[];
    commissionRates: PayoutSettings;
    availableCurrencies: string[];
    /** payment.commission.write — admin/assistant, not psychologist. */
    canEditPrice: boolean;
    /** approval.request — psychologist. */
    canRequestApproval: boolean;
}) {
    const [activePayment, setActivePayment] =
        useState<PaymentRowWithUsd | null>(null);
    const [editingPricePayment, setEditingPricePayment] =
        useState<PaymentRowWithUsd | null>(null);
    const [requestingApprovalPayment, setRequestingApprovalPayment] =
        useState<PaymentRowWithUsd | null>(null);

    if (payments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
                <p className="text-sm text-muted-foreground">
                    No se encontraron pagos
                </p>
            </div>
        );
    }

    const rowProps = (p: PaymentRowWithUsd): PaymentActionsProps => ({
        payment: p,
        commissionRates,
        hasAvailableCurrencies: availableCurrencies.length > 0,
        onGenerateLink: setActivePayment,
    });

    return (
        <>
            <DataTableShell
                items={payments}
                getKey={p => p.id}
                mobileRender={p => <PaymentCard {...rowProps(p)} />}
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
                            <PaymentTableRow key={p.id} {...rowProps(p)} />
                        ))}
                    </TableBody>
                </Table>
            </DataTableShell>

            {activePayment && (
                <GeneratePaymentLinkDialog
                    appointmentId={activePayment.appointment.id}
                    agreedAmount={activePayment.appointment.agreedAmount}
                    agreedCurrency={activePayment.appointment.agreedCurrency}
                    agreedPayoutType={
                        activePayment.appointment.agreedPayoutType
                    }
                    commissionRates={commissionRates}
                    canEditPrice={canEditPrice}
                    onEditPrice={() => {
                        setEditingPricePayment(activePayment);
                        setActivePayment(null);
                    }}
                    onRequestApproval={() => {
                        setRequestingApprovalPayment(activePayment);
                        setActivePayment(null);
                    }}
                    open={!!activePayment}
                    onOpenChange={v => !v && setActivePayment(null)}
                />
            )}

            {requestingApprovalPayment && canRequestApproval && (
                <RequestCustomAmountDialog
                    appointmentId={requestingApprovalPayment.appointment.id}
                    agreedAmount={
                        requestingApprovalPayment.appointment.agreedAmount
                    }
                    agreedCurrency={
                        requestingApprovalPayment.appointment.agreedCurrency
                    }
                    availableCurrencies={availableCurrencies}
                    commissionRates={commissionRates}
                    open={!!requestingApprovalPayment}
                    onOpenChange={v => !v && setRequestingApprovalPayment(null)}
                />
            )}

            {editingPricePayment && (
                <EditAppointmentPriceDialog
                    appointmentId={editingPricePayment.appointment.id}
                    agreedAmount={editingPricePayment.appointment.agreedAmount}
                    agreedCurrency={
                        editingPricePayment.appointment.agreedCurrency
                    }
                    agreedPayoutType={
                        editingPricePayment.appointment.agreedPayoutType
                    }
                    availableCurrencies={availableCurrencies}
                    commissionRates={commissionRates}
                    open={!!editingPricePayment}
                    onOpenChange={v => !v && setEditingPricePayment(null)}
                />
            )}
        </>
    );
}
