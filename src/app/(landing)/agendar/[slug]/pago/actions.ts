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

export type ValidateCouponResult =
    | {
          success: true;
          couponId: string;
          code: string;
          discountPercent: number;
          discountAmount: number;
          finalAmount: number;
      }
    | { success: false; error: string };

export async function validateCoupon(
    code: string,
    originalAmount: number,
): Promise<ValidateCouponResult> {
    const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase().trim() },
    });

    if (!coupon) return { success: false, error: "Cupón no válido" };
    if (!coupon.isActive) return { success: false, error: "Este cupón ya no está activo" };
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return { success: false, error: "Este cupón ha vencido" };
    }
    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
        return { success: false, error: "Este cupón ha alcanzado su límite de usos" };
    }

    const discountAmount = Math.round((originalAmount * coupon.discountPercent) / 100);
    const finalAmount = originalAmount - discountAmount;

    return {
        success: true,
        couponId: coupon.id,
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        discountAmount,
        finalAmount,
    };
}

export async function simulatePayment(
    appointmentId: string,
    couponId?: string,
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
    let discountAmount = 0;
    let finalAmount = amount;

    if (couponId) {
        const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
        if (coupon && coupon.isActive) {
            discountAmount = Math.round((amount * coupon.discountPercent) / 100);
            finalAmount = amount - discountAmount;
        }
    }

    await prisma.$transaction([
        prisma.payment.create({
            data: {
                appointmentId,
                amount,
                discountAmount,
                finalAmount,
                couponId: couponId ?? null,
                status: "APPROVED",
                method: "simulated",
                paidAt: new Date(),
            },
        }),
        prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: "CONFIRMED" },
        }),
        ...(couponId
            ? [prisma.coupon.update({
                where: { id: couponId },
                data: { currentUses: { increment: 1 } },
              })]
            : []),
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
