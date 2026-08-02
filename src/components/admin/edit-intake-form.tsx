"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "sonner";
import {
  intakeFormSchema,
  type IntakeFormData,
} from "@/lib/validators/intake-form";
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormRadioGroup,
  FormCheckbox,
} from "@/components/form/form-fields";
import { FormDatePicker } from "@/components/form/form-date-picker";
import { Button } from "@/components/ui/button";
import { updateIntakeForm } from "@/lib/admin/intake-form-actions";

export function EditIntakeForm({
  appointmentId,
  data,
}: {
  appointmentId: string;
  data: IntakeFormData;
}) {
  const router = useRouter();
  const [isSubmitting, startSubmit] = useTransition();

  const methods = useForm<IntakeFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(intakeFormSchema) as any,
    defaultValues: data,
  });

  const { handleSubmit, watch } = methods;
  const previousTherapy = watch("previousTherapy");
  const currentMedication = watch("currentMedication");

  function onSubmit(values: IntakeFormData) {
    startSubmit(async () => {
      try {
        await updateIntakeForm(appointmentId, values);
        toast.success("Formulario actualizado");
        router.push(`/admin/formularios/${appointmentId}`);
        router.refresh();
      } catch {
        toast.error("Error al actualizar el formulario");
      }
    });
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold">
            Datos personales
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormInput name="fullName" label="Nombre completo" />
            </div>
            <FormInput name="email" label="Correo electrónico" type="email" />
            <FormInput name="phone" label="Teléfono" type="tel" />
            <FormDatePicker name="dateOfBirth" label="Fecha de nacimiento" />
            <FormSelect
              name="gender"
              label="Género"
              placeholder="Selecciona..."
              options={[
                { value: "Masculino", label: "Masculino" },
                { value: "Femenino", label: "Femenino" },
                { value: "No binario", label: "No binario" },
                { value: "Otro", label: "Otro" },
                { value: "Prefiero no decir", label: "Prefiero no decir" },
              ]}
            />
            <FormSelect
              name="maritalStatus"
              label="Estado civil"
              placeholder="Selecciona..."
              options={[
                { value: "Soltero/a", label: "Soltero/a" },
                { value: "Casado/a", label: "Casado/a" },
                { value: "Unión libre", label: "Unión libre" },
                { value: "Divorciado/a", label: "Divorciado/a" },
                { value: "Viudo/a", label: "Viudo/a" },
              ]}
            />
            <FormInput name="occupation" label="Ocupación" />
            <FormInput name="religion" label="Religión" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold">
            Motivo de la sesión
          </h2>
          <FormTextarea
            name="consultationReason"
            label="¿Cuál es el motivo principal por el que buscas atención psicológica?"
            rows={4}
          />
        </div>

        <div className="space-y-5">
          <h2 className="font-heading text-lg font-semibold">
            Historial de salud mental
          </h2>
          <FormRadioGroup
            name="previousTherapy"
            label="¿Ha recibido tratamiento psicológico o psiquiátrico anteriormente?"
            options={[
              { value: "Sí", label: "Sí" },
              { value: "No", label: "No" },
            ]}
          />
          {previousTherapy === "Sí" && (
            <FormTextarea
              name="previousTherapyDetails"
              label="Detalles del tratamiento previo"
              rows={3}
            />
          )}
          <FormRadioGroup
            name="currentMedication"
            label="¿Toma alguna medicación actualmente?"
            options={[
              { value: "Sí", label: "Sí" },
              { value: "No", label: "No" },
            ]}
          />
          {currentMedication === "Sí" && (
            <FormTextarea
              name="currentMedicationDetails"
              label="Medicación actual"
              rows={3}
            />
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold">
            Historial médico
          </h2>
          <FormTextarea
            name="medicalHistory"
            label="Enfermedades o condiciones médicas relevantes"
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold">
            Red de apoyo / contacto de emergencia
          </h2>
          <FormInput name="livingWith" label="¿Con quién vive actualmente?" />
          <FormTextarea
            name="emergencyContact"
            label="Contacto de emergencia"
            rows={2}
          />
        </div>

        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold">
            Expectativas del acompañamiento
          </h2>
          <FormTextarea
            name="therapyExpectations"
            label="¿Qué espera lograr con el acompañamiento?"
            rows={4}
          />
        </div>

        <div className="space-y-5">
          <h2 className="font-heading text-lg font-semibold">
            Consentimientos
          </h2>
          <FormCheckbox
            name="informedConsent"
            label="Consentimiento informado aceptado"
          />
          <FormCheckbox
            name="privacyPolicy"
            label="Política de privacidad aceptada"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/formularios/${appointmentId}`)}
          >
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
