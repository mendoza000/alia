import { prisma } from "@/lib/db";
import { getStripeSettlement } from "@/lib/stripe";

export type ReconcileResult = {
  total: number;
  updated: number;
  failed: number;
  stillPending: number;
};

/**
 * Fills in the real Stripe settlement (amount, fee, exchange rate) for
 * approved payments that don't have it yet, and recomputes payoutAmountUsd
 * from the real amount so what's owed to psychologists reflects what Stripe
 * actually settled, not our mid-market estimate.
 */
export async function reconcileStripeSettlements(limit = 200): Promise<ReconcileResult> {
  const pending = await prisma.payment.findMany({
    where: {
      status: "APPROVED",
      stripePaymentIntentId: { not: null },
      stripeBalanceTransactionId: null,
    },
    select: { id: true, stripePaymentIntentId: true, payoutRatePercent: true },
    take: limit,
  });

  let updated = 0;
  let failed = 0;
  let stillPending = 0;

  for (const payment of pending) {
    try {
      const settlement = await getStripeSettlement(payment.stripePaymentIntentId as string);
      if (!settlement) {
        stillPending++;
        await prisma.payment.update({
          where: { id: payment.id },
          data: { stripeSettlementCheckedAt: new Date() },
        });
        continue;
      }

      const payoutAmountUsd =
        payment.payoutRatePercent != null
          ? settlement.settledAmountUsd * (payment.payoutRatePercent / 100)
          : undefined;

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          stripeChargeId: settlement.chargeId,
          stripeBalanceTransactionId: settlement.balanceTransactionId,
          stripeSettledAmountUsd: settlement.settledAmountUsd,
          stripeFeeUsd: settlement.feeUsd,
          stripeSettlementRate: settlement.exchangeRate,
          stripeSettlementCheckedAt: new Date(),
          ...(payoutAmountUsd !== undefined ? { payoutAmountUsd } : {}),
        },
      });
      updated++;
    } catch (err) {
      console.error(`Reconciliación falló para payment ${payment.id}`, err);
      failed++;
    }
  }

  return { total: pending.length, updated, failed, stillPending };
}
