"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDay, addMinutes } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getBlockingAppointments,
  getConfirmedCountsByDate,
} from "@/lib/queries/appointments";
import { getActivePatientAppointment } from "@/lib/queries/patient-appointments";
import { getCachedFreeBusyPeriods } from "@/lib/google-calendar";
import { confirmAndNotifyAppointment } from "@/lib/appointments/confirm-and-notify";
import {
  getScheduleForDay,
  generateTimeSlots,
  subtractBusyPeriods,
  filterPastSlots,
  appointmentsToBusyPeriods,
  toBogotaDate,
  DAILY_CONFIRMED_APPOINTMENT_CAP,
} from "@/lib/availability";

type ManualBookingInput = {
  psychologistId: string;
  patientEmail: string;
  patientName: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  notes?: string;
};

type ManualBookingResult =
  | { success: true; appointmentId: string; warning?: string }
  | { success: false; error: string };

export async function createManualAppointment(
  input: ManualBookingInput,
): Promise<ManualBookingResult> {
  const psychologist = await prisma.psychologist.findUnique({
    where: { id: input.psychologistId, isActive: true },
    include: { schedules: { where: { isActive: true } } },
  });
  if (!psychologist) {
    return { success: false, error: "Psicólogo no encontrado" };
  }

  const slotStart = toBogotaDate(input.date, input.time);
  const slotEnd = addMinutes(slotStart, psychologist.sessionDuration);

  const dayOfWeek = getDay(slotStart);
  const daySchedules = getScheduleForDay(psychologist.schedules, dayOfWeek);
  const allSlots = generateTimeSlots(daySchedules, psychologist.sessionDuration);
  const slot = allSlots.find(s => s.start === input.time);
  if (!slot) {
    return {
      success: false,
      error: "Este horario no está dentro del horario del psicólogo",
    };
  }

  const confirmedCountByDate = await getConfirmedCountsByDate(
    psychologist.id,
    toBogotaDate(input.date, "00:00"),
    toBogotaDate(input.date, "23:59"),
  );
  if (
    (confirmedCountByDate[input.date] ?? 0) >= DAILY_CONFIRMED_APPOINTMENT_CAP
  ) {
    return {
      success: false,
      error: "Este psicólogo ya alcanzó el máximo de sesiones para este día",
    };
  }

  const [calendarBusy, existingAppointments] = await Promise.all([
    psychologist.calendarId
      ? getCachedFreeBusyPeriods(psychologist.calendarId, slotStart, slotEnd)
      : Promise.resolve([]),
    getBlockingAppointments(psychologist.id, slotStart, slotEnd),
  ]);
  const allBusy = [
    ...calendarBusy,
    ...appointmentsToBusyPeriods(existingAppointments),
  ];
  const afterBusy = subtractBusyPeriods([slot], allBusy, input.date);
  const available = filterPastSlots(afterBusy, input.date, new Date());
  if (available.length === 0) {
    return { success: false, error: "Este horario ya está ocupado" };
  }

  let user = await prisma.user.findUnique({
    where: { email: input.patientEmail },
  });

  if (!user) {
    const result = await auth.api.createUser({
      body: {
        email: input.patientEmail,
        name: input.patientName,
      },
      headers: await headers(),
    });
    user = await prisma.user.findUnique({ where: { id: result.user.id } });
  }
  if (!user) {
    return { success: false, error: "No se pudo crear el usuario del paciente" };
  }
  const patientId = user.id;

  const activeAppointment = await getActivePatientAppointment(patientId);
  const warning = activeAppointment
    ? "Este paciente ya tenía una sesión activa. Se creó igual por ser un agendamiento manual."
    : undefined;

  let appointmentId: string;
  try {
    const appointment = await prisma.$transaction(async tx => {
      const conflicting = await tx.appointment.findFirst({
        where: {
          psychologistId: input.psychologistId,
          dateTime: { lt: slotEnd },
          endTime: { gt: slotStart },
          OR: [
            { status: "CONFIRMED" },
            {
              status: "PENDING_FORM",
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          ],
        },
      });
      if (conflicting) throw new Error("SLOT_TAKEN");

      return tx.appointment.create({
        data: {
          userId: patientId,
          psychologistId: input.psychologistId,
          dateTime: slotStart,
          endTime: slotEnd,
          status: "CONFIRMED",
          notes: input.notes || null,
        },
      });
    });
    appointmentId = appointment.id;
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_TAKEN") {
      return { success: false, error: "Este horario ya está ocupado" };
    }
    throw error;
  }

  await prisma.intakeForm.create({
    data: {
      appointmentId,
      userId: patientId,
      data: {
        fullName: input.patientName,
        email: input.patientEmail,
        consultationReason:
          input.notes || "Cita agendada manualmente por el equipo de ALIA.",
      },
    },
  });

  await confirmAndNotifyAppointment(appointmentId);

  revalidatePath("/admin/citas", "layout");
  return { success: true, appointmentId, warning };
}
