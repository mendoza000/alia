"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { updateSiteSettings } from "@/lib/admin/site-settings-actions";
import { siteSettingsSchema } from "@/lib/validators/site-settings";
import type { SiteSettingsFormData } from "@/lib/validators/site-settings";
import type { SiteSettings } from "@/lib/admin/site-settings-queries";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/admin/form-fields";

export function SiteSettingsForm({ settings }: { settings: SiteSettings }) {
    const methods = useForm<SiteSettingsFormData>({
        resolver: yupResolver(siteSettingsSchema),
        defaultValues: {
            whatsappNumber: settings.whatsappNumber ?? "",
            instagramUrl: settings.instagramUrl ?? "",
            contactEmail: settings.contactEmail ?? "",
        },
    });

    const {
        handleSubmit,
        formState: { isSubmitting },
    } = methods;

    async function onSubmit(data: SiteSettingsFormData) {
        const result = await updateSiteSettings(data);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        toast.success("Configuración actualizada");
    }

    return (
        <FormProvider {...methods}>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid max-w-lg gap-5"
            >
                <FormInput
                    name="whatsappNumber"
                    label="Número de WhatsApp"
                    placeholder="573001234567"
                    description="Solo dígitos, con código de país, sin espacios ni símbolos"
                />

                <FormInput
                    name="instagramUrl"
                    label="Instagram"
                    placeholder="https://instagram.com/alia"
                />

                <FormInput
                    name="contactEmail"
                    label="Email de contacto"
                    type="email"
                    placeholder="contacto@alia.com.co"
                />

                <div className="flex items-center gap-3">
                    <Button type="submit" isLoading={isSubmitting}>
                        Guardar cambios
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}
