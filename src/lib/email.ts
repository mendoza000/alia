import { render } from "@react-email/render";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Resend } from "resend";
import { AppointmentCancelledEmail } from "../../emails/appointment-cancelled";
import { AppointmentCancelledPatientEmail } from "../../emails/appointment-cancelled-patient";
import { AppointmentConfirmationEmail } from "../../emails/appointment-confirmation";
import { AppointmentReminderEmail } from "../../emails/appointment-reminder";
import { AppointmentRescheduledPatientEmail } from "../../emails/appointment-rescheduled-patient";
import { NewAppointmentNotificationEmail } from "../../emails/new-appointment-notification";
import { prisma } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "ALIA <onboarding@resend.dev>";

const SUPABASE_STORAGE = "https://hqatzpberpxebsemokrs.supabase.co/storage/v1/object/public/psychologist-photos";
const LOGO_DARK_URL  = `${SUPABASE_STORAGE}/logo-alia.png`;
const LOGO_LIGHT_URL = `${SUPABASE_STORAGE}/logo-alia-text-white.png`;

function getBaseUrl() {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

function getFontUrl() {
  return `${getBaseUrl()}/fonts/Robecha%20Daniera-Regular.ttf`;
}

function formatAppointmentDate(date: Date): string {
  return format(date, "EEEE d 'de' MMMM 'a las' h:mm a", { locale: es });
}

function buildGoogleCalendarUrl(
  dateTime: Date,
  endTime: Date,
  psychologistName: string,
): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Consulta con ${psychologistName}`,
    dates: `${fmt(dateTime)}/${fmt(endTime)}`,
    details: "Sesión de psicología agendada a través de ALIA",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

async function getAppointmentData(appointmentId: string) {
  return prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      dateTime: true,
      endTime: true,
      psychologist: {
        select: { name: true, email: true, sessionDuration: true },
      },
      user: { select: { name: true, email: true } },
      payment: { select: { finalAmount: true } },
    },
  });
}

export async function sendAppointmentConfirmation(
  appointmentId: string,
): Promise<void> {
  const appointment = await getAppointmentData(appointmentId);
  if (!appointment) return;

  const { psychologist, user, payment, dateTime, endTime } = appointment;
  const html = await render(
    AppointmentConfirmationEmail({
      patientName: user.name ?? user.email,
      psychologistName: psychologist.name,
      formattedDate: formatAppointmentDate(dateTime),
      duration: psychologist.sessionDuration,
      finalAmount: payment?.finalAmount ?? 0,
      appointmentsUrl: `${getBaseUrl()}/mi-cuenta/citas`,
      googleCalendarUrl: buildGoogleCalendarUrl(
        dateTime,
        endTime,
        psychologist.name,
      ),
      logoUrl: LOGO_DARK_URL,
      logoLightUrl: LOGO_LIGHT_URL,
      fontUrl: getFontUrl(),
    }),
  );

  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Tu cita con ${psychologist.name} está confirmada`,
    html,
  });
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
      intakeFormUrl: `${getBaseUrl()}/admin/formularios/${appointmentId}`,
      logoUrl: LOGO_DARK_URL,
      logoLightUrl: LOGO_LIGHT_URL,
      fontUrl: getFontUrl(),
    }),
  );

  await resend.emails.send({
    from: FROM,
    to: psychologist.email,
    subject: `Nueva cita agendada — ${user.name ?? user.email}`,
    html,
  });
}

export async function sendAppointmentReminder(
  appointmentId: string,
): Promise<void> {
  const appointment = await getAppointmentData(appointmentId);
  if (!appointment) return;

  const { psychologist, user, dateTime, endTime } = appointment;
  const html = await render(
    AppointmentReminderEmail({
      patientName: user.name ?? user.email,
      psychologistName: psychologist.name,
      formattedDate: formatAppointmentDate(dateTime),
      duration: psychologist.sessionDuration,
      appointmentsUrl: `${getBaseUrl()}/mi-cuenta/citas`,
      googleCalendarUrl: buildGoogleCalendarUrl(
        dateTime,
        endTime,
        psychologist.name,
      ),
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
    subject: `Cita cancelada — ${user.name ?? user.email}`,
    html,
  });
}

export async function sendAppointmentCancelledPatient(
  appointmentId: string,
): Promise<void> {
  const appointment = await getAppointmentData(appointmentId);
  if (!appointment) return;

  const { psychologist, user, dateTime } = appointment;
  const html = await render(
    AppointmentCancelledPatientEmail({
      patientName: user.name ?? user.email,
      psychologistName: psychologist.name,
      formattedDate: formatAppointmentDate(dateTime),
      scheduleUrl: `${getBaseUrl()}/agendar`,
      logoUrl: LOGO_DARK_URL,
      logoLightUrl: LOGO_LIGHT_URL,
      fontUrl: getFontUrl(),
    }),
  );

  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Tu cita con ${psychologist.name} fue cancelada`,
    html,
  });
}

export async function sendAppointmentRescheduled(
  appointmentId: string,
): Promise<void> {
  const appointment = await getAppointmentData(appointmentId);
  if (!appointment) return;

  const { psychologist, user, dateTime, endTime } = appointment;
  const html = await render(
    AppointmentRescheduledPatientEmail({
      patientName: user.name ?? user.email,
      psychologistName: psychologist.name,
      formattedDate: formatAppointmentDate(dateTime),
      duration: psychologist.sessionDuration,
      appointmentsUrl: `${getBaseUrl()}/mi-cuenta/citas`,
      googleCalendarUrl: buildGoogleCalendarUrl(
        dateTime,
        endTime,
        psychologist.name,
      ),
      logoUrl: LOGO_DARK_URL,
      logoLightUrl: LOGO_LIGHT_URL,
      fontUrl: getFontUrl(),
    }),
  );

  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Tu cita con ${psychologist.name} fue reagendada`,
    html,
  });
}
