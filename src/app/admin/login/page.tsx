"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import Aurora from "@/components/Aurora";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputPassword } from "@/components/ui/input-password";
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
        <div className="grid min-h-screen lg:grid-cols-2">
            {/* Left panel — decorative */}
            <div className="relative hidden overflow-hidden bg-primary lg:block">
                <div className="absolute inset-0">
                    <Aurora
                        colorStops={["#DBD4C2", "#EAACA7", "#DBD4C2"]}
                        amplitude={1.0}
                        blend={0.5}
                        speed={0.5}
                    />
                </div>
                <div className="relative z-10 flex h-full flex-col p-8">
                    <Image
                        src="/logo-alia-text-white.png"
                        alt="ALIA"
                        width={160}
                        height={40}
                        className="h-auto w-[120px]"
                    />

                    <div className="mt-auto">
                        <h1 className="font-heading text-3xl leading-tight text-primary-foreground font-semibold">
                            Tu espacio para
                            <br />
                            cuidar lo que importa
                        </h1>
                        <p className="mt-4 font-sans text-sm text-primary-foreground/60">
                            Panel de administración de ALIA
                        </p>
                    </div>

                    <p className="mt-6 font-sans text-xs text-primary-foreground/40">
                        © {new Date().getFullYear()} ALIA · Todos los derechos reservados
                    </p>
                </div>
            </div>

            {/* Right panel — login form */}
            <div className="flex items-center justify-center bg-gradient-to-b from-secondary/30 to-background px-6 py-12 lg:from-background lg:to-background">
                <div className="w-full max-w-[24rem]">
                    <div className="mb-8 flex flex-col items-center gap-4">
                        
                        <div className="text-center">
                            <h2 className="font-heading text-4xl font-semibold tracking-tight">
                                Iniciar sesión
                            </h2>
                            <p className="mt-1 font-sans text-sm text-muted-foreground">
                                Accede al panel de administración
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="grid gap-5"
                    >
                        <div className="grid gap-1.5">
                            <Label htmlFor="email" className="font-sans">
                                Correo electrónico
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@alia.com.co"
                                autoComplete="email"
                                className="h-10 font-sans"
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="password" className="font-sans">
                                Contraseña
                            </Label>
                            <InputPassword
                                id="password"
                                autoComplete="current-password"
                                className="h-10 font-sans"
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
                            size="lg"
                            isLoading={isSubmitting}
                            className="mt-2 w-full font-semibold"
                        >
                            Iniciar sesión
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        ¿Necesitas ayuda?{" "}
                        <a
                            href="mailto:soporte@alia.com.co"
                            className="underline-offset-4 hover:underline"
                        >
                            Contactar soporte
                        </a>
                    </p>
                    <Link
                        href="/"
                        className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
                    >
                        <ArrowLeft className="size-4" />
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
