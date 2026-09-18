import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getLatestIntakeFormByUser } from "@/lib/queries/intake-forms";
import {
    getPatientAppointments,
    getBlockingUnpaidAppointment,
} from "@/lib/queries/patient-appointments";
import { getPatientTracks } from "@/lib/queries/patient-assignment";
import { PayPendingSessionButton } from "@/components/patient/pay-pending-session-button";
import { AppointmentCard } from "@/components/patient/appointment-card";
import { MyProfileForm } from "@/components/patient/my-profile-form";

export const metadata: Metadata = {
    title: "Mi cuenta",
};

function getInitials(name: string) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const TRACK_LABELS = { INDIVIDUAL: "Individual", COUPLE: "Pareja" } as const;

export default async function MiCuentaPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const user = session?.user;
    if (!user) return null;

    const [latestForm, appointments, tracks, blockingAppointment] =
        await Promise.all([
            getLatestIntakeFormByUser(user.id),
            getPatientAppointments(user.id),
            getPatientTracks(user.id),
            getBlockingUnpaidAppointment(user.id),
        ]);

    const formData = latestForm?.data as Record<string, unknown> | null;
    const phone = typeof formData?.phone === "string" ? formData.phone : "";
    const dateOfBirth =
        typeof formData?.dateOfBirth === "string" ? formData.dateOfBirth : "";

    const now = new Date();
    const upcoming = appointments
        .filter(
            a =>
                a.dateTime > now &&
                (a.status === "CONFIRMED" ||
                    (a.status === "PENDING_FORM" &&
                        (a.expiresAt === null || a.expiresAt > now))),
        )
        .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    const trackEntries = Object.entries(tracks) as [
        keyof typeof TRACK_LABELS,
        NonNullable<(typeof tracks)[keyof typeof tracks]>,
    ][];

    return (
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
            <h1 className="font-heading text-3xl font-bold">Mi cuenta</h1>

            <div className="mt-8 rounded-lg bg-card p-6 ring-1 ring-border/50">
                <div className="flex items-center gap-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-secondary">
                        {user.image ? (
                            <Image
                                src={user.image}
                                alt=""
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <span className="font-heading text-xl text-muted-foreground">
                                    {getInitials(user.name)}
                                </span>
                            </div>
                        )}
                    </div>
                    <h2 className="text-lg font-semibold">
                        Hola, {user.name.split(" ")[0]}
                    </h2>
                </div>

                <div className="mt-6 border-t border-border pt-6">
                    <MyProfileForm
                        name={user.name}
                        email={user.email}
                        phone={phone}
                        dateOfBirth={dateOfBirth}
                    />
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-6">
                    <Link
                        href="/mi-cuenta/formulario"
                        className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                    >
                        Editar mi formulario
                    </Link>
                    <SignOutButton variant="outline" size="default" />
                </div>
            </div>

            {blockingAppointment && (
                <div className="mt-6 flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-medium text-destructive">
                            Tienes una sesión pendiente de pago
                        </p>
                        <p className="text-sm text-muted-foreground">
                            No podrás agendar una nueva sesión hasta pagarla.
                        </p>
                    </div>
                    <PayPendingSessionButton
                        appointmentId={blockingAppointment.id}
                    />
                </div>
            )}

            {trackEntries.length > 0 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {trackEntries.map(([sessionType, psychologist]) => (
                        <Link
                            key={sessionType}
                            href={`/psicologos/${psychologist.slug}`}
                            className="flex items-center gap-3 rounded-lg bg-card p-4 ring-1 ring-border/50 transition-shadow hover:shadow-sm"
                        >
                            <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-secondary">
                                {psychologist.photoUrl && (
                                    <Image
                                        src={psychologist.photoUrl}
                                        alt=""
                                        fill
                                        className="object-cover"
                                    />
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                    {TRACK_LABELS[sessionType]}
                                </p>
                                <p className="font-medium">
                                    {psychologist.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {psychologist.specialty}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <div className="mt-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Próximas sesiones
                    </h2>
                    <Link
                        href="/mi-cuenta/citas"
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        Ver historial completo →
                    </Link>
                </div>

                {upcoming.length > 0 ? (
                    <div className="mt-4 space-y-3">
                        {upcoming.map(a => (
                            <AppointmentCard
                                key={a.id}
                                appointment={a}
                                cancellable
                            />
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            No tienes sesiones próximas.
                        </p>
                        <Link
                            href="/agendar"
                            className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
                        >
                            Agendar una sesión
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
