"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createStaffUser } from "@/lib/admin/staff-actions";
import { FormInput, FormSelect } from "@/components/admin/form-fields";
import {
    STAFF_ROLE_OPTIONS,
    staffUserSchema,
    type StaffUserFormData,
} from "@/lib/validators/staff";

export function StaffForm({
    unlinkedPsychologists,
    onSuccess,
    formId,
}: {
    unlinkedPsychologists: { id: string; name: string; email: string }[];
    onSuccess?: () => void;
    formId?: string;
}) {
    const methods = useForm<StaffUserFormData>({
        resolver: yupResolver(staffUserSchema),
        defaultValues: {
            name: "",
            email: "",
            role: "assistant",
            psychologistId: "",
        },
    });

    const {
        handleSubmit,
        watch,
        formState: { isSubmitting },
    } = methods;

    const role = watch("role");

    const psychologistOptions = unlinkedPsychologists.map(p => ({
        value: p.id,
        label: `${p.name} (${p.email})`,
    }));

    async function onSubmit(data: StaffUserFormData) {
        try {
            await createStaffUser(data);
            toast.success(
                "Usuario creado — le enviamos un correo para que configure su contraseña",
            );
            onSuccess?.();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Error al crear el usuario",
            );
        }
    }

    return (
        <FormProvider {...methods}>
            <form
                id={formId}
                onSubmit={handleSubmit(onSubmit)}
                className="grid gap-4"
            >
                <FormInput
                    name="name"
                    label="Nombre completo"
                    placeholder="Ana Pérez"
                    disabled={isSubmitting}
                />
                <FormInput
                    name="email"
                    label="Correo electrónico"
                    type="email"
                    placeholder="ana@alia.com.co"
                    disabled={isSubmitting}
                />
                <FormSelect
                    name="role"
                    label="Rol"
                    placeholder="Selecciona un rol"
                    options={[...STAFF_ROLE_OPTIONS]}
                />
                {role === "psychologist" &&
                    (psychologistOptions.length > 0 ? (
                        <FormSelect
                            name="psychologistId"
                            label="Psicólogo a vincular"
                            placeholder="Selecciona un psicólogo"
                            options={psychologistOptions}
                        />
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            No hay psicólogos sin cuenta vinculada. Crea primero
                            su perfil en{" "}
                            <span className="font-medium">Psicólogos</span>.
                        </p>
                    ))}
            </form>
        </FormProvider>
    );
}
