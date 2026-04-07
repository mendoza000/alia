import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { auth } from "@/lib/auth";
import { getPatientAppointments } from "@/lib/queries/patient-appointments";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
    title: "Mis citas",
};

const STATUS_CONFIG: Record<
    string,
    {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
    }
> = {
    PENDING_FORM: { label: "Pendiente formulario", variant: "outline" },
    PENDING_PAYMENT: { label: "Pendiente pago", variant: "outline" },
    CONFIRMED: { label: "Confirmada", variant: "default" },
    COMPLETED: { label: "Completada", variant: "secondary" },
    CANCELLED: { label: "Cancelada", variant: "destructive" },
    NO_SHOW: { label: "No asistió", variant: "destructive" },
};

export default async function MisCitasPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) return null;

    const appointments = await getPatientAppointments(session.user.id);

    const now = new Date();
    const upcoming = appointments.filter(
        a =>
            a.dateTime > now &&
            (a.status === "CONFIRMED" ||
                a.status === "PENDING_FORM" ||
                a.status === "PENDING_PAYMENT"),
    );
    const past = appointments.filter(a => !upcoming.includes(a));

    return (
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
            <div className="flex items-center justify-between">
                <h1 className="font-heading text-3xl font-bold">Mis citas</h1>
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
                        Aún no tienes citas agendadas.
                    </p>
                    <Link
                        href="/agendar"
                        className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
                    >
                        Agendar una cita
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

function AppointmentCard({
    appointment,
}: {
    appointment: Awaited<ReturnType<typeof getPatientAppointments>>[number];
}) {
    const config = STATUS_CONFIG[appointment.status] ?? {
        label: appointment.status,
        variant: "outline" as const,
    };

    return (
        <div className="flex items-center justify-between rounded-lg bg-card p-4 ring-1 ring-border/50">
            <div>
                <Link
                    href={`/psicologos/${appointment.psychologist.slug}`}
                    className="font-medium hover:underline"
                >
                    {appointment.psychologist.name}
                </Link>
                <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                    {format(
                        appointment.dateTime,
                        "EEEE d 'de' MMMM, yyyy — HH:mm",
                        { locale: es },
                    )}
                </p>
            </div>
            <Badge variant={config.variant}>{config.label}</Badge>
        </div>
    );
}
