"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { ApprovalType, PayoutType } from "@/generated/prisma/enums";
import { requireOwnAppointment, requirePermission } from "@/lib/auth/require";
import { can } from "@/lib/auth/permissions";
import { requiresSettingsWriteEscalation } from "@/lib/approvals";
import { resolveCheckoutUrl } from "@/lib/admin/payment-actions";
import {
    sendApprovalDecidedEmail,
    sendApprovalRequestedEmail,
} from "@/lib/email";

type ActionResult = { success: true } | { success: false; error: string };

type CustomAmountPayload = {
    amount: number;
    currency: string;
    payoutType: PayoutType;
};

type RefundRequestPayload = { reason: string };

/**
 * A psychologist requests a non-standard price for their own appointment, or
 * any staff member with access to a payment requests a refund correction
 * (never a Stripe API call — see approveRequest/markRefundExecuted).
 */
export async function requestApproval(
    type: "CUSTOM_PAYMENT_AMOUNT",
    targetId: string,
    payload: CustomAmountPayload,
): Promise<ActionResult>;
export async function requestApproval(
    type: "REFUND_REQUEST",
    targetId: string,
    payload: RefundRequestPayload,
): Promise<ActionResult>;
export async function requestApproval(
    type: ApprovalType,
    targetId: string,
    payload: CustomAmountPayload | RefundRequestPayload,
): Promise<ActionResult> {
    try {
        const actor = await requirePermission("approval.request");

        if (type === "CUSTOM_PAYMENT_AMOUNT") {
            // approval.request is shared with REFUND_REQUEST's broader
            // access (admin/assistant/psychologist-on-own) — a custom
            // amount request only makes sense from the psychologist whose
            // own appointment it is; anyone else with payment.commission.write
            // should use "Editar precio" directly instead of requesting.
            if (actor.role !== "psychologist") {
                return {
                    success: false,
                    error: "Solo un psicólogo puede solicitar un monto personalizado — usa 'Editar precio' directamente.",
                };
            }
            await requireOwnAppointment(actor, targetId);

            const { amount, currency, payoutType } =
                payload as CustomAmountPayload;
            if (!Number.isFinite(amount) || amount <= 0) {
                return { success: false, error: "El monto debe ser mayor a 0" };
            }
            if (!currency) {
                return { success: false, error: "Indica una moneda" };
            }
            if (!payoutType) {
                return { success: false, error: "Indica una comisión" };
            }
        } else {
            const { reason } = payload as RefundRequestPayload;
            if (!reason?.trim()) {
                return {
                    success: false,
                    error: "Indica el motivo del reembolso",
                };
            }

            const payment = await prisma.payment.findUnique({
                where: { id: targetId },
                select: { appointmentId: true },
            });
            if (!payment)
                return { success: false, error: "Pago no encontrado" };
            await requireOwnAppointment(actor, payment.appointmentId);
        }

        const created = await prisma.approvalRequest.create({
            data: {
                type,
                requestedByUserId: actor.userId,
                targetId,
                payload: payload as Prisma.InputJsonValue,
            },
        });

        try {
            await sendApprovalRequestedEmail(created.id);
        } catch (err) {
            console.error("Failed to send approval-requested email:", err);
        }

        revalidatePath("/admin/aprobaciones", "layout");
        return { success: true };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return { success: false, error: "No se pudo enviar la solicitud" };
    }
}

export async function approveRequest(
    id: string,
    note?: string,
): Promise<ActionResult & { url?: string }> {
    try {
        const actor = await requirePermission("approval.decide");

        const request = await prisma.approvalRequest.findUnique({
            where: { id },
        });
        if (!request)
            return { success: false, error: "Solicitud no encontrada" };
        if (request.status !== "PENDING") {
            return { success: false, error: "Esta solicitud ya fue resuelta" };
        }

        let url: string | undefined;

        if (request.type === "CUSTOM_PAYMENT_AMOUNT") {
            const payload = request.payload as unknown as CustomAmountPayload;

            if (
                requiresSettingsWriteEscalation(payload.payoutType) &&
                !can(actor.role, "settings.write")
            ) {
                return {
                    success: false,
                    error: "Este monto fija una comisión no estándar — requiere permiso de configuración",
                };
            }

            const appointment = await prisma.appointment.findUnique({
                where: { id: request.targetId },
                select: { payment: { select: { id: true } } },
            });
            if (!appointment) {
                return { success: false, error: "Sesión no encontrada" };
            }

            await prisma.appointment.update({
                where: { id: request.targetId },
                data: {
                    agreedAmount: payload.amount,
                    agreedCurrency: payload.currency,
                    agreedPayoutType: payload.payoutType,
                },
            });

            // Only regenerate an existing link — same precedent as
            // updateAgreedPrice: approving a custom amount for a session
            // nobody has tried to charge yet shouldn't be what triggers
            // creating the first Stripe Checkout Session for it.
            if (appointment.payment) {
                const result = await resolveCheckoutUrl(request.targetId);
                if (!result.success) return result;
                url = result.url;
            }
        } else {
            const payment = await prisma.payment.findUnique({
                where: { id: request.targetId },
            });
            if (!payment)
                return { success: false, error: "Pago no encontrado" };
            if (payment.status !== "APPROVED") {
                return {
                    success: false,
                    error: "Solo se puede aprobar el reembolso de un pago ya aprobado",
                };
            }

            // Never call any Stripe refund API — this only marks the
            // correction as pending manual execution in the Stripe
            // dashboard (plan-v2.md Fase 5.1b).
            await prisma.payment.update({
                where: { id: request.targetId },
                data: { refundStatus: "PENDING_EXECUTION" },
            });
        }

        await prisma.approvalRequest.update({
            where: { id },
            data: {
                status: "APPROVED",
                decidedByUserId: actor.userId,
                decidedAt: new Date(),
                decisionNote: note ?? null,
            },
        });

        try {
            await sendApprovalDecidedEmail(id);
        } catch (err) {
            console.error("Failed to send approval-decided email:", err);
        }

        revalidatePath("/admin/aprobaciones", "layout");
        revalidatePath("/admin/citas", "layout");
        revalidatePath("/admin/pagos", "layout");
        return { success: true, url };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return { success: false, error: "No se pudo aprobar la solicitud" };
    }
}

export async function rejectRequest(
    id: string,
    note?: string,
): Promise<ActionResult> {
    try {
        const actor = await requirePermission("approval.decide");

        const request = await prisma.approvalRequest.findUnique({
            where: { id },
            select: { status: true },
        });
        if (!request)
            return { success: false, error: "Solicitud no encontrada" };
        if (request.status !== "PENDING") {
            return { success: false, error: "Esta solicitud ya fue resuelta" };
        }

        await prisma.approvalRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                decidedByUserId: actor.userId,
                decidedAt: new Date(),
                decisionNote: note ?? null,
            },
        });

        try {
            await sendApprovalDecidedEmail(id);
        } catch (err) {
            console.error("Failed to send approval-decided email:", err);
        }

        revalidatePath("/admin/aprobaciones", "layout");
        return { success: true };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return { success: false, error: "No se pudo rechazar la solicitud" };
    }
}

/**
 * Admin marks a refund correction as actually executed in the Stripe
 * dashboard. Admin-only per plan-v2.md, even though payment.commission.write
 * itself is also held by assistant — the permission alone isn't narrow
 * enough here, so the role is checked explicitly on top of it. Never calls
 * any Stripe refund API.
 */
export async function markRefundExecuted(
    paymentId: string,
): Promise<ActionResult> {
    try {
        const actor = await requirePermission("payment.commission.write");
        if (actor.role !== "admin") {
            return {
                success: false,
                error: "Solo un administrador puede marcar un reembolso como ejecutado",
            };
        }

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            select: { refundStatus: true },
        });
        if (!payment) return { success: false, error: "Pago no encontrado" };
        if (payment.refundStatus !== "PENDING_EXECUTION") {
            return {
                success: false,
                error: "Este pago no tiene un reembolso pendiente de ejecución",
            };
        }

        await prisma.payment.update({
            where: { id: paymentId },
            data: { refundStatus: "EXECUTED" },
        });

        revalidatePath("/admin/pagos", "layout");
        revalidatePath("/admin/citas", "layout");
        return { success: true };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return { success: false, error: "No se pudo marcar el reembolso" };
    }
}
