import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getLiveUsdRateMap, paymentToUsd } from "@/lib/exchange-rates";
import { getPayoutSettings } from "@/lib/admin/payout-settings-queries";
import { isFirstCompletedAppointment } from "@/lib/queries/patient-appointments";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      await handleCheckoutCompleted(event.data.object);
      break;
    }
    case "checkout.session.expired": {
      await handleCheckoutExpired(event.data.object);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const appointmentId = session.metadata?.appointmentId;
  if (!appointmentId) return;

  const payment = await prisma.payment.findUnique({
    where: { appointmentId },
    include: { appointment: true },
  });
  if (!payment) return;

  // Idempotency: Stripe may redeliver this event.
  if (
    payment.status === "APPROVED" &&
    payment.stripeCheckoutSessionId === session.id
  ) {
    return;
  }

  const rates = await getLiveUsdRateMap();
  const exchangeRateToUsd = rates.get(payment.currency.toUpperCase()) ?? null;

  // La comisión ya se elige manualmente al generar el link (payment.payoutType /
  // payment.payoutRatePercent quedan congelados en ese momento). El fallback abajo
  // solo cubre links generados antes de este cambio, que quedaron sin esos campos.
  let payoutRatePercent = payment.payoutRatePercent;
  let isFirstAppointment: boolean | null = payment.isFirstAppointment;
  if (payoutRatePercent == null) {
    const [autoIsFirstAppointment, payoutSettings] = await Promise.all([
      isFirstCompletedAppointment(
        payment.appointment.userId,
        payment.appointment.psychologistId,
        payment.appointment.dateTime,
      ),
      getPayoutSettings(),
    ]);
    isFirstAppointment = autoIsFirstAppointment;
    payoutRatePercent = autoIsFirstAppointment
      ? payoutSettings.newClientRatePercent
      : payoutSettings.recurringClientRatePercent;
  }

  const finalAmountUsd = paymentToUsd(
    payment.finalAmount,
    payment.currency,
    exchangeRateToUsd,
    rates,
  );
  const payoutAmountUsd = finalAmountUsd * (payoutRatePercent / 100);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { appointmentId },
      data: {
        status: "APPROVED",
        method: "stripe",
        paidAt: new Date(),
        exchangeRateToUsd,
        isFirstAppointment,
        payoutRatePercent,
        payoutAmountUsd,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
      },
    });

    if (payment.couponId) {
      await tx.coupon.update({
        where: { id: payment.couponId },
        data: { currentUses: { increment: 1 } },
      });
    }
  });
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const appointmentId = session.metadata?.appointmentId;
  if (!appointmentId) return;

  await prisma.payment.updateMany({
    where: {
      appointmentId,
      status: "PENDING",
      stripeCheckoutSessionId: session.id,
    },
    data: { stripeCheckoutSessionId: null, stripeCheckoutUrl: null },
  });
}
