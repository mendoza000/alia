import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, FileText } from "lucide-react";
import { getPatientDetail } from "@/lib/admin/patient-queries";
import { getAllPsychologists } from "@/lib/admin/psychologist-queries";
import { getAllRates } from "@/lib/admin/payment-rate-queries";
import { getPayoutSettings } from "@/lib/admin/payout-settings-queries";
import { can } from "@/lib/auth/permissions";
import { requireActor } from "@/lib/auth/require";
import { getPatientPhoneFromIntakeFormData } from "@/lib/patient-phone";
import { buildAppointmentWhatsappMessage } from "@/lib/whatsapp-templates";
import { PatientProfileEditor } from "@/components/admin/patient-profile-editor";
import { PatientNotes } from "@/components/admin/patient-notes";
import { AppointmentStatusBadge } from "@/components/admin/appointment-status-badge";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { WhatsappReminderButton } from "@/components/admin/whatsapp-reminder-action";
import { NewManualAppointmentDialog } from "@/components/admin/new-manual-appointment-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrencyAmount } from "@/lib/currency";

const SESSION_TYPE_LABELS: Record<string, string> = {
    INDIVIDUAL: "Individual",
    COUPLE: "Pareja",
};

type Props = {
    params: Promise<{ userId: string }>;
};

export default async function ClienteDetailPage({ params }: Props) {
    const { userId } = await params;
    const actor = await requireActor();
    const patient = await getPatientDetail(userId);
    if (!patient) notFound();

    const canCreateAppointment = can(actor.role, "appointment.write");
    const [psychologists, rates, commissionRates] = await Promise.all([
        getAllPsychologists(),
        getAllRates(),
        getPayoutSettings(),
    ]);

    // A psychologist can only view a patient they've actually treated —
    // same ownership rule as requirePatientAccess in patient-actions.ts,
    // checked here too since this page renders payment/session history
    // that action-level checks alone wouldn't gate.
    if (!can(actor.role, "intake.read.all")) {
        const owns = patient.appointments.some(
            a => a.psychologistId === actor.psychologistId,
        );
        if (!owns) redirect("/admin/clientes");
    }

    const formData = patient.intakeForm?.data as
        | Record<string, unknown>
        | undefined;
    const phone = getPatientPhoneFromIntakeFormData(formData) ?? "";
    const dateOfBirth =
        typeof formData?.dateOfBirth === "string" ? formData.dateOfBirth : "";

    return (
        <div className="space-y-6">
            <Link
                href="/admin/clientes"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
                Volver a clientes
            </Link>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-semibold">
                        {patient.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Cliente desde{" "}
                        {format(patient.createdAt, "d MMM yyyy", {
                            locale: es,
                        })}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {patient.intakeForm?.appointmentId && (
                        <Link
                            href={`/admin/formularios/${patient.intakeForm.appointmentId}`}
                        >
                            <Button variant="outline" size="sm">
                                <FileText />
                                Ver formulario
                            </Button>
                        </Link>
                    )}
                    {canCreateAppointment && (
                        <NewManualAppointmentDialog
                            psychologists={psychologists.map(p => ({
                                id: p.id,
                                name: p.name,
                                offeredSessionTypes: p.offeredSessionTypes,
                            }))}
                            rates={rates}
                            commissionRates={commissionRates}
                            initialPatientName={patient.name}
                            initialPatientEmail={patient.email}
                            triggerLabel="Agendar cita"
                        />
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 font-heading text-lg font-semibold">
                    Datos básicos
                </h2>
                <PatientProfileEditor
                    userId={patient.id}
                    name={patient.name}
                    email={patient.email}
                    phone={phone}
                    dateOfBirth={dateOfBirth}
                />
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 font-heading text-lg font-semibold">
                    Notas
                </h2>
                <PatientNotes userId={patient.id} notes={patient.notes} />
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 font-heading text-lg font-semibold">
                    Historial de citas
                </h2>
                {patient.appointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Sin citas registradas.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {patient.appointments.map(a => (
                            <div
                                key={a.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                            >
                                <div>
                                    <p className="font-medium">
                                        {format(
                                            a.dateTime,
                                            "d MMM yyyy, HH:mm",
                                            { locale: es },
                                        )}{" "}
                                        — {a.psychologist.name}
                                    </p>
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            {SESSION_TYPE_LABELS[
                                                a.sessionType
                                            ] ?? a.sessionType}
                                        </Badge>
                                        <AppointmentStatusBadge
                                            status={a.status}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        {a.payment ? (
                                            <>
                                                <p className="font-medium">
                                                    {formatCurrencyAmount(
                                                        a.payment.finalAmount,
                                                        a.payment.currency,
                                                    )}
                                                </p>
                                                <PaymentStatusBadge
                                                    status={a.payment.status}
                                                />
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                Sin pago
                                            </span>
                                        )}
                                    </div>
                                    {a.status === "CONFIRMED" && (
                                        <WhatsappReminderButton
                                            phone={phone || null}
                                            message={buildAppointmentWhatsappMessage(
                                                {
                                                    dateTime: a.dateTime,
                                                    timezone: a.timezone,
                                                    patientName: patient.name,
                                                    psychologistName:
                                                        a.psychologist.name,
                                                    whatsappReminderTemplate:
                                                        a.psychologist
                                                            .whatsappReminderTemplate,
                                                    whatsappTodaySessionTemplate:
                                                        a.psychologist
                                                            .whatsappTodaySessionTemplate,
                                                },
                                            )}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
