"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { updateWhatsappTemplates } from "@/lib/admin/whatsapp-template-actions";
import {
    whatsappTemplatesSchema,
    type WhatsappTemplatesFormData,
} from "@/lib/validators/whatsapp-templates";
import {
    DEFAULT_WHATSAPP_REMINDER_TEMPLATE,
    DEFAULT_WHATSAPP_TODAY_TEMPLATE,
} from "@/lib/whatsapp-templates";
import { Button } from "@/components/ui/button";
import { FormTextarea } from "@/components/admin/form-fields";

const PLACEHOLDERS_LEGEND =
    "Variables disponibles: {{nombrePaciente}}, {{nombrePsicologo}}, {{fecha}}, {{hora}}";

export function WhatsappTemplatesEditor({
    psychologistId,
    initialReminderTemplate,
    initialTodaySessionTemplate,
}: {
    psychologistId: string;
    initialReminderTemplate: string | null;
    initialTodaySessionTemplate: string | null;
}) {
    const methods = useForm<WhatsappTemplatesFormData>({
        resolver: yupResolver(whatsappTemplatesSchema),
        defaultValues: {
            whatsappReminderTemplate: initialReminderTemplate ?? "",
            whatsappTodaySessionTemplate: initialTodaySessionTemplate ?? "",
        },
    });

    const {
        handleSubmit,
        setValue,
        formState: { isSubmitting },
    } = methods;

    async function onSubmit(data: WhatsappTemplatesFormData) {
        try {
            await updateWhatsappTemplates(psychologistId, data);
            toast.success("Plantillas actualizadas");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error al guardar");
        }
    }

    return (
        <FormProvider {...methods}>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid max-w-lg gap-5"
            >
                <p className="text-xs text-muted-foreground">
                    {PLACEHOLDERS_LEGEND}
                </p>

                <div className="grid gap-1.5">
                    <FormTextarea
                        name="whatsappReminderTemplate"
                        label="Plantilla de recordatorio"
                        placeholder={DEFAULT_WHATSAPP_REMINDER_TEMPLATE}
                        rows={3}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="justify-self-start"
                        onClick={() =>
                            setValue("whatsappReminderTemplate", "", {
                                shouldDirty: true,
                            })
                        }
                    >
                        Restaurar predeterminado
                    </Button>
                </div>

                <div className="grid gap-1.5">
                    <FormTextarea
                        name="whatsappTodaySessionTemplate"
                        label="Plantilla de sesión de hoy"
                        placeholder={DEFAULT_WHATSAPP_TODAY_TEMPLATE}
                        rows={3}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="justify-self-start"
                        onClick={() =>
                            setValue("whatsappTodaySessionTemplate", "", {
                                shouldDirty: true,
                            })
                        }
                    >
                        Restaurar predeterminado
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <Button type="submit" isLoading={isSubmitting}>
                        Guardar plantillas
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}
