"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import {
    Controller,
    useForm,
    FormProvider,
    type Resolver,
} from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    createPsychologist,
    updatePsychologist,
    uploadPsychologistPhoto,
} from "@/lib/admin/psychologist-actions";
import {
    psychologistSchema,
    type PsychologistFormData,
} from "@/lib/validators/psychologist";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import {
    FormInput,
    FormTextarea,
    FormSelect,
    FormSwitch,
} from "@/components/admin/form-fields";
import { useState } from "react";

const durationOptions = [
    { value: 30, label: "30 minutos" },
    { value: 45, label: "45 minutos" },
    { value: 60, label: "60 minutos" },
    { value: 90, label: "90 minutos" },
];

const coupleDurationOptions = [
    { value: 90, label: "90 minutos" },
    { value: 120, label: "120 minutos" },
    { value: 150, label: "150 minutos" },
];

export function PsychologistForm({
    defaultValues,
    psychologistId,
    onSuccess,
    renderActions = true,
    formId,
}: {
    defaultValues?: PsychologistFormData;
    psychologistId?: string;
    onSuccess?: () => void;
    renderActions?: boolean;
    formId?: string;
}) {
    const isEditing = !!psychologistId;
    const router = useRouter();
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    const methods = useForm<PsychologistFormData>({
        resolver: yupResolver(
            psychologistSchema,
        ) as unknown as Resolver<PsychologistFormData>,
        defaultValues: defaultValues ?? {
            name: "",
            email: "",
            phone: "",
            specialty: "",
            bio: "",
            sessionDuration: 60,
            coupleSessionDuration: 120,
            offeredSessionTypes: ["INDIVIDUAL"],
            calendarId: "",
            photoUrl: "",
            isActive: true,
        },
    });

    const {
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
        setValue,
        watch,
    } = methods;

    const currentPhotoUrl = watch("photoUrl");

    async function onSubmit(data: PsychologistFormData) {
        try {
            let photoUrl = data.photoUrl;

            if (photoFile) {
                const fd = new FormData();
                fd.append("file", photoFile);
                fd.append("name", data.name);
                photoUrl = await uploadPsychologistPhoto(fd);
            }

            if (isEditing) {
                await updatePsychologist(psychologistId, { ...data, photoUrl });
            } else {
                await createPsychologist({ ...data, photoUrl });
            }
            toast.success(
                isEditing ? "Psicólogo actualizado" : "Psicólogo creado",
            );
            if (onSuccess) {
                onSuccess();
            } else {
                router.push("/admin/psicologos");
            }
        } catch {
            toast.error("Error al guardar el psicólogo");
        }
    }

    return (
        <FormProvider {...methods}>
            <form
                id={formId}
                onSubmit={handleSubmit(onSubmit)}
                className="grid max-w-2xl gap-6"
            >
                {/* Name + Email */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                        name="name"
                        label="Nombre completo"
                        placeholder="María López"
                    />
                    <FormInput
                        name="email"
                        label="Correo electrónico"
                        type="email"
                        placeholder="maria@ejemplo.com"
                    />
                </div>

                {/* Phone + Specialty */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                        name="phone"
                        label="Teléfono"
                        placeholder="+57 300 123 4567"
                    />
                    <FormInput
                        name="specialty"
                        label="Especialidad"
                        placeholder="Acompañamiento de parejas"
                    />
                </div>

                {/* Modalities */}
                <div className="grid gap-1.5">
                    <Label>Modalidades atendidas</Label>
                    <Controller
                        control={control}
                        name="offeredSessionTypes"
                        render={({ field }) => {
                            const selected = field.value ?? [];
                            function toggle(
                                type: "INDIVIDUAL" | "COUPLE",
                                checked: boolean,
                            ) {
                                field.onChange(
                                    checked
                                        ? [...selected, type]
                                        : selected.filter(t => t !== type),
                                );
                            }
                            return (
                                <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="offers-individual"
                                            checked={selected.includes(
                                                "INDIVIDUAL",
                                            )}
                                            onCheckedChange={checked =>
                                                toggle(
                                                    "INDIVIDUAL",
                                                    checked === true,
                                                )
                                            }
                                        />
                                        <Label
                                            htmlFor="offers-individual"
                                            className="font-normal"
                                        >
                                            Individual
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="offers-couple"
                                            checked={selected.includes(
                                                "COUPLE",
                                            )}
                                            onCheckedChange={checked =>
                                                toggle(
                                                    "COUPLE",
                                                    checked === true,
                                                )
                                            }
                                        />
                                        <Label
                                            htmlFor="offers-couple"
                                            className="font-normal"
                                        >
                                            Pareja
                                        </Label>
                                    </div>
                                </div>
                            );
                        }}
                    />
                    {errors.offeredSessionTypes && (
                        <p className="text-xs text-destructive">
                            {errors.offeredSessionTypes.message}
                        </p>
                    )}
                </div>

                {/* Duration */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormSelect
                        name="sessionDuration"
                        label="Duración de sesión individual"
                        placeholder="Seleccionar duración"
                        options={durationOptions}
                    />
                    <FormSelect
                        name="coupleSessionDuration"
                        label="Duración de sesión de pareja"
                        placeholder="Seleccionar duración"
                        options={coupleDurationOptions}
                    />
                </div>

                {/* Calendar ID + Active toggle */}
                <div className="grid gap-4 sm:grid-cols-1">
                    <FormInput
                        name="calendarId"
                        label="Google Calendar ID"
                        placeholder="ejemplo@group.calendar.google.com"
                        description="Se configurará en el paso de horarios"
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-1">
                    <FormSwitch
                        name="isActive"
                        label="Estado"
                        description="Psicólogo activo"
                    />
                </div>

                {/* Photo */}
                <div className="grid gap-1.5">
                    <Label>Foto</Label>
                    <ImageUpload
                        value={photoFile ?? currentPhotoUrl ?? null}
                        onChange={file => {
                            setPhotoFile(file);
                            if (!file) setValue("photoUrl", "");
                        }}
                    />
                    {errors.photoUrl && (
                        <p className="text-xs text-destructive">
                            {errors.photoUrl.message}
                        </p>
                    )}
                </div>

                {/* Bio */}
                <FormTextarea
                    name="bio"
                    label="Biografía"
                    placeholder="Describe la experiencia y enfoque del psicólogo..."
                    rows={6}
                />

                {/* Actions */}
                {renderActions && (
                    <div className="flex items-center gap-3">
                        <Button type="submit" isLoading={isSubmitting}>
                            {isEditing ? "Guardar cambios" : "Crear psicólogo"}
                        </Button>
                        {!onSuccess && (
                            <Link href="/admin/psicologos">
                                <Button type="button" variant="outline">
                                    Cancelar
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </form>
        </FormProvider>
    );
}
