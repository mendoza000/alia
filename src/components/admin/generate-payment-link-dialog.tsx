"use client";

import { useState, useTransition } from "react";
import { CreditCard, Mail } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  generatePaymentLink,
  sendPaymentLinkEmail,
} from "@/lib/admin/payment-actions";
import { suggestCurrencyFromCountry } from "@/lib/currency";
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
  open,
  onOpenChange,
}: {
  appointmentId: string;
  patientCountry: string | null;
  availableCurrencies: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currency, setCurrency] = useState(() => {
    const suggested = suggestCurrencyFromCountry(patientCountry);
    if (availableCurrencies.includes(suggested)) return suggested;
    if (availableCurrencies.includes("USD")) return "USD";
    return availableCurrencies[0];
  });
  const [url, setUrl] = useState<string | null>(null);
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const parsedCustomAmount = useCustomAmount
    ? Number(customAmount) || undefined
    : undefined;
  const isCustomAmountInvalid = useCustomAmount && !parsedCustomAmount;

  function handleGenerate() {
    startTransition(async () => {
      const result = await generatePaymentLink(
        appointmentId,
        currency,
        parsedCustomAmount,
      );
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
      const result = await sendPaymentLinkEmail(
        appointmentId,
        currency,
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
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-bold text-xl">Generar link de pago</DialogTitle>
          <DialogDescription>
            Elige la moneda en la que se le va a cobrar a la persona.
          </DialogDescription>
        </DialogHeader>

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
          {!url ? (
            <Button
              onClick={handleGenerate}
              isLoading={isPending}
              disabled={isCustomAmountInvalid}
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
