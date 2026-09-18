"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission, requireOwnAppointment } from "@/lib/auth/require";
import {
    cancelAppointmentCore,
    type CancelResult,
} from "@/lib/appointments/cancel-appointment";
import { rescheduleAppointmentCore } from "@/lib/appointments/reschedule-appointment";

type ActionResult = { success: true } | { success: false; error: string };

export async function cancelAppointment(
    appointmentId: string,
): Promise<CancelResult> {
    const actor = await requirePermission("appointment.write");
    await requireOwnAppointment(actor, appointmentId);

    const result = await cancelAppointmentCore(appointmentId);
    revalidatePath("/admin/citas", "layout");
    return result;
}

export async function completeAppointment(
    appointmentId: string,
): Promise<ActionResult> {
    const actor = await requirePermission("appointment.write");
    await requireOwnAppointment(actor, appointmentId);

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
    const actor = await requirePermission("appointment.write");
    await requireOwnAppointment(actor, appointmentId);

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
    const actor = await requirePermission("appointment.write");
    await requireOwnAppointment(actor, appointmentId);

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
    const actor = await requirePermission("appointment.write");
    await requireOwnAppointment(actor, appointmentId);

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
    const actor = await requirePermission("appointment.write");
    await requireOwnAppointment(actor, appointmentId);

    const result = await rescheduleAppointmentCore(appointmentId, date, time, {
        isException,
    });

    revalidatePath("/admin/citas", "layout");
    return result;
}
