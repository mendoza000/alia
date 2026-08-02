import { createAppointmentEvent } from "@/lib/calendar-events";
import {
  sendAppointmentConfirmation,
  sendNewAppointmentNotification,
} from "@/lib/email";

export async function confirmAndNotifyAppointment(
  appointmentId: string,
): Promise<void> {
  try {
    await createAppointmentEvent(appointmentId);
  } catch (err) {
    console.error("Google Calendar event creation failed:", err);
  }
  try {
    await sendAppointmentConfirmation(appointmentId);
    await sendNewAppointmentNotification(appointmentId);
  } catch (err) {
    console.error("Confirmation email failed:", err);
  }
}
