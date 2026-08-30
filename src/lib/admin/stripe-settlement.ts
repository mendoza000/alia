import { prisma } from "@/lib/db";
import { getStripeSettlement } from "@/lib/stripe";

export type ReconcileResult = {
    total: number;
    updated: number;
    failed: number;
    stillPending: number;
};

type SettlementTarget = {
    id: string;
    stripePaymentIntentId: string;
    payoutRatePercent: number | null;
};

async function applySettlement(
    payment: SettlementTarget,
): Promise<"updated" | "pending" | "failed"> {
    try {
        const settlement = await getStripeSettlement(
            payment.stripePaymentIntentId,
        );
        if (!settlement) {
            await prisma.payment.update({
                where: { id: payment.id },
                data: { stripeSettlementCheckedAt: new Date() },
            });
            return "pending";
        }

        const payoutAmountUsd =
            payment.payoutRatePercent != null
                ? settlement.settledAmountUsd *
                  (payment.payoutRatePercent / 100)
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
        return "updated";
    } catch (err) {
        console.error(`Reconciliación falló para payment ${payment.id}`, err);
        return "failed";
    }
}

/**
 * Safety-net sweep for payments whose real settlement was never captured by
 * the charge.succeeded/charge.updated webhook handlers (eg. a missed webhook
 * delivery). The primary, near-instant path is `applySettlementForPaymentIntent`,
 * called directly from the webhook as soon as Stripe reports the charge's
 * balance_transaction.
 */
export async function reconcileStripeSettlements(
    limit = 200,
): Promise<ReconcileResult> {
    const pending = await prisma.payment.findMany({
        where: {
            status: "APPROVED",
            stripePaymentIntentId: { not: null },
            stripeBalanceTransactionId: null,
        },
        select: {
            id: true,
            stripePaymentIntentId: true,
            payoutRatePercent: true,
        },
        take: limit,
    });

    let updated = 0;
    let failed = 0;
    let stillPending = 0;

    for (const payment of pending) {
        const result = await applySettlement({
            id: payment.id,
            stripePaymentIntentId: payment.stripePaymentIntentId as string,
            payoutRatePercent: payment.payoutRatePercent,
        });
        if (result === "updated") updated++;
        else if (result === "pending") stillPending++;
        else failed++;
    }

    return { total: pending.length, updated, failed, stillPending };
}

/**
 * Called from the webhook the moment Stripe reports a charge's
 * balance_transaction (charge.succeeded/charge.updated), so the real
 * settled USD amount lands on the Payment automatically, without waiting
 * for the reconciliation cron.
 */
export async function applySettlementForPaymentIntent(
    paymentIntentId: string,
): Promise<void> {
    const payment = await prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
        select: {
            id: true,
            stripePaymentIntentId: true,
            payoutRatePercent: true,
            stripeBalanceTransactionId: true,
        },
    });
    if (
        !payment?.stripePaymentIntentId ||
        payment.stripeBalanceTransactionId != null
    )
        return;

    await applySettlement({
        id: payment.id,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        payoutRatePercent: payment.payoutRatePercent,
    });
}
