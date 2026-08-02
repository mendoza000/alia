import { prisma } from "@/lib/db";
import { deleteAppointmentEvent } from "@/lib/calendar-events";
import {
  sendAppointmentCancelled,
  sendAppointmentCancelledPatient,
} from "@/lib/email";

export type CancelResult = { success: true } | { success: false; error: string };

export async function cancelAppointmentCore(
  appointmentId: string,
): Promise<CancelResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true, payment: { select: { status: true } } },
  });

  if (!appointment) return { success: false, error: "Sesión no encontrada" };
  if (appointment.status === "CANCELLED") {
    return { success: false, error: "La sesión ya está cancelada" };
  }
  if (appointment.status === "COMPLETED") {
    return { success: false, error: "No se puede cancelar una sesión completada" };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
  });

  if (
    appointment.payment &&
    (appointment.payment.status === "PENDING" ||
      appointment.payment.status === "APPROVED")
  ) {
    await prisma.payment.update({
      where: { appointmentId },
      data: { status: "VOIDED" },
    });
  }

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

  return { success: true };
}
