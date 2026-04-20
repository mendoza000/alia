import { render } from "@react-email/render";
import { Resend } from "resend";
import { AppointmentCancelledEmail } from "../emails/appointment-cancelled";
import { AppointmentCancelledPatientEmail } from "../emails/appointment-cancelled-patient";
import { AppointmentConfirmationEmail } from "../emails/appointment-confirmation";
import { AppointmentReminderEmail } from "../emails/appointment-reminder";
import { AppointmentRescheduledPatientEmail } from "../emails/appointment-rescheduled-patient";
import { NewAppointmentNotificationEmail } from "../emails/new-appointment-notification";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = "mendoza000.dev@gmail.com";
const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

const SUPABASE_STORAGE = "https://hqatzpberpxebsemokrs.supabase.co/storage/v1/object/public/psychologist-photos";
const LOGO_DARK_URL  = `${SUPABASE_STORAGE}/logo-alia.png`;
const LOGO_LIGHT_URL = `${SUPABASE_STORAGE}/logo-alia-text-white.png`;
const FONT_URL = `${BASE_URL}/fonts/Robecha%20Daniera-Regular.ttf`;

const GCAL_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Consulta+con+Dra.+Laura+Mart%C3%ADnez&dates=20250422T150000Z%2F20250422T160000Z&details=Sesi%C3%B3n+de+psicolog%C3%ADa+agendada+a+trav%C3%A9s+de+ALIA";

const DATA = {
  patientName:       "Ana García",
  psychologistName:  "Dra. Laura Martínez",
  formattedDate:     "martes 22 de abril a las 10:00 a. m.",
  formattedDateNew:  "jueves 24 de abril a las 3:00 p. m.",
  duration:          60,
  finalAmount:       150_000,
  patientEmail:      TO,
  appointmentsUrl:   `${BASE_URL}/mi-cuenta/citas`,
  intakeFormUrl:     `${BASE_URL}/admin/formularios/test-id`,
  scheduleUrl:       `${BASE_URL}/agendar`,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function send(subject: string, html: string) {
  const { data, error } = await resend.emails.send({ from: FROM, to: TO, subject, html });
  if (error) console.error(`✗ ${subject}:`, error.message);
  else        console.log(`✓ ${subject} — id: ${data?.id}`);
}

async function main() {
  console.log(`Enviando 6 emails de prueba a ${TO}...\n`);

  await send(
    "[PRUEBA] Confirmación de cita",
    await render(AppointmentConfirmationEmail({
      patientName:      DATA.patientName,
      psychologistName: DATA.psychologistName,
      formattedDate:    DATA.formattedDate,
      duration:         DATA.duration,
      finalAmount:      DATA.finalAmount,
      appointmentsUrl:  DATA.appointmentsUrl,
      googleCalendarUrl: GCAL_URL,
      logoUrl:          LOGO_DARK_URL,
      logoLightUrl:     LOGO_LIGHT_URL,
      fontUrl:          FONT_URL,
    })),
  );

  await sleep(300);
  await send(
    "[PRUEBA] Nueva cita agendada (psicólogo)",
    await render(NewAppointmentNotificationEmail({
      psychologistName: DATA.psychologistName,
      patientName:      DATA.patientName,
      patientEmail:     DATA.patientEmail,
      formattedDate:    DATA.formattedDate,
      duration:         DATA.duration,
      intakeFormUrl:    DATA.intakeFormUrl,
      logoUrl:          LOGO_DARK_URL,
      logoLightUrl:     LOGO_LIGHT_URL,
      fontUrl:          FONT_URL,
    })),
  );

  await sleep(300);
  await send(
    "[PRUEBA] Recordatorio de cita",
    await render(AppointmentReminderEmail({
      patientName:      DATA.patientName,
      psychologistName: DATA.psychologistName,
      formattedDate:    DATA.formattedDate,
      duration:         DATA.duration,
      appointmentsUrl:  DATA.appointmentsUrl,
      googleCalendarUrl: GCAL_URL,
      logoUrl:          LOGO_DARK_URL,
      logoLightUrl:     LOGO_LIGHT_URL,
      fontUrl:          FONT_URL,
    })),
  );

  await sleep(300);
  await send(
    "[PRUEBA] Cita cancelada (psicólogo)",
    await render(AppointmentCancelledEmail({
      psychologistName: DATA.psychologistName,
      patientName:      DATA.patientName,
      formattedDate:    DATA.formattedDate,
      logoUrl:          LOGO_DARK_URL,
      logoLightUrl:     LOGO_LIGHT_URL,
      fontUrl:          FONT_URL,
    })),
  );

  await sleep(300);
  await send(
    "[PRUEBA] Cita cancelada (paciente)",
    await render(AppointmentCancelledPatientEmail({
      patientName:      DATA.patientName,
      psychologistName: DATA.psychologistName,
      formattedDate:    DATA.formattedDate,
      scheduleUrl:      DATA.scheduleUrl,
      logoUrl:          LOGO_DARK_URL,
      logoLightUrl:     LOGO_LIGHT_URL,
      fontUrl:          FONT_URL,
    })),
  );

  await sleep(300);
  await send(
    "[PRUEBA] Cita reagendada (paciente)",
    await render(AppointmentRescheduledPatientEmail({
      patientName:      DATA.patientName,
      psychologistName: DATA.psychologistName,
      formattedDate:    DATA.formattedDateNew,
      duration:         DATA.duration,
      appointmentsUrl:  DATA.appointmentsUrl,
      googleCalendarUrl: GCAL_URL,
      logoUrl:          LOGO_DARK_URL,
      logoLightUrl:     LOGO_LIGHT_URL,
      fontUrl:          FONT_URL,
    })),
  );

  console.log("\nListo. Revisa la bandeja de entrada.");
}

main();
