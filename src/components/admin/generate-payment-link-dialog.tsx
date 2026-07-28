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
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleGenerate() {
    startTransition(async () => {
      const result = await generatePaymentLink(appointmentId, currency);
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
      const result = await sendPaymentLinkEmail(appointmentId, currency);
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
        if (!v) setUrl(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar link de pago</DialogTitle>
          <DialogDescription>
            Elige la moneda en la que se le va a cobrar al paciente.
          </DialogDescription>
        </DialogHeader>

        <Select
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

        {url && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <p className="flex-1 truncate text-sm text-muted-foreground">
              {url}
            </p>
            <CopyLinkButton text={url} />
          </div>
        )}

        <DialogFooter>
          {!url ? (
            <Button onClick={handleGenerate} isLoading={isPending}>
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
