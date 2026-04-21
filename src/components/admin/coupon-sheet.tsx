"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CouponForm } from "@/components/admin/coupon-form";
import type { CouponFormData } from "@/lib/validators/coupon";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

type CouponSheetProps = {
  coupon?: {
    id: string;
    code: string;
    discountPercent: number;
    maxUses: number | null;
    expiresAt: Date | null;
    isActive: boolean;
  };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CouponSheet({
  coupon,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CouponSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;

  const isEditing = !!coupon;
  const formId = `coupon-form-${coupon?.id ?? "new"}`;

  const defaultValues: Partial<CouponFormData> | undefined = coupon
    ? {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        maxUses: coupon.maxUses ?? undefined,
        expiresAt: coupon.expiresAt
          ? coupon.expiresAt.toISOString().slice(0, 10)
          : undefined,
        isActive: coupon.isActive,
      }
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
            Nuevo cupón
          </Button>
        ))}
      <SheetContent side="right" className="min-w-lg bg-card flex h-full flex-col">
        <SheetHeader>
          <SheetTitle className="font-sans text-lg font-semibold">
            {isEditing ? "Editar cupón" : "Nuevo cupón"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? `Modifica el cupón ${coupon.code}`
              : "Crea un nuevo cupón de descuento"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          <CouponForm
            key={coupon?.id ?? "new"}
            couponId={coupon?.id}
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
            {isEditing ? "Guardar cambios" : "Crear cupón"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
