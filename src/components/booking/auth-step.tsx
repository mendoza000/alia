"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";
import { formatInTimezone } from "@/lib/timezones";

/** Extracted from agendar/[slug]/booking-flow.tsx (Fase 7.2), generalizing
 * psychologistName -> sessionLabel so the modality-first flow can preview
 * "what" is being booked ("Sesión Individual (60 min)") without revealing
 * "who" — the direct-slug flow still passes the psychologist's name and
 * looks identical to before. */
export function AuthStep({
    sessionLabel,
    selectedDate,
    selectedTime,
    patientTimezone,
    callbackURL,
    onChangeSlot,
}: {
    sessionLabel: string;
    selectedDate: string;
    selectedTime: string;
    patientTimezone: string;
    callbackURL: string;
    onChangeSlot: () => void;
}) {
    const formattedDate = format(
        new Date(`${selectedDate}T12:00:00`),
        "EEEE d 'de' MMMM, yyyy",
        { locale: es },
    );
    const displayTime = formatInTimezone(
        selectedDate,
        selectedTime,
        patientTimezone,
    );

    return (
        <div className="mx-auto max-w-md">
            <div className="rounded-lg bg-card p-6 ring-1 ring-border/50 sm:p-8">
                {/* Appointment preview */}
                <div className="mb-6 rounded-md bg-secondary/50 p-4 text-center">
                    <p className="text-sm text-muted-foreground">Tu sesión</p>
                    <p className="mt-1 font-medium">{sessionLabel}</p>
                    <p className="text-sm capitalize text-muted-foreground">
                        {formattedDate} — {displayTime}
                    </p>
                </div>

                <div className="text-center">
                    <p className="mb-4 text-sm text-muted-foreground">
                        Inicia sesión para continuar con tu agendamiento
                    </p>
                    <GoogleSignInButton callbackURL={callbackURL} />
                </div>

                <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />o continúa con
                    correo
                    <div className="h-px flex-1 bg-border" />
                </div>

                <EmailSignInForm callbackURL={callbackURL} />

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    ¿No tienes cuenta?{" "}
                    <Link
                        href={`/registro?callbackURL=${encodeURIComponent(callbackURL)}`}
                        className="font-medium underline-offset-2 hover:underline"
                    >
                        Crea una
                    </Link>
                </p>

                <button
                    type="button"
                    onClick={onChangeSlot}
                    className="mt-4 block w-full text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
                >
                    Cambiar horario
                </button>
            </div>
        </div>
    );
}
