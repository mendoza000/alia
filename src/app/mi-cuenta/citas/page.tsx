import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPatientAppointments } from "@/lib/queries/patient-appointments";
import { AppointmentCard } from "@/components/patient/appointment-card";
import { PaymentResultToast } from "@/components/patient/payment-result-toast";

export const metadata: Metadata = {
    title: "Mis sesiones",
};

type Props = {
    searchParams: Promise<{ pago?: string }>;
};

export default async function MisCitasPage({ searchParams }: Props) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) return null;

    const { pago } = await searchParams;
    const appointments = await getPatientAppointments(session.user.id);

    const now = new Date();
    const upcoming = appointments.filter(
        a =>
            a.dateTime > now &&
            (a.status === "CONFIRMED" ||
                (a.status === "PENDING_FORM" &&
                    (a.expiresAt === null || a.expiresAt > now))),
    );
    const past = appointments.filter(a => !upcoming.includes(a));

    return (
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
            <PaymentResultToast
                pago={
                    pago === "exitoso" || pago === "cancelado"
                        ? pago
                        : undefined
                }
            />
            <div className="flex items-center justify-between">
                <h1 className="font-heading text-3xl font-bold">
                    Mis sesiones
                </h1>
                <Link
                    href="/mi-cuenta"
                    className="text-sm text-muted-foreground hover:underline"
                >
                    ← Mi cuenta
                </Link>
            </div>

            {appointments.length === 0 ? (
                <div className="mt-8 rounded-lg bg-card p-8 text-center ring-1 ring-border/50">
                    <p className="text-muted-foreground">
                        Aún no tienes sesiones agendadas.
                    </p>
                    <Link
                        href="/agendar"
                        className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
                    >
                        Agendar una sesión
                    </Link>
                </div>
            ) : (
                <div className="mt-8 space-y-8">
                    {upcoming.length > 0 && (
                        <div>
                            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                Próximas
                            </h2>
                            <div className="space-y-3">
                                {upcoming.map(a => (
                                    <AppointmentCard
                                        key={a.id}
                                        appointment={a}
                                        cancellable
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {past.length > 0 && (
                        <div>
                            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                Anteriores
                            </h2>
                            <div className="space-y-3">
                                {past.map(a => (
                                    <AppointmentCard
                                        key={a.id}
                                        appointment={a}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
