"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission, requireOwnAppointment } from "@/lib/auth/require";
import { createPaymentCheckoutSession, stripe } from "@/lib/stripe";
import { sendPaymentRequestEmail } from "@/lib/email";
import { getPayoutSettings } from "@/lib/admin/payout-settings-queries";
import { getPayoutTypeRate } from "@/lib/payout-type";
import { getRate } from "@/lib/admin/payment-rate-queries";
import { getPaymentAmountUsd, getUsdRateMap } from "@/lib/exchange-rates";
import {
    sessionTypeToRateKind,
    resolvePaymentAmount,
    resolvePayoutType,
} from "@/lib/pricing";
import type { PayoutType, RateKind } from "@/generated/prisma/enums";

type ActionResult = { success: true } | { success: false; error: string };

type CheckoutOverrides = {
    /** Explicit currency override — falls back to the appointment's
     * agreedCurrency. Required (one way or the other) since there's no
     * sensible currency default. */
    currency?: string;
    /** Explicit commission override — falls back to agreedPayoutType. */
    payoutType?: PayoutType;
    /** Explicit amount override — falls back to agreedAmount, then to the
     * matching tarifa. Used by the "editar precio" dialog and the no-show
     * fee flow. */
    customAmount?: number;
    /** Forces the rate lookup to a specific kind instead of deriving it
     * from the appointment's sessionType — the no-show fee is the only
     * caller that needs this. */
    kind?: RateKind;
};

function getBaseUrl() {
    return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

async function resolveCheckoutUrl(
    appointmentId: string,
    overrides: CheckoutOverrides = {},
): Promise<{ success: true; url: string } | { success: false; error: string }> {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
            status: true,
            sessionType: true,
            agreedAmount: true,
            agreedCurrency: true,
            agreedPayoutType: true,
            user: { select: { email: true } },
            payment: true,
        },
    });

    if (!appointment) return { success: false, error: "Sesión no encontrada" };

    if (!["CONFIRMED", "COMPLETED", "NO_SHOW"].includes(appointment.status)) {
        return {
            success: false,
            error: "Solo se puede cobrar una sesión confirmada en adelante",
        };
    }

    if (appointment.payment?.status === "APPROVED") {
        return { success: false, error: "Esta sesión ya fue pagada" };
    }

    const currency = overrides.currency ?? appointment.agreedCurrency;
    if (!currency) {
        return {
            success: false,
            error: "Esta cita no tiene una moneda acordada — indícala manualmente.",
        };
    }

    if (
        overrides.customAmount !== undefined &&
        (!Number.isFinite(overrides.customAmount) ||
            overrides.customAmount <= 0)
    ) {
        return {
            success: false,
            error: "El monto personalizado debe ser mayor a 0",
        };
    }

    const kind =
        overrides.kind ?? sessionTypeToRateKind(appointment.sessionType);
    const rate = await getRate(currency, kind);

    const amount = resolvePaymentAmount({
        customAmount: overrides.customAmount ?? null,
        agreedAmount: appointment.agreedAmount,
        fallbackRateAmount: rate?.amount ?? null,
    });
    if (amount == null) {
        return {
            success: false,
            error: `No hay tarifa configurada para ${currency}. Configúrala en Tarifas.`,
        };
    }

    const payoutSettings = await getPayoutSettings();
    const payoutType = resolvePayoutType({
        requestedPayoutType: overrides.payoutType ?? null,
        agreedPayoutType: appointment.agreedPayoutType,
        fallback: null,
    });
    if (!payoutType) {
        return {
            success: false,
            error: "Debes indicar la comisión antes de generar el link",
        };
    }
    const payoutRatePercent = getPayoutTypeRate(payoutSettings, payoutType);
    const isNoShowFee = kind === "NO_SHOW_FEE";

    const existing = appointment.payment;
    if (
        existing?.status === "PENDING" &&
        existing.currency === currency &&
        existing.amount === amount &&
        existing.isNoShowFee === isNoShowFee &&
        existing.stripeCheckoutSessionId
    ) {
        const session = await stripe.checkout.sessions.retrieve(
            existing.stripeCheckoutSessionId,
        );
        if (session.status === "open" && existing.stripeCheckoutUrl) {
            if (
                existing.payoutType !== payoutType ||
                existing.payoutRatePercent !== payoutRatePercent
            ) {
                await prisma.payment.update({
                    where: { appointmentId },
                    data: { payoutType, payoutRatePercent },
                });
            }
            return { success: true, url: existing.stripeCheckoutUrl };
        }
    }

    const { sessionId, url } = await createPaymentCheckoutSession({
        appointmentId,
        amount,
        currency,
        patientEmail: appointment.user.email,
        successUrl: `${getBaseUrl()}/mi-cuenta/citas?pago=exitoso`,
        cancelUrl: `${getBaseUrl()}/mi-cuenta/citas?pago=cancelado`,
    });

    await prisma.payment.upsert({
        where: { appointmentId },
        create: {
            appointmentId,
            currency,
            amount,
            finalAmount: amount,
            status: "PENDING",
            stripeCheckoutSessionId: sessionId,
            stripeCheckoutUrl: url,
            payoutType,
            payoutRatePercent,
            isNoShowFee,
        },
        update: {
            currency,
            amount,
            discountAmount: 0,
            finalAmount: amount,
            status: "PENDING",
            stripeCheckoutSessionId: sessionId,
            stripeCheckoutUrl: url,
            couponId: null,
            payoutType,
            payoutRatePercent,
            isNoShowFee,
        },
    });

    return { success: true, url };
}

export async function generatePaymentLink(
    appointmentId: string,
    overrides: CheckoutOverrides = {},
): Promise<ActionResult & { url?: string }> {
    try {
        const actor = await requirePermission("payment.link.create");
        await requireOwnAppointment(actor, appointmentId);

        const result = await resolveCheckoutUrl(appointmentId, overrides);
        if (!result.success) return result;

        revalidatePath("/admin/citas", "layout");
        revalidatePath("/admin/pagos", "layout");
        return { success: true, url: result.url };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return { success: false, error: "Error al generar el link de pago" };
    }
}

/** Charges a no-show fee for an appointment: upserts the same Payment row
 * (a session never has two payments — Payment.appointmentId is unique) with
 * kind NO_SHOW_FEE, overwriting whatever charge, if any, existed for it. If
 * the session never happened, it shouldn't also be billed for the session
 * itself. */
export async function createNoShowFeeCharge(
    appointmentId: string,
): Promise<ActionResult & { url?: string }> {
    try {
        const actor = await requirePermission("payment.link.create");
        await requireOwnAppointment(actor, appointmentId);

        const result = await resolveCheckoutUrl(appointmentId, {
            kind: "NO_SHOW_FEE",
        });
        if (!result.success) return result;

        revalidatePath("/admin/citas", "layout");
        revalidatePath("/admin/pagos", "layout");
        return { success: true, url: result.url };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return { success: false, error: "Error al generar la multa" };
    }
}

export async function sendPaymentLinkEmail(
    appointmentId: string,
    overrides: CheckoutOverrides = {},
): Promise<ActionResult> {
    try {
        const actor = await requirePermission("payment.link.create");
        await requireOwnAppointment(actor, appointmentId);

        const result = await resolveCheckoutUrl(appointmentId, overrides);
        if (!result.success) return result;

        const payment = await prisma.payment.findUnique({
            where: { appointmentId },
            select: { finalAmount: true, currency: true },
        });
        if (!payment) return { success: false, error: "Pago no encontrado" };

        await sendPaymentRequestEmail(
            appointmentId,
            result.url,
            payment.finalAmount,
            payment.currency,
        );

        revalidatePath("/admin/citas", "layout");
        revalidatePath("/admin/pagos", "layout");
        return { success: true };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return { success: false, error: "No se pudo enviar el correo" };
    }
}

export async function voidPayment(paymentId: string): Promise<ActionResult> {
    try {
        await requirePermission("payment.commission.write");

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment) return { success: false, error: "Pago no encontrado" };
        if (payment.status !== "PENDING") {
            return {
                success: false,
                error: "Solo se pueden anular pagos pendientes",
            };
        }

        await prisma.payment.update({
            where: { id: paymentId },
            data: { status: "VOIDED" },
        });

        revalidatePath("/admin/pagos", "layout");
        revalidatePath("/admin/citas", "layout");
        return { success: true };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return { success: false, error: "No se pudo anular el pago" };
    }
}

export async function updatePaymentCommission(
    paymentId: string,
    payoutType: PayoutType,
): Promise<ActionResult> {
    try {
        await requirePermission("payment.commission.write");

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment) return { success: false, error: "Pago no encontrado" };

        const payoutSettings = await getPayoutSettings();
        const payoutRatePercent = getPayoutTypeRate(payoutSettings, payoutType);

        let payoutAmountUsd = payment.payoutAmountUsd;
        if (
            payment.status === "APPROVED" &&
            (payment.stripeSettledAmountUsd != null ||
                payment.exchangeRateToUsd != null)
        ) {
            const rates = await getUsdRateMap();
            const finalAmountUsd = getPaymentAmountUsd(payment, rates);
            payoutAmountUsd = finalAmountUsd * (payoutRatePercent / 100);
        }

        await prisma.payment.update({
            where: { id: paymentId },
            data: { payoutType, payoutRatePercent, payoutAmountUsd },
        });

        revalidatePath("/admin/pagos", "layout");
        revalidatePath("/admin/citas", "layout");
        return { success: true };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return { success: false, error: "No se pudo actualizar la comisión" };
    }
}

/**
 * "Editar precio de la sesión" — changes the price agreed for the
 * appointment (not a Payment record directly). A Stripe Checkout Session
 * is immutable once created, so mutating an existing Payment row's
 * amount/currency in place would leave a stale link showing the patient
 * the old price. Updating the agreed fields and regenerating through
 * resolveCheckoutUrl (via generatePaymentLink) is what actually produces a
 * link with the new amount.
 */
export async function updateAgreedPrice(
    appointmentId: string,
    input: { amount: number; currency: string; payoutType: PayoutType },
): Promise<ActionResult & { url?: string }> {
    try {
        const actor = await requirePermission("payment.commission.write");
        await requireOwnAppointment(actor, appointmentId);

        if (!Number.isFinite(input.amount) || input.amount <= 0) {
            return { success: false, error: "El monto debe ser mayor a 0" };
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            select: { payment: { select: { status: true } } },
        });
        if (!appointment)
            return { success: false, error: "Sesión no encontrada" };
        if (appointment.payment?.status === "APPROVED") {
            return {
                success: false,
                error: "No se puede editar el precio de una sesión ya pagada",
            };
        }

        await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                agreedAmount: input.amount,
                agreedCurrency: input.currency,
                agreedPayoutType: input.payoutType,
            },
        });

        // Only regenerate an existing link — editing the agreed price
        // shouldn't be what triggers creating the first Stripe session for
        // a session nobody has tried to charge yet.
        if (appointment.payment) {
            const result = await resolveCheckoutUrl(appointmentId);
            if (!result.success) return result;
            revalidatePath("/admin/pagos", "layout");
            revalidatePath("/admin/citas", "layout");
            return { success: true, url: result.url };
        }

        revalidatePath("/admin/pagos", "layout");
        revalidatePath("/admin/citas", "layout");
        return { success: true };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return { success: false, error: "No se pudo actualizar el precio" };
    }
}
