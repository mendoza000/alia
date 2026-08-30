"use server";

import { revalidatePath } from "next/cache";
import { getDay, addMinutes, differenceInMinutes } from "date-fns";
import { prisma } from "@/lib/db";
import { updateAppointmentEvent } from "@/lib/calendar-events";
import {
    sendAppointmentRescheduled,
    sendAppointmentRescheduledPsychologist,
} from "@/lib/email";
import {
    cancelAppointmentCore,
    type CancelResult,
} from "@/lib/appointments/cancel-appointment";
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

type ActionResult = { success: true } | { success: false; error: string };

export async function cancelAppointment(
    appointmentId: string,
): Promise<CancelResult> {
    const result = await cancelAppointmentCore(appointmentId);
    revalidatePath("/admin/citas", "layout");
    return result;
}

export async function completeAppointment(
    appointmentId: string,
): Promise<ActionResult> {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { status: true },
    });

    if (!appointment) return { success: false, error: "Sesión no encontrada" };
    if (appointment.status !== "CONFIRMED") {
        return {
            success: false,
            error: "Solo se pueden completar sesiones confirmadas",
        };
    }

    await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "COMPLETED", finalizedAt: new Date() },
    });

    revalidatePath("/admin/citas", "layout");
    return { success: true };
}

export async function updateAppointmentNotes(
    appointmentId: string,
    internalNotes: string,
): Promise<ActionResult> {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { id: true },
    });

    if (!appointment) return { success: false, error: "Sesión no encontrada" };

    await prisma.appointment.update({
        where: { id: appointmentId },
        data: { internalNotes: internalNotes.trim() || null },
    });

    revalidatePath("/admin/citas", "layout");
    return { success: true };
}

export async function deleteAppointment(
    appointmentId: string,
): Promise<ActionResult> {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { status: true },
    });

    if (!appointment) return { success: false, error: "Sesión no encontrada" };
    if (appointment.status !== "CANCELLED") {
        return {
            success: false,
            error: "Solo se pueden eliminar sesiones canceladas",
        };
    }

    await prisma.appointment.delete({ where: { id: appointmentId } });

    revalidatePath("/admin/citas", "layout");
    revalidatePath("/admin/pagos", "layout");
    return { success: true };
}

export async function markNoShow(appointmentId: string): Promise<ActionResult> {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { status: true },
    });

    if (!appointment) return { success: false, error: "Sesión no encontrada" };
    if (appointment.status !== "CONFIRMED") {
        return {
            success: false,
            error: "Solo se pueden marcar como no-show sesiones confirmadas",
        };
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
    date: string, // "YYYY-MM-DD", interpreted in the psychologist's (Caracas) time
    time: string, // "HH:mm"
    isException?: boolean,
): Promise<ActionResult> {
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

    const bypassAvailability = isException === true;

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
        const available = filterPastSlots(afterBusy, date, new Date());
        if (available.length === 0) {
            return { success: false, error: "Este horario ya está ocupado" };
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

    revalidatePath("/admin/citas", "layout");
    return { success: true };
}
