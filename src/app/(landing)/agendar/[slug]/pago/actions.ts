"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAppointmentEvent } from "@/lib/calendar-events";
import {
    sendAppointmentConfirmation,
    sendNewAppointmentNotification,
} from "@/lib/email";

type SimulateResult = { success: true } | { success: false; error: string };

export async function simulatePayment(
    appointmentId: string,
): Promise<SimulateResult> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        return { success: false, error: "Debes iniciar sesión" };
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { psychologist: { select: { sessionRate: true } } },
    });

    if (!appointment) {
        return { success: false, error: "Cita no encontrada" };
    }

    if (appointment.userId !== session.user.id) {
        return { success: false, error: "No tienes permiso para esta cita" };
    }

    if (appointment.status !== "PENDING_PAYMENT") {
        return { success: false, error: "Esta cita no está pendiente de pago" };
    }

    const amount = appointment.psychologist.sessionRate;

    await prisma.$transaction([
        prisma.payment.create({
            data: {
                appointmentId,
                amount,
                finalAmount: amount,
                status: "APPROVED",
                method: "simulated",
                paidAt: new Date(),
            },
        }),
        prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: "CONFIRMED" },
        }),
    ]);

    try {
        await createAppointmentEvent(appointmentId);
    } catch (err) {
        console.error("Google Calendar event creation failed:", err);
    }

    try {
        await sendAppointmentConfirmation(appointmentId);
        await sendNewAppointmentNotification(appointmentId);
    } catch (err) {
        console.error("Email sending failed:", err);
    }

    return { success: true };
}
