import { render } from "@react-email/render";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement, type JSX } from "react";
import { AppointmentCancelledEmail } from "../../emails/appointment-cancelled";
import { AppointmentCancelledPatientEmail } from "../../emails/appointment-cancelled-patient";
import { AppointmentConfirmationEmail } from "../../emails/appointment-confirmation";
import { AppointmentReminderEmail } from "../../emails/appointment-reminder";
import { AppointmentRescheduledPatientEmail } from "../../emails/appointment-rescheduled-patient";
import { AppointmentRescheduledPsychologistEmail } from "../../emails/appointment-rescheduled-psychologist";
import { IntakeFormReminderEmail } from "../../emails/intake-form-reminder";
import { NewAppointmentNotificationEmail } from "../../emails/new-appointment-notification";
import { PaymentRequestEmail } from "../../emails/payment-request";
import { ApprovalRequestedEmail } from "../../emails/approval-requested";
import { ApprovalDecidedEmail } from "../../emails/approval-decided";
import { SessionsReportEmail } from "../../emails/sessions-report";
import { PasswordResetEmail } from "../../emails/password-reset";
import { VerifyEmail } from "../../emails/verify-email";
import { prisma } from "@/lib/db";
import { CARACAS_TZ } from "@/lib/availability";
import { matchTimezoneOption } from "@/lib/timezones";
import { IntakeFormPDF } from "@/components/admin/intake-form-pdf";
import {
    intakeFormSchema,
    type IntakeFormData,
} from "@/lib/validators/intake-form";
import { formatCurrencyAmount } from "@/lib/currency";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "ALIA <onboarding@resend.dev>";

export function getBaseUrl() {
    return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

const LOGO_DARK_URL = `${getBaseUrl()}/logo-alia.png`;
const LOGO_LIGHT_URL = `${getBaseUrl()}/logo-alia-text-white.png`;

function getFontUrl() {
    return `${getBaseUrl()}/fonts/Robecha%20Daniera-Regular.ttf`;
}

function formatAppointmentDate(date: Date): string {
    return format(
        new TZDate(date, CARACAS_TZ),
        "EEEE d 'de' MMMM 'a las' h:mm a",
        { locale: es },
    );
}

function buildCalendarUrl(appointmentId: string): string {
    return `${getBaseUrl()}/api/appointments/${appointmentId}/ics`;
}

async function getAppointmentData(appointmentId: string) {
    return prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
            dateTime: true,
            endTime: true,
            expiresAt: true,
            psychologist: {
                select: {
                    name: true,
                    email: true,
                    sessionDuration: true,
                    slug: true,
                },
            },
            user: { select: { name: true, email: true } },
            timezone: true,
        },
    });
}

// Patients must never see the psychologist's (Caracas) time — only their own
// local time, labeled with their timezone so it's unambiguous.
function formatPatientAppointmentDate(
    dateTime: Date,
    timezone: string | null,
): string {
    const tz = timezone ?? CARACAS_TZ;
    const label = matchTimezoneOption(tz).label;
    const formatted = format(
        new TZDate(dateTime, tz),
        "EEEE d 'de' MMMM 'a las' h:mm a",
        { locale: es },
    );
    return `${formatted} (Hora ${label})`;
}

async function getPaymentEmailData(appointmentId: string) {
    return prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
            dateTime: true,
            timezone: true,
            psychologist: { select: { name: true } },
            user: { select: { name: true, email: true } },
        },
    });
}

export async function sendAppointmentConfirmation(
    appointmentId: string,
): Promise<void> {
    const appointment = await getAppointmentData(appointmentId);
    if (!appointment) return;

    const { psychologist, user, dateTime, timezone } = appointment;
    const html = await render(
        AppointmentConfirmationEmail({
            patientName: user.name ?? user.email,
            psychologistName: psychologist.name,
            formattedDate: formatPatientAppointmentDate(dateTime, timezone),
            duration: psychologist.sessionDuration,
            appointmentsUrl: `${getBaseUrl()}/mi-cuenta/citas`,
            calendarUrl: buildCalendarUrl(appointmentId),
            logoUrl: LOGO_DARK_URL,
            logoLightUrl: LOGO_LIGHT_URL,
            fontUrl: getFontUrl(),
        }),
    );

    await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: `Tu sesión con ${psychologist.name} está confirmada`,
        html,
    });
}

export async function sendIntakeFormReminder(
    appointmentId: string,
): Promise<void> {
    const appointment = await getAppointmentData(appointmentId);
    if (!appointment) return;

    const { psychologist, user, dateTime, timezone, expiresAt } = appointment;
    const html = await render(
        IntakeFormReminderEmail({
            patientName: user.name ?? user.email,
            psychologistName: psychologist.name,
            formattedDate: formatPatientAppointmentDate(dateTime, timezone),
            formattedDeadline: expiresAt
                ? formatPatientAppointmentDate(expiresAt, timezone)
                : "en breve",
            formUrl: `${getBaseUrl()}/agendar/${psychologist.slug}/formulario?appointmentId=${appointmentId}`,
            logoUrl: LOGO_DARK_URL,
            logoLightUrl: LOGO_LIGHT_URL,
            fontUrl: getFontUrl(),
        }),
    );

    await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: `Falta un paso para confirmar tu sesión con ${psychologist.name}`,
        html,
    });
}

async function buildIntakeFormAttachment(
    appointmentId: string,
): Promise<{ filename: string; content: string } | undefined> {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
            dateTime: true,
            psychologist: { select: { name: true } },
            user: {
                select: {
                    name: true,
                    email: true,
                    intakeForm: { select: { data: true, createdAt: true } },
                },
            },
        },
    });
    if (!appointment?.user.intakeForm) return undefined;

    try {
        const formData = intakeFormSchema.cast(
            appointment.user.intakeForm.data,
            {
                assert: false,
                stripUnknown: true,
            },
        ) as IntakeFormData;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const element = createElement(IntakeFormPDF, {
            patientName: appointment.user.name,
            patientEmail: appointment.user.email,
            psychologistName: appointment.psychologist.name,
            appointmentDate: appointment.dateTime,
            submittedAt: appointment.user.intakeForm.createdAt,
            data: formData,
        }) as JSX.Element as Parameters<typeof renderToBuffer>[0];

        const buffer = await renderToBuffer(element);
        const name = appointment.user.name ?? appointment.user.email;
        return {
            filename: `formulario-${name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
            content: buffer.toString("base64"),
        };
    } catch (err) {
        console.error("Intake form PDF render failed:", err);
        return undefined;
    }
}

export async function sendNewAppointmentNotification(
    appointmentId: string,
): Promise<void> {
    const appointment = await getAppointmentData(appointmentId);
    if (!appointment) return;

    const { psychologist, user, dateTime } = appointment;
    const html = await render(
        NewAppointmentNotificationEmail({
            psychologistName: psychologist.name,
            patientName: user.name ?? user.email,
            patientEmail: user.email,
            formattedDate: formatAppointmentDate(dateTime),
            duration: psychologist.sessionDuration,
            logoUrl: LOGO_DARK_URL,
            logoLightUrl: LOGO_LIGHT_URL,
            fontUrl: getFontUrl(),
        }),
    );

    const attachment = await buildIntakeFormAttachment(appointmentId);

    await resend.emails.send({
        from: FROM,
        to: psychologist.email,
        subject: `Nueva sesión agendada — ${user.name ?? user.email}`,
        html,
        ...(attachment ? { attachments: [attachment] } : {}),
    });
}

export async function sendAppointmentReminder(
    appointmentId: string,
): Promise<void> {
    const appointment = await getAppointmentData(appointmentId);
    if (!appointment) return;

    const { psychologist, user, dateTime, timezone } = appointment;
    const html = await render(
        AppointmentReminderEmail({
            patientName: user.name ?? user.email,
            psychologistName: psychologist.name,
            formattedDate: formatPatientAppointmentDate(dateTime, timezone),
            duration: psychologist.sessionDuration,
            appointmentsUrl: `${getBaseUrl()}/mi-cuenta/citas`,
            calendarUrl: buildCalendarUrl(appointmentId),
            logoUrl: LOGO_DARK_URL,
            logoLightUrl: LOGO_LIGHT_URL,
            fontUrl: getFontUrl(),
        }),
    );

    await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: `Recuerda: mañana tienes sesión con ${psychologist.name}`,
        html,
    });
}

export async function sendAppointmentCancelled(
    appointmentId: string,
): Promise<void> {
    const appointment = await getAppointmentData(appointmentId);
    if (!appointment) return;

    const { psychologist, user, dateTime } = appointment;
    const html = await render(
        AppointmentCancelledEmail({
            psychologistName: psychologist.name,
            patientName: user.name ?? user.email,
            formattedDate: formatAppointmentDate(dateTime),
            logoUrl: LOGO_DARK_URL,
            logoLightUrl: LOGO_LIGHT_URL,
            fontUrl: getFontUrl(),
        }),
    );

    await resend.emails.send({
        from: FROM,
        to: psychologist.email,
        subject: `Sesión cancelada — ${user.name ?? user.email}`,
        html,
    });
}

export async function sendAppointmentCancelledPatient(
    appointmentId: string,
): Promise<void> {
    const appointment = await getAppointmentData(appointmentId);
    if (!appointment) return;

    const { psychologist, user, dateTime, timezone } = appointment;
    const html = await render(
        AppointmentCancelledPatientEmail({
            patientName: user.name ?? user.email,
            psychologistName: psychologist.name,
            formattedDate: formatPatientAppointmentDate(dateTime, timezone),
            scheduleUrl: `${getBaseUrl()}/agendar`,
            logoUrl: LOGO_DARK_URL,
            logoLightUrl: LOGO_LIGHT_URL,
            fontUrl: getFontUrl(),
        }),
    );

    await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: `Tu sesión con ${psychologist.name} fue cancelada`,
        html,
    });
}

export async function sendAppointmentRescheduled(
    appointmentId: string,
): Promise<void> {
    const appointment = await getAppointmentData(appointmentId);
    if (!appointment) return;

    const { psychologist, user, dateTime, timezone } = appointment;
    const html = await render(
        AppointmentRescheduledPatientEmail({
            patientName: user.name ?? user.email,
            psychologistName: psychologist.name,
            formattedDate: formatPatientAppointmentDate(dateTime, timezone),
            duration: psychologist.sessionDuration,
            appointmentsUrl: `${getBaseUrl()}/mi-cuenta/citas`,
            calendarUrl: buildCalendarUrl(appointmentId),
            logoUrl: LOGO_DARK_URL,
            logoLightUrl: LOGO_LIGHT_URL,
            fontUrl: getFontUrl(),
        }),
    );

    await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: `Tu sesión con ${psychologist.name} fue reagendada`,
        html,
    });
}

export async function sendAppointmentRescheduledPsychologist(
    appointmentId: string,
): Promise<void> {
    const appointment = await getAppointmentData(appointmentId);
    if (!appointment) return;

    const { psychologist, user, dateTime } = appointment;
    const html = await render(
        AppointmentRescheduledPsychologistEmail({
            psychologistName: psychologist.name,
            patientName: user.name ?? user.email,
            patientEmail: user.email,
            formattedDate: formatAppointmentDate(dateTime),
            duration: psychologist.sessionDuration,
            logoUrl: LOGO_DARK_URL,
            logoLightUrl: LOGO_LIGHT_URL,
            fontUrl: getFontUrl(),
        }),
    );

    await resend.emails.send({
        from: FROM,
        to: psychologist.email,
        subject: `Sesión reagendada — ${user.name ?? user.email}`,
        html,
    });
}

export async function sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetUrl: string,
): Promise<void> {
    const html = await render(
        PasswordResetEmail({
            userName,
            resetUrl,
            logoUrl: LOGO_DARK_URL,
            logoLightUrl: LOGO_LIGHT_URL,
            fontUrl: getFontUrl(),
        }),
    );

    await resend.emails.send({
        from: FROM,
        to: userEmail,
        subject: "Restablece tu contraseña de ALIA",
        html,
    });
}

export async function sendVerificationEmail(
    userEmail: string,
    userName: string,
    verificationUrl: string,
): Promise<void> {
    const html = await render(
        VerifyEmail({
            userName,
            verificationUrl,
            logoUrl: LOGO_DARK_URL,
            logoLightUrl: LOGO_LIGHT_URL,
            fontUrl: getFontUrl(),
        }),
    );

    await resend.emails.send({
        from: FROM,
        to: userEmail,
        subject: "Confirma tu correo en ALIA",
        html,
    });
}

export async function sendPaymentRequestEmail(
    appointmentId: string,
    paymentUrl: string,
    finalAmount: number,
    currency: string,
): Promise<void> {
    const appointment = await getPaymentEmailData(appointmentId);
    if (!appointment) return;

    const { psychologist, user, dateTime, timezone } = appointment;
    const html = await render(
        PaymentRequestEmail({
            patientName: user.name ?? user.email,
            psychologistName: psychologist.name,
            formattedDate: formatPatientAppointmentDate(dateTime, timezone),
            finalAmount,
            currency,
            paymentUrl,
            logoUrl: LOGO_DARK_URL,
            logoLightUrl: LOGO_LIGHT_URL,
            fontUrl: getFontUrl(),
        }),
    );

    await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: `Enlace de pago — sesión con ${psychologist.name}`,
        html,
    });
}

const APPROVAL_TYPE_LABELS: Record<
    "CUSTOM_PAYMENT_AMOUNT" | "REFUND_REQUEST",
    string
> = {
    CUSTOM_PAYMENT_AMOUNT: "un monto personalizado",
    REFUND_REQUEST: "un reembolso",
};

async function getApprovalEmailData(approvalRequestId: string) {
    const request = await prisma.approvalRequest.findUnique({
        where: { id: approvalRequestId },
        include: {
            requestedBy: { select: { name: true, email: true } },
        },
    });
    if (!request) return null;

    if (request.type === "CUSTOM_PAYMENT_AMOUNT") {
        const appointment = await prisma.appointment.findUnique({
            where: { id: request.targetId },
            select: {
                dateTime: true,
                psychologist: { select: { name: true } },
            },
        });
        const payload = request.payload as { amount: number; currency: string };
        const summaryLine = appointment
            ? `${formatCurrencyAmount(payload.amount, payload.currency)} para la sesión del ${formatAppointmentDate(appointment.dateTime)} con ${appointment.psychologist.name}`
            : `${formatCurrencyAmount(payload.amount, payload.currency)}`;
        return { request, summaryLine };
    }

    const payment = await prisma.payment.findUnique({
        where: { id: request.targetId },
        select: {
            appointment: {
                select: {
                    user: { select: { name: true } },
                    psychologist: { select: { name: true } },
                },
            },
        },
    });
    const payload = request.payload as { reason: string };
    const summaryLine = payment
        ? `Motivo: ${payload.reason} — pago de ${payment.appointment.user.name} con ${payment.appointment.psychologist.name}`
        : `Motivo: ${payload.reason}`;
    return { request, summaryLine };
}

export async function sendApprovalRequestedEmail(
    approvalRequestId: string,
): Promise<void> {
    const data = await getApprovalEmailData(approvalRequestId);
    if (!data) return;
    const { request, summaryLine } = data;

    const reviewers = await prisma.user.findMany({
        where: { role: { in: ["admin", "assistant"] } },
        select: { email: true },
    });
    if (reviewers.length === 0) return;

    const html = await render(
        ApprovalRequestedEmail({
            requestTypeLabel: APPROVAL_TYPE_LABELS[request.type],
            requesterName: request.requestedBy.name,
            summaryLine,
            reviewUrl: `${getBaseUrl()}/admin/aprobaciones`,
            logoUrl: LOGO_DARK_URL,
            logoLightUrl: LOGO_LIGHT_URL,
            fontUrl: getFontUrl(),
        }),
    );

    await resend.emails.send({
        from: FROM,
        to: reviewers.map(r => r.email),
        subject: `Nueva solicitud de ${APPROVAL_TYPE_LABELS[request.type]}`,
        html,
    });
}

export async function sendApprovalDecidedEmail(
    approvalRequestId: string,
): Promise<void> {
    const data = await getApprovalEmailData(approvalRequestId);
    if (!data) return;
    const { request, summaryLine } = data;
    if (request.status === "PENDING") return;

    const html = await render(
        ApprovalDecidedEmail({
            requestTypeLabel: APPROVAL_TYPE_LABELS[request.type],
            decision: request.status as "APPROVED" | "REJECTED",
            decisionNote: request.decisionNote,
            summaryLine,
            viewUrl: `${getBaseUrl()}/admin/aprobaciones`,
            logoUrl: LOGO_DARK_URL,
            logoLightUrl: LOGO_LIGHT_URL,
            fontUrl: getFontUrl(),
        }),
    );

    await resend.emails.send({
        from: FROM,
        to: request.requestedBy.email,
        subject: `Tu solicitud de ${APPROVAL_TYPE_LABELS[request.type]} fue ${request.status === "APPROVED" ? "aprobada" : "rechazada"}`,
        html,
    });
}

export async function sendSessionsReportEmail({
    to,
    psychologistName,
    dateFrom,
    dateTo,
    pdfBuffer,
}: {
    to: string;
    psychologistName: string;
    dateFrom: string;
    dateTo: string;
    pdfBuffer: Buffer;
}): Promise<void> {
    const formattedFrom = format(
        new Date(`${dateFrom}T00:00:00`),
        "d 'de' MMMM 'de' yyyy",
        {
            locale: es,
        },
    );
    const formattedTo = format(
        new Date(`${dateTo}T00:00:00`),
        "d 'de' MMMM 'de' yyyy",
        {
            locale: es,
        },
    );

    const html = await render(
        SessionsReportEmail({
            psychologistName,
            formattedFrom,
            formattedTo,
            logoUrl: LOGO_DARK_URL,
            logoLightUrl: LOGO_LIGHT_URL,
            fontUrl: getFontUrl(),
        }),
    );

    await resend.emails.send({
        from: FROM,
        to,
        subject: `Reporte de sesiones — ${formattedFrom} a ${formattedTo}`,
        html,
        attachments: [
            {
                filename: `reporte-sesiones-${dateFrom}-a-${dateTo}.pdf`,
                content: pdfBuffer.toString("base64"),
            },
        ],
    });
}
