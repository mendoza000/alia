"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { createRate, updateRate } from "@/lib/admin/payment-rate-actions";
import { paymentRateSchema } from "@/lib/validators/payment-rate";
import type { PaymentRateFormData } from "@/lib/validators/payment-rate";
import { SUPPORTED_CURRENCIES, getCurrencyLabel } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect } from "@/components/admin/form-fields";

export function RateForm({
  defaultValues,
  rateId,
  onSuccess,
  renderActions = true,
  formId,
}: {
  defaultValues?: Partial<PaymentRateFormData>;
  rateId?: string;
  onSuccess?: () => void;
  renderActions?: boolean;
  formId?: string;
}) {
  const isEditing = !!rateId;

  const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({
    value: c,
    label: `${c} — ${getCurrencyLabel(c)}`,
  })).sort((a, b) => a.label.localeCompare(b.label, "es"));

  const methods = useForm<PaymentRateFormData>({
    resolver: yupResolver(paymentRateSchema) as unknown as Resolver<PaymentRateFormData>,
    defaultValues: defaultValues ?? {
      currency: "COP",
      amount: 0,
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  async function onSubmit(data: PaymentRateFormData) {
    try {
      const result = isEditing
        ? await updateRate(rateId, data)
        : await createRate(data);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(isEditing ? "Tarifa actualizada" : "Tarifa creada");
      onSuccess?.();
    } catch {
      toast.error("Error al guardar la tarifa");
    }
  }

  return (
    <FormProvider {...methods}>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
        <FormSelect
          name="currency"
          label="Moneda"
          placeholder="Selecciona una moneda"
          options={currencyOptions}
        />

        <FormInput
          name="amount"
          label="Monto"
          type="number"
          placeholder="120000"
          description="Monto redondo a cobrar en esta moneda"
        />

        {renderActions && (
          <div className="flex items-center gap-3">
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? "Guardar cambios" : "Crear tarifa"}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
