"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const schema = yup.object({
    email: yup
        .string()
        .email("Ingresa un correo válido")
        .required("El correo es obligatorio"),
    password: yup
        .string()
        .min(6, "La contraseña debe tener al menos 6 caracteres")
        .required("La contraseña es obligatoria"),
});

type LoginForm = yup.InferType<typeof schema>;

export default function AdminLoginPage() {
    const router = useRouter();
    const [error, setError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        resolver: yupResolver(schema),
    });

    async function onSubmit(data: LoginForm) {
        setError("");
        const result = await authClient.signIn.email({
            email: data.email,
            password: data.password,
        });

        if (result.error) {
            setError("Credenciales incorrectas");
            return;
        }

        router.push("/admin");
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="font-heading text-2xl">
                        Panel de Administración
                    </CardTitle>
                    <CardDescription>
                        Inicia sesión para continuar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="grid gap-4"
                    >
                        <div className="grid gap-1.5">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@alia.com.co"
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
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
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
                            disabled={isSubmitting}
                            className="w-full"
                        >
                            {isSubmitting
                                ? "Iniciando sesión..."
                                : "Iniciar sesión"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
