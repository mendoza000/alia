"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputPassword } from "@/components/ui/input-password";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const schema = yup.object({
    name: yup.string().required("Tu nombre es obligatorio"),
    email: yup
        .string()
        .email("Ingresa un correo válido")
        .required("El correo es obligatorio"),
    password: yup
        .string()
        .min(6, "La contraseña debe tener al menos 6 caracteres")
        .required("La contraseña es obligatoria"),
});

type SignUpForm = yup.InferType<typeof schema>;

export function EmailSignUpForm({ callbackURL }: { callbackURL?: string }) {
    const router = useRouter();
    const [error, setError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignUpForm>({
        resolver: yupResolver(schema),
    });

    async function onSubmit(data: SignUpForm) {
        setError("");
        const result = await authClient.signUp.email({
            name: data.name,
            email: data.email,
            password: data.password,
            callbackURL,
        });

        if (result.error) {
            setError(
                result.error.message ?? "No se pudo crear la cuenta",
            );
            return;
        }

        router.push(callbackURL ?? "/mi-cuenta");
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-1.5">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" autoComplete="name" {...register("name")} />
                {errors.name && (
                    <p className="text-xs text-destructive">
                        {errors.name.message}
                    </p>
                )}
            </div>
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
            <div className="grid gap-1.5">
                <Label htmlFor="password">Contraseña</Label>
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
            <Button type="submit" isLoading={isSubmitting} className="w-full">
                Crear cuenta
            </Button>
        </form>
    );
}
