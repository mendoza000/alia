"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
    cancelAppointmentCore,
    type CancelResult,
} from "@/lib/appointments/cancel-appointment";
import {
    rescheduleAppointmentCore,
    type RescheduleResult,
} from "@/lib/appointments/reschedule-appointment";
import { MIN_RESCHEDULE_NOTICE_MINUTES } from "@/lib/availability";
import { resolveCheckoutUrl } from "@/lib/admin/payment-actions";

type PaymentLinkResult =
    | { success: true; url: string }
    | { success: false; error: string };

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

export async function rescheduleMyAppointment(
    appointmentId: string,
    date: string,
    time: string,
): Promise<RescheduleResult> {
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

    // Never accepts isException — that bypass is staff-only (manual booking's
    // sanctioned override), never available to a patient rescheduling their
    // own session.
    const result = await rescheduleAppointmentCore(appointmentId, date, time, {
        minNoticeMinutes: MIN_RESCHEDULE_NOTICE_MINUTES,
    });
    revalidatePath("/mi-cuenta/citas", "layout");
    return result;
}

/**
 * Generates a payment link for a patient's own completed/no-show session
 * with a pending charge. Never accepts an amount — resolveCheckoutUrl is
 * called with no overrides, so it always resolves to whatever was already
 * agreed (Fase 3) or the standard rate. Returns the URL rather than
 * redirecting: Next's redirect() throws a NEXT_REDIRECT error that would be
 * silently swallowed by this file's usual try/catch-and-return pattern —
 * the caller navigates client-side instead.
 */
export async function createMyPaymentLink(
    appointmentId: string,
): Promise<PaymentLinkResult> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return { success: false, error: "Debes iniciar sesión" };
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
            userId: true,
            status: true,
            payment: { select: { status: true } },
        },
    });

    if (!appointment) return { success: false, error: "Sesión no encontrada" };
    if (appointment.userId !== session.user.id) {
        return { success: false, error: "No autorizado" };
    }
    if (!["COMPLETED", "NO_SHOW"].includes(appointment.status)) {
        return {
            success: false,
            error: "Esta sesión no tiene un cobro pendiente",
        };
    }
    if (appointment.payment && appointment.payment.status !== "PENDING") {
        return { success: false, error: "Este cobro ya fue resuelto" };
    }

    const result = await resolveCheckoutUrl(appointmentId);
    if (!result.success) return result;
    return { success: true, url: result.url };
}
