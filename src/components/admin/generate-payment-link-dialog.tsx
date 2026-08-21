"use client";

import { useState, useTransition } from "react";
import { CreditCard, Mail } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  generatePaymentLink,
  sendPaymentLinkEmail,
} from "@/lib/admin/payment-actions";
import { formatCurrencyAmount, suggestCurrencyFromCountry } from "@/lib/currency";
import { PAYOUT_TYPES, PAYOUT_TYPE_LABELS, getPayoutTypeRate } from "@/lib/payout-type";
import type { PayoutSettings } from "@/lib/admin/payout-settings-queries";
import type { PayoutType } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
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

export function GeneratePaymentLinkDialog({
  appointmentId,
  patientCountry,
  availableCurrencies,
  commissionRates,
  open,
  onOpenChange,
}: {
  appointmentId: string;
  patientCountry: string | null;
  availableCurrencies: string[];
  commissionRates: PayoutSettings;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currency, setCurrency] = useState(() => {
    const suggested = suggestCurrencyFromCountry(patientCountry);
    if (availableCurrencies.includes(suggested)) return suggested;
    if (availableCurrencies.includes("USD")) return "USD";
    return availableCurrencies[0];
  });
  const [payoutType, setPayoutType] = useState<PayoutType | undefined>(undefined);
  const [url, setUrl] = useState<string | null>(null);
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const parsedCustomAmount = useCustomAmount
    ? Number(customAmount) || undefined
    : undefined;
  const isCustomAmountInvalid = useCustomAmount && !parsedCustomAmount;

  function handleGenerateClick() {
    if (useCustomAmount) {
      setConfirming(true);
      return;
    }
    handleGenerate();
  }

  function handleGenerate() {
    if (!payoutType) return;
    startTransition(async () => {
      const result = await generatePaymentLink(
        appointmentId,
        currency,
        payoutType,
        parsedCustomAmount,
      );
      setConfirming(false);
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
    if (!payoutType) return;
    startTransition(async () => {
      const result = await sendPaymentLinkEmail(
        appointmentId,
        currency,
        payoutType,
        parsedCustomAmount,
      );
      if (result.success) {
        toast.success("Correo enviado");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (availableCurrencies.length === 0) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setUrl(null);
          setUseCustomAmount(false);
          setCustomAmount("");
          setConfirming(false);
          setPayoutType(undefined);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-bold text-xl">Generar link de pago</DialogTitle>
          <DialogDescription>
            {confirming
              ? "Verifica el monto antes de generar el link."
              : "Elige la moneda y la comisión que aplica para esta sesión."}
          </DialogDescription>
        </DialogHeader>

        {confirming && parsedCustomAmount ? (
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
            <p className="text-sm text-muted-foreground">
              Vas a generar un link de pago en <strong>{currency}</strong> por{" "}
              <strong>{formatCurrencyAmount(parsedCustomAmount, currency)}</strong>.
            </p>
          </div>
        ) : (
          <>
            <Select
              items={availableCurrencies.map((c) => ({ value: c, label: c }))}
              value={currency}
              onValueChange={(value) => value && setCurrency(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una moneda" />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              items={PAYOUT_TYPES.map((t) => ({
                value: t,
                label: `${PAYOUT_TYPE_LABELS[t]} (${getPayoutTypeRate(commissionRates, t)}%)`,
              }))}
              value={payoutType}
              onValueChange={(value) => setPayoutType(value as PayoutType | undefined)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona qué comisión aplicar" />
              </SelectTrigger>
              <SelectContent>
                {PAYOUT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {PAYOUT_TYPE_LABELS[t]} ({getPayoutTypeRate(commissionRates, t)}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="custom-amount"
                  checked={useCustomAmount}
                  onCheckedChange={(checked) => setUseCustomAmount(checked === true)}
                  disabled={!!url}
                />
                <Label htmlFor="custom-amount" className="font-normal">
                  Establecer un monto personalizado
                </Label>
              </div>

              {useCustomAmount && (
                <Input
                  type="number"
                  min={1}
                  placeholder="Monto en la moneda seleccionada"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  disabled={!!url}
                />
              )}
            </div>
          </>
        )}

        {url && (
          <div className="min-w-0 space-y-2">
            <div className="min-w-0 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <p className="truncate text-sm text-muted-foreground">{url}</p>
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
          {confirming ? (
            <>
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} isLoading={isPending}>
                <CreditCard />
                Sí, generar
              </Button>
            </>
          ) : !url ? (
            <Button
              onClick={handleGenerateClick}
              isLoading={isPending}
              disabled={isCustomAmountInvalid || !payoutType}
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
