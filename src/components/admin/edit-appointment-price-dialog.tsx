"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateAgreedPrice } from "@/lib/admin/payment-actions";
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

export function EditAppointmentPriceDialog({
    appointmentId,
    agreedAmount,
    agreedCurrency,
    agreedPayoutType,
    availableCurrencies,
    commissionRates,
    open,
    onOpenChange,
}: {
    appointmentId: string;
    agreedAmount: number | null;
    agreedCurrency: string | null;
    agreedPayoutType: PayoutType | null;
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
    const [payoutType, setPayoutType] = useState<PayoutType | undefined>(
        agreedPayoutType ?? undefined,
    );
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const parsedAmount = Number(amount);
    const isInvalid =
        !currency ||
        !payoutType ||
        !Number.isFinite(parsedAmount) ||
        parsedAmount <= 0;

    function handleSave() {
        if (isInvalid || !payoutType) return;
        startTransition(async () => {
            const result = await updateAgreedPrice(appointmentId, {
                amount: parsedAmount,
                currency,
                payoutType,
            });
            if (result.success) {
                toast.success("Precio actualizado");
                onOpenChange(false);
                router.refresh();
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
                        Editar precio de la sesión
                    </DialogTitle>
                    <DialogDescription>
                        Cambia el monto o la comisión acordados para esta
                        sesión.
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
                        <Label htmlFor="edit-price-amount">Monto</Label>
                        <Input
                            id="edit-price-amount"
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
                        onClick={handleSave}
                        isLoading={isPending}
                        disabled={isInvalid}
                    >
                        <Save />
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
