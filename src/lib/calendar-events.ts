import { prisma } from "@/lib/db";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/lib/google-calendar";

export async function createAppointmentEvent(
  appointmentId: string,
): Promise<string | null> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      psychologist: { select: { calendarId: true, name: true } },
      user: { select: { name: true, email: true } },
    },
  });

  if (!appointment || !appointment.psychologist.calendarId) return null;

  const patientName = appointment.user.name ?? appointment.user.email;
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

  const eventId = await createCalendarEvent(appointment.psychologist.calendarId, {
    summary: `Sesión — ${patientName}`,
    description: [
      `Persona: ${patientName}`,
      `Email: ${appointment.user.email}`,
      `Formulario: ${baseUrl}/admin/formularios/${appointmentId}`,
    ].join("\n"),
    startDateTime: appointment.dateTime,
    endDateTime: appointment.endTime,
  });

  if (eventId) {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { googleEventId: eventId },
    });
  }

  return eventId;
}

export async function deleteAppointmentEvent(appointmentId: string): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      googleEventId: true,
      psychologist: { select: { calendarId: true } },
    },
  });

  if (!appointment?.googleEventId || !appointment.psychologist.calendarId) return;

  await deleteCalendarEvent(
    appointment.psychologist.calendarId,
    appointment.googleEventId,
  );
}

export async function updateAppointmentEvent(appointmentId: string): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      googleEventId: true,
      dateTime: true,
      endTime: true,
      psychologist: { select: { calendarId: true } },
    },
  });

  if (!appointment?.googleEventId || !appointment.psychologist.calendarId) return;

  await updateCalendarEvent(
    appointment.psychologist.calendarId,
    appointment.googleEventId,
    {
      startDateTime: appointment.dateTime,
      endDateTime: appointment.endTime,
    },
  );
}

export async function createTimeOffEvent(timeOffId: string): Promise<string | null> {
  const timeOff = await prisma.timeOff.findUnique({
    where: { id: timeOffId },
    include: { psychologist: { select: { calendarId: true } } },
  });

  if (!timeOff || !timeOff.psychologist.calendarId) return null;

  const summary = timeOff.reason ? `Bloqueado — ${timeOff.reason}` : "Bloqueado";

  const eventId = await createCalendarEvent(timeOff.psychologist.calendarId, {
    summary,
    description: "Bloqueo de horario creado desde ALIA.",
    startDateTime: timeOff.startsAt,
    endDateTime: timeOff.endsAt,
  });

  if (eventId) {
    await prisma.timeOff.update({
      where: { id: timeOffId },
      data: { googleEventId: eventId },
    });
  }

  return eventId;
}

export async function deleteTimeOffEvent(timeOffId: string): Promise<void> {
  const timeOff = await prisma.timeOff.findUnique({
    where: { id: timeOffId },
    select: {
      googleEventId: true,
      psychologist: { select: { calendarId: true } },
    },
  });

  if (!timeOff?.googleEventId || !timeOff.psychologist.calendarId) return;

  await deleteCalendarEvent(timeOff.psychologist.calendarId, timeOff.googleEventId);
}
