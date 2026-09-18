"use client";

import { CreditCard, Mail, XCircle } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
    PAYOUT_TYPES,
    PAYOUT_TYPE_LABELS,
    getPayoutTypeRate,
} from "@/lib/payout-type";
import type { PayoutSettings } from "@/lib/admin/payout-settings-queries";
import type { PayoutType } from "@/generated/prisma/enums";

/** Shared by payment-table.tsx and appointments-table.tsx — previously only
 * defined inside payment-table.tsx, so appointments-table had no way to
 * change a payment's commission without navigating to /admin/pagos. */
export function CommissionSelect({
    payoutType,
    commissionRates,
    disabled,
    onChange,
    className,
}: {
    payoutType: PayoutType | null;
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
            value={payoutType ?? undefined}
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

/** Shared payment-related dropdown items — previously appointments-table.tsx
 * had generate/regenerate link + send email but no void, and payment-table.tsx
 * had void but no generate/regenerate link + send email. Renders as a
 * fragment so each table keeps its own DropdownMenu/trigger and can mix
 * these items with its own non-payment actions. */
export function PaymentActionsMenuItems({
    canGenerateLink,
    hasUsableLink,
    canVoid,
    onGenerateLinkClick,
    onSendEmail,
    onVoid,
}: {
    canGenerateLink: boolean;
    hasUsableLink: boolean;
    canVoid: boolean;
    onGenerateLinkClick: () => void;
    onSendEmail: () => void;
    onVoid: () => void;
}) {
    return (
        <>
            {canGenerateLink && (
                <DropdownMenuItem onClick={onGenerateLinkClick}>
                    <CreditCard />
                    {hasUsableLink
                        ? "Regenerar link de pago"
                        : "Generar link de pago"}
                </DropdownMenuItem>
            )}
            {hasUsableLink && (
                <DropdownMenuItem onClick={onSendEmail}>
                    <Mail />
                    Enviar por correo
                </DropdownMenuItem>
            )}
            {canVoid && (
                <DropdownMenuItem variant="destructive" onClick={onVoid}>
                    <XCircle />
                    Anular pago
                </DropdownMenuItem>
            )}
        </>
    );
}
