import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-06-24.dahlia",
});

// Currencies with no minor unit — Stripe expects the amount as-is, not multiplied by 100.
// https://docs.stripe.com/currencies#zero-decimal
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

export function toStripeAmount(amount: number, currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase())
    ? amount
    : amount * 100;
}

type CreatePaymentCheckoutSessionParams = {
  appointmentId: string;
  amount: number;
  currency: string;
  patientEmail: string;
  successUrl: string;
  cancelUrl: string;
};

export async function createPaymentCheckoutSession({
  appointmentId,
  amount,
  currency,
  patientEmail,
  successUrl,
  cancelUrl,
}: CreatePaymentCheckoutSessionParams): Promise<{
  sessionId: string;
  url: string;
}> {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: patientEmail,
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product: process.env.STRIPE_PRODUCT_ID as string,
          unit_amount: toStripeAmount(amount, currency),
        },
        quantity: 1,
      },
    ],
    metadata: { appointmentId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    throw new Error("Stripe no devolvió una URL de checkout");
  }

  return { sessionId: session.id, url: session.url };
}
