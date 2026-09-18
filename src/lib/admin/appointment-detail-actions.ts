"use server";

import { requireActor, requireOwnAppointment } from "@/lib/auth/require";
import { getAppointmentById } from "@/lib/admin/appointment-queries";

/** Backs the calendar's "click an appointment" detail sheet — admin/
 * assistant can open any appointment, a psychologist only their own
 * (requireOwnAppointment is a no-op for admin/assistant, same as every
 * other appointment-scoped action). */
export async function getAppointmentDetailAction(appointmentId: string) {
    const actor = await requireActor();
    await requireOwnAppointment(actor, appointmentId);
    return getAppointmentById(appointmentId);
}
