import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { CARACAS_TZ } from "@/lib/availability";
import { getPatientAppointments } from "@/lib/queries/patient-appointments";
import { Badge } from "@/components/ui/badge";
import { CancelAppointmentButton } from "@/components/patient/cancel-appointment-button";
import { RescheduleAppointmentButton } from "@/components/patient/reschedule-appointment-button";
import { PayPendingSessionButton } from "@/components/patient/pay-pending-session-button";

export const STATUS_CONFIG: Record<
    string,
    {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
    }
> = {
    PENDING_FORM: { label: "Pendiente formulario", variant: "outline" },
    CONFIRMED: { label: "Confirmada", variant: "default" },
    COMPLETED: { label: "Completada", variant: "secondary" },
    CANCELLED: { label: "Cancelada", variant: "destructive" },
    NO_SHOW: { label: "No asistió", variant: "destructive" },
};

/** Shared between /mi-cuenta (upcoming sessions shown inline) and
 * /mi-cuenta/citas (full history) — same row, same actions. */
export function AppointmentCard({
    appointment,
    cancellable = false,
}: {
    appointment: Awaited<ReturnType<typeof getPatientAppointments>>[number];
    cancellable?: boolean;
}) {
    const config = STATUS_CONFIG[appointment.status] ?? {
        label: appointment.status,
        variant: "outline" as const,
    };

    const patientTimezone = appointment.timezone ?? CARACAS_TZ;
    const dateTimeInPatientTz = new TZDate(
        appointment.dateTime,
        patientTimezone,
    );

    return (
        <div className="flex flex-col gap-3 rounded-lg bg-card p-4 ring-1 ring-border/50 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <Link
                    href={`/psicologos/${appointment.psychologist.slug}`}
                    className="font-medium hover:underline"
                >
                    {appointment.psychologist.name}
                </Link>
                <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                    {format(
                        dateTimeInPatientTz,
                        "EEEE d 'de' MMMM, yyyy — HH:mm",
                        { locale: es },
                    )}
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {appointment.status === "PENDING_FORM" && (
                    <Link
                        href={`/agendar/${appointment.psychologist.slug}/formulario?appointmentId=${appointment.id}`}
                        className="text-sm font-medium text-accent hover:underline"
                    >
                        Completar formulario
                    </Link>
                )}
                <Badge variant={config.variant}>{config.label}</Badge>
                {appointment.status === "CONFIRMED" && (
                    <RescheduleAppointmentButton
                        appointmentId={appointment.id}
                        psychologistId={appointment.psychologistId}
                        psychologistName={appointment.psychologist.name}
                        currentDateTime={appointment.dateTime}
                        patientTimezone={appointment.timezone}
                    />
                )}
                {cancellable && (
                    <CancelAppointmentButton appointmentId={appointment.id} />
                )}
                {["COMPLETED", "NO_SHOW"].includes(appointment.status) &&
                    (!appointment.payment ||
                        appointment.payment.status === "PENDING") && (
                        <PayPendingSessionButton
                            appointmentId={appointment.id}
                        />
                    )}
            </div>
        </div>
    );
}
