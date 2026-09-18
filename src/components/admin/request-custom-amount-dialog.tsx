"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { requestApproval } from "@/lib/admin/approval-actions";
import {
    PAYOUT_TYPES,
    PAYOUT_TYPE_LABELS,
    getPayoutTypeRate,
} from "@/lib/payout-type";
import type { PayoutSettings } from "@/lib/admin/payout-settings-queries";
import type { PayoutType } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/**
 * Psychologist-only counterpart to EditAppointmentPriceDialog: instead of
 * writing the agreed price directly (payment.commission.write, which a
 * psychologist doesn't hold), this submits an ApprovalRequest for
 * admin/assistant to decide (Fase 5).
 */
export function RequestCustomAmountDialog({
    appointmentId,
    agreedAmount,
    agreedCurrency,
    availableCurrencies,
    commissionRates,
    open,
    onOpenChange,
}: {
    appointmentId: string;
    agreedAmount: number | null;
    agreedCurrency: string | null;
    availableCurrencies: string[];
    commissionRates: PayoutSettings;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [amount, setAmount] = useState(
        agreedAmount != null ? String(agreedAmount) : "",
    );
    const [currency, setCurrency] = useState(
        agreedCurrency ?? availableCurrencies[0] ?? "",
    );
    const [payoutType, setPayoutType] = useState<PayoutType | undefined>();
    const [isPending, startTransition] = useTransition();

    const parsedAmount = Number(amount);
    const isInvalid =
        !currency ||
        !payoutType ||
        !Number.isFinite(parsedAmount) ||
        parsedAmount <= 0;

    function handleSend() {
        if (isInvalid || !payoutType) return;
        startTransition(async () => {
            const result = await requestApproval(
                "CUSTOM_PAYMENT_AMOUNT",
                appointmentId,
                { amount: parsedAmount, currency, payoutType },
            );
            if (result.success) {
                toast.success(
                    "Solicitud enviada — un administrador la revisará",
                );
                onOpenChange(false);
            } else {
                toast.error(result.error);
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-bold text-xl">
                        Solicitar aprobación de monto
                    </DialogTitle>
                    <DialogDescription>
                        Un administrador o asistente revisará este monto antes
                        de generar el link de pago.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-1.5">
                        <Label>Moneda</Label>
                        <Select
                            items={availableCurrencies.map(c => ({
                                value: c,
                                label: c,
                            }))}
                            value={currency}
                            onValueChange={value => value && setCurrency(value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecciona una moneda" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableCurrencies.map(c => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="request-amount">Monto</Label>
                        <Input
                            id="request-amount"
                            type="number"
                            min={1}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Comisión</Label>
                        <Select
                            items={PAYOUT_TYPES.map(t => ({
                                value: t,
                                label: `${PAYOUT_TYPE_LABELS[t]} (${getPayoutTypeRate(commissionRates, t)}%)`,
                            }))}
                            value={payoutType}
                            onValueChange={value =>
                                setPayoutType(value as PayoutType | undefined)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecciona qué comisión aplicar" />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYOUT_TYPES.map(t => (
                                    <SelectItem key={t} value={t}>
                                        {PAYOUT_TYPE_LABELS[t]} (
                                        {getPayoutTypeRate(commissionRates, t)}
                                        %)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSend}
                        isLoading={isPending}
                        disabled={isInvalid}
                    >
                        <Send />
                        Enviar solicitud
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
