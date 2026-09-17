"use client";

import { useState, useTransition } from "react";
import { CreditCard, Mail, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    generatePaymentLink,
    sendPaymentLinkEmail,
} from "@/lib/admin/payment-actions";
import { formatCurrencyAmount } from "@/lib/currency";
import { PAYOUT_TYPE_LABELS, getPayoutTypeRate } from "@/lib/payout-type";
import type { PayoutSettings } from "@/lib/admin/payout-settings-queries";
import type { PayoutType } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

/**
 * Confirmation-only since Fase 3: the price/commission are agreed at
 * booking time (Appointment.agreedAmount/agreedCurrency/agreedPayoutType),
 * not chosen here. If nothing was agreed (a session booked before this
 * existed), this points at "Editar precio" instead of letting the amount
 * be picked ad-hoc at generate time.
 */
export function GeneratePaymentLinkDialog({
    appointmentId,
    agreedAmount,
    agreedCurrency,
    agreedPayoutType,
    commissionRates,
    onEditPrice,
    open,
    onOpenChange,
}: {
    appointmentId: string;
    agreedAmount: number | null;
    agreedCurrency: string | null;
    agreedPayoutType: PayoutType | null;
    commissionRates: PayoutSettings;
    onEditPrice: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [url, setUrl] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const hasAgreedPrice =
        agreedAmount != null &&
        agreedCurrency != null &&
        agreedPayoutType != null;

    function handleGenerate() {
        startTransition(async () => {
            const result = await generatePaymentLink(appointmentId);
            if (result.success) {
                setUrl(result.url ?? null);
                toast.success("Link generado");
                router.refresh();
            } else {
                toast.error(result.error);
            }
        });
    }

    function handleSendEmail() {
        startTransition(async () => {
            const result = await sendPaymentLinkEmail(appointmentId);
            if (result.success) {
                toast.success("Correo enviado");
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error(result.error);
            }
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={v => {
                onOpenChange(v);
                if (!v) setUrl(null);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-bold text-xl">
                        Generar link de pago
                    </DialogTitle>
                    <DialogDescription>
                        {hasAgreedPrice
                            ? "Confirma el monto y la comisión ya acordados para esta sesión."
                            : "Esta sesión no tiene un precio acordado todavía."}
                    </DialogDescription>
                </DialogHeader>

                {hasAgreedPrice ? (
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                        <p>
                            Monto:{" "}
                            <strong>
                                {formatCurrencyAmount(
                                    agreedAmount,
                                    agreedCurrency,
                                )}
                            </strong>
                        </p>
                        <p className="text-muted-foreground">
                            Comisión: {PAYOUT_TYPE_LABELS[agreedPayoutType]} (
                            {getPayoutTypeRate(
                                commissionRates,
                                agreedPayoutType,
                            )}
                            %)
                        </p>
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                        Usa "Editar precio de la sesión" para fijar el monto y
                        la comisión antes de generar el link.
                    </div>
                )}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={onEditPrice}
                    className="w-fit"
                >
                    <Pencil />
                    Editar precio de esta sesión
                </Button>

                {url && (
                    <div className="min-w-0 space-y-2">
                        <div className="min-w-0 rounded-lg border border-border bg-muted/40 px-3 py-2">
                            <p className="truncate text-sm text-muted-foreground">
                                {url}
                            </p>
                        </div>
                        <CopyLinkButton
                            text={url}
                            label="Copiar link de pago"
                            showLabel
                            variant="outline"
                            size="default"
                            className="w-full"
                        />
                    </div>
                )}

                <DialogFooter>
                    {!url ? (
                        <Button
                            onClick={handleGenerate}
                            isLoading={isPending}
                            disabled={!hasAgreedPrice}
                        >
                            <CreditCard />
                            Generar
                        </Button>
                    ) : (
                        <Button onClick={handleSendEmail} isLoading={isPending}>
                            <Mail />
                            Enviar por correo
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
