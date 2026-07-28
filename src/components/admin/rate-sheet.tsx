"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RateForm } from "@/components/admin/rate-form";
import type { PaymentRateFormData } from "@/lib/validators/payment-rate";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

type RateSheetProps = {
  rate?: {
    id: string;
    currency: string;
    amount: number;
  };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function RateSheet({
  rate,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: RateSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;

  const isEditing = !!rate;
  const formId = `rate-form-${rate?.id ?? "new"}`;

  const defaultValues: Partial<PaymentRateFormData> | undefined = rate
    ? { currency: rate.currency as PaymentRateFormData["currency"], amount: rate.amount }
    : undefined;

  function handleSuccess() {
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ??
        (!isEditing && (
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Nueva tarifa
          </Button>
        ))}
      <SheetContent side="right" className="min-w-lg bg-card flex h-full flex-col">
        <SheetHeader>
          <SheetTitle className="font-sans text-lg font-semibold">
            {isEditing ? "Editar tarifa" : "Nueva tarifa"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? `Modifica la tarifa en ${rate.currency}`
              : "Define el monto a cobrar en una moneda"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          <RateForm
            key={rate?.id ?? "new"}
            rateId={rate?.id}
            defaultValues={defaultValues}
            onSuccess={handleSuccess}
            renderActions={false}
            formId={formId}
          />
        </div>
        <SheetFooter className="border-t px-4 py-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            {isEditing ? "Guardar cambios" : "Crear tarifa"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
