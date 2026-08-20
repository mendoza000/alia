"use client";

import { Settings2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PayoutSettingsForm } from "@/components/admin/payout-settings-form";
import type { PayoutSettingsFormData } from "@/lib/validators/payout-settings";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";

export function PayoutSettingsSheet({
  defaultValues,
}: {
  defaultValues: PayoutSettingsFormData;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const formId = "payout-settings-form";

  function handleSuccess() {
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" className="gap-2" />}>
        <Settings2 className="size-4" />
        Editar comisiones
      </SheetTrigger>
      <SheetContent side="right" className="min-w-lg bg-card flex h-full flex-col">
        <SheetHeader>
          <SheetTitle className="font-sans text-lg font-semibold">
            Comisiones de psicólogos
          </SheetTitle>
          <SheetDescription>
            Define qué porcentaje del monto cobrado se le paga a cada
            psicólogo, según sea la primera cita del paciente o una
            recurrente. Los pagos ya aprobados no cambian.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          <PayoutSettingsForm
            key={open ? "open" : "closed"}
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
            Guardar cambios
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
