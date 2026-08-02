"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputPassword } from "@/components/ui/input-password";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const schema = yup.object({
    password: yup
        .string()
        .min(6, "La contraseña debe tener al menos 6 caracteres")
        .required("La contraseña es obligatoria"),
});

type ResetForm = yup.InferType<typeof schema>;

function RestablecerContrasenaContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [error, setError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetForm>({
        resolver: yupResolver(schema),
    });

    async function onSubmit(data: ResetForm) {
        setError("");
        if (!token) {
            setError("El enlace no es válido o ya expiró");
            return;
        }

        const result = await authClient.resetPassword({
            newPassword: data.password,
            token,
        });

        if (result.error) {
            setError("El enlace no es válido o ya expiró");
            return;
        }

        toast.success("Contraseña actualizada");
        router.push("/iniciar-sesion");
    }

    return (
        <section className="mx-auto mt-10 max-w-md px-4 py-10 sm:px-6 sm:py-16 lg:mt-20">
            <div className="mb-8 text-center">
                <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                    Restablece tu contraseña
                </h1>
            </div>

            <div className="rounded-lg bg-card p-6 ring-1 ring-border/50 sm:p-8">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid gap-4"
                >
                    <div className="grid gap-1.5">
                        <Label htmlFor="password">Nueva contraseña</Label>
                        <InputPassword
                            id="password"
                            autoComplete="new-password"
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-xs text-destructive">
                                {errors.password.message}
                            </p>
                        )}
                    </div>
                    {error && (
                        <p className="text-center text-sm text-destructive">
                            {error}
                        </p>
                    )}
                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        className="w-full"
                    >
                        Guardar nueva contraseña
                    </Button>
                </form>
            </div>
        </section>
    );
}

export default function RestablecerContrasenaPage() {
    return (
        <Suspense fallback={null}>
            <RestablecerContrasenaContent />
        </Suspense>
    );
}
