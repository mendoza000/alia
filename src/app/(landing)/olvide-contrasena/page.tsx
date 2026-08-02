"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const schema = yup.object({
    email: yup
        .string()
        .email("Ingresa un correo válido")
        .required("El correo es obligatorio"),
});

type ForgotForm = yup.InferType<typeof schema>;

export default function OlvideContrasenaPage() {
    const [sent, setSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotForm>({
        resolver: yupResolver(schema),
    });

    async function onSubmit(data: ForgotForm) {
        await authClient.requestPasswordReset({
            email: data.email,
            redirectTo: "/restablecer-contrasena",
        });
        setSent(true);
    }

    return (
        <section className="mx-auto mt-10 max-w-md px-4 py-10 sm:px-6 sm:py-16 lg:mt-20">
            <div className="mb-8 text-center">
                <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                    ¿Olvidaste tu contraseña?
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Te enviaremos un enlace para restablecerla
                </p>
            </div>

            <div className="rounded-lg bg-card p-6 ring-1 ring-border/50 sm:p-8">
                {sent ? (
                    <p className="text-center text-sm text-muted-foreground">
                        Si el correo existe en nuestro sistema, te llegará un
                        enlace para restablecer tu contraseña en unos
                        minutos.
                    </p>
                ) : (
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="grid gap-4"
                    >
                        <div className="grid gap-1.5">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            className="w-full"
                        >
                            Enviar enlace
                        </Button>
                    </form>
                )}
            </div>
        </section>
    );
}
