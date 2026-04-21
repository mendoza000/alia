"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { createCoupon, updateCoupon } from "@/lib/admin/coupon-actions";
import { couponSchema } from "@/lib/validators/coupon";
import type { CouponFormData } from "@/lib/validators/coupon";
import { Button } from "@/components/ui/button";
import { FormInput, FormSwitch } from "@/components/admin/form-fields";

export function CouponForm({
  defaultValues,
  couponId,
  onSuccess,
  renderActions = true,
  formId,
}: {
  defaultValues?: Partial<CouponFormData>;
  couponId?: string;
  onSuccess?: () => void;
  renderActions?: boolean;
  formId?: string;
}) {
  const isEditing = !!couponId;

  const methods = useForm<CouponFormData>({
    resolver: yupResolver(couponSchema) as unknown as Resolver<CouponFormData>,
    defaultValues: defaultValues ?? {
      code: "",
      discountPercent: 10,
      maxUses: undefined,
      expiresAt: undefined,
      isActive: true,
    },
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  async function onSubmit(data: CouponFormData) {
    try {
      const result = isEditing
        ? await updateCoupon(couponId, data)
        : await createCoupon(data);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(isEditing ? "Cupón actualizado" : "Cupón creado");
      onSuccess?.();
    } catch {
      toast.error("Error al guardar el cupón");
    }
  }

  return (
    <FormProvider {...methods}>
      <form
        id={formId}
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-5"
      >
        <FormInput
          name="code"
          label="Código"
          placeholder="BIENVENIDA20"
          className="uppercase"
          description="Solo letras mayúsculas, números, guiones y guiones bajos"
        />

        <FormInput
          name="discountPercent"
          label="Porcentaje de descuento"
          type="number"
          placeholder="10"
          description="Valor entre 1 y 100"
        />

        <FormInput
          name="maxUses"
          label="Límite de usos"
          type="number"
          placeholder="Dejar vacío para ilimitado"
          description="Número máximo de veces que se puede usar"
        />

        <FormInput
          name="expiresAt"
          label="Fecha de vencimiento"
          type="date"
          description="Dejar vacío si no vence"
        />

        <FormSwitch
          name="isActive"
          label="Estado"
          description="Cupón activo"
        />

        {renderActions && (
          <div className="flex items-center gap-3">
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? "Guardar cambios" : "Crear cupón"}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
