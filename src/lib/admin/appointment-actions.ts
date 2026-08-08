"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { updateAppointmentEvent } from "@/lib/calendar-events";
import { sendAppointmentRescheduled } from "@/lib/email";
import { cancelAppointmentCore, type CancelResult } from "@/lib/appointments/cancel-appointment";

type ActionResult = { success: true } | { success: false; error: string };

export async function cancelAppointment(appointmentId: string): Promise<CancelResult> {
  const result = await cancelAppointmentCore(appointmentId);
  revalidatePath("/admin/citas", "layout");
  return result;
}

export async function completeAppointment(appointmentId: string): Promise<ActionResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true },
  });

  if (!appointment) return { success: false, error: "Sesión no encontrada" };
  if (appointment.status !== "CONFIRMED") {
    return { success: false, error: "Solo se pueden completar sesiones confirmadas" };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "COMPLETED", finalizedAt: new Date() },
  });

  revalidatePath("/admin/citas", "layout");
  return { success: true };
}

export async function markNoShow(appointmentId: string): Promise<ActionResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true },
  });

  if (!appointment) return { success: false, error: "Sesión no encontrada" };
  if (appointment.status !== "CONFIRMED") {
    return { success: false, error: "Solo se pueden marcar como no-show sesiones confirmadas" };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "NO_SHOW", finalizedAt: new Date() },
  });

  revalidatePath("/admin/citas", "layout");
  return { success: true };
}

export async function rescheduleAppointment(
  appointmentId: string,
  newDateTime: Date,
  newEndTime: Date,
): Promise<ActionResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true },
  });

  if (!appointment) return { success: false, error: "Sesión no encontrada" };
  if (appointment.status !== "CONFIRMED") {
    return { success: false, error: "No se puede reagendar esta sesión" };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { dateTime: newDateTime, endTime: newEndTime },
  });

  try {
    await updateAppointmentEvent(appointmentId);
  } catch (err) {
    console.error("Google Calendar event update failed:", err);
  }

  try {
    await sendAppointmentRescheduled(appointmentId);
  } catch (err) {
    console.error("Reschedule email failed:", err);
  }

  revalidatePath("/admin/citas", "layout");
  return { success: true };
}
