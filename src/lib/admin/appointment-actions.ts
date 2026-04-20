"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { deleteAppointmentEvent, updateAppointmentEvent } from "@/lib/calendar-events";
import {
  sendAppointmentCancelled,
  sendAppointmentCancelledPatient,
  sendAppointmentRescheduled,
} from "@/lib/email";

type ActionResult = { success: true } | { success: false; error: string };

export async function cancelAppointment(appointmentId: string): Promise<ActionResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true },
  });

  if (!appointment) return { success: false, error: "Cita no encontrada" };
  if (appointment.status === "CANCELLED") {
    return { success: false, error: "La cita ya está cancelada" };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
  });

  try {
    await deleteAppointmentEvent(appointmentId);
  } catch (err) {
    console.error("Google Calendar event deletion failed:", err);
  }

  try {
    await sendAppointmentCancelled(appointmentId);
    await sendAppointmentCancelledPatient(appointmentId);
  } catch (err) {
    console.error("Cancellation email failed:", err);
  }

  revalidatePath("/admin/citas", "layout");
  return { success: true };
}

export async function completeAppointment(appointmentId: string): Promise<ActionResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true },
  });

  if (!appointment) return { success: false, error: "Cita no encontrada" };
  if (appointment.status !== "CONFIRMED") {
    return { success: false, error: "Solo se pueden completar citas confirmadas" };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "COMPLETED" },
  });

  revalidatePath("/admin/citas", "layout");
  return { success: true };
}

export async function markNoShow(appointmentId: string): Promise<ActionResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true },
  });

  if (!appointment) return { success: false, error: "Cita no encontrada" };
  if (appointment.status !== "CONFIRMED") {
    return { success: false, error: "Solo se pueden marcar como no-show citas confirmadas" };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "NO_SHOW" },
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

  if (!appointment) return { success: false, error: "Cita no encontrada" };
  if (!["CONFIRMED", "PENDING_PAYMENT"].includes(appointment.status)) {
    return { success: false, error: "No se puede reagendar esta cita" };
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
