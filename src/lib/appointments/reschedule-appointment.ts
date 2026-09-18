import { getDay, addMinutes, differenceInMinutes } from "date-fns";
import { prisma } from "@/lib/db";
import { updateAppointmentEvent } from "@/lib/calendar-events";
import {
    sendAppointmentRescheduled,
    sendAppointmentRescheduledPsychologist,
} from "@/lib/email";
import {
    getBlockingAppointments,
    getConfirmedCountsByDate,
} from "@/lib/queries/appointments";
import { getCachedFreeBusyPeriods } from "@/lib/google-calendar";
import {
    getScheduleForDay,
    generateTimeSlots,
    subtractBusyPeriods,
    filterPastSlots,
    appointmentsToBusyPeriods,
    toCaracasDate,
    DAILY_CONFIRMED_APPOINTMENT_CAP,
} from "@/lib/availability";

export type RescheduleResult =
    | { success: true }
    | { success: false; error: string };

/**
 * Shared reschedule logic between the admin action (rescheduleAppointment)
 * and the patient-facing one (rescheduleMyAppointment). Permission/ownership
 * checks stay in the callers — this only does the actual date/time move and
 * its availability checks.
 */
export async function rescheduleAppointmentCore(
    appointmentId: string,
    date: string, // "YYYY-MM-DD", interpreted in the psychologist's (Caracas) time
    time: string, // "HH:mm"
    options: {
        /** Only the admin caller ever passes this — the patient wrapper
         * never does. */
        isException?: boolean;
        /** Minimum minutes of notice required before the new slot. Admin
         * passes 0 (today's unchanged behavior — no lead-time floor on
         * admin reschedules). The patient wrapper passes a real value. */
        minNoticeMinutes?: number;
    } = {},
): Promise<RescheduleResult> {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
            status: true,
            dateTime: true,
            endTime: true,
            psychologistId: true,
            psychologist: {
                select: {
                    calendarId: true,
                    schedules: { where: { isActive: true } },
                },
            },
        },
    });

    if (!appointment) return { success: false, error: "Sesión no encontrada" };
    if (appointment.status !== "CONFIRMED") {
        return { success: false, error: "No se puede reagendar esta sesión" };
    }

    const bypassAvailability = options.isException === true;

    const durationMinutes = differenceInMinutes(
        appointment.endTime,
        appointment.dateTime,
    );
    const newDateTime = toCaracasDate(date, time);
    const newEndTime = addMinutes(newDateTime, durationMinutes);

    if (!bypassAvailability) {
        const dayOfWeek = getDay(newDateTime);
        const daySchedules = getScheduleForDay(
            appointment.psychologist.schedules,
            dayOfWeek,
        );
        const allSlots = generateTimeSlots(daySchedules, durationMinutes);
        const slot = allSlots.find(s => s.start === time);
        if (!slot) {
            return {
                success: false,
                error: "Este horario no está dentro del horario del psicólogo",
            };
        }

        const [calendarBusy, existingAppointments] = await Promise.all([
            appointment.psychologist.calendarId
                ? getCachedFreeBusyPeriods(
                      appointment.psychologist.calendarId,
                      newDateTime,
                      newEndTime,
                  )
                : Promise.resolve([]),
            getBlockingAppointments(
                appointment.psychologistId,
                newDateTime,
                newEndTime,
                appointmentId,
            ),
        ]);
        const allBusy = [
            ...calendarBusy,
            ...appointmentsToBusyPeriods(existingAppointments),
        ];
        const afterBusy = subtractBusyPeriods([slot], allBusy, date);
        const available = filterPastSlots(
            afterBusy,
            date,
            new Date(),
            options.minNoticeMinutes ?? 0,
        );
        if (available.length === 0) {
            return {
                success: false,
                error:
                    options.minNoticeMinutes && options.minNoticeMinutes > 0
                        ? "Este horario ya está ocupado o no cumple con el tiempo mínimo de aviso"
                        : "Este horario ya está ocupado",
            };
        }

        const confirmedCountByDate = await getConfirmedCountsByDate(
            appointment.psychologistId,
            toCaracasDate(date, "00:00"),
            toCaracasDate(date, "23:59"),
            appointmentId,
        );
        if (
            (confirmedCountByDate[date] ?? 0) >= DAILY_CONFIRMED_APPOINTMENT_CAP
        ) {
            return {
                success: false,
                error: "Este psicólogo ya alcanzó el máximo de sesiones para este día",
            };
        }
    }

    await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
            dateTime: newDateTime,
            endTime: newEndTime,
            ...(bypassAvailability ? { isException: true } : {}),
        },
    });

    try {
        await updateAppointmentEvent(appointmentId);
    } catch (err) {
        console.error("Google Calendar event update failed:", err);
    }

    try {
        await sendAppointmentRescheduled(appointmentId);
    } catch (err) {
        console.error("Reschedule email (patient) failed:", err);
    }

    try {
        await sendAppointmentRescheduledPsychologist(appointmentId);
    } catch (err) {
        console.error("Reschedule email (psychologist) failed:", err);
    }

    return { success: true };
}
