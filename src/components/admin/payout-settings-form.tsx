"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { updatePayoutSettings } from "@/lib/admin/payout-settings-actions";
import { payoutSettingsSchema } from "@/lib/validators/payout-settings";
import type { PayoutSettingsFormData } from "@/lib/validators/payout-settings";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/admin/form-fields";

export function PayoutSettingsForm({
  defaultValues,
  onSuccess,
  renderActions = true,
  formId,
}: {
  defaultValues: PayoutSettingsFormData;
  onSuccess?: () => void;
  renderActions?: boolean;
  formId?: string;
}) {
  const methods = useForm<PayoutSettingsFormData>({
    resolver: yupResolver(payoutSettingsSchema) as unknown as Resolver<PayoutSettingsFormData>,
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  async function onSubmit(data: PayoutSettingsFormData) {
    try {
      const result = await updatePayoutSettings(data);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Comisiones actualizadas");
      onSuccess?.();
    } catch {
      toast.error("Error al guardar las comisiones");
    }
  }

  return (
    <FormProvider {...methods}>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
        <FormInput
          name="recurringClientRatePercent"
          label="Comisión recurrente"
          type="number"
          step="0.1"
          description="Porcentaje del monto cobrado que se le paga al psicólogo por un paciente recurrente"
        />

        <FormInput
          name="newClientRatePercent"
          label="Comisión nuevo"
          type="number"
          step="0.1"
          description="Porcentaje del monto cobrado que se le paga al psicólogo por un paciente nuevo"
        />

        <FormInput
          name="loyalRatePercent"
          label="Comisión leal"
          type="number"
          step="0.1"
          description="Porcentaje del monto cobrado que se le paga al psicólogo por un paciente leal"
        />

        <FormInput
          name="loyalNewRatePercent"
          label="Comisión leal nuevo"
          type="number"
          step="0.1"
          description="Porcentaje del monto cobrado que se le paga al psicólogo por un paciente leal nuevo"
        />

        {renderActions && (
          <div className="flex items-center gap-3">
            <Button type="submit" isLoading={isSubmitting}>
              Guardar cambios
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
