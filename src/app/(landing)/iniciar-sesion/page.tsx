"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";

function IniciarSesionContent() {
    const searchParams = useSearchParams();
    const callbackURL = searchParams.get("callbackURL") ?? undefined;

    return (
        <section className="mx-auto mt-10 max-w-md px-4 py-10 sm:px-6 sm:py-16 lg:mt-20">
            <div className="mb-8 text-center">
                <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                    Iniciar sesión
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Accede a tu cuenta de ALIA
                </p>
            </div>

            <div className="rounded-lg bg-card p-6 ring-1 ring-border/50 sm:p-8">
                <GoogleSignInButton callbackURL={callbackURL} />

                <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    o continúa con correo
                    <div className="h-px flex-1 bg-border" />
                </div>

                <EmailSignInForm callbackURL={callbackURL} />
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link
                    href={
                        callbackURL
                            ? `/registro?callbackURL=${encodeURIComponent(callbackURL)}`
                            : "/registro"
                    }
                    className="font-medium underline-offset-2 hover:underline"
                >
                    Crea una
                </Link>
            </p>
        </section>
    );
}

export default function IniciarSesionPage() {
    return (
        <Suspense fallback={null}>
            <IniciarSesionContent />
        </Suspense>
    );
}
