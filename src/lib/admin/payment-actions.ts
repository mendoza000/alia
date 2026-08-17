"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createPaymentCheckoutSession, stripe } from "@/lib/stripe";
import { sendPaymentRequestEmail } from "@/lib/email";

type ActionResult = { success: true } | { success: false; error: string };

function getBaseUrl() {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

async function resolveCheckoutUrl(
  appointmentId: string,
  currency: string,
  customAmount?: number,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      status: true,
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

  const rate = await prisma.paymentRate.findUnique({ where: { currency } });
  if (!rate) {
    return {
      success: false,
      error: `No hay tarifa configurada para ${currency}. Configúrala en Tarifas.`,
    };
  }

  if (customAmount !== undefined && (!Number.isFinite(customAmount) || customAmount <= 0)) {
    return { success: false, error: "El monto personalizado debe ser mayor a 0" };
  }

  const amount = customAmount ?? rate.amount;

  const existing = appointment.payment;
  if (
    existing?.status === "PENDING" &&
    existing.currency === currency &&
    existing.amount === amount &&
    existing.stripeCheckoutSessionId
  ) {
    const session = await stripe.checkout.sessions.retrieve(
      existing.stripeCheckoutSessionId,
    );
    if (session.status === "open" && existing.stripeCheckoutUrl) {
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
    },
  });

  return { success: true, url };
}

export async function generatePaymentLink(
  appointmentId: string,
  currency: string,
  customAmount?: number,
): Promise<ActionResult & { url?: string }> {
  try {
    const result = await resolveCheckoutUrl(appointmentId, currency, customAmount);
    if (!result.success) return result;

    revalidatePath("/admin/citas", "layout");
    revalidatePath("/admin/pagos", "layout");
    return { success: true, url: result.url };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Error al generar el link de pago" };
  }
}

export async function sendPaymentLinkEmail(
  appointmentId: string,
  currency: string,
  customAmount?: number,
): Promise<ActionResult> {
  try {
    const result = await resolveCheckoutUrl(appointmentId, currency, customAmount);
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
