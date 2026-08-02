"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cancelAppointmentCore, type CancelResult } from "@/lib/appointments/cancel-appointment";

export async function cancelMyAppointment(
  appointmentId: string,
): Promise<CancelResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "Debes iniciar sesión" };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { userId: true },
  });

  if (!appointment) return { success: false, error: "Sesión no encontrada" };
  if (appointment.userId !== session.user.id) {
    return { success: false, error: "No autorizado" };
  }

  const result = await cancelAppointmentCore(appointmentId);
  revalidatePath("/mi-cuenta/citas", "layout");
  return result;
}
